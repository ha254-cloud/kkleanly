import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc,
  addDoc,
  serverTimestamp,
  limit as firestoreLimit
} from 'firebase/firestore';
import { driverService, Driver } from './driverService';
import { orderService, Order } from './orderService';

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface AssignmentCriteria {
  maxDistance: number; // km
  preferredVehicleTypes?: string[];
  minRating?: number;
  maxActiveOrders?: number;
}

export interface AutoAssignmentService {
  assignOrderToDriver: (orderId: string, criteria?: AssignmentCriteria) => Promise<{
    success: boolean;
    assignedDriver?: Driver;
    error?: string;
  }>;
  findBestDriver: (orderLocation: LocationCoordinates, criteria?: AssignmentCriteria) => Promise<Driver | null>;
  calculateDriverScore: (driver: Driver, distance: number | null, currentLoad: number) => number;
  calculateDistance: (point1: LocationCoordinates, point2: LocationCoordinates) => number;
  toRadians: (degrees: number) => number;
  getDriverLoad: (driverId: string) => Promise<number>;
  createAssignmentRecord: (orderId: string, driverId: string, criteria: any) => Promise<void>;
  parseOrderLocation: (address: string) => Promise<LocationCoordinates | null>;
  calculateEstimatedPickupTime: (orderLocation: LocationCoordinates, driverLocation?: LocationCoordinates) => string;
  notifyDriverOfAssignment: (driver: Driver, order: Order) => Promise<void>;
  batchAssignOrders: (orderIds: string[], criteria?: AssignmentCriteria) => Promise<{
    successful: number;
    failed: number;
    results: Array<{ orderId: string; success: boolean; driverId?: string; error?: string }>;
  }>;
  getAssignmentStats: (period?: 'today' | 'week' | 'month') => Promise<{
    totalAssignments: number;
    averageAssignmentTime: number;
    successRate: number;
    topDrivers: Array<{ driverId: string; assignments: number }>;
  }>;
}

// Helper functions
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

const parseOrderLocation = async (address: string): Promise<LocationCoordinates | null> => {
  // In a real implementation, this would use Google Geocoding API
  return {
    latitude: -1.2921,
    longitude: 36.8219
  };
};

const calculateEstimatedPickupTime = (orderLocation: LocationCoordinates, driverLocation?: LocationCoordinates): string => {
  let estimatedMinutes = 30;
  
  if (driverLocation) {
    const distance = autoAssignmentService.calculateDistance(orderLocation, driverLocation);
    estimatedMinutes = Math.round(distance * 3) + 15;
  }
  
  const pickupTime = new Date();
  pickupTime.setMinutes(pickupTime.getMinutes() + estimatedMinutes);
  return pickupTime.toISOString();
};

const notifyDriverOfAssignment = async (driver: Driver, order: Order): Promise<void> => {
  try {
    console.log('📱 Notifying driver of assignment:', {
      driverName: driver.name,
      driverPhone: driver.phone,
      orderId: order.id,
      customerAddress: order.address
    });

    await addDoc(collection(db, 'notifications'), {
      type: 'order_assignment',
      driverId: driver.id,
      orderId: order.id,
      title: 'New Order Assigned',
      message: `You have been assigned a new order from ${order.address}`,
      timestamp: serverTimestamp(),
      read: false,
    });
  } catch (error) {
    console.error('Error notifying driver:', error);
  }
};

export const autoAssignmentService: AutoAssignmentService = {
  
  /**
   * Automatically assign an order to the best available driver
   */
  async assignOrderToDriver(orderId: string, criteria: AssignmentCriteria = {
    maxDistance: 10,
    minRating: 4.0,
    maxActiveOrders: 3
  }) {
    try {
      console.log('🤖 Starting automatic order assignment for order:', orderId);
      
      // Get order details
      const order = await orderService.getOrderById(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Parse order location (assuming address contains coordinates or use geocoding)
      const orderLocation = await parseOrderLocation(order.address);
      if (!orderLocation) {
        return { success: false, error: 'Could not determine order location' };
      }

      // Find the best driver
      const bestDriver = await this.findBestDriver(orderLocation, criteria);
      if (!bestDriver) {
        return { success: false, error: 'No suitable drivers available' };
      }

      // Assign the order
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'confirmed',
        assignedDriver: bestDriver.id,
        driverName: bestDriver.name,
        assignedAt: new Date().toISOString(),
        estimatedPickupTime: calculateEstimatedPickupTime(orderLocation, bestDriver.currentLocation),
        updatedAt: serverTimestamp(),
      });

      // Update driver status
      await driverService.updateDriverStatus(bestDriver.id!, 'busy');

      // Create assignment record for analytics
      await this.createAssignmentRecord(orderId, bestDriver.id!, {
        criteria,
        distance: bestDriver.currentLocation ? 
          this.calculateDistance(orderLocation, bestDriver.currentLocation) : null,
        assignmentTime: new Date().toISOString(),
      });

      // Send notification to driver (implement notification service)
      await notifyDriverOfAssignment(bestDriver, order);

      console.log('✅ Order successfully assigned to driver:', {
        orderId,
        driverId: bestDriver.id,
        driverName: bestDriver.name
      });

      return { success: true, assignedDriver: bestDriver };

    } catch (error) {
      console.error('❌ Error in automatic order assignment:', error);
      return { success: false, error: error.message || 'Assignment failed' };
    }
  },

  /**
   * Find the best available driver based on criteria
   */
  async findBestDriver(orderLocation: LocationCoordinates, criteria: AssignmentCriteria = {
    maxDistance: 10,
    minRating: 4.0,
    maxActiveOrders: 3
  }): Promise<Driver | null> {
    try {
      // Get all available drivers
      const availableDrivers = await driverService.getAvailableDrivers();
      
      if (availableDrivers.length === 0) {
        console.log('🚫 No available drivers found');
        return null;
      }

      console.log('🔍 Evaluating drivers:', availableDrivers.length);

      // Score and rank drivers
      const rankedDrivers = [];

      for (const driver of availableDrivers) {
        // Skip if driver doesn't meet basic criteria
        if (driver.rating < (criteria.minRating || 4.0)) {
          continue;
        }

        // Check vehicle type preference
        if (criteria.preferredVehicleTypes && 
            !criteria.preferredVehicleTypes.includes(driver.vehicleType)) {
          continue;
        }

        // Check current load
        const currentLoad = await this.getDriverLoad(driver.id!);
        if (currentLoad >= (criteria.maxActiveOrders || 3)) {
          continue;
        }

        // Calculate distance if location is available
        let distance = null;
        if (driver.currentLocation) {
          distance = this.calculateDistance(orderLocation, driver.currentLocation);
          
          // Skip if too far
          if (distance > criteria.maxDistance) {
            continue;
          }
        }

        // Calculate driver score
        const score = this.calculateDriverScore(driver, distance, currentLoad);
        
        rankedDrivers.push({
          driver,
          score,
          distance,
          currentLoad
        });
      }

      if (rankedDrivers.length === 0) {
        console.log('🚫 No drivers meet the criteria');
        return null;
      }

      // Sort by score (highest first)
      rankedDrivers.sort((a, b) => b.score - a.score);

      const bestDriver = rankedDrivers[0];
      console.log('🏆 Best driver selected:', {
        name: bestDriver.driver.name,
        score: bestDriver.score,
        distance: bestDriver.distance,
        rating: bestDriver.driver.rating
      });

      return bestDriver.driver;

    } catch (error) {
      console.error('Error finding best driver:', error);
      return null;
    }
  },

  /**
   * Calculate driver score based on multiple factors
   */
  calculateDriverScore(driver: Driver, distance: number | null, currentLoad: number): number {
    let score = 0;

    // Rating factor (0-50 points)
    score += (driver.rating / 5) * 50;

    // Experience factor (0-25 points)
    score += Math.min(driver.totalDeliveries / 100, 1) * 25;

    // Distance factor (0-20 points) - closer is better
    if (distance !== null) {
      score += Math.max(0, (10 - distance) / 10) * 20;
    } else {
      score += 10; // Neutral score if distance unknown
    }

    // Load factor (0-15 points) - less load is better
    score += Math.max(0, (3 - currentLoad) / 3) * 15;

    // Performance factor (0-10 points)
    if (driver.performance) {
      const completionRate = driver.completionRate || 1;
      score += completionRate * 10;
    }

    return score;
  },

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(point1: LocationCoordinates, point2: LocationCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  },

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  },

  /**
   * Get current load (active orders) for a driver
   */
  async getDriverLoad(driverId: string): Promise<number> {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('assignedDriver', '==', driverId),
        where('status', 'in', ['confirmed', 'in-progress'])
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting driver load:', error);
      return 0;
    }
  },

  /**
   * Create assignment record for analytics
   */
  async createAssignmentRecord(orderId: string, driverId: string, criteria: any): Promise<void> {
    try {
      await addDoc(collection(db, 'orderAssignments'), {
        orderId,
        driverId,
        criteria,
        timestamp: serverTimestamp(),
        date: new Date().toDateString(),
      });
    } catch (error) {
      console.error('Error creating assignment record:', error);
    }
  },

  /**
   * Parse order location from address (placeholder for geocoding)
   */
  async parseOrderLocation(address: string): Promise<LocationCoordinates | null> {
    // In a real implementation, this would use Google Geocoding API or similar
    // For now, return default Nairobi coordinates
    return {
      latitude: -1.2921,
      longitude: 36.8219
    };
  },

  /**
   * Calculate estimated pickup time
   */
  calculateEstimatedPickupTime(orderLocation: LocationCoordinates, driverLocation?: LocationCoordinates): string {
    let estimatedMinutes = 30; // Default 30 minutes
    
    if (driverLocation) {
      const distance = this.calculateDistance(orderLocation, driverLocation);
      // Estimate 3 minutes per km + 15 minutes preparation time
      estimatedMinutes = Math.round(distance * 3) + 15;
    }
    
    const pickupTime = new Date();
    pickupTime.setMinutes(pickupTime.getMinutes() + estimatedMinutes);
    
    return pickupTime.toISOString();
  },

  /**
   * Notify driver of new assignment
   */
  async notifyDriverOfAssignment(driver: Driver, order: Order): Promise<void> {
    try {
      // Implement push notification, SMS, or email notification
      console.log('📱 Notifying driver of assignment:', {
        driverName: driver.name,
        driverPhone: driver.phone,
        orderId: order.id,
        customerAddress: order.address
      });

      // Add notification record
      await addDoc(collection(db, 'notifications'), {
        type: 'order_assignment',
        driverId: driver.id,
        orderId: order.id,
        title: 'New Order Assigned',
        message: `You have been assigned a new order from ${order.address}`,
        timestamp: serverTimestamp(),
        read: false,
      });

    } catch (error) {
      console.error('Error notifying driver:', error);
    }
  },

  /**
   * Batch assign multiple orders
   */
  async batchAssignOrders(orderIds: string[], criteria?: AssignmentCriteria): Promise<{
    successful: number;
    failed: number;
    results: Array<{ orderId: string; success: boolean; driverId?: string; error?: string }>;
  }> {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const orderId of orderIds) {
      const result = await this.assignOrderToDriver(orderId, criteria);
      
      results.push({
        orderId,
        success: result.success,
        driverId: result.assignedDriver?.id,
        error: result.error
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Add small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { successful, failed, results };
  },

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(period: 'today' | 'week' | 'month' = 'today'): Promise<{
    totalAssignments: number;
    averageAssignmentTime: number;
    successRate: number;
    topDrivers: Array<{ driverId: string; assignments: number }>;
  }> {
    try {
      const assignmentsRef = collection(db, 'orderAssignments');
      let startDate = new Date();
      
      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const q = query(
        assignmentsRef,
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const assignments = snapshot.docs.map(doc => doc.data());

      // Calculate statistics
      const totalAssignments = assignments.length;
      const averageAssignmentTime = 45; // Placeholder - calculate from actual data
      const successRate = 0.95; // Placeholder - calculate from actual data

      // Group by driver
      const driverStats = assignments.reduce((acc, assignment) => {
        const driverId = assignment.driverId;
        acc[driverId] = (acc[driverId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topDrivers = Object.entries(driverStats)
        .map(([driverId, assignments]) => ({ driverId, assignments }))
        .sort((a, b) => b.assignments - a.assignments)
        .slice(0, 5);

      return {
        totalAssignments,
        averageAssignmentTime,
        successRate,
        topDrivers
      };

    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return {
        totalAssignments: 0,
        averageAssignmentTime: 0,
        successRate: 0,
        topDrivers: []
      };
    }
  }
};

export default autoAssignmentService;

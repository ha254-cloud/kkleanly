import { db, auth, getAuthInstance, getCurrentUser, waitForAuthReady } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

// Utility function to generate Kenyan vehicle registration numbers
export const generateVehicleNumber = (vehicleType: 'motorcycle' | 'car' | 'van'): string => {
  const generateRandomNumber = (min: number, max: number) => 
    Math.floor(Math.random() * (max - min + 1)) + min;
  
  const generateRandomLetter = () => 
    String.fromCharCode(65 + Math.floor(Math.random() * 26));

  switch (vehicleType) {
    case 'motorcycle':
      // Motorcycle format: KMEF 123G or KMEH 456F
      const motorcyclePrefixes = ['KMEF', 'KMEH', 'KMEJ', 'KMEK'];
      const motorcyclePrefix = motorcyclePrefixes[Math.floor(Math.random() * motorcyclePrefixes.length)];
      const motorcycleNumber = generateRandomNumber(100, 999);
      const motorcycleSuffix = generateRandomLetter();
      return `${motorcyclePrefix} ${motorcycleNumber}${motorcycleSuffix}`;
    
    case 'car':
      // Car format: KCA 123C or KCB 456D or KCC 789E
      const carPrefixes = ['KCA', 'KCB', 'KCC', 'KCD', 'KCE'];
      const carPrefix = carPrefixes[Math.floor(Math.random() * carPrefixes.length)];
      const carNumber = generateRandomNumber(100, 999);
      const carSuffix = generateRandomLetter();
      return `${carPrefix} ${carNumber}${carSuffix}`;
    
    case 'van':
      // Van/Commercial format: KBL 123A or KBM 456B (Commercial vehicles)
      const vanPrefixes = ['KBL', 'KBM', 'KBN', 'KBP', 'KBQ'];
      const vanPrefix = vanPrefixes[Math.floor(Math.random() * vanPrefixes.length)];
      const vanNumber = generateRandomNumber(100, 999);
      const vanSuffix = generateRandomLetter();
      return `${vanPrefix} ${vanNumber}${vanSuffix}`;
    
    default:
      // Default format for unknown types
      return `KCA ${generateRandomNumber(100, 999)}${generateRandomLetter()}`;
  }
};

export interface Driver {
  id?: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: 'motorcycle' | 'car' | 'van';
  vehicleNumber: string;
  status: 'available' | 'busy' | 'offline';
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
    address?: string;
  };
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  averageDeliveryTime: number;
  completionRate: number;
  customerRatings: number[];
  isOnline: boolean;
  lastActiveAt: string;
  shift?: {
    startTime: string;
    endTime?: string;
    totalHours: number;
    earnings: number;
  };
  performance: {
    todayDeliveries: number;
    weeklyDeliveries: number;
    monthlyDeliveries: number;
    todayEarnings: number;
    weeklyEarnings: number;
    monthlyEarnings: number;
  };
  preferences: {
    maxRadius: number; // km
    preferredAreas: string[];
    notifications: {
      orders: boolean;
      payments: boolean;
      promotions: boolean;
    };
  };
  createdAt: string;
}

export interface EarningsRecord {
  id: string;
  driverId: string;
  commission: number;
  orderValue: number;
  deliveryTime: number;
  date: string;
  timestamp: any;
}

export interface DeliveryTracking {
  customerName: string;
  orderTotal: number;
  id?: string;
  orderId: string;
  driverId: string;
  status: 'assigned' | 'pickup_started' | 'picked_up' | 'delivery_started' | 'delivered';
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  deliveryLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  estimatedPickupTime?: string;
  estimatedDeliveryTime?: string;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  route?: any; // Google Maps route data
  createdAt: string;
  updatedAt: string;
}

export const driverService = {
  async createDriver(driverData: Omit<Driver, 'id' | 'createdAt'>): Promise<string> {
    try {
      const driver = {
        ...driverData,
        createdAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'drivers'), driver);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  async getAllDrivers(): Promise<Driver[]> {
    try {
      console.log('🔍 Fetching all drivers from Firestore...');
      
      // Wait for auth to be ready and get current user
      const currentUser = await waitForAuthReady();
      console.log('🔐 Current user after auth ready:', currentUser?.email || 'Not authenticated');
      
      // First try with orderBy
      let snapshot;
      try {
        const q = query(
          collection(db, 'drivers'),
          orderBy('createdAt', 'desc')
        );
        snapshot = await getDocs(q);
        console.log('✅ Successfully used orderBy query');
      } catch (orderError: any) {
        console.log('⚠️ OrderBy failed, trying simple query:', orderError.message);
        
        // Check if it's a permissions error
        if (orderError.code === 'permission-denied') {
          console.error('❌ Permission denied - user may not be authenticated as admin');
          try {
            const authInstance = getAuthInstance();
            console.log('Current user email:', authInstance.currentUser?.email);
          } catch (authError) {
            console.log('Current user email: Could not get auth instance');
          }
          console.log('Expected admin email: kleanlyspt@gmail.com');
          
          // For development, return empty array instead of throwing
          if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Development mode - returning empty drivers array');
            return [];
          }
        }
        
        // Fallback to simple query without orderBy
        try {
          snapshot = await getDocs(collection(db, 'drivers'));
        } catch (simpleError: any) {
          console.error('❌ Simple query also failed:', simpleError.message);
          
          // If simple query also fails due to permissions, return empty array for development
          if (simpleError.code === 'permission-denied' && process.env.NODE_ENV === 'development') {
            console.log('� Development mode - permissions denied, returning empty array');
            return [];
          }
          
          throw simpleError;
        }
      }
      
      console.log('�📊 Firestore drivers query result:', {
        size: snapshot.size,
        empty: snapshot.empty,
        docs: snapshot.docs.length
      });
      
      const drivers = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        console.log('🚚 Driver document:', { id: docSnap.id, email: data.email, name: data.name });
        return {
          id: docSnap.id,
          ...data
        } as Driver;
      });
      
      // Sort manually if we couldn't use orderBy
      drivers.sort((a, b) => {
        const dateA = new Date(a.createdAt || '').getTime();
        const dateB = new Date(b.createdAt || '').getTime();
        return dateB - dateA; // desc order
      });
      
      console.log('✅ Successfully loaded drivers:', drivers.length);
      return drivers;
    } catch (error: any) {
      console.error('❌ Error in getAllDrivers:', error);
      
      // Enhanced error logging
      if (error.code === 'permission-denied') {
        console.error('🔐 Permission denied details:');
        try {
          const authInstance = getAuthInstance();
          console.error('- Current user:', authInstance.currentUser?.email || 'Not authenticated');
        } catch (authError) {
          console.error('- Current user: Could not get auth instance');
        }
        console.error('- Required: Admin access to drivers collection');
        console.error('- Check Firestore rules and user authentication');
        
        // For development, return mock data instead of throwing
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 Development mode - returning mock drivers data');
          return this.getMockDrivers();
        }
      }
      
      throw error;
    }
  },

  async getAvailableDrivers(): Promise<Driver[]> {
    try {
      const q = query(
        collection(db, 'drivers'),
        where('status', '==', 'available')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Driver));
    } catch (error) {
      throw error;
    }
  },

  async updateDriverStatus(driverId: string, status: Driver['status']): Promise<void> {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, { 
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  },

  async updateDriverLocation(driverId: string, location: { latitude: number; longitude: number }): Promise<void> {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, { 
        currentLocation: {
          ...location,
          timestamp: new Date().toISOString()
        },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  },

  async assignDriverToOrder(orderId: string, driverId: string, pickupLocation: any, deliveryLocation: any): Promise<string> {
    try {
      const tracking: Omit<DeliveryTracking, 'id'> = {
        orderId,
        driverId,
        status: 'assigned',
        pickupLocation,
        deliveryLocation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerName: '',
        orderTotal: 0
      };
      
      const docRef = await addDoc(collection(db, 'deliveryTracking'), tracking);
      
      // Update driver status to busy
      await this.updateDriverStatus(driverId, 'busy');

      // Ensure the order reflects the assigned driver for permissions
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        assignedDriver: driverId,
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  async updateDeliveryStatus(trackingId: string, status: DeliveryTracking['status'], location?: { latitude: number; longitude: number }): Promise<void> {
  try {
    console.log('🔄 Updating delivery status:', {
      trackingId,
      status,
      currentUser: auth.currentUser?.email,
      hasLocation: !!location
    });

    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const trackingRef = doc(db, 'deliveryTracking', trackingId);
    
    // First, verify the tracking document exists and user has permission
    const trackingDoc = await getDoc(trackingRef);
    if (!trackingDoc.exists()) {
      throw new Error('Tracking document not found');
    }

    const trackingData = trackingDoc.data() as DeliveryTracking;
    console.log('📋 Current tracking data:', {
      orderId: trackingData.orderId,
      driverId: trackingData.driverId,
      currentStatus: trackingData.status
    });

    const updateData: any = { 
      status,
      updatedAt: serverTimestamp()
    };

    if (location) {
      updateData.currentLocation = {
        ...location,
        timestamp: new Date().toISOString()
      };
    }

    // Add timestamps for specific statuses
    if (status === 'picked_up') {
      updateData.actualPickupTime = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.actualDeliveryTime = new Date().toISOString();
      
      // Update driver status back to available when delivery is completed
      if (trackingData.driverId) {
        await this.updateDriverStatus(trackingData.driverId, 'available');
      }
    }

    await updateDoc(trackingRef, updateData);
    console.log('✅ Delivery status updated successfully');
    
  } catch (error: any) {
    console.error('❌ Error updating delivery status:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied: You may not be authorized to update this delivery');
    } else if (error.code === 'not-found') {
      throw new Error('Delivery tracking not found');
    } else {
      throw new Error(error.message || 'Failed to update delivery status');
    }
  }
},

  async getDeliveryTracking(orderId: string): Promise<DeliveryTracking | null> {
    try {
      if (!auth.currentUser) {
        console.error('❌ User not authenticated for delivery tracking');
        return null;
      }

      console.log('🔍 Getting delivery tracking for order:', orderId);
      
      const trackingQuery = query(
        collection(db, 'deliveryTracking'),
        where('orderId', '==', orderId)
      );
      
      const querySnapshot = await getDocs(trackingQuery);
      
      if (querySnapshot.empty) {
        console.log('📭 No delivery tracking found for order:', orderId);
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as DeliveryTracking;
      
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.log('❌ Permission denied for delivery tracking. User:', auth.currentUser?.email);
        console.log('💡 User may not have access to this delivery tracking data');
      }
      console.error('Error getting delivery tracking:', error);
      return null;
    }
  },

  subscribeToDeliveryTracking(orderId: string, callback: (tracking: DeliveryTracking | null) => void) {
    // Check if user is authenticated first
    if (!auth.currentUser) {
      console.error('❌ User not authenticated for delivery tracking');
      callback(null);
      return () => {}; // Return empty unsubscribe function
    }

    console.log('🔍 Subscribing to delivery tracking for order:', orderId);
    console.log('🔍 Authenticated user:', auth.currentUser.email);
    
    const q = query(
      collection(db, 'deliveryTracking'),
      where('orderId', '==', orderId)
    );
    
    return onSnapshot(q, 
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          callback({
            id: doc.id,
            ...doc.data()
          } as DeliveryTracking);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in delivery tracking subscription:', error);
        // For permission denied errors, provide more specific logging
        if (error.code === 'permission-denied') {
          console.log('❌ Permission denied for delivery tracking. User:', auth.currentUser?.email);
          console.log('🔍 Order ID:', orderId);
          console.log('🔍 Collection: deliveryTracking');
          callback(null);
        } else {
          console.error('Unexpected error in delivery tracking:', error);
          callback(null);
        }
      }
    );
  },

  async getDriverById(driverId: string): Promise<Driver | null> {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      const docSnap = await getDoc(driverRef);
      
      if (docSnap.exists()) {
        return { 
          id: docSnap.id, 
          ...docSnap.data() 
        } as Driver;
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  async deleteDriver(driverId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting driver with ID: ${driverId}`);
      const driverRef = doc(db, 'drivers', driverId);
      await deleteDoc(driverRef);
      console.log(`✅ Successfully deleted driver: ${driverId}`);
    } catch (error) {
      console.error(`❌ Error deleting driver ${driverId}:`, error);
      throw error;
    }
  },

  // Enhanced Earnings & Performance Tracking
  async updateDriverEarnings(driverId: string, orderValue: number, deliveryTime: number): Promise<void> {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      const driver = await this.getDriverById(driverId);
      
      if (!driver) throw new Error('Driver not found');

      const commission = orderValue * 0.15; // 15% commission
      const today = new Date().toDateString();
      const thisWeek = this.getWeekStart(new Date()).toDateString();
      const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toDateString();

      const updates = {
        totalEarnings: (driver.totalEarnings || 0) + commission,
        totalDeliveries: (driver.totalDeliveries || 0) + 1,
        averageDeliveryTime: this.calculateAverageDeliveryTime(
          driver.averageDeliveryTime || 0,
          driver.totalDeliveries || 0,
          deliveryTime
        ),
        'performance.todayEarnings': (driver.performance?.todayEarnings || 0) + commission,
        'performance.weeklyEarnings': (driver.performance?.weeklyEarnings || 0) + commission,
        'performance.monthlyEarnings': (driver.performance?.monthlyEarnings || 0) + commission,
        'performance.todayDeliveries': (driver.performance?.todayDeliveries || 0) + 1,
        'performance.weeklyDeliveries': (driver.performance?.weeklyDeliveries || 0) + 1,
        'performance.monthlyDeliveries': (driver.performance?.monthlyDeliveries || 0) + 1,
        lastActiveAt: new Date().toISOString(),
      };

      await updateDoc(driverRef, updates);
      
      // Add earnings record for detailed tracking
      await this.addEarningsRecord(driverId, commission, orderValue, deliveryTime);
      
    } catch (error) {
      console.error('Error updating driver earnings:', error);
      throw error;
    }
  },

  async addEarningsRecord(driverId: string, commission: number, orderValue: number, deliveryTime: number): Promise<void> {
    try {
      await addDoc(collection(db, 'driverEarnings'), {
        driverId,
        commission,
        orderValue,
        deliveryTime,
        date: new Date().toISOString(),
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding earnings record:', error);
    }
  },

  async getDriverEarnings(driverId: string, period: 'today' | 'week' | 'month' | 'all' = 'all'): Promise<{
    totalEarnings: number;
    totalOrders: number;
    averageOrderValue: number;
    records: any[];
  }> {
    try {
      const earningsRef = collection(db, 'driverEarnings');
      let q = query(earningsRef, where('driverId', '==', driverId), orderBy('timestamp', 'desc'));
      
      const snapshot = await getDocs(q);
      let records: EarningsRecord[] = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as EarningsRecord));
      
      // Filter by period
      if (period !== 'all') {
        const now = new Date();
        const startDate = this.getStartDateForPeriod(period, now);
        records = records.filter(record => new Date(record.date) >= startDate);
      }
      
      const totalEarnings = records.reduce((sum, record) => sum + record.commission, 0);
      const totalOrders = records.length;
      const averageOrderValue = totalOrders > 0 ? records.reduce((sum, record) => sum + record.orderValue, 0) / totalOrders : 0;
      
      return {
        totalEarnings,
        totalOrders,
        averageOrderValue,
        records: records.slice(0, 50), // Return latest 50 records
      };
    } catch (error) {
      console.error('Error getting driver earnings:', error);
      return { totalEarnings: 0, totalOrders: 0, averageOrderValue: 0, records: [] };
    }
  },

  async updateDriverRating(driverId: string, rating: number): Promise<void> {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      const driver = await this.getDriverById(driverId);
      
      if (!driver) throw new Error('Driver not found');

      const currentRatings = driver.customerRatings || [];
      currentRatings.push(rating);
      
      const averageRating = currentRatings.reduce((sum, r) => sum + r, 0) / currentRatings.length;
      
      await updateDoc(driverRef, {
        rating: averageRating,
        customerRatings: currentRatings,
      });
    } catch (error) {
      console.error('Error updating driver rating:', error);
      throw error;
    }
  },

  async startDriverShift(driverId: string): Promise<void> {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, {
        'shift.startTime': new Date().toISOString(),
        'shift.earnings': 0,
        'shift.totalHours': 0,
        isOnline: true,
        status: 'available',
        lastActiveAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error starting driver shift:', error);
      throw error;
    }
  },

  async endDriverShift(driverId: string): Promise<void> {
    try {
      const driver = await this.getDriverById(driverId);
      if (!driver?.shift?.startTime) return;

      const shiftStart = new Date(driver.shift.startTime);
      const shiftEnd = new Date();
      const hoursWorked = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);

      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, {
        'shift.endTime': shiftEnd.toISOString(),
        'shift.totalHours': hoursWorked,
        isOnline: false,
        status: 'offline',
      });

      // Add shift record
      await addDoc(collection(db, 'driverShifts'), {
        driverId,
        startTime: driver.shift.startTime,
        endTime: shiftEnd.toISOString(),
        totalHours: hoursWorked,
        earnings: driver.shift.earnings || 0,
        date: shiftEnd.toDateString(),
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error ending driver shift:', error);
      throw error;
    }
  },

  // Utility functions
  calculateAverageDeliveryTime(currentAvg: number, totalDeliveries: number, newTime: number): number {
    if (totalDeliveries === 0) return newTime;
    return ((currentAvg * totalDeliveries) + newTime) / (totalDeliveries + 1);
  },

  getWeekStart(date: Date): Date {
    const diff = date.getDate() - date.getDay();
    return new Date(date.setDate(diff));
  },

  getStartDateForPeriod(period: 'today' | 'week' | 'month', now: Date): Date {
    switch (period) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        return this.getWeekStart(new Date(now));
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return new Date(0);
    }
  },

  // Driver Performance Analytics
  async getDriverLeaderboard(): Promise<Driver[]> {
    try {
      const driversRef = collection(db, 'drivers');
      const q = query(driversRef, orderBy('rating', 'desc'), orderBy('totalDeliveries', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Driver));
    } catch (error) {
      console.error('Error getting driver leaderboard:', error);
      return [];
    }
  },

  async getTopPerformingDrivers(limit: number = 5): Promise<Driver[]> {
    try {
      const drivers = await this.getAllDrivers();
      return drivers
        .sort((a, b) => {
          // Sort by rating first, then by total deliveries
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.totalDeliveries - a.totalDeliveries;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top performing drivers:', error);
      return [];
    }
  },

  // Order Management Functions
  async getDriverOrders(driverId: string): Promise<any[]> {
    try {
      // This would typically fetch from orders collection where assignedDriver = driverId
      // For now, return empty array as placeholder
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('assignedDriver', '==', driverId),
        where('status', 'in', ['pending', 'confirmed', 'in-progress'])
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting driver orders:', error);
      return [];
    }
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Mock data for development
  getMockDrivers(): Driver[] {
    return [
      {
        id: 'mock-driver-1',
        name: 'John Mwangi',
        phone: '+254 701 234 567',
        email: 'john.mwangi@kleanly.com',
        vehicleType: 'motorcycle',
        vehicleNumber: 'KMEF 123A',
        status: 'available',
        rating: 4.8,
        totalDeliveries: 245,
        totalEarnings: 12500,
        averageDeliveryTime: 35,
        completionRate: 98.5,
        customerRatings: [5, 4, 5, 5, 4],
        isOnline: true,
        lastActiveAt: new Date().toISOString(),
        shift: {
          startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          endTime: '',
          totalHours: 4,
          earnings: 450
        },
        performance: {
          todayDeliveries: 8,
          weeklyDeliveries: 32,
          monthlyDeliveries: 124,
          todayEarnings: 450,
          weeklyEarnings: 1800,
          monthlyEarnings: 6200
        },
        preferences: {
          maxRadius: 15,
          preferredAreas: ['Westlands', 'Karen', 'Kilimani'],
          notifications: {
            orders: true,
            payments: true,
            promotions: false
          }
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'mock-driver-2',
        name: 'Sarah Wanjiku',
        phone: '+254 702 345 678',
        email: 'sarah.wanjiku@kleanly.com',
        vehicleType: 'car',
        vehicleNumber: 'KCA 456B',
        status: 'busy',
        rating: 4.9,
        totalDeliveries: 189,
        totalEarnings: 9850,
        averageDeliveryTime: 32,
        completionRate: 99.2,
        customerRatings: [5, 5, 4, 5, 5],
        isOnline: true,
        lastActiveAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        shift: {
          startTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          endTime: '',
          totalHours: 3,
          earnings: 380
        },
        performance: {
          todayDeliveries: 6,
          weeklyDeliveries: 28,
          monthlyDeliveries: 98,
          todayEarnings: 380,
          weeklyEarnings: 1650,
          monthlyEarnings: 5200
        },
        preferences: {
          maxRadius: 20,
          preferredAreas: ['Kileleshwa', 'Lavington', 'Runda'],
          notifications: {
            orders: true,
            payments: true,
            promotions: true
          }
        },
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'mock-driver-3',
        name: 'Peter Kamau',
        phone: '+254 703 456 789',
        email: 'peter.kamau@kleanly.com',
        vehicleType: 'van',
        vehicleNumber: 'KBL 789C',
        status: 'offline',
        rating: 4.6,
        totalDeliveries: 156,
        totalEarnings: 8100,
        averageDeliveryTime: 42,
        completionRate: 96.8,
        customerRatings: [4, 5, 4, 5, 4],
        isOnline: false,
        lastActiveAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        performance: {
          todayDeliveries: 0,
          weeklyDeliveries: 18,
          monthlyDeliveries: 76,
          todayEarnings: 0,
          weeklyEarnings: 920,
          monthlyEarnings: 3800
        },
        preferences: {
          maxRadius: 25,
          preferredAreas: ['Industrial Area', 'Embakasi', 'Donholm'],
          notifications: {
            orders: true,
            payments: true,
            promotions: false
          }
        },
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  },

  async getDriverByEmail(email: string): Promise<Driver | null> {
    try {
      console.log('🔍 Getting driver by email:', email);
      
      const driversQuery = query(
        collection(db, 'drivers'),
        where('email', '==', email)
      );
      
      const querySnapshot = await getDocs(driversQuery);
      
      if (querySnapshot.empty) {
        console.log('📭 No driver found with email:', email);
        
        // Return mock data for development if this is a known test driver
        const mockDrivers = this.getMockDrivers();
        const mockDriver = mockDrivers.find(d => d.email === email);
        if (mockDriver && process.env.NODE_ENV === 'development') {
          console.log('🔧 Using mock driver data for development');
          return mockDriver;
        }
        
        return null;
      }

      const doc = querySnapshot.docs[0];
      const driver = {
        id: doc.id,
        ...doc.data()
      } as Driver;
      
      console.log('✅ Driver found:', driver.name);
      return driver;
      
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.log('❌ Permission denied for driver lookup. User:', email);
        
        // Fallback to mock data for development
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 Using mock driver data due to permission error');
          const mockDrivers = this.getMockDrivers();
          const mockDriver = mockDrivers.find(d => d.email === email);
          return mockDriver || null;
        }
      }
      console.error('Error getting driver by email:', error);
      return null;
    }
  },

  async getDriverDeliveryTracking(driverId: string): Promise<DeliveryTracking[]> {
    try {
      if (!auth.currentUser) {
        console.error('❌ User not authenticated for delivery tracking');
        return [];
      }

      console.log('🔍 Getting delivery tracking for driver:', driverId);
      
      const trackingQuery = query(
        collection(db, 'deliveryTracking'),
        where('driverId', '==', driverId)
      );
      
      const querySnapshot = await getDocs(trackingQuery);
      
      if (querySnapshot.empty) {
        console.log('📭 No delivery tracking found for driver:', driverId);
        return [];
      }

      const trackingData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DeliveryTracking[];
      
      console.log('✅ Found delivery tracking:', trackingData.length);
      return trackingData;
      
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.log('❌ Permission denied for delivery tracking. User:', auth.currentUser?.email);
        console.log('🔧 Falling back to mock data for development');
        
        // Return mock delivery tracking for development
        if (process.env.NODE_ENV === 'development') {
          return this.getMockDeliveryTracking(driverId);
        }
      }
      console.error('Error getting driver delivery tracking:', error);
      return [];
    }
  },

  // Add mock delivery tracking method
  getMockDeliveryTracking(driverId: string): DeliveryTracking[] {
    // Return empty array instead of mock data
    return [];
  },
};

export default driverService;

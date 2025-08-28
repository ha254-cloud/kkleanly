/**
 * Utility to create test deliveries and assign them to drivers
 * This helps populate the driver dashboard with test data
 */

import { db } from '../services/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { driverService } from '../services/driverService';

export interface TestDelivery {
  orderId: string;
  driverId: string;
  customerName: string;
  pickupLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  deliveryLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  status: 'assigned' | 'pickup_started' | 'picked_up' | 'delivery_started' | 'delivered';
  estimatedPickupTime: string;
  estimatedDeliveryTime: string;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
}

export const createTestDeliveries = async () => {
  try {
    console.log('📦 Creating test deliveries...');
    
    // First, get available drivers
    const drivers = await driverService.getAllDrivers();
    
    if (drivers.length === 0) {
      console.log('❌ No drivers found. Please create test drivers first.');
      return { success: false, error: 'No drivers available' };
    }
    
    const testOrders = [
      {
        userID: 'test-user-1',
        category: 'wash-fold',
        date: new Date().toISOString().split('T')[0],
        address: '123 Westlands Avenue, Nairobi',
        status: 'confirmed' as const,
        items: ['Shirts', 'Trousers', 'Dresses'],
        total: 850,
        createdAt: new Date().toISOString(),
      },
      {
        userID: 'test-user-2',
        category: 'dry-cleaning',
        date: new Date().toISOString().split('T')[0],
        address: '456 Karen Road, Nairobi',
        status: 'confirmed' as const,
        items: ['Suit', 'Coat', 'Dress'],
        total: 1200,
        createdAt: new Date().toISOString(),
      },
      {
        userID: 'test-user-3',
        category: 'premium-care',
        date: new Date().toISOString().split('T')[0],
        address: '789 Kilimani Street, Nairobi',
        status: 'confirmed' as const,
        items: ['Silk dress', 'Cashmere coat'],
        total: 2500,
        createdAt: new Date().toISOString(),
      },
    ];
    
    const testLocations = [
      {
        pickup: { address: '123 Westlands Avenue, Nairobi', latitude: -1.2632, longitude: 36.8117 },
        delivery: { address: '456 Industrial Area, Nairobi', latitude: -1.3032, longitude: 36.8289 }
      },
      {
        pickup: { address: '456 Karen Road, Nairobi', latitude: -1.3197, longitude: 36.7082 },
        delivery: { address: '789 Lavington Mall, Nairobi', latitude: -1.2749, longitude: 36.7620 }
      },
      {
        pickup: { address: '789 Kilimani Street, Nairobi', latitude: -1.2906, longitude: 36.7837 },
        delivery: { address: '321 CBD Plaza, Nairobi', latitude: -1.2864, longitude: 36.8172 }
      },
    ];
    
    const results = [];
    
    for (let i = 0; i < testOrders.length; i++) {
      try {
        // Create order
        const orderRef = await addDoc(collection(db, 'orders'), testOrders[i]);
        console.log(`✅ Created test order: ${orderRef.id}`);
        
        // Assign to a driver (rotate through available drivers)
        const assignedDriver = drivers[i % drivers.length];
        
        // Create delivery tracking
        const deliveryTracking: TestDelivery = {
          orderId: orderRef.id,
          driverId: assignedDriver.id!,
          customerName: `Customer ${i + 1}`,
          pickupLocation: testLocations[i].pickup,
          deliveryLocation: testLocations[i].delivery,
          status: i === 0 ? 'assigned' : i === 1 ? 'picked_up' : 'delivered',
          estimatedPickupTime: new Date(Date.now() + (i + 1) * 60 * 60 * 1000).toISOString(),
          estimatedDeliveryTime: new Date(Date.now() + (i + 2) * 60 * 60 * 1000).toISOString(),
        };
        
        // If delivered, add actual times
        if (deliveryTracking.status === 'delivered') {
          deliveryTracking.actualPickupTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
          deliveryTracking.actualDeliveryTime = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
        }
        
        const trackingRef = await addDoc(collection(db, 'deliveryTracking'), deliveryTracking);
        console.log(`✅ Created delivery tracking: ${trackingRef.id} for driver ${assignedDriver.name}`);
        
        results.push({
          orderId: orderRef.id,
          trackingId: trackingRef.id,
          driverName: assignedDriver.name,
          status: deliveryTracking.status
        });
        
      } catch (error) {
        console.error(`❌ Error creating test delivery ${i + 1}:`, error);
      }
    }
    
    console.log(`🎉 Successfully created ${results.length} test deliveries`);
    return { success: true, results };
    
  } catch (error) {
    console.error('❌ Error creating test deliveries:', error);
    return { success: false, error: error.message };
  }
};

export default createTestDeliveries;

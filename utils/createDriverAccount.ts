/**
 * Driver Account Creation     // Step 2: Create driver profile in Firestore
    const driverProfile = {
      email: driverData.email,
      name: driverData.name,
      phone: driverData.phone || '+254714648622',
      vehicleType: 'motorcycle' as const,
      vehicleNumber: 'KL-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      status: 'available' as const,
      rating: 5.0,
      totalDeliveries: 0,
      totalEarnings: 0,
      averageDeliveryTime: 0,
      completionRate: 100,
      customerRatings: [],
      isOnline: true,
      lastActiveAt: new Date().toISOString(),
      currentLocation: {
        latitude: -1.2921,
        longitude: 36.8219,
        timestamp: new Date().toISOString(),
        address: 'Nairobi, Kenya'
      },
      shift: {
        startTime: new Date().toISOString(),
        totalHours: 0,
        earnings: 0
      },
      performance: {
        todayDeliveries: 0,
        weeklyDeliveries: 0,
        monthlyDeliveries: 0,
        todayEarnings: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0
      },
      preferences: {
        maxRadius: 15,
        preferredAreas: ['Nairobi CBD', 'Westlands', 'Karen'],
        notifications: {
          orders: true,
          payments: true,
          promotions: false
        }
      }
    };s script to create driver accounts in Firebase Authentication
 */

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { driverService } from '../services/driverService';

interface DriverAccountData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

/**
 * Create a new driver account in Firebase Auth and Firestore
 */
export const createDriverAccount = async (driverData: DriverAccountData) => {
  try {
    console.log(`🚗 Creating driver account for: ${driverData.email}`);
    
    // Step 1: Create Firebase Authentication account
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      driverData.email, 
      driverData.password
    );
    
    console.log(`✅ Firebase Auth account created: ${userCredential.user.uid}`);
    
    // Step 2: Create driver profile in Firestore
    const driverProfile = {
      email: driverData.email,
      name: driverData.name,
      phone: driverData.phone || '+254714648622',
      vehicleType: 'motorcycle' as const,
      vehicleNumber: 'KL-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      status: 'available' as const,
      rating: 5.0,
      totalDeliveries: 0,
      totalEarnings: 0,
      averageDeliveryTime: 0,
      completionRate: 100,
      customerRatings: [],
      isOnline: true,
      lastActiveAt: new Date().toISOString(),
      currentLocation: {
        latitude: -1.2921,
        longitude: 36.8219,
        timestamp: new Date().toISOString(),
        address: 'Nairobi, Kenya'
      },
      shift: {
        startTime: new Date().toISOString(),
        totalHours: 0,
        earnings: 0
      },
      performance: {
        todayDeliveries: 0,
        weeklyDeliveries: 0,
        monthlyDeliveries: 0,
        todayEarnings: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0
      },
      preferences: {
        maxRadius: 15,
        preferredAreas: ['Nairobi CBD', 'Westlands', 'Karen'],
        notifications: {
          orders: true,
          payments: true,
          promotions: false
        }
      }
    };
    
    await driverService.createDriver(driverProfile);
    console.log(`✅ Driver profile created in Firestore`);
    
    return {
      success: true,
      uid: userCredential.user.uid,
      email: driverData.email,
      message: `Driver account created successfully for ${driverData.email}`
    };
    
  } catch (error: any) {
    console.error('❌ Error creating driver account:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      return {
        success: false,
        error: 'EMAIL_EXISTS',
        message: `Account with email ${driverData.email} already exists`
      };
    } else if (error.code === 'auth/weak-password') {
      return {
        success: false,
        error: 'WEAK_PASSWORD',
        message: 'Password should be at least 6 characters'
      };
    } else if (error.code === 'auth/invalid-email') {
      return {
        success: false,
        error: 'INVALID_EMAIL',
        message: 'Invalid email address format'
      };
    }
    
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: error.message || 'Failed to create driver account'
    };
  }
};

/**
 * Batch create multiple driver accounts
 */
export const createMultipleDriverAccounts = async (driversData: DriverAccountData[]) => {
  const results = [];
  
  for (const driverData of driversData) {
    const result = await createDriverAccount(driverData);
    results.push(result);
    
    // Add delay between creations to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
};

/**
 * Predefined driver accounts to create
 */
export const DEFAULT_DRIVER_ACCOUNTS: DriverAccountData[] = [
  {
    email: 'driver@kleanly.co.ke',
    password: 'SwiftDelivery543',
    name: 'Main Driver',
    phone: '+254701234567'
  },
  {
    email: 'john.driver@kleanly.co.ke',
    password: 'JohnDriver123!',
    name: 'John Kiprotich',
    phone: '+254702345678'
  },
  {
    email: 'mary.driver@kleanly.co.ke',
    password: 'MaryDriver123!',
    name: 'Mary Wanjiku',
    phone: '+254703456789'
  },
  {
    email: 'driver1@gmail.com',
    password: 'TestDriver123!',
    name: 'Test Driver 1',
    phone: '+254704567890'
  },
  {
    email: 'driver2@gmail.com',
    password: 'SpeedDriver647',
    name: 'Speed Driver',
    phone: '+254705678901'
  },
  {
    email: 'testdriver@kleanly.co.ke',
    password: 'TestDriver123!',
    name: 'Emergency Test Driver',
    phone: '+254706789012'
  }
];

/**
 * Create all default driver accounts
 */
export const createAllDefaultDrivers = async () => {
  console.log('🚗 Creating all default driver accounts...');
  const results = await createMultipleDriverAccounts(DEFAULT_DRIVER_ACCOUNTS);
  
  console.log('\n📊 Driver Creation Results:');
  results.forEach((result, index) => {
    const driver = DEFAULT_DRIVER_ACCOUNTS[index];
    if (result.success) {
      console.log(`✅ ${driver.email} - Created successfully`);
    } else {
      console.log(`❌ ${driver.email} - ${result.message}`);
    }
  });
  
  return results;
};

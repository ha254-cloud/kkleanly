/**
 * Admin and Driver Authentication Utilities
 * Centralized functions for checking admin and driver access
 */

import { auth, getAuthInstance, getCurrentUser, waitForAuthReady } from '../services/firebase';
import { driverService } from '../services/driverService';

// Define admin email
export const ADMIN_EMAIL = 'kleanlyspt@gmail.com';

// Known driver emails - update this list when adding new drivers
const KNOWN_DRIVER_EMAILS = [
  'driver1@kleanly.co.ke',
  'driver2@kleanly.co.ke', 
  'driver3@kleanly.co.ke',
  'driver1@gmail.com',
  'driver2@gmail.com',  // ✅ This driver was created with password: SpeedDriver647
  'driver3@gmail.com',
  'testdriver@kleanly.co.ke', // ✅ Emergency test driver with password: TestDriver123!
  'john.doe@kleanly.co.ke',
  'jane.smith@kleanly.co.ke',
  'mike.johnson@kleanly.co.ke',
  'driver@kleanly.co.ke', // ✅ Main driver account with password: SwiftDelivery543
  'john.driver@kleanly.co.ke', // ✅ Drivers from Firestore database
  'mary.driver@kleanly.co.ke', // ✅ Drivers from Firestore database
  // 'harrymaina02@gmail.com', // ❌ REMOVED - Conflicting with user registration
  // Add more driver emails as needed
];

// Runtime driver emails (loaded from AsyncStorage)
let additionalDriverEmails: string[] = [];

/**
 * Load additional driver emails from AsyncStorage
 */
const loadAdditionalDrivers = async (): Promise<string[]> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const stored = await AsyncStorage.getItem('additional_drivers');
    if (stored) {
      const drivers = JSON.parse(stored);
      const emails = drivers.map((d: any) => d.email);
      additionalDriverEmails = emails;
      console.log('✅ Loaded additional drivers from storage:', emails);
      return emails;
    }
  } catch (error) {
    console.warn('Could not load additional drivers:', error);
  }
  return [];
};

/**
 * Get all known driver emails (static + dynamic)
 */
const getAllKnownDriverEmails = async (): Promise<string[]> => {
  const additional = await loadAdditionalDrivers();
  return [...KNOWN_DRIVER_EMAILS, ...additional];
};

/**
 * Check if the current user is an admin
 */
export const isCurrentUserAdmin = (): boolean => {
  try {
    const currentUser = getCurrentUser();
    const isAdmin = currentUser?.email === ADMIN_EMAIL;
    console.log('🔐 Admin check:', {
      email: currentUser?.email,
      expectedAdmin: ADMIN_EMAIL,
      isAdmin
    });
    return isAdmin;
  } catch (error) {
    console.warn('Could not get current user in isCurrentUserAdmin:', error);
    return false;
  }
};

/**
 * Async version that waits for auth to be ready
 */
export const isCurrentUserAdminAsync = async (): Promise<boolean> => {
  try {
    const currentUser = await waitForAuthReady();
    const isAdmin = currentUser?.email === ADMIN_EMAIL;
    console.log('🔐 Admin check (async):', {
      email: currentUser?.email,
      expectedAdmin: ADMIN_EMAIL,
      isAdmin
    });
    return isAdmin;
  } catch (error) {
    console.warn('Could not wait for auth in isCurrentUserAdminAsync:', error);
    return false;
  }
};

/**
 * Check if a given email is an admin email
 */
export const isAdminEmail = (email: string): boolean => {
  return email === ADMIN_EMAIL;
};

/**
 * Check if the current user is a registered driver
 */
export const isCurrentUserDriver = async (): Promise<boolean> => {
  try {
    const authInstance = getAuthInstance();
    const currentUser = authInstance.currentUser;
    if (!currentUser?.email) return false;
    
    // First check if user is admin (admin has access to drivers collection)
    if (isCurrentUserAdmin()) {
      try {
        const drivers = await driverService.getAllDrivers();
        return drivers.some(driver => driver.email === currentUser.email);
      } catch (error) {
        console.error('Error checking driver status for admin:', error);
        return false;
      }
    }
    
    // Check all known driver emails (static + dynamic)
    const allKnownEmails = await getAllKnownDriverEmails();
    if (allKnownEmails.includes(currentUser.email)) {
    console.log('✅ Driver found in known emails list:', currentUser.email);
    return true;
  }
  
  // Fallback: Try to fetch from Firestore to catch newly created drivers
  try {
    console.log('🔍 Checking driver status in Firestore for:', currentUser.email);
    const drivers = await driverService.getAllDrivers();
    const isDriver = drivers.some(driver => driver.email === currentUser.email);
    
    if (isDriver) {
      console.log('✅ Driver found in Firestore but not in local list:', currentUser.email);
      // Auto-add to local storage for next time
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const existing = await AsyncStorage.getItem('additional_drivers');
        const drivers = existing ? JSON.parse(existing) : [];
        if (!drivers.some((d: any) => d.email === currentUser.email)) {
          drivers.push({
            email: currentUser.email,
            name: 'Auto-detected Driver',
            createdAt: new Date().toISOString()
          });
          await AsyncStorage.setItem('additional_drivers', JSON.stringify(drivers));
          console.log('✅ Auto-added driver to local storage');
        }
      } catch (storageError) {
        console.warn('Could not save to storage:', storageError);
      }
    }
    
    return isDriver;
  } catch (error) {
    console.error('Error checking driver status in Firestore:', error);
    // Return false if we can't access Firestore (permissions, etc.)
    return false;
  }
  } catch (authError) {
    console.error('Error getting auth instance in isCurrentUserDriver:', authError);
    return false;
  }
};

/**
 * Check if a given email belongs to a registered driver
 */
export const isDriverEmail = async (email: string): Promise<boolean> => {
  // Admin email check first
  if (email === ADMIN_EMAIL) {
    try {
      const drivers = await driverService.getAllDrivers();
      return drivers.some(driver => driver.email === email);
    } catch (error) {
      console.error('Error checking driver email for admin:', error);
      return false;
    }
  }
  
  // Check all known driver emails (static + dynamic)
  const allKnownEmails = await getAllKnownDriverEmails();
  return allKnownEmails.includes(email);
};

/**
 * Get current user's admin status with detailed info
 */
export const getAdminStatus = () => {
  try {
    const authInstance = getAuthInstance();
    const currentUser = authInstance.currentUser;
    const isAdmin = currentUser?.email === ADMIN_EMAIL;
    
    return {
      isAdmin,
      user: currentUser,
      email: currentUser?.email,
      uid: currentUser?.uid,
    };
  } catch (error) {
    console.warn('Could not get auth instance in getAdminStatus:', error);
    return {
      isAdmin: false,
      user: null,
      email: null,
      uid: null,
    };
  }
};

/**
 * Throw error if current user is not admin
 */
export const requireAdmin = (): void => {
  if (!isCurrentUserAdmin()) {
    throw new Error('Admin access required. This operation is only available to administrators.');
  }
};

/**
 * Async version of admin check that waits for auth state
 */
export const waitForAdminAuth = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      const authInstance = getAuthInstance();
      const unsubscribe = authInstance.onAuthStateChanged((user) => {
        unsubscribe();
        if (user) {
          resolve(user.email === ADMIN_EMAIL);
        } else {
          resolve(false);
        }
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Auth timeout'));
      }, 5000);
    } catch (error) {
      reject(new Error('Failed to get auth instance: ' + error.message));
    }
  });
};

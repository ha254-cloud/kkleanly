/**
 * Admin and Driver Authentication Utilities
 * Centralized functions for checking admin and driver access
 */

import { auth } from '../services/firebase';
import { driverService } from '../services/driverService';

// Define admin email
export const ADMIN_EMAIL = 'admin@kleanly.co.ke';

// Known driver emails - update this list when adding new drivers
const KNOWN_DRIVER_EMAILS = [
  'driver1@kleanly.co.ke',
  'driver2@kleanly.co.ke',
  'driver3@kleanly.co.ke',
  // Add more driver emails as needed
];

/**
 * Check if the current user is an admin
 */
export const isCurrentUserAdmin = (): boolean => {
  const currentUser = auth.currentUser;
  return currentUser?.email === ADMIN_EMAIL;
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
  const currentUser = auth.currentUser;
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
  
  // For non-admin users, we use a predefined list of driver emails
  // This avoids permission issues with Firestore security rules
  return KNOWN_DRIVER_EMAILS.includes(currentUser.email);
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
  
  // For non-admin users, use predefined list to avoid permission issues
  return KNOWN_DRIVER_EMAILS.includes(email);
};

/**
 * Get current user's admin status with detailed info
 */
export const getAdminStatus = () => {
  const currentUser = auth.currentUser;
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  
  return {
    isAdmin,
    user: currentUser,
    email: currentUser?.email,
    uid: currentUser?.uid,
  };
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
    const unsubscribe = auth.onAuthStateChanged((user) => {
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
  });
};

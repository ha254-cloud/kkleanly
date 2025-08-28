/**
 * Enhanced Driver Creation Service
 * Automatically handles complete driver setup including authentication
 */

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface CreateDriverParams {
  email: string;
  password: string;
  name: string;
  phone: string;
  vehicle: {
    type: string;
    plateNumber: string;
    model: string;
  };
}

interface DriverCreationResult {
  success: boolean;
  message: string;
  driverId?: string;
  error?: string;
}

export class AutoDriverService {
  
  /**
   * Create a complete driver account with automatic auth system integration
   */
  static async createDriverWithAutoAuth(params: CreateDriverParams): Promise<DriverCreationResult> {
    try {
      console.log('🔄 Starting complete driver creation process...');
      
      // Step 1: Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        params.email,
        params.password
      );
      
      const user = userCredential.user;
      console.log('✅ Firebase Auth account created:', user.uid);
      
      // Step 2: Create Firestore driver record
      const driverData = {
        id: user.uid,
        email: params.email,
        name: params.name,
        phone: params.phone,
        vehicle: params.vehicle,
        status: 'available',
        location: {
          latitude: -1.2921,
          longitude: 36.8219,
          address: 'Nairobi, Kenya'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        rating: 5.0,
        totalDeliveries: 0
      };
      
      await setDoc(doc(db, 'drivers', user.uid), driverData);
      console.log('✅ Driver record created in Firestore');
      
      // Step 3: Add to runtime authentication system
      this.addToRuntimeDriverList(params.email, params.name);
      
      console.log('🎉 Driver creation completed successfully!');
      
      return {
        success: true,
        message: `Driver ${params.name} created successfully! They can now log in immediately.`,
        driverId: user.uid
      };
      
    } catch (error: any) {
      console.error('❌ Error in driver creation:', error);
      
      let errorMessage = 'Failed to create driver account';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already exists. Driver may already be registered.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      }
      
      return {
        success: false,
        message: errorMessage,
        error: error.message
      };
    }
  }
  
  /**
   * Add driver to runtime list for immediate recognition
   * This ensures the driver is recognized without restarting the app
   */
  private static addToRuntimeDriverList(email: string, name: string) {
    try {
      // Get the current adminAuth module
      const adminAuthModule = require('../utils/adminAuth');
      
      // Add to the runtime list if it exists
      if (adminAuthModule.KNOWN_DRIVER_EMAILS) {
        if (!adminAuthModule.KNOWN_DRIVER_EMAILS.includes(email)) {
          adminAuthModule.KNOWN_DRIVER_EMAILS.push(email);
          console.log(`✅ Added ${email} to runtime driver list`);
        }
      }
      
      // Store in AsyncStorage for persistence across app restarts
      this.storeDriverInLocalStorage(email, name);
      
    } catch (error) {
      console.warn('Could not add to runtime list, but driver will work after app restart:', error);
    }
  }
  
  /**
   * Store driver info locally for persistence
   */
  private static async storeDriverInLocalStorage(email: string, name: string) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // Get existing drivers
      const existingDrivers = await AsyncStorage.getItem('additional_drivers');
      const drivers = existingDrivers ? JSON.parse(existingDrivers) : [];
      
      // Add new driver if not exists
      if (!drivers.some((d: any) => d.email === email)) {
        drivers.push({
          email,
          name,
          createdAt: new Date().toISOString()
        });
        
        await AsyncStorage.setItem('additional_drivers', JSON.stringify(drivers));
        console.log(`✅ Driver ${email} stored in local storage`);
      }
    } catch (error) {
      console.warn('Could not store in local storage:', error);
    }
  }
  
  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 12): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one uppercase, lowercase, number, and special char
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Fill the rest
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
  
  /**
   * Validate driver email format
   */
  static validateDriverEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Check if driver email already exists
   */
  static async checkDriverExists(email: string): Promise<boolean> {
    try {
      // Check in known driver emails first
      const adminAuthModule = require('../utils/adminAuth');
      if (adminAuthModule.KNOWN_DRIVER_EMAILS?.includes(email)) {
        return true;
      }
      
      // Check in Firestore
      const { driverService } = require('../services/driverService');
      const drivers = await driverService.getAllDrivers();
      return drivers.some((driver: any) => driver.email === email);
      
    } catch (error) {
      console.warn('Could not check driver existence:', error);
      return false;
    }
  }
}

export default AutoDriverService;

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { ADMIN_EMAIL } from '../utils/adminAuth';

const ADMIN_PASSWORD = 'KleanlyAdmin2025!';

export const ensureAdminAccountExists = async (): Promise<{
  success: boolean;
  message: string;
  accountExists: boolean;
}> => {
  try {
    console.log('🔧 Checking admin account status...');
    
    // First try to sign in (this will fail if account doesn't exist)
    try {
      const loginResult = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('✅ Admin account exists and login successful');
      return {
        success: true,
        message: 'Admin account exists and credentials are correct',
        accountExists: true
      };
    } catch (loginError: any) {
      if (loginError.code === 'auth/user-not-found') {
        console.log('ℹ️ Admin account not found, creating...');
        
        // Try to create the account
        const createResult = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Admin account created successfully');
        
        return {
          success: true,
          message: 'Admin account created successfully',
          accountExists: false
        };
      } else if (loginError.code === 'auth/wrong-password') {
        console.log('❌ Admin account exists but password is incorrect');
        return {
          success: false,
          message: 'Admin account exists but password is incorrect. Check Firebase Console.',
          accountExists: true
        };
      } else {
        throw loginError;
      }
    }
  } catch (error: any) {
    console.error('❌ Error with admin account:', error);
    return {
      success: false,
      message: `Error: ${error.message}`,
      accountExists: false
    };
  }
};

export const testAdminPermissions = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    // Ensure admin is logged in
    const adminCheck = await ensureAdminAccountExists();
    if (!adminCheck.success) {
      return {
        success: false,
        message: `Admin account issue: ${adminCheck.message}`
      };
    }

    // Test basic Firestore access
    const { db } = require('../services/firebase');
    const { collection, getDocs, limit } = require('firebase/firestore');
    
    // Try to read drivers collection
    const driversRef = collection(db, 'drivers');
    const driversSnapshot = await getDocs(driversRef);
    console.log('✅ Successfully accessed drivers collection');
    
    // Try to read orders collection
    const ordersRef = collection(db, 'orders');
    const ordersSnapshot = await getDocs(ordersRef);
    console.log('✅ Successfully accessed orders collection');
    
    return {
      success: true,
      message: `Admin permissions working. Found ${driversSnapshot.size} drivers and ${ordersSnapshot.size} orders.`
    };
  } catch (error: any) {
    console.error('❌ Admin permissions test failed:', error);
    return {
      success: false,
      message: `Permission test failed: ${error.message}`
    };
  }
};

export { ADMIN_EMAIL, ADMIN_PASSWORD };

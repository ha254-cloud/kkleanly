/**
 * Simple Driver Test Script
 * Test driver authentication without circular imports
 */

import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { driverService } from '../services/driverService';

// Test driver credentials
const TEST_DRIVER = {
  email: 'driver@kleanly.co.ke',
  password: 'SwiftDelivery543',
  name: 'Main Driver'
};

export const testDriverLoginSimple = async () => {
  console.log('🚗 Testing driver login (simple version)...');
  
  try {
    // Test authentication
    console.log(`🔐 Attempting login for: ${TEST_DRIVER.email}`);
    const userCredential = await signInWithEmailAndPassword(auth, TEST_DRIVER.email, TEST_DRIVER.password);
    console.log(`✅ Authentication successful!`);
    console.log(`   - UID: ${userCredential.user.uid}`);
    console.log(`   - Email: ${userCredential.user.email}`);
    
    // Check if driver exists in Firestore
    console.log(`🔍 Checking driver in Firestore...`);
    const drivers = await driverService.getAllDrivers();
    const driverRecord = drivers.find(d => d.email === TEST_DRIVER.email);
    
    if (driverRecord) {
      console.log(`✅ Driver found in Firestore:`);
      console.log(`   - ID: ${driverRecord.id}`);
      console.log(`   - Name: ${driverRecord.name}`);
      console.log(`   - Email: ${driverRecord.email}`);
    } else {
      console.log(`❌ Driver not found in Firestore`);
    }
    
    return { success: true, user: userCredential.user, driverRecord };
    
  } catch (error: any) {
    console.log(`❌ Test failed:`);
    console.log(`   - Error: ${error.code} - ${error.message}`);
    
    if (error.code === 'auth/user-not-found') {
      console.log(`💡 Suggestion: Create the driver account first`);
    }
    
    return { success: false, error };
  }
};

export const createDriverAccountSimple = async () => {
  console.log('🔧 Creating driver account...');
  
  try {
    // Create Firebase Auth account
    console.log(`👤 Creating auth account for: ${TEST_DRIVER.email}`);
    const userCredential = await createUserWithEmailAndPassword(auth, TEST_DRIVER.email, TEST_DRIVER.password);
    console.log(`✅ Auth account created successfully`);
    
    // Create Firestore driver record
    console.log(`📝 Creating Firestore driver record...`);
    const driverId = await driverService.createDriver({
      name: TEST_DRIVER.name,
      email: TEST_DRIVER.email,
      phone: '+254712345678',
      vehicleType: 'motorcycle',
      vehicleNumber: 'KDA 123A',
      status: 'available',
      rating: 5.0,
      totalDeliveries: 0
    });
    
    console.log(`✅ Driver record created with ID: ${driverId}`);
    
    return { success: true, user: userCredential.user, driverId };
    
  } catch (error: any) {
    console.log(`❌ Creation failed:`);
    console.log(`   - Error: ${error.code} - ${error.message}`);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log(`💡 Account already exists, testing login instead...`);
      return await testDriverLoginSimple();
    }
    
    return { success: false, error };
  }
};

export const fullDriverTest = async () => {
  console.log('🚀 Starting full driver test...');
  console.log('===============================');
  
  // First try to login
  let result: any = await testDriverLoginSimple();
  
  // If login failed, try to create account
  if (!result.success && result.error?.code === 'auth/user-not-found') {
    console.log('📝 User not found, creating account...');
    result = await createDriverAccountSimple();
  }
  
  console.log('===============================');
  if (result.success) {
    console.log('🎉 Driver test completed successfully!');
  } else {
    console.log('❌ Driver test failed');
  }
  
  return result;
};

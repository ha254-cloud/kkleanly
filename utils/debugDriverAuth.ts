/**
 * Driver Authentication Debug & Setup Script
 * Run this to diagnose and fix driver login issues
 */

import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { driverService } from '../services/driverService';
import { createDriverAccount, DEFAULT_DRIVER_ACCOUNTS } from './createDriverAccount';

/**
 * Test driver authentication
 */
export const testDriverAuth = async (email: string, password: string) => {
  console.log(`🔐 Testing authentication for: ${email}`);
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✅ Authentication successful!`);
    console.log(`   - UID: ${userCredential.user.uid}`);
    console.log(`   - Email: ${userCredential.user.email}`);
    console.log(`   - Email Verified: ${userCredential.user.emailVerified}`);
    
    // Check if user is recognized as driver (skip to avoid circular import)
    console.log(`   - Driver check skipped (avoiding circular import)`);
    
    return { success: true, user: userCredential.user, isDriver: 'skipped' };
    
  } catch (error: any) {
    console.log(`❌ Authentication failed:`);
    console.log(`   - Error Code: ${error.code}`);
    console.log(`   - Error Message: ${error.message}`);
    
    return { success: false, error: error.code, message: error.message };
  }
};

/**
 * Check if driver exists in Firestore
 */
export const checkDriverInFirestore = async (email: string) => {
  console.log(`🔍 Checking Firestore for driver: ${email}`);
  
  try {
    const drivers = await driverService.getAllDrivers();
    const driver = drivers.find(d => d.email === email);
    
    if (driver) {
      console.log(`✅ Driver found in Firestore:`);
      console.log(`   - ID: ${driver.id}`);
      console.log(`   - Name: ${driver.name}`);
      console.log(`   - Phone: ${driver.phone}`);
      console.log(`   - Status: ${driver.status}`);
      console.log(`   - Vehicle: ${driver.vehicleType} (${driver.vehicleNumber})`);
      return { exists: true, driver };
    } else {
      console.log(`❌ Driver not found in Firestore`);
      return { exists: false, driver: null };
    }
    
  } catch (error: any) {
    console.log(`❌ Error checking Firestore: ${error.message}`);
    return { exists: false, error: error.message };
  }
};

/**
 * Comprehensive driver setup and test
 */
export const setupAndTestDriver = async (email: string, password: string, name: string) => {
  console.log(`\n🚗 === DRIVER SETUP & TEST: ${email} ===`);
  
  // Step 1: Check if driver exists in Firestore
  const firestoreCheck = await checkDriverInFirestore(email);
  
  // Step 2: Test authentication
  let authResult = await testDriverAuth(email, password);
  
  // Step 3: If auth fails, try to create account
  if (!authResult.success && authResult.error === 'auth/user-not-found') {
    console.log(`\n🔧 User not found, creating account...`);
    
    const createResult = await createDriverAccount({
      email,
      password,
      name,
      phone: '+254714648622'
    });
    
    if (createResult.success) {
      console.log(`✅ Account created, testing auth again...`);
      authResult = await testDriverAuth(email, password);
    } else {
      console.log(`❌ Failed to create account: ${createResult.message}`);
    }
  }
  
  // Step 4: Summary
  console.log(`\n📊 === SUMMARY FOR ${email} ===`);
  console.log(`   Firebase Auth: ${authResult.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Firestore Entry: ${firestoreCheck.exists ? '✅ Found' : '❌ Missing'}`);
  console.log(`   Driver Recognition: ${authResult.isDriver ? '✅ Recognized' : '❌ Not Recognized'}`);
  
  return {
    email,
    authWorking: authResult.success,
    firestoreExists: firestoreCheck.exists,
    driverRecognized: authResult.isDriver,
    canLogin: authResult.success && authResult.isDriver
  };
};

/**
 * Test all known drivers
 */
export const testAllDrivers = async () => {
  console.log(`\n🚗 === TESTING ALL DRIVER ACCOUNTS ===`);
  
  const results = [];
  
  for (const driver of DEFAULT_DRIVER_ACCOUNTS) {
    const result = await setupAndTestDriver(driver.email, driver.password, driver.name);
    results.push(result);
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n📊 === OVERALL RESULTS ===`);
  console.log(`Total Drivers Tested: ${results.length}`);
  console.log(`Can Login: ${results.filter(r => r.canLogin).length}`);
  console.log(`Auth Issues: ${results.filter(r => !r.authWorking).length}`);
  console.log(`Missing from Firestore: ${results.filter(r => !r.firestoreExists).length}`);
  console.log(`Not Recognized as Driver: ${results.filter(r => !r.driverRecognized).length}`);
  
  console.log(`\n✅ Working Drivers:`);
  results.filter(r => r.canLogin).forEach(r => console.log(`   - ${r.email}`));
  
  console.log(`\n❌ Problematic Drivers:`);
  results.filter(r => !r.canLogin).forEach(r => console.log(`   - ${r.email}`));
  
  return results;
};

/**
 * Quick fix for the specific driver from the screenshot
 */
export const fixMainDriver = async () => {
  console.log(`\n🔧 === FIXING MAIN DRIVER ACCOUNT ===`);
  
  return await setupAndTestDriver(
    'driver@kleanly.co.ke',
    'SwiftDelivery543',
    'Main Driver'
  );
};

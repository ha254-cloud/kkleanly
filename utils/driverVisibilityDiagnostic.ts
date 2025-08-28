/**
 * Driver Visibility Diagnostic Tool
 * Helps diagnose why drivers aren't showing up in admin dispatch
 */

import { auth } from '../services/firebase';
import { driverService } from '../services/driverService';
import { ensureAdminAccountExists } from './ensureAdminAccount';

export const runDriverVisibilityDiagnostic = async () => {
  console.log('\n🔍 DRIVER VISIBILITY DIAGNOSTIC');
  console.log('================================');
  
  try {
    // Step 1: Check admin authentication
    console.log('\n1️⃣ Checking Admin Authentication...');
    const adminResult = await ensureAdminAccountExists();
    console.log(`Admin Status: ${adminResult.success ? '✅ OK' : '❌ FAILED'}`);
    console.log(`Message: ${adminResult.message}`);
    
    if (!adminResult.success) {
      console.log('❌ Cannot proceed without admin access');
      return;
    }
    
    // Step 2: Test Firestore access
    console.log('\n2️⃣ Testing Firestore Access...');
    try {
      const allDrivers = await driverService.getAllDrivers();
      console.log(`✅ Successfully accessed drivers collection`);
      console.log(`📊 Total drivers found: ${allDrivers.length}`);
      
      if (allDrivers.length > 0) {
        console.log('\n📋 Driver Details:');
        allDrivers.forEach((driver, index) => {
          console.log(`  ${index + 1}. ${driver.name} (${driver.email})`);
          console.log(`     Status: ${driver.status}`);
          console.log(`     Online: ${driver.isOnline}`);
          console.log(`     Vehicle: ${driver.vehicleType} - ${driver.vehicleNumber}`);
          console.log(`     ID: ${driver.id}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log(`❌ Firestore access failed: ${error}`);
      return;
    }
    
    // Step 3: Test available drivers filter
    console.log('\n3️⃣ Testing Available Drivers Filter...');
    try {
      const availableDrivers = await driverService.getAvailableDrivers();
      console.log(`✅ Successfully filtered available drivers`);
      console.log(`📊 Available drivers: ${availableDrivers.length}`);
      
      if (availableDrivers.length > 0) {
        console.log('\n📋 Available Driver Details:');
        availableDrivers.forEach((driver, index) => {
          console.log(`  ${index + 1}. ${driver.name} (${driver.email})`);
          console.log(`     Status: ${driver.status}`);
          console.log(`     Vehicle: ${driver.vehicleType}`);
        });
      } else {
        console.log('⚠️ No drivers have status = "available"');
        
        // Check what statuses exist
        const allDrivers = await driverService.getAllDrivers();
        const statuses = allDrivers.map(d => d.status);
        const uniqueStatuses = [...new Set(statuses)];
        console.log(`📊 Found statuses: ${uniqueStatuses.join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ Available drivers filter failed: ${error}`);
    }
    
    // Step 4: Test admin dispatch logic
    console.log('\n4️⃣ Testing Admin Dispatch Logic...');
    try {
      const user = auth.currentUser;
      const isAdmin = user?.email === 'kleanlyspt@gmail.com';
      
      console.log(`Current user: ${user?.email || 'Not logged in'}`);
      console.log(`Is admin: ${isAdmin ? '✅ YES' : '❌ NO'}`);
      
      if (!isAdmin) {
        console.log('⚠️ User needs to be logged in as admin to see drivers in dispatch');
      }
    } catch (error) {
      console.log(`❌ Admin check failed: ${error}`);
    }
    
    // Step 5: Provide recommendations
    console.log('\n5️⃣ Recommendations:');
    const allDrivers = await driverService.getAllDrivers();
    const availableDrivers = await driverService.getAvailableDrivers();
    
    if (allDrivers.length === 0) {
      console.log('📝 No drivers exist - need to create drivers first');
      console.log('   Run: createAllDefaultDrivers() or use emergency driver creator');
    } else if (availableDrivers.length === 0) {
      console.log('📝 Drivers exist but none are "available"');
      console.log('   Update driver status to "available" in Firestore');
    } else {
      console.log('📝 Drivers exist and are available');
      console.log('   Check admin login and dispatch screen refresh');
    }
    
    console.log('\n✅ Diagnostic completed!');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
};

export const fixDriverVisibility = async () => {
  console.log('\n🔧 FIXING DRIVER VISIBILITY');
  console.log('===========================');
  
  try {
    // Step 1: Ensure admin account exists
    await ensureAdminAccountExists();
    
    // Step 2: Get all drivers and fix their status
    const allDrivers = await driverService.getAllDrivers();
    
    console.log(`Found ${allDrivers.length} drivers`);
    
    if (allDrivers.length === 0) {
      console.log('No drivers found - creating emergency driver...');
      // Could import and use emergency driver creator here
      return;
    }
    
    // Step 3: Fix driver statuses
    for (const driver of allDrivers) {
      if (driver.status !== 'available') {
        console.log(`Updating ${driver.name} status from "${driver.status}" to "available"`);
        await driverService.updateDriverStatus(driver.id!, 'available');
      }
    }
    
    console.log('✅ Driver statuses updated!');
    
    // Step 4: Verify fix
    const availableDrivers = await driverService.getAvailableDrivers();
    console.log(`✅ Available drivers now: ${availableDrivers.length}`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
};

export default {
  runDriverVisibilityDiagnostic,
  fixDriverVisibility
};

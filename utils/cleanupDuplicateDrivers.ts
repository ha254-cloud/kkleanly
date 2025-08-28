/**
 * Cleanup Duplicate Drivers Script
 * Removes duplicate driver records from Firestore
 */

import { driverService } from '../services/driverService';

export const cleanupDuplicateDrivers = async () => {
  console.log('🧹 Starting cleanup of duplicate drivers...');
  
  try {
    // Get all drivers
    const allDrivers = await driverService.getAllDrivers();
    console.log(`📊 Total drivers found: ${allDrivers.length}`);
    
    // Group drivers by email
    const driversByEmail = new Map<string, any[]>();
    
    allDrivers.forEach(driver => {
      const email = driver.email;
      if (!driversByEmail.has(email)) {
        driversByEmail.set(email, []);
      }
      driversByEmail.get(email)!.push(driver);
    });
    
    console.log(`👥 Unique driver emails: ${driversByEmail.size}`);
    
    // Find and remove duplicates
    let duplicatesRemoved = 0;
    
    for (const [email, drivers] of driversByEmail.entries()) {
      if (drivers.length > 1) {
        console.log(`⚠️  Found ${drivers.length} duplicates for ${email}`);
        
        // Keep the first driver, remove the rest
        const [keepDriver, ...duplicates] = drivers;
        console.log(`   ✅ Keeping driver ID: ${keepDriver.id}`);
        
        for (const duplicate of duplicates) {
          try {
            await driverService.deleteDriver(duplicate.id);
            console.log(`   🗑️  Removed duplicate ID: ${duplicate.id}`);
            duplicatesRemoved++;
          } catch (error) {
            console.error(`   ❌ Failed to remove duplicate ID: ${duplicate.id}`, error);
          }
        }
      }
    }
    
    console.log(`✅ Cleanup complete! Removed ${duplicatesRemoved} duplicate drivers`);
    
    // Get updated count
    const updatedDrivers = await driverService.getAllDrivers();
    console.log(`📊 Drivers remaining: ${updatedDrivers.length}`);
    
    return { success: true, duplicatesRemoved, finalCount: updatedDrivers.length };
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return { success: false, error };
  }
};

export const reportDriverStatistics = async () => {
  console.log('📊 Generating driver statistics...');
  
  try {
    const drivers = await driverService.getAllDrivers();
    
    // Count by email
    const emailCounts = new Map<string, number>();
    drivers.forEach(driver => {
      const count = emailCounts.get(driver.email) || 0;
      emailCounts.set(driver.email, count + 1);
    });
    
    console.log('\n📈 Driver Statistics:');
    console.log(`Total Records: ${drivers.length}`);
    console.log(`Unique Emails: ${emailCounts.size}`);
    
    // Show duplicates
    const duplicates = Array.from(emailCounts.entries()).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('\n⚠️  Duplicate emails found:');
      duplicates.forEach(([email, count]) => {
        console.log(`   ${email}: ${count} records`);
      });
    } else {
      console.log('\n✅ No duplicates found!');
    }
    
    return { 
      totalRecords: drivers.length, 
      uniqueEmails: emailCounts.size, 
      duplicates: duplicates.length 
    };
    
  } catch (error) {
    console.error('❌ Error generating statistics:', error);
    return { error };
  }
};

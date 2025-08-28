/**
 * Simple driver creation utility for testing
 * Run this with admin credentials to create test drivers
 */

import { driverAccountService } from '../services/driverAccountService';

export const createTestDrivers = async () => {
  try {
    console.log('🚚 Creating test drivers with accounts...');
    
    const testDrivers = [
      {
        name: 'John Doe',
        email: 'driver1@kleanly.co.ke',
        phone: '+254712345678',
        vehicleType: 'motorcycle' as const,
        vehicleNumber: 'KCA 123A',
      },
      {
        name: 'Jane Smith',
        email: 'driver2@kleanly.co.ke',
        phone: '+254787654321',
        vehicleType: 'van' as const,
        vehicleNumber: 'KBZ 456B',
      },
      {
        name: 'Mike Johnson',
        email: 'driver3@kleanly.co.ke',
        phone: '+254798765432',
        vehicleType: 'motorcycle' as const,
        vehicleNumber: 'KCD 789C',
      }
    ];
    
    const results = [];
    
    for (const driverData of testDrivers) {
      try {
        const result = await driverAccountService.createDriverWithAccount(driverData);
        
        if (result.success) {
          console.log(`✅ Created driver account: ${driverData.name} (${driverData.email})`);
          console.log(`   Password: ${result.temporaryPassword}`);
          results.push({
            name: driverData.name,
            email: driverData.email,
            password: result.temporaryPassword
          });
        } else {
          console.log(`❌ Failed to create driver ${driverData.name}: ${result.error}`);
        }
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`ℹ️ Driver account already exists: ${driverData.name} (${driverData.email})`);
        } else {
          console.error(`❌ Error creating driver ${driverData.name}:`, error);
        }
      }
    }
    
    console.log('🎉 Driver setup completed!');
    
    if (results.length > 0) {
      console.log('\n📋 DRIVER LOGIN CREDENTIALS:');
      console.log('================================================');
      results.forEach(driver => {
        console.log(`👤 ${driver.name}`);
        console.log(`   📧 Email: ${driver.email}`);
        console.log(`   🔑 Password: ${driver.password}`);
        console.log('');
      });
      console.log('Share these credentials with your drivers!');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Error in createTestDrivers:', error);
    throw error;
  }
};

// Export for use in other files
export default createTestDrivers;

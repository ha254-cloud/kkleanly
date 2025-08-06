import { driverService } from '../services/driverService';

export const createTestDrivers = async () => {
  try {
    // Check if drivers already exist
    const existingDrivers = await driverService.getAllDrivers();
    
    if (existingDrivers.length === 0) {
      console.log('Creating test drivers...');
      
      const testDrivers = [
        {
          name: 'John Kiprotich',
          phone: '+254712345678',
          email: 'john.driver@kleanly.co.ke',
          vehicleType: 'motorcycle' as const,
          vehicleNumber: 'KCA 123A',
          status: 'available' as const,
          rating: 4.8,
          totalDeliveries: 245,
        },
        {
          name: 'Mary Wanjiku',
          phone: '+254723456789',
          email: 'mary.driver@kleanly.co.ke',
          vehicleType: 'car' as const,
          vehicleNumber: 'KCB 456B',
          status: 'available' as const,
          rating: 4.6,
          totalDeliveries: 189,
        },
        {
          name: 'Peter Otieno',
          phone: '+254734567890',
          email: 'peter.driver@kleanly.co.ke',
          vehicleType: 'van' as const,
          vehicleNumber: 'KCC 789C',
          status: 'available' as const,
          rating: 4.9,
          totalDeliveries: 312,
        }
      ];
      
      for (const driver of testDrivers) {
        await driverService.createDriver(driver);
        console.log(`Created driver: ${driver.name}`);
      }
      
      console.log('Test drivers created successfully!');
    } else {
      console.log(`Found ${existingDrivers.length} existing drivers`);
    }
    
    return await driverService.getAllDrivers();
  } catch (error) {
    console.error('Error creating test drivers:', error);
    throw error;
  }
};

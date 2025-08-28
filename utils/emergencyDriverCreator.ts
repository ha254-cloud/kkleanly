/**
 * Emergency Driver Account Creator
 * Creates a fresh driver account with known credentials
 */

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { driverService } from '../services/driverService';

const createEmergencyDriverAccount = async () => {
  const testEmail = 'testdriver@kleanly.co.ke';
  const testPassword = 'TestDriver123!';
  
  try {
    console.log('🚚 Creating emergency driver account...');
    
    // Create Firebase auth account
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    
    console.log('✅ Firebase auth account created:', user.uid);
    
    // Create driver profile
    const driverData = {
      email: testEmail,
      name: 'Test Driver',
      phone: '+254714648622',
      status: 'offline' as const,
      vehicleType: 'motorcycle' as const,
      vehicleNumber: 'TEST-001',
      rating: 5.0,
      totalDeliveries: 0
    };
    
    const driverId = await driverService.createDriver(driverData);
    console.log('✅ Driver profile created:', driverId);
    
    console.log(`
  EMERGENCY DRIVER ACCOUNT CREATED!

📧 Email: ${testEmail}
🔑 Password: ${testPassword}
🆔 Firebase UID: ${user.uid}
📄 Driver Profile ID: ${driverId}

🔗 Test this account immediately:
1. Go to http://localhost:8082/login
2. Enter the credentials above
3. Should redirect to driver dashboard

This account is for testing purposes only.
    `);
    
    return { email: testEmail, password: testPassword, uid: user.uid, driverId };
    
  } catch (error) {
    console.error('❌ Error creating emergency driver account:', error);
    throw error;
  }
};

export { createEmergencyDriverAccount };

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface DriverSetupData {
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  licenseNumber: string;
}

export const setupDriverAccount = async (driverData: DriverSetupData) => {
  try {
    console.log('🚀 Setting up driver account for:', driverData.email);
    
    // Generate secure password
    const password = generateSecurePassword();
    
    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      driverData.email,
      password
    );
    
    const user = userCredential.user;
    console.log('✅ Driver auth account created:', user.uid);
    
    // Create driver profile in Firestore
    const driverProfile = {
      ...driverData,
      id: user.uid,
      createdAt: new Date().toISOString(),
      isActive: true,
      rating: 5.0,
      totalDeliveries: 0,
      supportEmail: 'kleanlyspt@gmail.com', // Your support email
    };
    
    // Save to drivers collection
    await setDoc(doc(db, 'drivers', user.uid), driverProfile);
    console.log('✅ Driver profile saved to Firestore');
    
    // Return account details for communication to driver
    return {
      success: true,
      driverData: {
        email: driverData.email,
        password: password,
        uid: user.uid,
        supportEmail: 'kleanlyspt@gmail.com'
      }
    };
    
  } catch (error: any) {
    console.error('❌ Failed to setup driver account:', error);
    
    // Handle specific error cases
    if (error.code === 'auth/email-already-in-use') {
      return {
        success: false,
        error: 'Email already in use. Driver account may already exist.'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create driver account'
    };
  }
};

const generateSecurePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Email template for sending credentials to driver
export const generateDriverWelcomeEmail = (driverData: any) => {
  return {
    subject: 'Welcome to Kleanly - Your Driver Account Details',
    body: `
Dear ${driverData.name || 'Driver'},

Welcome to the Kleanly driver team! Your driver account has been successfully created.

Login Details:
📧 Email: ${driverData.email}
🔒 Password: ${driverData.password}

Important Notes:
• Please change your password after your first login
• Download the Kleanly driver app to get started
• Contact support if you need assistance

Support Contact:
📧 Email: kleanlyspt@gmail.com
📱 Phone: [Your support phone]

Thank you for joining our team!

Best regards,
Kleanly Team
    `.trim()
  };
};

export default setupDriverAccount;

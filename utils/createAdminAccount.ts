import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { ADMIN_EMAIL } from './adminAuth';

const ADMIN_PASSWORD = 'KleanlyAdmin2025!';

export const createAdminAccount = async () => {
  try {
    console.log('🔧 Setting up admin account...');
    console.log('📧 Admin Email:', ADMIN_EMAIL);
    console.log('🔑 Admin Password:', ADMIN_PASSWORD);
    
    // Try to create the admin account
    const result = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Admin account created successfully:', result.user.email);
    
    return {
      success: true,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      message: 'Admin account created successfully'
    };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin account already exists, attempting login...');
      
      try {
        // Try to sign in with the expected password
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Admin login successful with existing account');
        
        return {
          success: true,
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          message: 'Admin account already exists and login successful'
        };
      } catch (loginError: any) {
        console.log('❌ Could not login with expected password');
        return {
          success: false,
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          message: 'Admin account exists but password might be different. Try the credentials above or reset the password in Firebase Console.'
        };
      }
    } else {
      console.error('❌ Error creating admin account:', error);
      return {
        success: false,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        message: `Error: ${error.message}`
      };
    }
  }
};

export const getAdminCredentials = () => {
  return {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  };
};

// Test admin login
export const testAdminLogin = async () => {
  try {
    console.log('🧪 Testing admin login...');
    const result = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Admin login test successful:', result.user.email);
    return true;
  } catch (error: any) {
    console.log('❌ Admin login test failed:', error.message);
    return false;
  }
};

// Display admin info
export const displayAdminInfo = () => {
  console.log('\n🔐 ADMIN LOGIN CREDENTIALS');
  console.log('================================');
  console.log('📧 Email:', ADMIN_EMAIL);
  console.log('🔑 Password:', ADMIN_PASSWORD);
  console.log('================================');
  console.log('💡 Use these credentials to log in as admin');
  console.log('💡 Admin features include:');
  console.log('   - Analytics Dashboard');
  console.log('   - Order Management');
  console.log('   - Driver Management');
  console.log('   - Dispatch Center');
  console.log('================================\n');
};

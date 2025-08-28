import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance } from './services/firebase';

const ADMIN_EMAIL = 'kleanlyspt@gmail.com';
const ADMIN_PASSWORD = 'KleanlyAdmin2025!';

export const setupAdminAccount = async () => {
  try {
    console.log('🔧 Starting admin account setup...');
    const auth = getAuthInstance();
    
    console.log('📧 Admin Email:', ADMIN_EMAIL);
    console.log('🔑 Admin Password:', ADMIN_PASSWORD);
    
    // First try to create the account
    try {
      console.log('🔄 Attempting to create admin account...');
      const createResult = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('✅ Admin account created successfully!');
      console.log('👤 User UID:', createResult.user.uid);
      console.log('📧 User Email:', createResult.user.email);
      return { success: true, action: 'created', user: createResult.user };
    } catch (createError: any) {
      if (createError.code === 'auth/email-already-in-use') {
        console.log('ℹ️ Admin account already exists, testing login...');
        
        // Try to login with the credentials
        try {
          console.log('🔄 Attempting admin login...');
          const loginResult = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
          console.log('✅ Admin login successful!');
          console.log('👤 User UID:', loginResult.user.uid);
          console.log('📧 User Email:', loginResult.user.email);
          return { success: true, action: 'login_successful', user: loginResult.user };
        } catch (loginError: any) {
          console.log('❌ Admin login failed:', loginError.code, loginError.message);
          
          if (loginError.code === 'auth/wrong-password') {
            console.log('🔧 The account exists but with a different password');
            console.log('💡 Try these solutions:');
            console.log('   1. Check if password was changed in Firebase Console');
            console.log('   2. Reset password in Firebase Console');
            console.log('   3. Use Firebase Console to set password to: KleanlyAdmin2025!');
          }
          
          return { 
            success: false, 
            action: 'login_failed', 
            error: loginError.message,
            code: loginError.code
          };
        }
      } else {
        console.log('❌ Failed to create admin account:', createError.code, createError.message);
        return { 
          success: false, 
          action: 'create_failed', 
          error: createError.message,
          code: createError.code
        };
      }
    }
  } catch (error: any) {
    console.error('❌ Setup failed:', error);
    return { success: false, action: 'setup_failed', error: error.message };
  }
};

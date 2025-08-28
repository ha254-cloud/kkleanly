import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { getAuthInstance } from '../services/firebase';

export const testFirebaseAuth = async (email: string) => {
  console.log('=== Firebase Auth Test ===');
  console.log('Testing email:', email);
  
  try {
    const auth = getAuthInstance();
    console.log('Auth instance:', {
      currentUser: auth.currentUser,
      config: auth.config,
      name: auth.name
    });
    
    console.log('Attempting to send password reset email...');
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent successfully!');
    return { success: true, message: 'Email sent successfully' };
  } catch (error: any) {
    console.error('❌ Password reset failed:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

export const testFirebaseConfig = () => {
  console.log('=== Firebase Config Test ===');
  const auth = getAuthInstance();
  
  console.log('Auth configuration:', {
    authDomain: auth.app.options.authDomain,
    apiKey: auth.app.options.apiKey ? '***configured***' : 'missing',
    projectId: auth.app.options.projectId
  });
  
  return {
    authDomain: auth.app.options.authDomain,
    hasApiKey: !!auth.app.options.apiKey,
    projectId: auth.app.options.projectId
  };
};

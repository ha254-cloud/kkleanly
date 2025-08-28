import { sendPasswordResetEmail } from 'firebase/auth';
import { getAuthInstance } from '../services/firebase';

export const simplePasswordResetTest = async (email: string) => {
  console.log('🔥 SIMPLE TEST: Starting basic Firebase password reset test');
  console.log('🔥 SIMPLE TEST: Email:', email);
  
  try {
    // Get Firebase auth
    const auth = getAuthInstance();
    console.log('🔥 SIMPLE TEST: Got auth instance');
    console.log('🔥 SIMPLE TEST: Auth config:', {
      apiKey: auth.app.options.apiKey ? 'SET' : 'MISSING',
      authDomain: auth.app.options.authDomain,
      projectId: auth.app.options.projectId
    });
    
    // Try direct Firebase call
    console.log('🔥 SIMPLE TEST: Calling sendPasswordResetEmail directly...');
    
    await sendPasswordResetEmail(auth, email);
    
    console.log('✅ SIMPLE TEST: SUCCESS! Firebase accepted the request');
    return { success: true, message: 'Direct Firebase call succeeded' };
    
  } catch (error: any) {
    console.error('❌ SIMPLE TEST: FAILED');
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Full error:', error);
    
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message,
        fullError: error.toString()
      }
    };
  }
};

export const checkFirebaseAuthConfig = () => {
  console.log('🔍 CHECKING FIREBASE AUTH CONFIG');
  
  try {
    const auth = getAuthInstance();
    const config = auth.app.options;
    
    console.log('🔍 Config check:', {
      hasApiKey: !!config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      appId: config.appId,
      messagingSenderId: config.messagingSenderId
    });
    
    // Check if all required fields are present
    const required = ['apiKey', 'authDomain', 'projectId'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      console.log('❌ Missing required config:', missing);
      return { valid: false, missing };
    }
    
    console.log('✅ All required config present');
    return { valid: true, config };
    
  } catch (error) {
    console.error('❌ Config check failed:', error);
    return { valid: false, error };
  }
};

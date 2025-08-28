/**
 * Create Driver Account via Expo
 * Quick fix for the missing driver account
 */
const { createUserWithEmailAndPassword } = require('firebase/auth');

// This will run in the Expo environment
const createDriver = async () => {
  try {
    console.log('🚗 Creating driver@kleanly.co.ke account...');
    
    // This assumes Firebase is already initialized in the app
    const auth = global.auth || require('./services/firebase').auth;
    
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'driver@kleanly.co.ke',
      'SwiftDelivery543'
    );
    
    console.log('✅ Driver account created successfully!');
    console.log('UID:', userCredential.user.uid);
    console.log('Email:', userCredential.user.email);
    
    return userCredential;
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️ Account already exists, this is good!');
    } else {
      console.error('❌ Error creating account:', error.code, error.message);
    }
    return error;
  }
};

// Export for use in debug panel
module.exports = { createDriver };

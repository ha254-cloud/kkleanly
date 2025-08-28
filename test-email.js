// Test password reset email functionality
const { initializeApp } = require('firebase/app');
const { getAuth, sendPasswordResetEmail } = require('firebase/auth');
require('dotenv').config();

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testPasswordReset() {
  try {
    console.log('🔥 Testing Firebase Password Reset Email...');
    console.log('📧 Sending password reset email to: harrythukumaina@gmail.com');
    
    // Send password reset email
    await sendPasswordResetEmail(auth, 'harrythukumaina@gmail.com', {
      url: 'https://kleanly.app/reset-password', // Custom redirect URL
      handleCodeInApp: false
    });
    
    console.log('✅ Password reset email sent successfully!');
    console.log('📬 Check the inbox for harrythukumaina@gmail.com');
    console.log('📧 Email should contain a link to reset the password');
    
    // Note: Firebase will only send the email if the user exists in the system
    console.log('\n📝 Note: Firebase only sends reset emails to registered users');
    console.log('   If no email appears, the user may not be registered yet');
    
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('🔍 User not found. The email address is not registered.');
      console.log('💡 Try registering the user first, then test password reset.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('📧 Invalid email format provided.');
    } else if (error.code === 'auth/too-many-requests') {
      console.log('⏱️  Too many requests. Please wait before trying again.');
    } else {
      console.log('🔧 Check your Firebase configuration and try again.');
    }
  }
}

// Run the test
testPasswordReset().then(() => {
  console.log('\n🎯 Password reset email test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});

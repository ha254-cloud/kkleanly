// Test user registration and password reset email
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } = require('firebase/auth');
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

async function testEmailFlow() {
  const testEmail = 'harrythukumaina@gmail.com';
  const testPassword = 'TestPassword123!';
  
  try {
    console.log('🔥 Testing Firebase Email Flow...');
    console.log('📧 Email:', testEmail);
    
    // Step 1: Try to create user (or skip if already exists)
    try {
      console.log('\n👤 Step 1: Creating test user...');
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('✅ User created successfully:', userCredential.user.uid);
    } catch (registrationError) {
      if (registrationError.code === 'auth/email-already-in-use') {
        console.log('✅ User already exists, proceeding to password reset...');
      } else {
        console.log('⚠️  Registration error:', registrationError.message);
        console.log('   Proceeding with password reset anyway...');
      }
    }
    
    // Step 2: Send password reset email (without custom URL to avoid domain issue)
    console.log('\n📧 Step 2: Sending password reset email...');
    await sendPasswordResetEmail(auth, testEmail);
    
    console.log('✅ Password reset email sent successfully!');
    console.log('📬 Check the inbox for harrythukumaina@gmail.com');
    console.log('📧 The email should contain a Firebase-hosted reset link');
    console.log('🔗 The reset link will redirect to: https://kleanly-67b7b.firebaseapp.com');
    
  } catch (error) {
    console.error('❌ Error in email flow:', error.message);
    console.error('📄 Error code:', error.code);
    
    if (error.code === 'auth/user-not-found') {
      console.log('🔍 User not found in Firebase Authentication');
    } else if (error.code === 'auth/invalid-email') {
      console.log('📧 Invalid email format');
    } else if (error.code === 'auth/too-many-requests') {
      console.log('⏱️  Rate limited - too many requests');
    } else {
      console.log('🔧 Check Firebase project configuration');
    }
  }
}

// Run the test
testEmailFlow().then(() => {
  console.log('\n🎯 Email flow test completed!');
  console.log('📝 If successful, check harrythukumaina@gmail.com for the reset email');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});

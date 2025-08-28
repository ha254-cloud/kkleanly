/**
 * Test password reset with real user account
 * This creates a test user and immediately tests password reset
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } = require('firebase/auth');

const firebaseConfig = {
  apiKey: 'AIzaSyD3EG_vMbeMeuf8mdMhOtu-3ePqff6polo',
  authDomain: 'kleanly-67b7b.firebaseapp.com',
  projectId: 'kleanly-67b7b',
  storageBucket: 'kleanly-67b7b.firebasestorage.app',
  messagingSenderId: '474784025290',
  appId: '1:474784025290:web:92b6bbfa7b85c52f040233'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testPasswordResetWithRealUser() {
  console.log('🧪 Testing Password Reset with Real User');
  console.log('==========================================');
  
  const testEmail = 'passwordtest@kleanly.com';
  const testPassword = 'TestPassword123!';
  
  try {
    // Step 1: Create a test user
    console.log('📝 Step 1: Creating test user...');
    console.log(`Email: ${testEmail}`);
    
    try {
      await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('✅ Test user created successfully');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('✅ Test user already exists, proceeding with password reset');
      } else {
        console.log('❌ Failed to create test user:', error.message);
        return;
      }
    }
    
    // Step 2: Send password reset email
    console.log('\n📧 Step 2: Sending password reset email...');
    
    await sendPasswordResetEmail(auth, testEmail, {
      url: 'https://kleanly-67b7b.firebaseapp.com/',
      handleCodeInApp: false
    });
    
    console.log('✅ Password reset email sent successfully!');
    console.log(`📬 Email sent to: ${testEmail}`);
    console.log('');
    console.log('🔍 Next Steps:');
    console.log('1. Check your email inbox and spam folder');
    console.log('2. Look for email from: noreply@kleanly-67b7b.firebaseapp.com');
    console.log('3. If not received within 15 minutes, check Firebase Console');
    console.log('4. Subject should be: "Reset your password for kleanly-67b7b"');
    console.log('');
    console.log('📋 If email doesn\'t arrive, verify:');
    console.log('• Firebase Console > Authentication > Templates');
    console.log('• Firebase Console > Authentication > Settings > Authorized domains');
    console.log('• Your email provider spam settings');
    
  } catch (error) {
    console.log('❌ Password reset failed:');
    console.log(`Error Code: ${error.code}`);
    console.log(`Error Message: ${error.message}`);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 The user doesn\'t exist. Try creating the user first.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('💡 Invalid email format.');
    } else {
      console.log('💡 Check Firebase Console configuration.');
    }
  }
}

testPasswordResetWithRealUser();

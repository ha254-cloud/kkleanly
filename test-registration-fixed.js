// Quick test to verify the problematic email can now be registered
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, deleteUser, signOut } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyD3EG_vMbeMeuf8mdMhOtu-3ePqff6polo",
  authDomain: "kleanly-67b7b.firebaseapp.com",
  projectId: "kleanly-67b7b",
  storageBucket: "kleanly-67b7b.firebasestorage.app",
  messagingSenderId: "474784025290",
  appId: "1:474784025290:web:92b6bbfa7b85c52f040233",
  measurementId: "G-GR5WPXRPY9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log('🧪 Testing Registration After Cleanup');
console.log('====================================');

async function testRegistration(email) {
  const testPassword = 'TestPassword123!';
  
  console.log(`\n📧 Testing: ${email}`);
  
  try {
    // Try to create the account
    console.log('   📝 Creating account...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, testPassword);
    
    console.log(`   ✅ SUCCESS! Account created with UID: ${userCredential.user.uid}`);
    
    // Immediately clean up the test account
    console.log('   🧹 Cleaning up test account...');
    await deleteUser(userCredential.user);
    console.log('   ✅ Test account deleted');
    
    await signOut(auth);
    
    return { success: true, message: 'Registration successful' };
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.code} - ${error.message}`);
    
    // Sign out in case of error
    try {
      await signOut(auth);
    } catch (signOutError) {
      // Ignore
    }
    
    return { success: false, error: error.code, message: error.message };
  }
}

async function runTests() {
  const testEmails = [
    'mainaharry67@gmail.com',
    'mainaharry554@gmail.com'
  ];
  
  for (const email of testEmails) {
    const result = await testRegistration(email);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Registration tests complete!');
  console.log('You should now be able to register these emails in your app.');
}

runTests().catch(console.error);

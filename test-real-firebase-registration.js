// Test actual Firebase registration with the problematic emails
// This will verify that the emails can now be registered successfully

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signOut, deleteUser } = require('firebase/auth');

// Firebase config (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log('🔥 Testing Firebase Registration with Fixed Emails');
console.log('================================================');

const testEmails = [
  'mainaharry554@gmail.com',
  'mainaharry67@gmail.com',
  'testuser123@example.com',
  'testuser456@example.com'
];

async function testRegistration(email) {
  const testPassword = 'TestPassword123!';
  
  console.log(`\n🧪 Testing registration for: ${email}`);
  
  try {
    // Attempt to create user
    console.log('   📝 Creating user...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, testPassword);
    
    console.log(`   ✅ SUCCESS! User created with UID: ${userCredential.user.uid}`);
    
    // Clean up - delete the test user
    console.log('   🧹 Cleaning up test user...');
    await deleteUser(userCredential.user);
    console.log('   ✅ Test user deleted successfully');
    
    // Sign out
    await signOut(auth);
    
    return { email, success: true, message: 'Registration successful' };
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.code} - ${error.message}`);
    
    // Sign out in case of error
    try {
      await signOut(auth);
    } catch (signOutError) {
      // Ignore sign out errors
    }
    
    return { email, success: false, error: error.code, message: error.message };
  }
}

async function runRegistrationTests() {
  console.log(`\n📋 Testing registration for ${testEmails.length} emails...\n`);
  
  const results = [];
  
  for (const email of testEmails) {
    const result = await testRegistration(email);
    results.push(result);
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Registration Test Results');
  console.log('===========================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}`);
  successful.forEach(r => console.log(`   • ${r.email}`));
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach(r => console.log(`   • ${r.email}: ${r.error} - ${r.message}`));
  }
  
  console.log(`\n📈 Success Rate: ${((successful.length / results.length) * 100).toFixed(1)}%`);
  
  if (successful.length === results.length) {
    console.log('\n🎉 All registration tests passed!');
    console.log('Users can now successfully create accounts with different email variations.');
  } else {
    console.log('\n⚠️  Some registrations failed. Check the errors above for details.');
  }
}

// Note: This script requires actual Firebase credentials to work
console.log('⚠️  Note: This script requires actual Firebase configuration.');
console.log('Update the firebaseConfig object with your real Firebase credentials.');
console.log('Then run this script to test actual registration.');

// Uncomment the line below to run the test with real Firebase config
// runRegistrationTests().catch(console.error);

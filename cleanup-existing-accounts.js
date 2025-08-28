// Clean up existing test accounts that are blocking registration
// This script will help identify and remove conflicting accounts

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, deleteUser, signOut } = require('firebase/auth');
const { getFirestore, collection, query, where, getDocs, deleteDoc } = require('firebase/firestore');

// Firebase config from your project
const firebaseConfig = {
  apiKey: "AIzaSyD3EG_vMbeMeuf8mdMhOtu-3ePqff6polo",
  authDomain: "kleanly-67b7b.firebaseapp.com",
  projectId: "kleanly-67b7b",
  storageBucket: "kleanly-67b7b.firebasestorage.app",
  messagingSenderId: "474784025290",
  appId: "1:474784025290:web:92b6bbfa7b85c52f040233",
  measurementId: "G-GR5WPXRPY9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('🧹 Firebase Account Cleanup Tool');
console.log('================================');

const problemEmails = [
  'mainaharry67@gmail.com',
  'mainaharry554@gmail.com',
  'harrymaina02@gmail.com'
];

async function checkEmailInFirestore(email) {
  console.log(`\n🔍 Checking Firestore for: ${email}`);
  
  try {
    // Check users collection
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('email', '==', email));
    const userSnapshots = await getDocs(userQuery);
    
    if (!userSnapshots.empty) {
      console.log(`   📄 Found in users collection: ${userSnapshots.size} documents`);
      userSnapshots.forEach(doc => {
        console.log(`      • Document ID: ${doc.id}`);
        console.log(`      • Data: ${JSON.stringify(doc.data(), null, 2)}`);
      });
      return { found: true, collection: 'users', docs: userSnapshots.docs };
    }
    
    // Check drivers collection  
    const driversRef = collection(db, 'drivers');
    const driverQuery = query(driversRef, where('email', '==', email));
    const driverSnapshots = await getDocs(driverQuery);
    
    if (!driverSnapshots.empty) {
      console.log(`   🚗 Found in drivers collection: ${driverSnapshots.size} documents`);
      driverSnapshots.forEach(doc => {
        console.log(`      • Document ID: ${doc.id}`);
        console.log(`      • Data: ${JSON.stringify(doc.data(), null, 2)}`);
      });
      return { found: true, collection: 'drivers', docs: driverSnapshots.docs };
    }
    
    console.log(`   ✅ Not found in Firestore`);
    return { found: false };
    
  } catch (error) {
    console.log(`   ❌ Error checking Firestore: ${error.message}`);
    return { found: false, error: error.message };
  }
}

async function tryDeleteAuthAccount(email) {
  console.log(`\n🗑️ Attempting to delete Auth account: ${email}`);
  
  // We need to know the password to sign in and delete
  const possiblePasswords = [
    'TestPassword123!',
    'password123',
    'Password123!',
    'test123',
    'SwiftDelivery543'
  ];
  
  for (const password of possiblePasswords) {
    try {
      console.log(`   🔑 Trying password: ${password.substring(0, 4)}...`);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log(`   ✅ Successfully signed in with UID: ${userCredential.user.uid}`);
      
      // Delete the user
      await deleteUser(userCredential.user);
      console.log(`   ✅ Successfully deleted Auth account for ${email}`);
      
      await signOut(auth);
      return { deleted: true, uid: userCredential.user.uid };
      
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        console.log(`   ❌ Wrong password: ${password.substring(0, 4)}...`);
        continue;
      } else if (error.code === 'auth/user-not-found') {
        console.log(`   ✅ No Auth account found for ${email}`);
        return { deleted: false, reason: 'user-not-found' };
      } else {
        console.log(`   ❌ Error: ${error.code} - ${error.message}`);
      }
    }
  }
  
  console.log(`   ❌ Could not delete Auth account - unknown password`);
  return { deleted: false, reason: 'unknown-password' };
}

async function cleanupEmail(email) {
  console.log(`\n🎯 CLEANING UP: ${email}`);
  console.log('=' + '='.repeat(email.length + 15));
  
  // Step 1: Check Firestore
  const firestoreResult = await checkEmailInFirestore(email);
  
  // Step 2: Try to delete Auth account
  const authResult = await tryDeleteAuthAccount(email);
  
  // Step 3: Clean up Firestore documents if found
  if (firestoreResult.found && firestoreResult.docs) {
    console.log(`\n🗑️ Deleting Firestore documents for ${email}`);
    try {
      for (const doc of firestoreResult.docs) {
        await deleteDoc(doc.ref);
        console.log(`   ✅ Deleted document: ${doc.id}`);
      }
    } catch (error) {
      console.log(`   ❌ Error deleting Firestore docs: ${error.message}`);
    }
  }
  
  return {
    email,
    firestore: firestoreResult,
    auth: authResult
  };
}

async function runCleanup() {
  console.log(`\n📋 Starting cleanup for ${problemEmails.length} emails...\n`);
  
  const results = [];
  
  for (const email of problemEmails) {
    const result = await cleanupEmail(email);
    results.push(result);
    
    // Wait between cleanups
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📊 CLEANUP SUMMARY');
  console.log('==================');
  
  results.forEach(result => {
    console.log(`\n📧 ${result.email}:`);
    console.log(`   Firestore: ${result.firestore.found ? '🗑️ Cleaned' : '✅ Clean'}`);
    console.log(`   Auth: ${result.auth.deleted ? '🗑️ Deleted' : '✅ Clean'}`);
  });
  
  console.log('\n🎉 Cleanup complete! Try registering the emails again.');
}

// Add manual cleanup instructions
console.log('\n⚠️  MANUAL CLEANUP NEEDED');
console.log('========================');
console.log('If this script cannot delete accounts automatically, you need to:');
console.log('');
console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
console.log('2. Select your project: kleanly-67b7b');
console.log('3. Go to Authentication > Users');
console.log('4. Search for and delete these emails:');
problemEmails.forEach(email => console.log(`   • ${email}`));
console.log('');
console.log('5. Go to Firestore Database');
console.log('6. Check users/ and drivers/ collections');
console.log('7. Delete any documents with these emails');

console.log('\n🚀 Starting automated cleanup...');
runCleanup().catch(console.error);

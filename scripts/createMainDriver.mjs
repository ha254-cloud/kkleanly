/**
 * Create Driver Account Script
 * Run this to create the missing driver@kleanly.co.ke account
 */

// Import Firebase functions
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase config (from your project)
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
const db = getFirestore(app);

const createMainDriver = async () => {
  console.log('🚗 Creating main driver account...');
  
  const driverData = {
    email: 'driver@kleanly.co.ke',
    password: 'SwiftDelivery543',
    name: 'Main Driver',
    phone: '+254712345678',
    vehicleType: 'motorcycle',
    vehicleNumber: 'KDA 123A'
  };
  
  try {
    // Step 1: Create Firebase Auth account
    console.log('👤 Creating Firebase Auth account...');
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      driverData.email, 
      driverData.password
    );
    console.log(`✅ Auth account created: ${userCredential.user.uid}`);
    
    // Step 2: Create Firestore driver record
    console.log('📝 Creating Firestore driver record...');
    const docRef = await addDoc(collection(db, 'drivers'), {
      name: driverData.name,
      email: driverData.email,
      phone: driverData.phone,
      vehicleType: driverData.vehicleType,
      vehicleNumber: driverData.vehicleNumber,
      status: 'available',
      rating: 5.0,
      totalDeliveries: 0,
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ Driver record created: ${docRef.id}`);
    
    console.log('🎉 Driver account setup complete!');
    console.log(`   Email: ${driverData.email}`);
    console.log(`   Password: ${driverData.password}`);
    
    return { success: true, uid: userCredential.user.uid, driverId: docRef.id };
    
  } catch (error) {
    console.error('❌ Error creating driver:', error);
    return { success: false, error };
  }
};

// Run the script
createMainDriver()
  .then((result) => {
    if (result.success) {
      console.log('✅ Script completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Script failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Script error:', error);
    process.exit(1);
  });

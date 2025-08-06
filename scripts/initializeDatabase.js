// Script to initialize the Firestore database with the orders collection
// Run this with: node scripts/initializeDatabase.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration (same as your app)
const firebaseConfig = {
  apiKey: "AIzaSyD3EG_vMbeMeuf8mdMhOtu-3ePqff6polo",
  authDomain: "kleanly-67b7b.firebaseapp.com",
  projectId: "kleanly-67b7b",
  storageBucket: "kleanly-67b7b.firebasestorage.app",
  messagingSenderId: "191918354353",
  appId: "1:191918354353:web:d1c8b5c8a9e8a5d8f8b8c5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeDatabase() {
  try {
    console.log('🔥 Initializing Firestore database...');
    
    // Create a sample order to initialize the orders collection
    const sampleOrder = {
      userID: 'MAakOISXk0T9D2b1Zlc0DWtXybs1', // User who created the order
      status: 'pending',
      category: 'wash-fold',
      address: 'kilimani',
      total: 300,
      items: ['Shirt (2)'],
      notes: 'Sample order to initialize database',
      date: '2025-08-03',
      pickupTime: new Date('2025-08-04T10:00:00.000Z'),
      createdAt: serverTimestamp()
    };
    
    // Add the sample order to create the collection
    const docRef = await addDoc(collection(db, 'orders'), sampleOrder);
    console.log('✅ Sample order created with ID:', docRef.id);
    
    // Create drivers collection too
    const sampleDriver = {
      name: 'John Kiprotich',
      phone: '+254712345678',
      email: 'john.driver@kleanly.co.ke',
      vehicleType: 'motorcycle',
      vehicleNumber: 'KCA 123A',
      status: 'available',
      rating: 4.8,
      totalDeliveries: 245,
      createdAt: serverTimestamp()
    };
    
    const driverRef = await addDoc(collection(db, 'drivers'), sampleDriver);
    console.log('✅ Sample driver created with ID:', driverRef.id);
    
    console.log('🎉 Database initialized successfully!');
    console.log('📱 Your admin app should now be able to see orders.');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

// Run the initialization
initializeDatabase();

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, setDoc, doc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3EG_vMbeMeuf8mdMhOtu-3ePqff6polo",
  authDomain: "kleanly-67b7b.firebaseapp.com",
  projectId: "kleanly-67b7b",
  storageBucket: "kleanly-67b7b.firebasestorage.app",
  messagingSenderId: "474784025290",
  appId: "1:474784025290:web:92b6bbfa7b85c52f040233"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test drivers data
const testDrivers = [
  {
    id: 'driver1',
    name: 'John Doe',
    email: 'driver1@kleanly.co.ke',
    phone: '+254712345678',
    status: 'available',
    vehicleInfo: {
      type: 'motorcycle',
      plateNumber: 'KCA 123A',
      color: 'blue'
    },
    currentLocation: {
      latitude: -1.2921,
      longitude: 36.8219,
      address: 'Nairobi CBD'
    },
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    rating: 4.8,
    completedDeliveries: 156
  },
  {
    id: 'driver2',
    name: 'Jane Smith',
    email: 'driver2@kleanly.co.ke',
    phone: '+254787654321',
    status: 'busy',
    vehicleInfo: {
      type: 'van',
      plateNumber: 'KBZ 456B',
      color: 'white'
    },
    currentLocation: {
      latitude: -1.3032,
      longitude: 36.7073,
      address: 'Westlands'
    },
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    rating: 4.9,
    completedDeliveries: 203
  },
  {
    id: 'driver3',
    name: 'Mike Johnson',
    email: 'driver3@kleanly.co.ke',
    phone: '+254798765432',
    status: 'available',
    vehicleInfo: {
      type: 'motorcycle',
      plateNumber: 'KCD 789C',
      color: 'red'
    },
    currentLocation: {
      latitude: -1.2833,
      longitude: 36.8167,
      address: 'Kilimani'
    },
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    rating: 4.7,
    completedDeliveries: 89
  }
];

async function createTestDrivers() {
  try {
    console.log('🚚 Creating test drivers...');
    
    for (const driver of testDrivers) {
      await setDoc(doc(db, 'drivers', driver.id), driver);
      console.log(`✅ Created driver: ${driver.name} (${driver.email})`);
    }
    
    console.log('🎉 Test drivers created successfully!');
    console.log('\nYou can now access the driver dashboard with any of these emails:');
    testDrivers.forEach(driver => {
      console.log(`- ${driver.email} (${driver.name})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test drivers:', error);
  }
}

createTestDrivers();

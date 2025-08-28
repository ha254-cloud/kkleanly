const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase config - you'll need to replace with your actual config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestDeliveryTracking() {
  try {
    // Test data for driver ID: 3ZlxjAFTJjjKmqliAESx
    const testTrackingData = [
      {
        orderId: 'test-order-1',
        driverId: '3ZlxjAFTJjjKmqliAESx',
        status: 'assigned',
        pickupLocation: {
          latitude: -1.2921,
          longitude: 36.8219,
          address: 'Westlands Shopping Mall, Nairobi'
        },
        deliveryLocation: {
          latitude: -1.3032,
          longitude: 36.8856,
          address: 'Karen Shopping Centre, Nairobi'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        orderId: 'test-order-2',
        driverId: '3ZlxjAFTJjjKmqliAESx',
        status: 'pickup_started',
        pickupLocation: {
          latitude: -1.2864,
          longitude: 36.8172,
          address: 'Sarit Centre, Westlands'
        },
        deliveryLocation: {
          latitude: -1.2739,
          longitude: 36.8075,
          address: 'The Junction Mall, Ngong Road'
        },
        estimatedPickupTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        orderId: 'test-order-3',
        driverId: '3ZlxjAFTJjjKmqliAESx',
        status: 'delivered',
        pickupLocation: {
          latitude: -1.2921,
          longitude: 36.8219,
          address: 'ABC Place, Westlands'
        },
        deliveryLocation: {
          latitude: -1.3032,
          longitude: 36.8856,
          address: 'Karen Hardy, Karen'
        },
        actualPickupTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actualDeliveryTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ];

    console.log('Creating test delivery tracking data...');
    
    for (const trackingData of testTrackingData) {
      const docRef = await addDoc(collection(db, 'deliveryTracking'), trackingData);
      console.log(`✅ Created tracking record: ${docRef.id} for order: ${trackingData.orderId}`);
    }
    
    console.log('🎉 Test delivery tracking data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createTestDeliveryTracking();

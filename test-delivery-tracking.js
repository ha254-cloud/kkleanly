// Test script to check delivery tracking permissions
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, query, where, getDocs, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyD3EG_vMbeMeuf8mdMhOtu-3ePqff6polo",
  authDomain: "kleanly-67b7b.firebaseapp.com",
  projectId: "kleanly-67b7b",
  storageBucket: "kleanly-67b7b.firebasestorage.app",
  messagingSenderId: "474784025290",
  appId: "1:474784025290:web:92b6bbfa7b85c52f040233"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testDeliveryTracking() {
  try {
    console.log('🔍 Testing delivery tracking permissions...');
    
    // Test with admin user
    console.log('🔐 Signing in as admin...');
    await signInWithEmailAndPassword(auth, 'kleanlyspt@gmail.com', 'testpass123');
    console.log('✅ Admin signed in:', auth.currentUser.email);
    
    // Try to read delivery tracking collection
    console.log('📋 Trying to read deliveryTracking collection...');
    const trackingQuery = query(collection(db, 'deliveryTracking'));
    const trackingSnapshot = await getDocs(trackingQuery);
    
    console.log(`✅ Successfully read ${trackingSnapshot.docs.length} delivery tracking documents`);
    
    // If no documents exist, create a test one
    if (trackingSnapshot.docs.length === 0) {
      console.log('📝 Creating test delivery tracking document...');
      const testTracking = {
        orderId: 'test-order-123',
        driverId: 'test-driver-123',
        status: 'assigned',
        createdAt: new Date().toISOString(),
        deliveryLocation: {
          address: 'Test Address, Nairobi',
          latitude: -1.2921,
          longitude: 36.8219
        }
      };
      
      const docRef = await addDoc(collection(db, 'deliveryTracking'), testTracking);
      console.log('✅ Test delivery tracking created:', docRef.id);
    }
    
    // Test specific order query
    console.log('🔍 Testing order-specific query...');
    const orderQuery = query(
      collection(db, 'deliveryTracking'),
      where('orderId', '==', 'test-order-123')
    );
    const orderSnapshot = await getDocs(orderQuery);
    console.log(`✅ Order-specific query returned ${orderSnapshot.docs.length} documents`);
    
    console.log('🎉 All delivery tracking tests passed!');
    
  } catch (error) {
    console.error('❌ Delivery tracking test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

testDeliveryTracking();

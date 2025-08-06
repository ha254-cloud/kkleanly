const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Firebase config
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
const db = getFirestore(app);

async function cleanupTestOrders() {
  try {
    console.log('🧹 Starting cleanup of test orders...');
    
    // Query for test orders
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('notes', '==', 'Test order created by admin to verify database connection'));
    
    const querySnapshot = await getDocs(q);
    
    console.log(`📋 Found ${querySnapshot.size} test orders to delete`);
    
    if (querySnapshot.size === 0) {
      console.log('✅ No test orders found to delete');
      return;
    }
    
    // Delete each test order
    const deletePromises = [];
    querySnapshot.forEach((document) => {
      console.log(`🗑️  Deleting order: ${document.id}`);
      deletePromises.push(deleteDoc(doc(db, 'orders', document.id)));
    });
    
    await Promise.all(deletePromises);
    
    console.log(`✅ Successfully deleted ${querySnapshot.size} test orders`);
    
  } catch (error) {
    console.error('❌ Error cleaning up test orders:', error);
  }
}

cleanupTestOrders();

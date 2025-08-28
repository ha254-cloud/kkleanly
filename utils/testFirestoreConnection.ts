import { auth, db } from '../services/firebase';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const testFirestoreConnection = () => {
  console.log('🧪 Testing Firestore connection...');
  
  // Test auth state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('✅ User authenticated:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      });
      
      // Test basic read
      testBasicRead(user.uid);
      
      // Test real-time listener
      testRealtimeListener(user.uid);
    } else {
      console.log('❌ User not authenticated');
    }
  });
};

const testBasicRead = async (userID: string) => {
  try {
    console.log('🧪 Testing basic read for user:', userID);
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('userID', '==', userID));
    const snapshot = await getDocs(q);
    
    console.log('✅ Basic read successful. Found', snapshot.docs.length, 'orders');
    snapshot.docs.forEach(doc => {
      console.log('📄 Order:', { id: doc.id, ...doc.data() });
    });
  } catch (error) {
    console.error('❌ Basic read failed:', error);
  }
};

const testRealtimeListener = (userID: string) => {
  try {
    console.log('🧪 Testing real-time listener for user:', userID);
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('userID', '==', userID));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('✅ Real-time listener successful. Found', snapshot.docs.length, 'orders');
        snapshot.docs.forEach(doc => {
          console.log('📄 Real-time order:', { id: doc.id, ...doc.data() });
        });
      },
      (error) => {
        console.error('❌ Real-time listener failed:', error);
      }
    );
    
    // Cleanup after 10 seconds
    setTimeout(() => {
      unsubscribe();
      console.log('🧪 Test cleanup completed');
    }, 10000);
  } catch (error) {
    console.error('❌ Real-time listener setup failed:', error);
  }
};

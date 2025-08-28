import { auth, db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const debugFirestoreAuth = async () => {
  console.log('🔍 Starting Firestore Authentication Debug...');
  
  // Check auth state
  console.log('🔐 Current auth state:', {
    currentUser: auth.currentUser,
    uid: auth.currentUser?.uid,
    email: auth.currentUser?.email,
    emailVerified: auth.currentUser?.emailVerified,
    isAnonymous: auth.currentUser?.isAnonymous,
    accessToken: auth.currentUser ? 'present' : 'none'
  });
  
  // Wait for auth state if needed
  if (!auth.currentUser) {
    console.log('⏳ Waiting for auth state...');
    await new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('🔄 Auth state changed:', user ? user.email : 'no user');
        unsubscribe();
        resolve();
      });
      
      // Timeout after 3 seconds
      setTimeout(() => {
        unsubscribe();
        resolve();
      }, 3000);
    });
  }
  
  // Test basic Firestore connection
  try {
    console.log('🔌 Testing basic Firestore connection...');
    const testCollection = collection(db, 'drivers');
    console.log('✅ Firestore collection reference created successfully');
    
    // Try to read drivers collection
    console.log('📖 Attempting to read drivers collection...');
    const snapshot = await getDocs(testCollection);
    console.log('✅ Drivers collection read successful:', {
      size: snapshot.size,
      empty: snapshot.empty,
      docs: snapshot.docs.length
    });
    
    // List first few drivers (if any)
    snapshot.docs.slice(0, 3).forEach((doc, index) => {
      const data = doc.data();
      console.log(`🚚 Driver ${index + 1}:`, {
        id: doc.id,
        email: data.email,
        name: data.name,
        status: data.status
      });
    });
    
  } catch (error) {
    console.error('❌ Firestore read error:', {
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Additional debugging for permission errors
    if (error.code === 'permission-denied') {
      console.log('🔒 Permission denied - checking auth details:');
      console.log('  - User authenticated:', !!auth.currentUser);
      console.log('  - User email:', auth.currentUser?.email);
      console.log('  - Email verified:', auth.currentUser?.emailVerified);
      console.log('  - User claims:', auth.currentUser?.metadata);
    }
  }
  
  // Test user collection access (should work for authenticated users)
  try {
    console.log('👤 Testing user collection access...');
    if (auth.currentUser) {
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', auth.currentUser.email)
      );
      const userSnapshot = await getDocs(userQuery);
      console.log('✅ User collection access successful:', {
        size: userSnapshot.size,
        userFound: !userSnapshot.empty
      });
    }
  } catch (error) {
    console.error('❌ User collection error:', error.code, error.message);
  }
  
  console.log('🏁 Firestore Authentication Debug completed');
};

export default debugFirestoreAuth;

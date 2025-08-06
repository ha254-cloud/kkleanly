import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export const testFirestoreConnection = async () => {
  console.log('🔥 =====FIRESTORE CONNECTION TEST=====');
  
  try {
    // Check authentication
    const currentUser = auth.currentUser;
    console.log('🔥 Current user:', currentUser?.uid);
    console.log('🔥 Current user email:', currentUser?.email);
    console.log('🔥 Firebase project ID:', db.app.options.projectId);
    
    if (!currentUser) {
      console.log('❌ No user is logged in');
      return false;
    }
    
    // Test creating a simple document
    console.log('🔥 Testing document creation...');
    const testData = {
      test: true,
      userID: currentUser.uid,
      createdAt: new Date().toISOString(),
      message: 'Test order creation'
    };
    
    console.log('🔥 Test data:', testData);
    
    const docRef = await addDoc(collection(db, 'orders'), testData);
    
    console.log('✅ SUCCESS: Test document created!');
    console.log('✅ Document ID:', docRef.id);
    console.log('✅ Document path:', docRef.path);
    
    return true;
    
  } catch (error: any) {
    console.error('❌ FIRESTORE TEST FAILED:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      console.error('❌ PERMISSION DENIED: Firestore security rules are blocking this operation');
      console.error('❌ You need to update your Firestore security rules to allow writes');
    }
    
    return false;
  }
};

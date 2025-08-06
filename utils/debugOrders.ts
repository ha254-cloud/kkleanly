import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const debugOrders = {
  async createTestOrder() {
    try {
      console.log('🧪 Creating test order...');
      const testOrder = {
        userID: 'test-user-123',
        category: 'wash-fold',
        date: new Date().toISOString().split('T')[0],
        address: 'Test Address, Nairobi',
        status: 'pending',
        createdAt: new Date().toISOString(),
        items: ['Shirts', 'Pants', 'Socks'],
        total: 1500,
        notes: 'Test order for debugging admin view'
      };

      const docRef = await addDoc(collection(db, 'orders'), testOrder);
      console.log('🧪 Test order created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('🧪 Failed to create test order:', error);
      throw error;
    }
  },

  async listAllOrders() {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      console.log('🧪 Fetching all orders for debugging...');
      
      const snapshot = await getDocs(collection(db, 'orders'));
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('🧪 Found orders:', orders.length);
      console.log('🧪 Orders list:', orders);
      return orders;
    } catch (error) {
      console.error('🧪 Failed to fetch orders:', error);
      throw error;
    }
  }
};

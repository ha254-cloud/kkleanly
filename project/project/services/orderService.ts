import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';

export interface Order {
  id?: string;
  userID: string;
  category: string;
  date: string;
  address: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  items: string[];
  total: number;
  pickupTime?: string;
  notes?: string;
}

export const orderService = {
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    try {
      const order = {
        ...orderData,
        createdAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), order);
      return docRef.id;
    } catch (error) {
      if (error.code === 'unavailable') {
        throw new Error('Service temporarily unavailable. Please try again.');
      }
      throw error;
    }
  },

  async getUserOrders(userID: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('userID', '==', userID),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Order));
    } catch (error) {
      if (error.code === 'unavailable') {
        console.log('Firestore temporarily unavailable, returning empty array');
        return [];
      }
      throw error;
    }
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status });
    } catch (error) {
      if (error.code === 'unavailable') {
        throw new Error('Service temporarily unavailable. Please try again.');
      }
      throw error;
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(orderRef);
      
      if (docSnap.exists()) {
        return { 
          id: docSnap.id, 
          ...docSnap.data() 
        } as Order;
      }
      return null;
    } catch (error) {
      if (error.code === 'unavailable') {
        console.log('Firestore temporarily unavailable');
        return null;
      }
      throw error;
    }
  }
};
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc,
  getDoc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { isCurrentUserAdmin } from '../utils/adminAuth';

export interface Order {
  completedAt: string;
  specialInstructions: string;
  phone: any;
  isPaid: boolean;
  paymentStatus?: 'unpaid' | 'paid' | 'partial' | 'refunded';
  paymentMethod?: 'cash' | 'mpesa' | 'card' | 'other';
  paymentAmount?: number | null;
  transactionId?: string | null;
  paidAt?: any; // Firestore Timestamp | null
  paymentUpdatedBy?: { uid?: string | null; role?: 'driver' | 'admin' | 'system' | 'user' } | null;
  paymentEvents?: Array<{
    type: 'status_change';
    status: 'unpaid' | 'paid' | 'partial' | 'refunded';
    method?: 'cash' | 'mpesa' | 'card' | 'other';
    amount?: number;
    transactionId?: string;
    note?: string;
    at: any; // Firestore Timestamp
    actor?: { uid?: string | null; role?: string };
  }>;
  id?: string;
  userID: string;
  category: string;
  date: string;
  address: string;
  // Newly added optional estate/neighborhood/sub-estate name extracted from location picker
  estate?: string;
  // Detailed address information from ModernLocationPicker
  addressDetails?: {
    mainAddress?: string;
    estate?: string;
    buildingName?: string;
    floorNumber?: string;
    doorNumber?: string;
    additionalInfo?: string;
    label?: string;
    placeType?: string;
  };
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  items: string[];
  total: number;
  pickupTime?: string;
  preferredDeliveryTime?: string;
  notes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  // Customer contact information
  customerName?: string;
  userEmail?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  deliveryTime?: string;
}

export const orderService = {
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    try {
      // 🔍 CRITICAL DEBUG: Log Firebase connection details
      console.log('🔥 ===== ORDER CREATION DEBUG =====');
      console.log('🔥 Current user:', auth.currentUser?.uid);
      console.log('🔥 Current user email:', auth.currentUser?.email);
      console.log('🔥 Firebase project ID:', db.app.options.projectId);
      console.log('🔥 Order data being saved:', orderData);
      
      const order = {
        ...orderData,
        status: orderData.status || 'pending', // Ensure status is always set
        createdAt: new Date().toISOString(),
      };
      
      // Remove undefined, null, and empty string fields to prevent Firestore errors
      const cleanOrder = Object.fromEntries(
        Object.entries(order).filter(([_, value]) => {
          return value !== undefined && value !== null && value !== '';
        })
      );
      
      console.log('🔥 Final order object (cleaned):', cleanOrder);
      console.log('🔥 Attempting to save to Firestore...');
      
      const docRef = await addDoc(collection(db, 'orders'), cleanOrder);
      
      console.log('✅ Order created successfully!');
      console.log('✅ Document ID:', docRef.id);
      console.log('✅ Document path:', docRef.path);
      console.log('✅ Collection:', docRef.parent.path);
      
      // 🔍 VERIFY: Immediately try to read back the order
      console.log('🔍 Verifying order was saved...');
      const savedDoc = await getDoc(docRef);
      if (savedDoc.exists()) {
        console.log('✅ VERIFICATION SUCCESS: Order exists in database');
        console.log('✅ Saved data:', savedDoc.data());
      } else {
        console.log('❌ VERIFICATION FAILED: Order not found after creation');
      }
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      if (error.code === 'unavailable') {
        throw new Error('Service temporarily unavailable. Please try again.');
      }
      throw error;
    }
  },

  async getUserOrders(userID: string): Promise<Order[]> {
    try {
      // 🔧 TEMPORARY FIX: Remove orderBy to avoid composite index requirement
      const q = query(
        collection(db, 'orders'),
        where('userID', '==', userID)
      );
      const snapshot = await getDocs(q);
      
      const orders = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Order));
      
      // 🔧 CLIENT-SIDE SORTING: Sort by createdAt descending
      return orders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
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

  async cancelOrder(orderId: string, reason: string): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason
      });
    } catch (error) {
      if (error.code === 'unavailable') {
        throw new Error('Service temporarily unavailable. Please try again.');
      }
      throw error;
    }
  },

  async updateOrderTimes(
    orderId: string, 
    pickupTime?: string, 
    preferredDeliveryTime?: string
  ): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData: any = {};
      
      if (pickupTime) updateData.pickupTime = pickupTime;
      if (preferredDeliveryTime) updateData.preferredDeliveryTime = preferredDeliveryTime;
      
      await updateDoc(orderRef, updateData);
    } catch (error) {
      if (error.code === 'unavailable') {
        throw new Error('Service temporarily unavailable. Please try again.');
      }
      throw error;
    }
  },

  async getOrderById(orderId) {
    try {
      console.log('Getting order by ID:', orderId);
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      
      if (!orderDoc.exists()) {
        console.log('Order not found:', orderId);
        return null;
      }
      
      return { id: orderDoc.id, ...orderDoc.data() } as Order;
    } catch (error) {
      console.error('Error getting order by ID:', error);
      throw error;
    }
  },

  subscribeToUserOrders(
    userID: string, 
    onOrdersUpdate: (orders: Order[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe {
    // 🔒 SECURITY: Check if user is authenticated first
    if (!auth.currentUser) {
      console.error('❌ User not authenticated for subscribeToUserOrders');
      if (onError) {
        onError(new Error('Authentication required to view orders'));
      }
      return () => {}; // Return empty unsubscribe function
    }

    // 🔒 SECURITY: Ensure user can only access their own orders (unless admin)
    if (!isCurrentUserAdmin() && auth.currentUser.uid !== userID) {
      console.error('❌ Access denied: Cannot access orders for another user');
      if (onError) {
        onError(new Error('Access denied: Cannot access orders for another user'));
      }
      return () => {}; // Return empty unsubscribe function
    }

    try {
      console.log('🔥 OrderService: Setting up subscription for user:', userID);
      
      // 🔧 TEMPORARY FIX: Remove orderBy to avoid composite index requirement
      // We'll sort on the client-side instead
      const q = query(
        collection(db, 'orders'),
        where('userID', '==', userID)
      );
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('📱 OrderService: Firestore snapshot received, docs count:', snapshot.docs.length);
          
          const orders: Order[] = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          } as Order));
          
          // 🔧 REMOVE DUPLICATES: Ensure no duplicate orders by ID
          const uniqueOrders = orders.reduce((acc, current) => {
            const existingOrder = acc.find(order => order.id === current.id);
            if (!existingOrder) {
              acc.push(current);
            } else {
              console.warn(`⚠️ Duplicate order detected and removed: ${current.id}`);
            }
            return acc;
          }, [] as Order[]);
          
          // 🔧 CLIENT-SIDE SORTING: Sort by createdAt descending to match expected behavior
          const sortedOrders = uniqueOrders.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          console.log(`📱 Real-time update: ${sortedOrders.length} orders received (${orders.length - uniqueOrders.length} duplicates removed, sorted client-side)`);
          
          // Log order details for debugging
          if (sortedOrders.length > 0) {
            console.log('📱 Orders details:', sortedOrders.map(o => ({ 
              id: o.id, 
              userID: o.userID, 
              status: o.status, 
              createdAt: o.createdAt 
            })));
          }
          
          onOrdersUpdate(sortedOrders);
        },
        (error) => {
          console.error('❌ Real-time orders listener error:', error);
          console.error('❌ Error code:', error.code);
          console.error('❌ Error message:', error.message);
          console.error('❌ User ID:', userID);
          
          // Provide more specific error handling
          if (error.code === 'permission-denied') {
            console.error('❌ Permission denied - check Firestore rules and user authentication');
          } else if (error.code === 'unavailable') {
            console.error('❌ Firestore service unavailable');
          } else if (error.code === 'unauthenticated') {
            console.error('❌ User not authenticated - check auth state');
          }
          
          if (onError) {
            onError(error);
          }
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Failed to set up real-time listener:', error);
      if (onError) {
        onError(error);
      }
      // Return a no-op function as fallback
      return () => {};
    }
  },

  // 🚀 NEW: Real-time subscription to all orders (for admin only)
  subscribeToAllOrders(
    onOrdersUpdate: (orders: Order[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe {
    // 🔒 SECURITY: Check if user is authenticated first
    if (!auth.currentUser) {
      console.error('❌ User not authenticated for subscribeToAllOrders');
      if (onError) {
        onError(new Error('Authentication required to view orders'));
      }
      return () => {}; // Return empty unsubscribe function
    }

    // 🔒 SECURITY: Only allow admin to subscribe to all orders
    if (!isCurrentUserAdmin()) {
      console.error('❌ Admin access denied: subscribeToAllOrders requires admin privileges');
      if (onError) {
        onError(new Error('Admin access required to view all orders'));
      }
      return () => {}; // Return empty unsubscribe function
    }
    
    try {
      console.log('✅ Admin access verified for subscribeToAllOrders');
      
      // 🔍 FORCE FRESH DATA: Disable cache to ensure we get latest data
      const q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      );
      
            // 🔍 ENHANCED DEBUG: Force fresh data fetch from server...
      console.log('🔍 CRITICAL DEBUG: Forcing fresh data fetch from server...');
      console.log('🔍 Admin project ID:', db.app.options.projectId);
      console.log('🔍 Admin auth user:', auth.currentUser?.uid);
      console.log('🔍 Admin auth email:', auth.currentUser?.email);
      
      const freshData = async () => {
        try {
          const { getDocs } = await import('firebase/firestore');
          const freshSnapshot = await getDocs(q);
          const freshOrders = freshSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
          
          console.log(`🔍 FRESH FETCH: Found ${freshOrders.length} orders directly from server`);
          
          // Check all unique userIDs
          const allUserIds = freshOrders.map(o => o.data.userID);
          const uniqueUserIds = [...new Set(allUserIds)];
          console.log(`🔍 FRESH FETCH: Orders from ${uniqueUserIds.length} unique users:`, uniqueUserIds);
          
          // Specifically check for user orders
          const userOrders = freshOrders.filter(o => o.data.userID === 'MAakOISXk0T9D2b1Zlc0DWtXybs1');
          if (userOrders.length > 0) {
            console.log(`✅ FRESH FETCH: Found ${userOrders.length} orders from user MAakOISXk0T9D2b1Zlc0DWtXybs1`);
            console.log('🔍 User orders details:', userOrders);
          } else {
            console.log('❌ FRESH FETCH: NO orders found from user MAakOISXk0T9D2b1Zlc0DWtXybs1');
          }
        } catch (error) {
          console.error('❌ Fresh fetch failed:', error);
        }
      };
      
      // Run fresh fetch first
      freshData();
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const orders: Order[] = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          } as Order));
          
          console.log(`🔥 Admin real-time update: ${orders.length} orders received`);
          
          // 🔍 ENHANCED DEBUG: Log all userIDs to track cross-user visibility
          const userIds = orders.map(o => o.userID);
          const uniqueUserIds = [...new Set(userIds)];
          console.log(`🔍 ADMIN DEBUG: Found orders from ${uniqueUserIds.length} unique users:`, uniqueUserIds);
          
          // Log order details for debugging
          if (orders.length > 0) {
            console.log('🔥 Admin orders details:', orders.map(o => ({ 
              id: o.id, 
              userID: o.userID, 
              status: o.status, 
              createdAt: o.createdAt 
            })));
            
            // 🔍 CRITICAL: Check for the specific user that just created orders
            const recentUserOrders = orders.filter(o => o.userID === 'MAakOISXk0T9D2b1Zlc0DWtXybs1');
            if (recentUserOrders.length > 0) {
              console.log(`✅ ADMIN SEES: ${recentUserOrders.length} orders from user MAakOISXk0T9D2b1Zlc0DWtXybs1`);
              console.log('🔍 User order IDs:', recentUserOrders.map(o => o.id));
            } else {
              console.log(`❌ ADMIN MISSING: No orders visible from user MAakOISXk0T9D2b1Zlc0DWtXybs1`);
              console.log('🔍 Admin is authenticated as:', auth.currentUser?.email);
              console.log('🔍 Admin should see ALL orders but only seeing:', uniqueUserIds);
            }
          } else {
            console.log('🔥 Admin: No orders found in database');
          }
          
          onOrdersUpdate(orders);
        },
        (error) => {
          console.error('Real-time admin orders listener error:', error);
          if (onError) {
            onError(error);
          }
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Failed to set up admin real-time listener:', error);
      if (onError) {
        onError(error);
      }
      return () => {};
    }
  },

  updateOrderPaymentStatus: async (
    orderId: string,
    payload: {
      status: 'unpaid' | 'paid' | 'partial' | 'refunded';
      method?: 'cash' | 'mpesa' | 'card' | 'other';
      amount?: number;
      transactionId?: string;
      note?: string;
      actorId?: string;
      actorRole?: 'driver' | 'admin' | 'system' | 'user';
    }
  ) => {
    try {
      const orderRef = doc(db, 'orders', orderId);

      const actor = {
        uid: payload.actorId ?? auth.currentUser?.uid ?? null,
        role: payload.actorRole ?? 'driver',
      };

      // Top-level updates can use serverTimestamp()
      const update: any = {
        paymentStatus: payload.status,
        paymentMethod: payload.method ?? null,
        paymentAmount: typeof payload.amount === 'number' ? payload.amount : null,
        transactionId: payload.transactionId ?? null,
        paymentUpdatedBy: actor,
        updatedAt: serverTimestamp(),
        lastPaymentEventAt: serverTimestamp(),
      };
      if (payload.status === 'paid') {
        update.paidAt = serverTimestamp();
      }

      // Build event WITHOUT serverTimestamp() and WITHOUT undefined fields
      const event: any = {
        type: 'status_change',
        status: payload.status,
        at: new Date().toISOString(), // client timestamp OK inside arrayUnion
        actor,
      };
      if (payload.method != null) event.method = payload.method;
      if (typeof payload.amount === 'number') event.amount = payload.amount;
      if (payload.transactionId != null) event.transactionId = payload.transactionId;
      if (payload.note != null) event.note = payload.note;

      update.paymentEvents = arrayUnion(event);

      await updateDoc(orderRef, update);
      return true;
    } catch (error) {
      console.error('Error updating order payment status:', error);
      throw error;
    }
  },
};

export async function assignDriverToOrder(orderId: string, driverUid: string) {
  await updateDoc(doc(db, 'orders', orderId), { assignedDriverId: driverUid });
}
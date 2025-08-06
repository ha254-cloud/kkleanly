import { useState, useEffect } from 'react';
import { Order, orderService } from '../services/orderService';
import { auth } from '../services/firebase';
import { isCurrentUserAdmin, requireAdmin } from '../utils/adminAuth';

export const useAdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔥 useAdminOrders: Setting up admin orders listener');
    
    // 🔒 SECURITY: Check if user is admin
    if (!isCurrentUserAdmin()) {
      console.error('❌ Admin access denied: User is not an administrator');
      setError('Admin access required');
      setLoading(false);
      return;
    }
    
    // Debug authentication
    const currentUser = auth.currentUser;
    console.log('🔥 Admin Auth Debug - Current User:', currentUser);
    console.log('🔥 Admin Auth Debug - User Email:', currentUser?.email);
    console.log('🔥 Admin Auth Debug - User UID:', currentUser?.uid);
    
    setLoading(true);
    setError(null);
    
    try {
      // 🔒 SECURITY: Additional check before accessing orders
      requireAdmin();
      
      // 🔍 ENHANCED DEBUG: Manual query to check all orders in database
      console.log('🔍 Debug: Attempting to manually fetch all orders...');
      const manualQuery = async () => {
        try {
          const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          
          // Try to count orders first
          try {
            const { count, getCountFromServer } = await import('firebase/firestore');
            const countQuery = query(collection(db, 'orders'));
            const countSnapshot = await getCountFromServer(countQuery);
            console.log(`🔍 Debug: Total orders in database: ${countSnapshot.data().count}`);
          } catch (countError) {
            console.log('🔍 Debug: Count query not supported, continuing with normal query');
          }
          
          const allOrdersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(allOrdersQuery);
          const allOrders = querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
          
          console.log(`🔍 Debug: Manual fetch found ${allOrders.length} orders`);
          console.log('🔍 Debug: Orders details:', allOrders);
          
          // Check for specific user
          const specificUserOrders = allOrders.filter(o => o.data.userID === 'MAakOISXk0T9D2b1Zlc0DWtXybs1');
          if (specificUserOrders.length > 0) {
            console.log(`✅ MANUAL QUERY: Found ${specificUserOrders.length} orders from user MAakOISXk0T9D2b1Zlc0DWtXybs1`);
          } else {
            console.log(`❌ MANUAL QUERY: No orders found from user MAakOISXk0T9D2b1Zlc0DWtXybs1`);
          }
        } catch (error) {
          console.error('❌ Manual query failed:', error);
        }
      };
      
      // Run manual check
      manualQuery();
      
      // Set up real-time listener for ALL orders (admin view)
      const unsubscribe = orderService.subscribeToAllOrders(
        (allOrders) => {
          console.log(`🔥 Admin received ${allOrders.length} orders`);
          console.log('🔥 Admin orders details:', allOrders.map(o => ({ id: o.id, userID: o.userID, status: o.status })));
          setOrders(allOrders);
          setLoading(false);
        },
        (error) => {
          console.error('❌ Error in admin orders listener:', error);
          setError('Failed to load admin orders');
          setLoading(false);
        }
      );

      // Cleanup listener on unmount
      return () => {
        console.log('🔥 useAdminOrders: Cleaning up admin orders listener');
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (adminError) {
      console.error('❌ Admin authentication failed:', adminError);
      setError('Admin authentication failed');
      setLoading(false);
    }
  }, []);

  const refreshOrders = async () => {
    // 🔒 SECURITY: Check admin access before refresh
    if (!isCurrentUserAdmin()) {
      setError('Admin access required');
      return;
    }
    
    // The real-time listener handles this automatically,
    // but we can provide this method for manual refresh if needed
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Admin orders refresh requested');
      requireAdmin(); // Additional security check
      // The real-time listener will update the orders
    } catch (error) {
      console.error('Error refreshing admin orders:', error);
      setError('Failed to refresh admin orders');
      setLoading(false);
    }
  };

  return {
    orders,
    loading,
    error,
    refreshOrders,
  };
};

import { useState, useEffect } from 'react';
import { Order, orderService } from '../services/orderService';
import { auth } from '../services/firebase';
import { isCurrentUserAdmin, requireAdmin, isCurrentUserAdminAsync } from '../utils/adminAuth';
import { waitForAuthReady } from '../services/firebase';

export const useAdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const init = async () => {
      console.log('🔧 useAdminOrders: initializing with auth readiness & retry');
      setLoading(true);
      setError(null);

      // Wait for auth state
      const user = await waitForAuthReady();
      if (cancelled) return;
      if (!user) {
        console.log('❌ useAdminOrders: Not authenticated, skipping admin setup');
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      console.log('✅ Admin Orders Auth User:', { email: user.email, uid: user.uid });

      // Retry admin check up to 3 times if initially false (covers token propagation delays)
      let isAdmin = isCurrentUserAdmin();
      for (let attempt = 0; attempt < 3 && !isAdmin; attempt++) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        isAdmin = isCurrentUserAdmin();
      }
      if (!isAdmin) {
        console.log('❌ useAdminOrders: Admin access denied, user is not admin');
        setError('Admin access required');
        setLoading(false);
        return;
      }

      try {
        requireAdmin();
      } catch (error) {
        console.log('❌ useAdminOrders: Admin verification failed:', error);
        setError('Admin verification failed');
        setLoading(false);
        return;
      }

      // Manual preload (optional debug)
      try {
        const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        const allOrdersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const qs = await getDocs(allOrdersQuery);
        if (!cancelled) {
          console.log(`✅ Preload admin orders: ${qs.size}`);
        }
      } catch (e) {
        console.log('⚠️ Preload failed (non-fatal):', e);
      }

      // Real-time subscription
      unsubscribe = orderService.subscribeToAllOrders(
        (allOrders) => {
          if (cancelled) return;
          console.log('✅ useAdminOrders: Received orders update:', allOrders.length);
          setOrders(allOrders);
          setLoading(false);
        },
        (err) => {
          if (cancelled) return;
          console.error('❌ useAdminOrders: Admin orders subscription error:', err);
          setError('Failed to load admin orders');
          setLoading(false);
        }
      );
    };

    init();
    return () => {
      cancelled = true;
      if (unsubscribe) {
        console.log('🔧 useAdminOrders: Cleaning up admin orders subscription');
        unsubscribe();
      }
    };
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

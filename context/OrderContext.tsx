import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Order, orderService } from '../services/orderService';
import { useAuth } from './AuthContext';
import { useAppState } from '../hooks/useAppState';

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'userID'>) => Promise<string>;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  updateOrderTimes: (orderId: string, pickupTime?: string, preferredDeliveryTime?: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  // Raw orders as received (may contain duplicates transiently)
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const previousOrdersRef = useRef<Order[]>([]);

  // 🚀 Background refresh when app comes to foreground
  useAppState(
    () => {
      if (user?.uid) {
        console.log('🔄 App foregrounded - refreshing orders...');
        // The real-time listener will handle this automatically now
      }
    }
  );

  // Set up real-time listener when user changes
  useEffect(() => {
    if (!user?.uid) {
      setRawOrders([]);
      previousOrdersRef.current = [];
      return;
    }

    console.log('🔥 OrderContext: Setting up real-time listener for user:', user.uid);
    setLoading(true);
    
    let unsubscribe: (() => void) | null = null;
    
    // Wait for Firebase auth to be fully ready before setting up listeners
    const setupListener = async () => {
      try {
        // Import the auth ready function
        const { waitForAuth } = await import('../services/firebase');
        
        // Wait for authentication to be ready
        const isAuthenticated = await waitForAuth();
        
        if (!isAuthenticated || !user?.uid) {
          console.log('❌ Authentication not ready or user changed, skipping listener setup');
          setLoading(false);
          return;
        }

        console.log('✅ Authentication confirmed, setting up order listener');
        
        // Set up real-time listener
        unsubscribe = orderService.subscribeToUserOrders(
          user.uid,
          (newOrders) => {
            console.log('✅ OrderContext: Received orders update:', newOrders.length);
            // Check for status changes and send notifications
            if (previousOrdersRef.current.length > 0) {
              newOrders.forEach(newOrder => {
                const existingOrder = previousOrdersRef.current.find(o => o.id === newOrder.id);
                if (existingOrder && existingOrder.status !== newOrder.status) {
                  // Status changed - send notification
                  handleOrderStatusChange(newOrder, existingOrder.status, newOrder.status);
                }
              });
            }
            
            // Update both state and ref
            setRawOrders(newOrders);
            previousOrdersRef.current = newOrders;
            setLoading(false);
          },
          (error) => {
            console.error('❌ Error in real-time orders listener:', error);
            console.error('❌ Error details:', {
              code: error.code,
              message: error.message,
              userId: user?.uid,
              userEmail: user?.email
            });
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('❌ Error setting up order listener:', error);
        setLoading(false);
      }
    };

    setupListener();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        console.log('🔥 OrderContext: Cleaning up real-time listener');
        unsubscribe();
      }
    };
  }, [user?.uid]); // Only depend on user.uid, not orders

  // 🔔 Handle order status change notifications
  const handleOrderStatusChange = async (order: Order, oldStatus: Order['status'], newStatus: Order['status']) => {
    try {
      const { notificationService } = await import('../services/notificationService');
      
      const statusMessages = {
        'pending': '  Your order is pending confirmation',
        'confirmed': '✅ Your order has been confirmed and will be picked up soon!',
        'in-progress': '  Your order is being processed - driver is on the way!',
        'completed': '  Your order has been completed! Thank you for choosing Kleanly!',
        'cancelled': '  Your order has been cancelled'
      };

      const message = statusMessages[newStatus] || `Order status updated to ${newStatus}`;
      
      await notificationService.sendLocalNotification({
        orderId: order.id || '',
        type: 'order_assigned',
        title: 'Order Status Update',
        body: `Order #${order.id?.slice(-6)} - ${message}`,
        data: { orderId: order.id, oldStatus, newStatus }
      });

      console.log(`🔔 Notification sent for order ${order.id}: ${oldStatus} → ${newStatus}`);
    } catch (error) {
      console.log('Notification service not available:', error);
    }
  };

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'userID'>) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      console.log('🔥 OrderContext: Creating order for user:', user.uid);
      console.log('🔥 OrderContext: Order data:', orderData);
      
      const orderId = await orderService.createOrder({
        ...orderData,
        userID: user.uid,
      });
      
      console.log('🔥 OrderContext: Order created with ID:', orderId);
      
      // Add the new order to the local state
      const newOrder: Order = {
        id: orderId,
        ...orderData,
        userID: user.uid,
        createdAt: new Date().toISOString(),
      };
      
      // Optimistically add only if not already present (subscription will reconcile)
      setRawOrders(prev => {
        if (prev.some(o => o.id === orderId)) return prev;
        return [newOrder, ...prev];
      });
      
      // Send order created notification
      try {
        await import('../services/notificationService').then(({ notificationService }) => {
          notificationService.sendLocalNotification({
            orderId,
            type: 'order_assigned',
            title: 'Order Created Successfully! 🎉',
            body: `Your ${orderData.category.replace('-', ' ')} order has been placed and is being processed.`,
          });
        });
      } catch (notificationError) {
        console.log('Notification service not available:', notificationError);
      }
      
      return orderId; // Return the order ID
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userOrders = await orderService.getUserOrders(user.uid);
  setRawOrders(userOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
  setRawOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status } : order
        )
      );
    } catch (error) {
      throw error;
    }
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    try {
      await orderService.cancelOrder(orderId, reason);
  setRawOrders(prev =>
        prev.map(order =>
          order.id === orderId 
            ? { 
                ...order, 
                status: 'cancelled' as Order['status'],
                cancelledAt: new Date().toISOString(),
                cancellationReason: reason
              } 
            : order
        )
      );
    } catch (error) {
      throw error;
    }
  };

  const updateOrderTimes = async (
    orderId: string, 
    pickupTime?: string, 
    preferredDeliveryTime?: string
  ) => {
    try {
      await orderService.updateOrderTimes(orderId, pickupTime, preferredDeliveryTime);
  setRawOrders(prev =>
        prev.map(order =>
          order.id === orderId 
            ? { 
                ...order, 
                ...(pickupTime && { pickupTime }),
                ...(preferredDeliveryTime && { preferredDeliveryTime })
              } 
            : order
        )
      );
    } catch (error) {
      throw error;
    }
  };

  // Centralized dedupe + sort so UI components don't repeat logic
  const orders = React.useMemo(() => {
    if (!rawOrders.length) return [];
    const map = new Map<string, Order>();
    for (const o of rawOrders) {
      if (!o.id) continue;
      if (!map.has(o.id)) {
        map.set(o.id, o);
      } else {
        // Prefer the one with later updated status or newer createdAt if mismatch
        const existing = map.get(o.id)!;
        if (existing.status !== o.status) {
          map.set(o.id, o); // last write wins
        }
      }
    }
    return [...map.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawOrders]);

  const value = {
    orders,
    loading,
    createOrder,
    refreshOrders,
    updateOrderStatus,
    cancelOrder,
    updateOrderTimes,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
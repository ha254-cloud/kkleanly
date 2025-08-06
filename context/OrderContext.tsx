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
  const [orders, setOrders] = useState<Order[]>([]);
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
      setOrders([]);
      previousOrdersRef.current = [];
      return;
    }

    setLoading(true);
    
    // Set up real-time listener
    const unsubscribe = orderService.subscribeToUserOrders(
      user.uid,
      (newOrders) => {
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
        setOrders(newOrders);
        previousOrdersRef.current = newOrders;
        setLoading(false);
      },
      (error) => {
        console.error('Error in real-time orders listener:', error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount or user change
    return () => {
      if (unsubscribe) {
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
      
      setOrders(prev => [newOrder, ...prev]);
      
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
      setOrders(userOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      setOrders(prev =>
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
      setOrders(prev =>
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
      setOrders(prev =>
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
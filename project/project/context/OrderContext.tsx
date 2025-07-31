import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Order, orderService } from '../services/orderService';
import { useAuth } from './AuthContext';

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'userID'>) => Promise<string>;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
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

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'userID'>) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const orderId = await orderService.createOrder({
        ...orderData,
        userID: user.uid,
      });
      
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

  const value = {
    orders,
    loading,
    createOrder,
    refreshOrders,
    updateOrderStatus,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
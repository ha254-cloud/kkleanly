import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toast } from '../components/ui/Toast';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
  showOrderUpdate: (orderInfo: { id: string; status: string; message?: string }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showToast = (
    message: string, 
    type: 'success' | 'error' | 'info' = 'info', 
    duration: number = 3000
  ) => {
    setToast({
      visible: true,
      message,
      type,
      duration,
    });
  };

  const showOrderUpdate = (orderInfo: { id: string; status: string; message?: string }) => {
    const statusEmojis = {
      'pending': '⏳',
      'confirmed': '✅', 
      'in-progress': '🚛',
      'completed': '🎉',
      'cancelled': '❌'
    };

    const emoji = statusEmojis[orderInfo.status as keyof typeof statusEmojis] || '📦';
    const orderId = orderInfo.id.slice(-6);
    const message = orderInfo.message || `Order #${orderId} ${orderInfo.status}`;
    
    const type = orderInfo.status === 'completed' ? 'success' : 
                 orderInfo.status === 'cancelled' ? 'error' : 'info';

    showToast(`${emoji} ${message}`, type, 4000);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const value = {
    showToast,
    showOrderUpdate,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
};

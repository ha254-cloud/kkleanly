import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface NotificationData {
  orderId: string;
  type: 'order_assigned' | 'pickup_confirmed' | 'delivery_started' | 'delivered' | 'order_created' | 'payment_confirmed';
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  async initialize() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }
  }

  async sendLocalNotification(data: NotificationData) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: {
            orderId: data.orderId,
            type: data.type,
            ...data.data,
          },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async sendOrderStatusNotification(orderId: string, status: string, message: string) {
    await this.sendLocalNotification({
      orderId,
      type: 'order_assigned',
      title: `Order ${status}`,
      body: message,
    });
  }

  async sendPickupConfirmationNotification(orderId: string) {
    await this.sendLocalNotification({
      orderId,
      type: 'pickup_confirmed',
      title: 'Items Picked Up! 📦',
      body: 'Your laundry has been collected and is being processed.',
    });
  }

  async sendDeliveryStartedNotification(orderId: string, driverName: string) {
    await this.sendLocalNotification({
      orderId,
      type: 'delivery_started',
      title: 'Out for Delivery! 🚚',
      body: `${driverName} is on the way with your clean laundry!`,
    });
  }

  async sendDeliveryCompletedNotification(orderId: string) {
    await this.sendLocalNotification({
      orderId,
      type: 'delivered',
      title: 'Delivery Complete! ✅',
      body: 'Your laundry has been delivered. Thank you for choosing our service!',
    });
  }

  async sendETAUpdateNotification(orderId: string, eta: string) {
    await this.sendLocalNotification({
      orderId,
      type: 'order_assigned',
      title: 'ETA Update 🚚',
      body: `Your driver will arrive in approximately ${eta}`,
    });
  }

  async sendDriverArrivedNotification(orderId: string, address: string) {
    await this.sendLocalNotification({
      orderId,
      type: 'order_assigned',
      title: 'Driver Arrived! 📍',
      body: `Your driver has arrived at ${address}`,
    });
  }

  async sendOrderAssignedNotification(orderId: string, driverName: string) {
    await this.sendLocalNotification({
      orderId,
      type: 'order_assigned',
      title: 'Driver Assigned! 🚚',
      body: `${driverName} has been assigned to your order and is on the way!`,
    });
  }

  async sendOrderCreatedNotification(orderId: string, category: string) {
    await this.sendLocalNotification({
      orderId,
      type: 'order_created',
      title: 'Order Created! 📋',
      body: `Your ${category.replace('-', ' ')} order has been placed successfully.`,
    });
  }

  async sendPaymentConfirmationNotification(orderId: string, amount: number, method: string) {
    await this.sendLocalNotification({
      orderId,
      type: 'payment_confirmed',
      title: 'Payment Confirmed! 💳',
      body: `Payment of KSH ${amount.toLocaleString()} via ${method} has been confirmed.`,
    });
  }
}

export const notificationService = new NotificationService();
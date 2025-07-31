import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface NotificationData {
  orderId: string;
  type: 'order_assigned' | 'driver_arrived' | 'pickup_completed' | 'delivery_completed' | 'eta_update';
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Request permissions
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

    // Get push token for Firebase Cloud Messaging
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    this.initialized = true;
  }

  async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async sendLocalNotification(notification: NotificationData) {
    await this.initialize();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          orderId: notification.orderId,
          type: notification.type,
          ...notification.data
        },
        sound: true,
      },
      trigger: null, // Send immediately
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

  async sendDriverArrivedNotification(orderId: string, location: string) {
    await this.sendLocalNotification({
      orderId,
      type: 'driver_arrived',
      title: 'Driver Arrived! 📍',
      body: `Your driver has arrived at ${location}`,
    });
  }

  async sendPickupCompletedNotification(orderId: string) {
    await this.sendLocalNotification({
      orderId,
      type: 'pickup_completed',
      title: 'Pickup Completed! ✅',
      body: 'Your laundry has been picked up and is being processed',
    });
  }

  async sendDeliveryCompletedNotification(orderId: string) {
    await this.sendLocalNotification({
      orderId,
      type: 'delivery_completed',
      title: 'Delivery Completed! 🎉',
      body: 'Your clean laundry has been delivered successfully!',
    });
  }

  async sendETAUpdateNotification(orderId: string, eta: string) {
    await this.sendLocalNotification({
      orderId,
      type: 'eta_update',
      title: 'ETA Update ⏰',
      body: `Your driver will arrive in approximately ${eta}`,
    });
  }

  // Listen for notification responses
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Listen for notifications received while app is in foreground
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();
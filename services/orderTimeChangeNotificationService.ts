/**
 * Order Time Change Notification Service
 * Handles notifications when customers modify order pickup/delivery times
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { driverService } from './driverService';
import { isAdminEmail } from '../utils/adminAuth';

interface OrderTimeChangeNotification {
  orderId: string;
  userId: string;
  driverId?: string;
  oldPickupTime: string;
  newPickupTime: string;
  oldDeliveryTime?: string;
  newDeliveryTime?: string;
  reason?: string;
  changeType: 'pickup' | 'delivery' | 'both';
  timestamp: any;
  status: 'pending' | 'sent' | 'acknowledged' | 'failed';
  recipients: {
    admin: boolean;
    driver: boolean;
    customer: boolean;
  };
}

interface NotificationRecipient {
  type: 'admin' | 'driver' | 'customer';
  email: string;
  name?: string;
  notificationMethod: 'email' | 'sms' | 'whatsapp' | 'push';
}

/**
 * Create and send notifications for order time changes
 */
export const notifyOrderTimeChange = async (params: {
  orderId: string;
  userId: string;
  driverId?: string;
  oldPickupTime: string;
  newPickupTime: string;
  oldDeliveryTime?: string;
  newDeliveryTime?: string;
  reason?: string;
  changeType: 'pickup' | 'delivery' | 'both';
}): Promise<{
  success: boolean;
  notificationId?: string;
  error?: string;
  sentTo: string[];
}> => {
  try {
    console.log('🔔 Creating order time change notification for order:', params.orderId);

    // Create notification record
    const notification: OrderTimeChangeNotification = {
      ...params,
      timestamp: serverTimestamp(),
      status: 'pending',
      recipients: {
        admin: true,
        driver: !!params.driverId,
        customer: true
      }
    };

    // Save to database
    const notificationRef = await addDoc(collection(db, 'orderTimeChangeNotifications'), notification);
    const notificationId = notificationRef.id;

    console.log('✅ Notification record created:', notificationId);

    // Get notification recipients
    const recipients = await getNotificationRecipients(params.orderId, params.userId, params.driverId);
    
    // Send notifications to each recipient
    const sentTo: string[] = [];
    const promises = recipients.map(async (recipient) => {
      try {
        const sent = await sendTimeChangeNotification(recipient, {
          ...params,
          notificationId
        });
        if (sent) {
          sentTo.push(`${recipient.type}: ${recipient.email}`);
        }
        return sent;
      } catch (error) {
        console.error(`Failed to send notification to ${recipient.type} ${recipient.email}:`, error);
        return false;
      }
    });

    await Promise.all(promises);

    // Update notification status
    await updateDoc(doc(db, 'orderTimeChangeNotifications', notificationId), {
      status: sentTo.length > 0 ? 'sent' : 'failed',
      sentTo,
      sentAt: serverTimestamp()
    });

    return {
      success: true,
      notificationId,
      sentTo
    };

  } catch (error) {
    console.error('❌ Failed to create order time change notification:', error);
    return {
      success: false,
      error: error.message,
      sentTo: []
    };
  }
};

/**
 * Get notification recipients for an order
 */
const getNotificationRecipients = async (
  orderId: string, 
  userId: string, 
  driverId?: string
): Promise<NotificationRecipient[]> => {
  const recipients: NotificationRecipient[] = [];

  try {
    // Get admin email
    const adminEmail = 'kleanlyspt@gmail.com'; // From adminAuth.ts
    recipients.push({
      type: 'admin',
      email: adminEmail,
      name: 'Kleanly Admin',
      notificationMethod: 'email'
    });

    // Get driver info if assigned
    if (driverId) {
      try {
        const driver = await driverService.getDriverById(driverId);
        if (driver) {
          recipients.push({
            type: 'driver',
            email: driver.email,
            name: driver.name,
            notificationMethod: 'email'
          });
        }
      } catch (error) {
        console.warn('Could not get driver info:', error);
      }
    }

    // Get customer info
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        recipients.push({
          type: 'customer',
          email: userData.email,
          name: userData.name || 'Customer',
          notificationMethod: 'email'
        });
      }
    } catch (error) {
      console.warn('Could not get customer info:', error);
    }

    console.log('📧 Found notification recipients:', recipients.map(r => `${r.type}: ${r.email}`));
    return recipients;

  } catch (error) {
    console.error('Error getting notification recipients:', error);
    return recipients;
  }
};

/**
 * Send individual time change notification
 */
const sendTimeChangeNotification = async (
  recipient: NotificationRecipient,
  params: any
): Promise<boolean> => {
  try {
    console.log(`📤 Sending time change notification to ${recipient.type}: ${recipient.email}`);

    // Format notification message based on recipient type
    const message = formatNotificationMessage(recipient.type, params);
    
    // For now, we'll use a simple alert/console approach
    // In production, you'd integrate with actual email/SMS services
    
    switch (recipient.notificationMethod) {
      case 'email':
        return await sendEmailNotification(recipient, message, params);
      case 'sms':
        return await sendSMSNotification(recipient, message, params);
      case 'whatsapp':
        return await sendWhatsAppNotification(recipient, message, params);
      case 'push':
        return await sendPushNotification(recipient, message, params);
      default:
        console.log('📝 Notification message:', message);
        return true;
    }

  } catch (error) {
    console.error(`Failed to send notification to ${recipient.email}:`, error);
    return false;
  }
};

/**
 * Format notification message based on recipient type
 */
const formatNotificationMessage = (recipientType: string, params: any): string => {
  const orderLink = `kleanly://orders/${params.orderId}`;
  
  switch (recipientType) {
    case 'admin':
      return `🚨 Order Time Change Alert\n\n` +
        `Order ID: ${params.orderId}\n` +
        `Change Type: ${params.changeType}\n` +
        `Old Pickup: ${params.oldPickupTime}\n` +
        `New Pickup: ${params.newPickupTime}\n` +
        (params.oldDeliveryTime ? `Old Delivery: ${params.oldDeliveryTime}\n` : '') +
        (params.newDeliveryTime ? `New Delivery: ${params.newDeliveryTime}\n` : '') +
        (params.reason ? `Reason: ${params.reason}\n` : '') +
        `\nPlease update driver assignment and notify customer.\n` +
        `View Order: ${orderLink}`;

    case 'driver':
      return `📦 Delivery Time Update\n\n` +
        `Order #${params.orderId} has been rescheduled:\n\n` +
        `New Pickup Time: ${params.newPickupTime}\n` +
        (params.newDeliveryTime ? `New Delivery Time: ${params.newDeliveryTime}\n` : '') +
        (params.reason ? `Reason: ${params.reason}\n` : '') +
        `\nPlease update your schedule accordingly.\n` +
        `View Order: ${orderLink}`;

    case 'customer':
      return `✅ Order Time Changed\n\n` +
        `Your order #${params.orderId} has been updated:\n\n` +
        `New Pickup Time: ${params.newPickupTime}\n` +
        (params.newDeliveryTime ? `New Delivery Time: ${params.newDeliveryTime}\n` : '') +
        `\nWe'll notify you 30 minutes before pickup.\n` +
        `Track your order: ${orderLink}`;

    default:
      return `Order ${params.orderId} time changed from ${params.oldPickupTime} to ${params.newPickupTime}`;
  }
};

/**
 * Send email notification (placeholder implementation)
 */
const sendEmailNotification = async (recipient: NotificationRecipient, message: string, params: any): Promise<boolean> => {
  try {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log(`📧 Email notification to ${recipient.email}:`);
    console.log(message);
    
    // Simulate email sending
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 100);
    });
  } catch (error) {
    console.error('Email notification failed:', error);
    return false;
  }
};

/**
 * Send SMS notification (placeholder implementation)
 */
const sendSMSNotification = async (recipient: NotificationRecipient, message: string, params: any): Promise<boolean> => {
  try {
    // This would integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`📱 SMS notification to ${recipient.email}:`);
    console.log(message);
    return true;
  } catch (error) {
    console.error('SMS notification failed:', error);
    return false;
  }
};

/**
 * Send WhatsApp notification (placeholder implementation)
 */
const sendWhatsAppNotification = async (recipient: NotificationRecipient, message: string, params: any): Promise<boolean> => {
  try {
    // This would integrate with WhatsApp Business API
    console.log(`📲 WhatsApp notification to ${recipient.email}:`);
    console.log(message);
    return true;
  } catch (error) {
    console.error('WhatsApp notification failed:', error);
    return false;
  }
};

/**
 * Send push notification (placeholder implementation)
 */
const sendPushNotification = async (recipient: NotificationRecipient, message: string, params: any): Promise<boolean> => {
  try {
    // This would integrate with push notification service (Expo, FCM, etc.)
    console.log(`🔔 Push notification to ${recipient.email}:`);
    console.log(message);
    return true;
  } catch (error) {
    console.error('Push notification failed:', error);
    return false;
  }
};

/**
 * Get order time change history
 */
export const getOrderTimeChangeHistory = async (orderId: string): Promise<OrderTimeChangeNotification[]> => {
  try {
    const q = query(
      collection(db, 'orderTimeChangeNotifications'),
      where('orderId', '==', orderId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OrderTimeChangeNotification & { id: string }));

  } catch (error) {
    console.error('Error getting order time change history:', error);
    return [];
  }
};

/**
 * Mark notification as acknowledged
 */
export const acknowledgeTimeChangeNotification = async (notificationId: string, acknowledgedBy: string): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'orderTimeChangeNotifications', notificationId), {
      status: 'acknowledged',
      acknowledgedBy,
      acknowledgedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error acknowledging notification:', error);
    return false;
  }
};

/**
 * Get pending notifications for a user
 */
export const getPendingTimeChangeNotifications = async (userEmail: string): Promise<OrderTimeChangeNotification[]> => {
  try {
    // For admin, get all pending notifications
    if (isAdminEmail(userEmail)) {
      const q = query(
        collection(db, 'orderTimeChangeNotifications'),
        where('status', 'in', ['pending', 'sent']),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as OrderTimeChangeNotification & { id: string }));
    }

    // For drivers, get notifications assigned to them
    const driverQuery = query(
      collection(db, 'orderTimeChangeNotifications'),
      where('status', 'in', ['pending', 'sent']),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    
    const querySnapshot = await getDocs(driverQuery);
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OrderTimeChangeNotification & { id: string }));

    // Filter for driver's orders (would need driver ID lookup)
    return notifications;

  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
};

export const orderTimeChangeNotificationService = {
  notifyOrderTimeChange,
  getOrderTimeChangeHistory,
  acknowledgeTimeChangeNotification,
  getPendingTimeChangeNotifications
};

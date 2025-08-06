import * as SMS from 'expo-sms';

interface OrderData {
  id: string;
  items: Array<{
    service: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  pickupTime: string;
  deliveryTime: string;
  customerInfo: {
    name: string;
    phone: string;
    address: string;
  };
}

interface SMSNotificationData {
  phoneNumber: string;
  customerName: string;
  orderId: string;
  orderData: OrderData;
}

export class SMSNotificationService {
  // Check if SMS is available on device
  static async isAvailable(): Promise<boolean> {
    return await SMS.isAvailableAsync();
  }

  // Send order confirmation SMS
  static async sendOrderConfirmationSMS(data: SMSNotificationData): Promise<boolean> {
    try {
      if (!await this.isAvailable()) {
        console.log('SMS not available on this device');
        return false;
      }

      const itemsList = data.orderData.items
        .map(item => `${item.quantity}x ${item.service}`)
        .join(', ');

      const message = `  Order Confirmed!
Hi ${data.customerName},

Your laundry order #${data.orderId} has been confirmed.

Services: ${itemsList}
Total: KSH ${data.orderData.total}
Pickup: ${data.orderData.pickupTime}
Delivery: ${data.orderData.deliveryTime}

We'll contact you before pickup. Thanks for choosing Kleanly!

Track your order in the app.`;

      const result = await SMS.sendSMSAsync([data.phoneNumber], message);
      return result.result === 'sent';
    } catch (error) {
      console.error('Error sending order confirmation SMS:', error);
      return false;
    }
  }

  // Send pickup confirmation SMS
  static async sendPickupConfirmationSMS(data: SMSNotificationData): Promise<boolean> {
    try {
      if (!await this.isAvailable()) {
        console.log('SMS not available on this device');
        return false;
      }

      const message = `🚚 Items Picked Up!
Hi ${data.customerName},

Your laundry has been picked up successfully for order #${data.orderId}.

Current status: Being processed
Expected delivery: ${data.orderData.deliveryTime}

We'll notify you when your items are ready for delivery.

Track your order in the Kleanly app.`;

      const result = await SMS.sendSMSAsync([data.phoneNumber], message);
      return result.result === 'sent';
    } catch (error) {
      console.error('Error sending pickup confirmation SMS:', error);
      return false;
    }
  }

  // Send delivery started SMS
  static async sendDeliveryStartedSMS(data: SMSNotificationData, driverInfo?: { name: string; phone: string }): Promise<boolean> {
    try {
      if (!await this.isAvailable()) {
        console.log('SMS not available on this device');
        return false;
      }

      const driverDetails = driverInfo 
        ? `Driver: ${driverInfo.name} (${driverInfo.phone})`
        : 'Our driver will contact you';

      const message = `🚛 Out for Delivery!
Hi ${data.customerName},

Your clean laundry is on the way!

Order #${data.orderId}
Status: Out for delivery
${driverDetails}

Please be available at your delivery address.

Track live location in the Kleanly app.`;

      const result = await SMS.sendSMSAsync([data.phoneNumber], message);
      return result.result === 'sent';
    } catch (error) {
      console.error('Error sending delivery started SMS:', error);
      return false;
    }
  }

  // Send delivery completed SMS
  static async sendDeliveryCompletedSMS(data: SMSNotificationData): Promise<boolean> {
    try {
      if (!await this.isAvailable()) {
        console.log('SMS not available on this device');
        return false;
      }

      const message = `  Order Delivered!
Hi ${data.customerName},

Your order #${data.orderId} has been delivered successfully!

Thank you for choosing Kleanly. We hope you're happy with the quality of our work.

Rate your experience and book your next order through our app.

Questions? Contact support in the app.`;

      const result = await SMS.sendSMSAsync([data.phoneNumber], message);
      return result.result === 'sent';
    } catch (error) {
      console.error('Error sending delivery completed SMS:', error);
      return false;
    }
  }

  // Send custom SMS notification
  static async sendCustomSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      if (!await this.isAvailable()) {
        console.log('SMS not available on this device');
        return false;
      }

      const result = await SMS.sendSMSAsync([phoneNumber], message);
      return result.result === 'sent';
    } catch (error) {
      console.error('Error sending custom SMS:', error);
      return false;
    }
  }
}
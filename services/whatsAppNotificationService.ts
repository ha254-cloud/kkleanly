import { Linking } from 'react-native';

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

interface WhatsAppNotificationData {
  phoneNumber: string;
  customerName: string;
  orderId: string;
  orderData: OrderData;
}

export class WhatsAppNotificationService {
  private static BUSINESS_PHONE = '+254712345678'; // Replace with your business WhatsApp number
  private static BUSINESS_NAME = 'Kleanly';

  // Format phone number for WhatsApp
  private static formatPhoneNumber(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.startsWith('0')) {
      return '254' + cleanPhone.substring(1);
    }
    
    if (cleanPhone.length === 9) {
      return '254' + cleanPhone;
    }
    
    return cleanPhone;
  }

  // Generate WhatsApp URL with message
  private static generateWhatsAppURL(phoneNumber: string, message: string): string {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    return `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`;
  }

  // Send order confirmation via WhatsApp
  static async sendOrderConfirmationWhatsApp(data: WhatsAppNotificationData): Promise<boolean> {
    try {
      const itemsList = data.orderData.items
        .map(item => `${item.quantity}x ${item.service}`)
        .join('\n');

      const message = `  *Order Confirmed!*

Hi ${data.customerName},

Your laundry order has been confirmed ✅

*Order Details:*
📋 Order ID: #${data.orderId}
🛍️ Services:
${itemsList}

  Total: KSH ${data.orderData.total}
📅 Pickup: ${data.orderData.pickupTime}
🚚 Delivery: ${data.orderData.deliveryTime}

We'll contact you before pickup. Thanks for choosing ${this.BUSINESS_NAME}!

Need help? Reply to this message 💬`;

      const whatsappURL = this.generateWhatsAppURL(data.phoneNumber, message);
      
      const supported = await Linking.canOpenURL(whatsappURL);
      if (supported) {
        await Linking.openURL(whatsappURL);
        return true;
      } else {
        console.log('WhatsApp is not installed');
        return false;
      }
    } catch (error) {
      console.error('Error sending WhatsApp order confirmation:', error);
      return false;
    }
  }

  // Send pickup confirmation via WhatsApp
  static async sendPickupConfirmationWhatsApp(data: WhatsAppNotificationData): Promise<boolean> {
    try {
      const message = `🚚 *Items Picked Up!*

Hi ${data.customerName},

Your laundry has been picked up successfully! 📦

*Order #${data.orderId}*
✅ Status: Being processed
⏰ Expected delivery: ${data.orderData.deliveryTime}

Your items are now being carefully cleaned and will be ready soon.

We'll notify you when ready for delivery 🔔

Questions? Just reply here! 💬`;

      const whatsappURL = this.generateWhatsAppURL(data.phoneNumber, message);
      
      const supported = await Linking.canOpenURL(whatsappURL);
      if (supported) {
        await Linking.openURL(whatsappURL);
        return true;
      } else {
        console.log('WhatsApp is not installed');
        return false;
      }
    } catch (error) {
      console.error('Error sending WhatsApp pickup confirmation:', error);
      return false;
    }
  }

  // Send delivery started via WhatsApp
  static async sendDeliveryStartedWhatsApp(
    data: WhatsAppNotificationData, 
    driverInfo?: { name: string; phone: string }
  ): Promise<boolean> {
    try {
      const driverDetails = driverInfo 
        ? `👨‍🚚 Driver: ${driverInfo.name}\n📞 Phone: ${driverInfo.phone}`
        : '👨‍🚚 Our driver will contact you shortly';

      const message = `🚛 *Out for Delivery!*

Hi ${data.customerName},

Your fresh, clean laundry is on the way! 

*Order #${data.orderId}*
📍 Status: Out for delivery
${driverDetails}

Please be available at your delivery address.

Almost there!   `;

      const whatsappURL = this.generateWhatsAppURL(data.phoneNumber, message);
      
      const supported = await Linking.canOpenURL(whatsappURL);
      if (supported) {
        await Linking.openURL(whatsappURL);
        return true;
      } else {
        console.log('WhatsApp is not installed');
        return false;
      }
    } catch (error) {
      console.error('Error sending WhatsApp delivery started:', error);
      return false;
    }
  }

  // Send delivery completed via WhatsApp
  static async sendDeliveryCompletedWhatsApp(data: WhatsAppNotificationData): Promise<boolean> {
    try {
      const message = `  *Order Delivered Successfully!*

Hi ${data.customerName},

Your order #${data.orderId} has been delivered! 📦✅

Thank you for choosing ${this.BUSINESS_NAME}! We hope you love how fresh and clean your items are. 

*What's next?*
⭐ Rate your experience in the app
🔄 Book your next laundry order
📞 Contact us for any questions

We appreciate your business! 😊

Support: Reply to this message 💬`;

      const whatsappURL = this.generateWhatsAppURL(data.phoneNumber, message);
      
      const supported = await Linking.canOpenURL(whatsappURL);
      if (supported) {
        await Linking.openURL(whatsappURL);
        return true;
      } else {
        console.log('WhatsApp is not installed');
        return false;
      }
    } catch (error) {
      console.error('Error sending WhatsApp delivery completed:', error);
      return false;
    }
  }

  // Open customer support chat
  static async openCustomerSupport(): Promise<boolean> {
    try {
      const supportMessage = `Hello! I need help with my ${this.BUSINESS_NAME} order.`;
      const whatsappURL = this.generateWhatsAppURL(this.BUSINESS_PHONE, supportMessage);
      
      const supported = await Linking.canOpenURL(whatsappURL);
      if (supported) {
        await Linking.openURL(whatsappURL);
        return true;
      } else {
        console.log('WhatsApp is not installed');
        return false;
      }
    } catch (error) {
      console.error('Error opening WhatsApp customer support:', error);
      return false;
    }
  }
}
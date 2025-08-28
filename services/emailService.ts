import { Linking, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface Order {
  id: string;
  category: string;
  items: string[];
  total: number;
  address: string;
  date: string;
  createdAt: string;
  status: string;
  userID: string;
  pickupTime?: string;
}

interface EmailData {
  orderId: string;
  orderDetails: Order;
  customerEmail: string;
  receiptType: 'payment_receipt' | 'order_confirmation';
  paymentInfo?: {
    method: string;
    amount: number;
    transactionId?: string;
    paidAt: string;
  };
}

class EmailService {
  async sendReceiptEmail(emailData: EmailData): Promise<boolean> {
    try {
      const { orderDetails, customerEmail, receiptType, paymentInfo } = emailData;
      
      const subject = receiptType === 'payment_receipt' 
        ? `Payment Receipt - Kleanly Order #${orderDetails.id}`
        : `Order Confirmation - Kleanly Order #${orderDetails.id}`;
      
      const body = this.generateEmailBody(orderDetails, receiptType, paymentInfo);
      
      const emailUrl = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const supported = await Linking.canOpenURL(emailUrl);
      if (supported) {
        await Linking.openURL(emailUrl);
        return true;
      } else {
        throw new Error('No email app available');
      }
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  async shareReceipt(order: Order, receiptType: string, options?: any): Promise<void> {
    try {
      const content = this.generateReceiptContent(order, receiptType, options);
      await Sharing.shareAsync('', {
        mimeType: 'text/plain',
        dialogTitle: 'Share Receipt'
      });
    } catch (error) {
      console.error('Share receipt error:', error);
      throw error;
    }
  }

  async downloadReceipt(order: Order, receiptType: string, options?: any): Promise<string> {
    try {
      const content = this.generateReceiptContent(order, receiptType, options);
      const filename = `receipt_${order.id}_${Date.now()}.txt`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(filePath, content);
      return filePath;
    } catch (error) {
      console.error('Download receipt error:', error);
      throw error;
    }
  }

  private generateEmailBody(order: Order, receiptType: string, paymentInfo?: any): string {
    const isPaymentReceipt = receiptType === 'payment_receipt';
    
    let body = `
Dear Customer,

${isPaymentReceipt ? 'Thank you for your payment!' : 'Thank you for your order!'} Here are your ${isPaymentReceipt ? 'payment' : 'order'} details:

ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order ID: #${order.id}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Service: ${order.category}
Items: ${order.items.join(', ')}
Delivery Address: ${order.address}
Total Amount: KSH ${order.total.toLocaleString()}
`;

    if (isPaymentReceipt && paymentInfo) {
      body += `
PAYMENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Payment Method: ${paymentInfo.method}
Amount Paid: KSH ${paymentInfo.amount.toLocaleString()}
Transaction ID: ${paymentInfo.transactionId || 'N/A'}
Payment Date: ${new Date(paymentInfo.paidAt).toLocaleDateString()}
Status: PAID ✅
`;
    }

    body += `

CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Customer Support: kleanlyspt@gmail.com
Phone: +254 700 000 000
Website: www.kleanly.co.ke

Thank you for choosing Kleanly!
Your satisfaction is our priority.

Best regards,
The Kleanly Team
`;

    return body;
  }

  private generateReceiptContent(order: Order, receiptType: string, options?: any): string {
    return this.generateEmailBody(order, receiptType, options?.paymentInfo);
  }
}

export const emailService = new EmailService();
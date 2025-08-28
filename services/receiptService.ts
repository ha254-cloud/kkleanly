import { Order } from './orderService';
import { Linking } from 'react-native';

interface ReceiptData {
  order: Order;
  customerName?: string;
  customerPhone?: string;
}

export class ReceiptService {
  static generateReceiptText(data: ReceiptData): string {
    const { order, customerName = 'Valued Customer', customerPhone = 'N/A' } = data;
    
    const subtotal = Math.round(order.total / 1.16);
    const tax = Math.round(order.total - subtotal);
    
    return `
🧾 *KLEANLY RECEIPT*

📋 Order #${order.id?.slice(-8).toUpperCase()}
📅 Date: ${new Date(order.createdAt).toLocaleDateString()}

👤 *Customer Information*
Name: ${customerName}
Phone: ${customerPhone}
Address: ${order.address || 'N/A'}

🧺 *Service Details*
Service: ${(order.category || '').replace('-', ' ').toUpperCase()}
Items: ${order.items?.join(', ') || 'N/A'}
Status: ${(order.status || '').toUpperCase()}

💰 *Payment Details*
Subtotal: KSh ${subtotal.toLocaleString()}
VAT (16%): KSh ${tax.toLocaleString()}
*Total: KSh ${order.total.toLocaleString()}*

✨ Thank you for choosing Kleanly!
📞 Support: +254 714 648 622
📧 Email: support@kleanly.app
    `.trim();
  }

  static async shareViaWhatsApp(receiptText: string): Promise<void> {
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(receiptText)}`;
    
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        const webWhatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(receiptText)}`;
        await Linking.openURL(webWhatsappUrl);
      }
        } catch (error) {
          console.error('Error sharing via WhatsApp:', error);
          throw new Error('Failed to open WhatsApp');
        }
      }
    }
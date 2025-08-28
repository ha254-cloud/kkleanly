// services/emailReceiptService.ts
import { Order } from './orderService';
import { Alert } from 'react-native';
import { printToFileAsync } from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface EmailReceiptData {
  order: Order;
  customerName: string;
  customerEmail: string;
  adminName: string;
}

export class EmailReceiptService {
  // Replace this with your actual email service (SendGrid, Resend, etc.)
  private static EMAIL_API_ENDPOINT = 'YOUR_EMAIL_SERVICE_ENDPOINT';
  private static EMAIL_API_KEY = 'YOUR_EMAIL_API_KEY';

  static async sendReceiptEmail(data: EmailReceiptData): Promise<void> {
    try {
      // Generate PDF receipt
      const receiptData = {
        order: data.order,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        paymentStatus: (data.order.isPaid || data.order.paymentMethod !== 'cash') ? 'paid' : 'pending' as 'paid' | 'pending',
        generatedBy: data.adminName
      };

      const pdfUri = await PDFReceiptService.generatePDFReceipt(receiptData);
      const pdfBase64 = await PDFReceiptService.emailPDFReceipt(pdfUri, data.customerEmail, data.order.id || 'unknown');

      // Prepare email data
      const emailData = {
        to: data.customerEmail,
        from: 'noreply@kleanly.app',
        fromName: 'Kleanly Team',
        subject: `Your Kleanly Receipt - Order #${data.order.id?.slice(-6).toUpperCase()}`,
        html: this.generateEmailTemplate(data),
        attachments: [
          {
            content: pdfBase64,
            filename: `Kleanly_Receipt_${data.order.id?.slice(-6).toUpperCase()}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      };

      // Send email using your preferred service
      await this.sendEmail(emailData);
      
      console.log('Receipt email sent successfully to:', data.customerEmail);
    } catch (error) {
      console.error('Failed to send receipt email:', error);
      throw new Error('Failed to send receipt email');
    }
  }

  private static async sendEmail(emailData: any): Promise<void> {
    // Example for SendGrid
    /*
    const response = await fetch('https://api.sendgrid.v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.EMAIL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: emailData.to }],
          subject: emailData.subject
        }],
        from: { email: emailData.from, name: emailData.fromName },
        content: [{
          type: 'text/html',
          value: emailData.html
        }],
        attachments: emailData.attachments
      })
    });
    */

    // Example for Resend
    /*
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.EMAIL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${emailData.fromName} <${emailData.from}>`,
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments
      })
    });
    */

    // For now, just log the email data (replace with actual implementation)
    console.log('Email would be sent with data:', emailData);
  }

  private static generateEmailTemplate(data: EmailReceiptData): string {
    const orderId = data.order.id?.slice(-6).toUpperCase();
    const orderDate = new Date(data.order.createdAt).toLocaleDateString();
    const total = data.order.total.toLocaleString();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Kleanly Receipt</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f8f9fa;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #0A1931;
              padding-bottom: 30px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #0A1931;
              margin-bottom: 10px;
            }
            .tagline {
              color: #666;
              font-size: 16px;
            }
            .greeting {
              font-size: 20px;
              color: #0A1931;
              margin-bottom: 20px;
            }
            .order-summary {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #0A1931;
            }
            .order-detail {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 5px 0;
            }
            .order-detail:last-child {
              margin-bottom: 0;
              font-weight: bold;
              font-size: 18px;
              border-top: 2px solid #0A1931;
              padding-top: 15px;
              margin-top: 15px;
            }
            .cta-button {
              display: inline-block;
              background-color: #0A1931;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 30px;
              border-top: 1px solid #eee;
              color: #666;
              font-size: 14px;
            }
            .contact-info {
              background-color: #f1f5f9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Kleanly</div>
              <div class="tagline">Premium Laundry & Dry Cleaning Services</div>
            </div>

            <div class="greeting">
              Hello ${data.customerName}! 👋
            </div>

            <p>Thank you for choosing Kleanly for your laundry needs. Your receipt is ready and attached to this email.</p>

            <div class="order-summary">
              <div class="order-detail">
                <span>Order Number:</span>
                <span>#${orderId}</span>
              </div>
              <div class="order-detail">
                <span>Order Date:</span>
                <span>${orderDate}</span>
              </div>
              <div class="order-detail">
                <span>Service:</span>
                <span>${data.order.category.replace('-', ' ').toUpperCase()}</span>
              </div>
              <div class="order-detail">
                <span>Status:</span>
                <span>${data.order.status.toUpperCase()}</span>
              </div>
              <div class="order-detail">
                <span>Total Amount:</span>
                <span>KSh ${total}</span>
              </div>
            </div>

            <p>📎 <strong>Your detailed receipt is attached as a PDF file.</strong></p>

            <p>We hope you're satisfied with our service! If you have any questions or need support, don't hesitate to reach out.</p>

            <div class="contact-info">
              <strong>Need Help?</strong><br>
              📞 Phone: +254 714 648 622<br>
              📧 Email: support@kleanly.app<br>
              🌐 Website: www.kleanly.app
            </div>

            <div class="footer">
              <p>Thank you for choosing Kleanly!</p>
              <p>This email was sent automatically. Please do not reply to this email.</p>
              <p>&copy; 2024 Kleanly. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// services/pdfReceiptService.ts

export class PDFReceiptService {
  static async generatePDFReceipt(data: any): Promise<string> {
    // Implementation for PDF generation...
    return 'pdf-uri-placeholder';
  }

  static async emailPDFReceipt(pdfUri: string, customerEmail: string, orderId: string): Promise<string> {
    try {
      // Convert PDF to base64 for email attachment
      const response = await fetch(pdfUri);
      const arrayBuffer = await response.arrayBuffer();

      // Convert ArrayBuffer to Base64 without using Node.js Buffer
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binaryString);
      
      console.log(`PDF receipt prepared for email to ${customerEmail} for order ${orderId}`);
      return base64;
    } catch (error) {
      console.error('Failed to prepare PDF for email:', error);
      throw new Error('Failed to prepare PDF for email attachment');
    }
  }
}

/**
 * Simplified version - avoids Buffer usage completely
 */
export class EmailPDFReceiptService {
  // Generate receipt HTML without any dependencies
  static generateReceiptHTML(orderData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kleanly Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .receipt { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; }
          .details { margin-bottom: 20px; }
          .total { font-weight: bold; text-align: right; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="company-name">KLEANLY</div>
            <div>Premium Laundry & Dry Cleaning Service</div>
            <div>Receipt #${orderData.id || 'Unknown'}</div>
            <div>${new Date().toLocaleDateString()}</div>
          </div>
          <div class="details">
            <p><strong>Customer:</strong> ${orderData.customerName || 'Valued Customer'}</p>
            <p><strong>Phone:</strong> ${orderData.phone || 'N/A'}</p>
            <p><strong>Address:</strong> ${orderData.address || 'N/A'}</p>
            <p><strong>Order ID:</strong> ${orderData.id || 'Unknown'}</p>
            <p><strong>Services:</strong> ${orderData.items?.join(', ') || 'Laundry Services'}</p>
          </div>
          <div class="total">
            <p>Total: KES ${orderData.total || 0}</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <p>Thank you for choosing Kleanly!</p>
            <p>For support: +254714648622 | support@kleanly.app</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate and save a PDF without email functionality
  static async generatePDF(orderData: any): Promise<string> {
    try {
      const html = this.generateReceiptHTML(orderData);
      
      const { uri } = await printToFileAsync({
        html,
        base64: false,
      });
      
      return uri;
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      Alert.alert('Error', 'Failed to generate receipt PDF');
      return '';
    }
  }

  // Share the generated PDF
  static async sharePDF(orderData: any): Promise<boolean> {
    try {
      const pdfUri = await this.generatePDF(orderData);
      
      if (!pdfUri) {
        throw new Error('Failed to generate PDF');
      }
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri);
        return true;
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
        return false;
      }
    } catch (error) {
      console.error('Failed to share PDF:', error);
      Alert.alert('Error', 'Failed to share receipt');
      return false;
    }
  }

  // Save PDF to documents directory
  static async savePDF(orderData: any): Promise<string> {
    try {
      const pdfUri = await this.generatePDF(orderData);
      
      if (!pdfUri) {
        throw new Error('Failed to generate PDF');
      }
      
      const fileName = `kleanly-receipt-${orderData.id || Date.now()}.pdf`;
      const destUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: pdfUri,
        to: destUri
      });
      
      Alert.alert('Success', `Receipt saved as ${fileName}`);
      return destUri;
    } catch (error) {
      console.error('Failed to save PDF:', error);
      Alert.alert('Error', 'Failed to save receipt');
      return '';
    }
  }
}

export const emailPDFReceiptService = new EmailPDFReceiptService();
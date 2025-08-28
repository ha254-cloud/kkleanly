import { Order } from './orderService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { printToFileAsync } from 'expo-print';

// Using the Expo-compatible approach instead of jsPDF which causes latin1 encoding errors

interface PDFReceiptOptions {
  order: Order;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  paymentInfo: {
    method: string;
    transactionId?: string;
    paidAt: string;
  };
}

export class PDFReceiptService {
  // A small base64 logo placeholder
  private static readonly KLEANLY_LOGO_BASE64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;

  static async generatePDFReceipt(options: PDFReceiptOptions): Promise<Blob | string> {
    const { order, customerInfo, paymentInfo } = options;
    
    // Generate HTML content for the receipt
    const htmlContent = this.generateReceiptHTML(options);
    
    try {
      // Use expo-print to generate the PDF
      const { uri } = await printToFileAsync({
        html: htmlContent,
        base64: false,
        margins: {
          left: 20,
          top: 20,
          right: 20,
          bottom: 20,
        },
      });
      
      // Return the URI to the generated PDF file
      return uri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
  
  private static generateReceiptHTML(options: PDFReceiptOptions): string {
    const { order, customerInfo, paymentInfo } = options;
    
    // Calculate tax and subtotal
    const subtotal = order.total / 1.16; // Assuming 16% VAT included
    const tax = order.total - subtotal;
    
    // Format the receipt date
    const receiptDate = new Date(paymentInfo.paidAt).toLocaleDateString();
    
    // Generate items list
    const itemsList = (order.items || []).map(item => {
      const itemName = typeof item === 'string' ? item : 'Item';
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${itemName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">1</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">KSh ${(order.total / (order.items?.length || 1)).toFixed(2)}</td>
        </tr>
      `;
    }).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kleanly Receipt</title>
        <style>
          body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            padding: 20px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #0A1931;
          }
          .receipt-title {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            color: #0A1931;
            text-align: center;
          }
          .receipt-number {
            font-size: 14px;
            text-align: center;
            margin-bottom: 10px;
            color: #666;
          }
          .section {
            margin: 25px 0;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #0A1931;
            border-bottom: 1px solid #B3CFE5;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th {
            text-align: left;
            padding: 10px 8px;
            border-bottom: 2px solid #0A1931;
            color: #0A1931;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          .summary {
            margin-top: 20px;
            text-align: right;
          }
          .total {
            font-weight: bold;
            font-size: 16px;
            color: #0A1931;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #B3CFE5;
            padding-top: 15px;
          }
          .thankyou {
            font-weight: bold;
            font-size: 14px;
            color: #0A1931;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Kleanly</div>
          <div>Premium Laundry & Dry Cleaning Services</div>
          <div>Phone: +254 714 648 622</div>
          <div>Email: support@kleanly.app</div>
        </div>
        
        <div class="receipt-title">RECEIPT</div>
        <div class="receipt-number">Receipt #: ${order.id?.slice(-8).toUpperCase() || 'N/A'}</div>
        <div class="receipt-number">Date: ${receiptDate}</div>
        
        <div class="section">
          <div class="section-title">CUSTOMER INFORMATION</div>
          <div>Phone: ${customerInfo.phone}</div>
          <div>Address: ${order.address || 'N/A'}</div>
        </div>
        
        <div class="section">
          <div class="section-title">SERVICE DETAILS</div>
          <div>Service Type: ${(order.category || '').replace('-', ' ').toUpperCase()}</div>
          <div>Items: ${order.items?.join(', ') || 'N/A'}</div>
          <div>Status: ${(order.status || '').toUpperCase()}</div>
        </div>
        
        <div class="section">
          <div class="section-title">PAYMENT INFORMATION</div>
          <div>Payment Method: ${paymentInfo.method}</div>
          ${paymentInfo.transactionId ? `<div>Transaction ID: ${paymentInfo.transactionId}</div>` : ''}
          <div>Payment Date: ${new Date(paymentInfo.paidAt).toLocaleString()}</div>
        </div>
        
        <div class="section">
          <div class="section-title">COST BREAKDOWN</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList || `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${(order.category || '').replace('-', ' ')} Service</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">1</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">KSh ${subtotal.toFixed(2)}</td>
                </tr>
              `}
              <tr>
                <td colspan="2" style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Tax (16%):</td>
                <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">KSh ${tax.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="2" style="text-align: right; padding: 8px; font-weight: bold;">TOTAL AMOUNT:</td>
                <td style="text-align: right; padding: 8px; font-weight: bold;">KSh ${order.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <div class="thankyou">Thank You for Choosing Kleanly!</div>
          <div>For support, contact us at +254 714 648 622 or support@kleanly.app</div>
          <div>This is a computer-generated receipt and does not require a signature.</div>
        </div>
      </body>
      </html>
    `;
  }
  
  static async downloadPDF(pdfUri: string, filename: string) {
    try {
      // Share the PDF file using Expo's sharing API
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: filename,
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error('Error sharing PDF:', error);
      throw error;
    }
  }
  
  static async sharePDF(pdfUri: string, filename: string) {
    try {
      // Share the PDF file using Expo's sharing API
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: filename,
        UTI: 'com.adobe.pdf'
      });
      return true;
    } catch (error) {
      console.error('Error sharing PDF:', error);
      throw error;
    }
  }
  
  static async emailPDFReceipt(pdfUri: string, customerEmail: string, orderId: string): Promise<string> {
    try {
      // In a real implementation, you might upload the PDF to a server
      // and then send an email with the PDF attachment
      
      // For now, we'll just return the PDF URI as a base64 placeholder
      return 'base64placeholder';
    } catch (error) {
      console.error('Failed to prepare PDF for email:', error);
      throw new Error('Failed to prepare PDF for email attachment');
    }
  }
}
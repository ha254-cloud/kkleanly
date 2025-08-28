/**
 * Professional Twilio Communication Service for Kleanly
 * Handles SMS notifications, verification, and email services
 */

const twilio = require('twilio');

interface TwilioResult {
  success: boolean;
  messageId?: string;
  message: string;
  deliveryStatus?: string;
}

class TwilioCommunicationService {
  private client: any;
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;
  private messagingServiceSid: string;
  private isConfigured: boolean = false;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || '';
    
    this.initialize();
  }

  private initialize() {
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
      this.isConfigured = true;
      console.log('✅ Twilio communication service configured');
    } else {
      console.log('⚠️ Twilio credentials not found - service disabled');
      this.isConfigured = false;
    }
  }

  /**
   * Send SMS notification for password reset
   */
  async sendPasswordResetSMS(phoneNumber: string, resetCode: string): Promise<TwilioResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Twilio service not configured'
      };
    }

    try {
      const message = `🔒 Kleanly Password Reset\n\nYour reset code: ${resetCode}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this message.\n\n- Kleanly Team`;

      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: phoneNumber
      });

      console.log('✅ Password reset SMS sent successfully');
      
      return {
        success: true,
        messageId: result.sid,
        message: `SMS sent to ${phoneNumber}`,
        deliveryStatus: result.status
      };

    } catch (error: any) {
      console.error('❌ SMS sending failed:', error.message);
      return {
        success: false,
        message: `Failed to send SMS: ${error.message}`
      };
    }
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmationSMS(phoneNumber: string, orderDetails: any): Promise<TwilioResult> {
    if (!this.isConfigured) {
      return { success: false, message: 'Twilio service not configured' };
    }

    try {
      const message = `🧺 Kleanly Order Confirmed!\n\nOrder #${orderDetails.orderId}\nService: ${orderDetails.serviceType}\nPickup: ${orderDetails.pickupTime}\nTotal: KSh ${orderDetails.totalAmount}\n\nTrack your order in the Kleanly app.\n\nThank you for choosing Kleanly! 🌟`;

      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: result.sid,
        message: `Order confirmation sent to ${phoneNumber}`,
        deliveryStatus: result.status
      };

    } catch (error: any) {
      console.error('❌ Order confirmation SMS failed:', error.message);
      return {
        success: false,
        message: `Failed to send confirmation: ${error.message}`
      };
    }
  }

  /**
   * Send pickup reminder SMS
   */
  async sendPickupReminderSMS(phoneNumber: string, pickupDetails: any): Promise<TwilioResult> {
    if (!this.isConfigured) {
      return { success: false, message: 'Twilio service not configured' };
    }

    try {
      const message = `⏰ Kleanly Pickup Reminder\n\nHi ${pickupDetails.customerName}!\n\nYour laundry pickup is scheduled for ${pickupDetails.pickupTime} at ${pickupDetails.address}.\n\nOur driver will arrive within the scheduled window.\n\nOrder #${pickupDetails.orderId}\n\n📞 Need help? Call us anytime!`;

      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: result.sid,
        message: `Pickup reminder sent to ${phoneNumber}`,
        deliveryStatus: result.status
      };

    } catch (error: any) {
      console.error('❌ Pickup reminder SMS failed:', error.message);
      return {
        success: false,
        message: `Failed to send reminder: ${error.message}`
      };
    }
  }

  /**
   * Send delivery notification SMS
   */
  async sendDeliveryNotificationSMS(phoneNumber: string, deliveryDetails: any): Promise<TwilioResult> {
    if (!this.isConfigured) {
      return { success: false, message: 'Twilio service not configured' };
    }

    try {
      const message = `🚚 Your Kleanly order is out for delivery!\n\nOrder #${deliveryDetails.orderId}\nDriver: ${deliveryDetails.driverName}\nETA: ${deliveryDetails.estimatedTime}\n\nTrack live location in the Kleanly app.\n\nGet ready to receive your fresh, clean laundry! ✨`;

      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: result.sid,
        message: `Delivery notification sent to ${phoneNumber}`,
        deliveryStatus: result.status
      };

    } catch (error: any) {
      console.error('❌ Delivery notification SMS failed:', error.message);
      return {
        success: false,
        message: `Failed to send delivery notification: ${error.message}`
      };
    }
  }

  /**
   * Send verification code SMS
   */
  async sendVerificationCodeSMS(phoneNumber: string, verificationCode: string): Promise<TwilioResult> {
    if (!this.isConfigured) {
      return { success: false, message: 'Twilio service not configured' };
    }

    try {
      const message = `🔐 Kleanly Verification Code\n\nYour verification code: ${verificationCode}\n\nThis code expires in 5 minutes.\n\nEnter this code in the Kleanly app to verify your phone number.\n\n- Kleanly Team`;

      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: result.sid,
        message: `Verification code sent to ${phoneNumber}`,
        deliveryStatus: result.status
      };

    } catch (error: any) {
      console.error('❌ Verification SMS failed:', error.message);
      return {
        success: false,
        message: `Failed to send verification: ${error.message}`
      };
    }
  }

  /**
   * Send promotional SMS (with opt-out)
   */
  async sendPromotionalSMS(phoneNumber: string, promoDetails: any): Promise<TwilioResult> {
    if (!this.isConfigured) {
      return { success: false, message: 'Twilio service not configured' };
    }

    try {
      const message = `🎉 Kleanly Special Offer!\n\n${promoDetails.title}\n${promoDetails.description}\n\nUse code: ${promoDetails.promoCode}\nValid until: ${promoDetails.expiryDate}\n\n📱 Book now in the Kleanly app!\n\nReply STOP to opt out.`;

      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: result.sid,
        message: `Promotional SMS sent to ${phoneNumber}`,
        deliveryStatus: result.status
      };

    } catch (error: any) {
      console.error('❌ Promotional SMS failed:', error.message);
      return {
        success: false,
        message: `Failed to send promotion: ${error.message}`
      };
    }
  }

  /**
   * Check message delivery status
   */
  async checkMessageStatus(messageId: string): Promise<any> {
    if (!this.isConfigured) {
      return { status: 'service_unavailable' };
    }

    try {
      const message = await this.client.messages(messageId).fetch();
      return {
        status: message.status,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error: any) {
      console.error('❌ Status check failed:', error.message);
      return { status: 'check_failed', error: error.message };
    }
  }

  /**
   * Get account information and usage statistics
   */
  async getAccountInfo(): Promise<any> {
    if (!this.isConfigured) {
      return { error: 'Service not configured' };
    }

    try {
      const account = await this.client.api.accounts(this.accountSid).fetch();
      const usage = await this.client.usage.records.list({ limit: 20 });

      return {
        accountStatus: account.status,
        balance: account.balance,
        dateCreated: account.dateCreated,
        usage: usage.map((record: any) => ({
          category: record.category,
          description: record.description,
          count: record.count,
          usage: record.usage,
          price: record.price
        }))
      };
    } catch (error: any) {
      console.error('❌ Account info fetch failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Format phone number for Twilio (international format)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming Kenya +254)
    if (cleaned.startsWith('0')) {
      return `+254${cleaned.substring(1)}`;
    } else if (cleaned.startsWith('254')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('+')) {
      return cleaned;
    } else {
      // Assume Kenya number
      return `+254${cleaned}`;
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): { valid: boolean; formatted?: string; error?: string } {
    try {
      const formatted = this.formatPhoneNumber(phoneNumber);
      
      // Basic validation for Kenya numbers
      if (formatted.startsWith('+254') && formatted.length === 13) {
        return { valid: true, formatted };
      } else {
        return { valid: false, error: 'Invalid phone number format' };
      }
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Send bulk SMS (for announcements)
   */
  async sendBulkSMS(phoneNumbers: string[], message: string): Promise<TwilioResult[]> {
    if (!this.isConfigured) {
      return [{ success: false, message: 'Twilio service not configured' }];
    }

    const results: TwilioResult[] = [];
    
    for (const phoneNumber of phoneNumbers) {
      try {
        const result = await this.client.messages.create({
          body: message,
          from: this.phoneNumber,
          to: phoneNumber
        });

        results.push({
          success: true,
          messageId: result.sid,
          message: `Sent to ${phoneNumber}`,
          deliveryStatus: result.status
        });

        // Rate limiting - wait 1 second between messages
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        results.push({
          success: false,
          message: `Failed to send to ${phoneNumber}: ${error.message}`
        });
      }
    }

    return results;
  }
}

export const twilioService = new TwilioCommunicationService();

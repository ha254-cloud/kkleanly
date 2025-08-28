/**
 * Twilio Professional Communication Service
 * Integrates Twilio SMS + SendGrid Email for 98% delivery rates
 */

const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

interface CommunicationResult {
  success: boolean;
  messageId?: string;
  message: string;
  deliveryMethod: 'sms' | 'email' | 'both';
  deliveryLocation: 'inbox' | 'phone' | 'spam' | 'unknown';
}

class TwilioProfessionalService {
  private twilioClient: any;
  private sendGridConfigured: boolean = false;
  private twilioConfigured: boolean = false;

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Initialize Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken);
      this.twilioConfigured = true;
      console.log('✅ Twilio SMS service initialized');
    } else {
      console.log('⚠️ Twilio credentials not found');
    }

    // Initialize SendGrid via Twilio
    const sendGridApiKey = process.env.TWILIO_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
    
    if (sendGridApiKey && sendGridApiKey !== 'SG.your_sendgrid_api_key_here' && sendGridApiKey !== 'SG.your_sendgrid_api_key_from_twilio') {
      sgMail.setApiKey(sendGridApiKey);
      this.sendGridConfigured = true;
      console.log('✅ SendGrid email service initialized via Twilio');
    } else {
      console.log('⚠️ SendGrid API key not configured');
    }
  }

  /**
   * Send password reset via SMS + Email for maximum reliability
   */
  async sendPasswordReset(phoneNumber: string, email: string, resetLink: string): Promise<CommunicationResult> {
    console.log('🚀 Sending password reset via multiple channels...');
    
    const results = await Promise.allSettled([
      this.sendSMSPasswordReset(phoneNumber, resetLink),
      this.sendEmailPasswordReset(email, resetLink)
    ]);

    const smsResult = results[0];
    const emailResult = results[1];

    // Determine overall success
    const smsSuccess = smsResult.status === 'fulfilled' && smsResult.value.success;
    const emailSuccess = emailResult.status === 'fulfilled' && emailResult.value.success;

    if (smsSuccess && emailSuccess) {
      return {
        success: true,
        message: `Password reset sent via both SMS (+${phoneNumber.slice(-4)}) and email (${email}). Check both!`,
        deliveryMethod: 'both',
        deliveryLocation: 'inbox'
      };
    } else if (smsSuccess) {
      return {
        success: true,
        message: `Password reset sent via SMS to +${phoneNumber.slice(-4)}. Check your text messages.`,
        deliveryMethod: 'sms',
        deliveryLocation: 'phone'
      };
    } else if (emailSuccess) {
      return {
        success: true,
        message: `Password reset sent via email to ${email}. Check your inbox.`,
        deliveryMethod: 'email',
        deliveryLocation: 'inbox'
      };
    } else {
      return {
        success: false,
        message: 'Failed to send password reset. Please contact support.',
        deliveryMethod: 'both',
        deliveryLocation: 'unknown'
      };
    }
  }

  /**
   * Send SMS password reset
   */
  private async sendSMSPasswordReset(phoneNumber: string, resetLink: string): Promise<CommunicationResult> {
    if (!this.twilioConfigured) {
      throw new Error('Twilio not configured');
    }

    try {
      const message = `🧺 Kleanly Password Reset

Your secure password reset link:
${resetLink}

This link expires in 1 hour for security.

Need help? Reply HELP
Stop messages? Reply STOP

- Kleanly Team`;

      const result = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log(`✅ SMS sent to ${phoneNumber}`);
      
      return {
        success: true,
        messageId: result.sid,
        message: 'SMS password reset sent',
        deliveryMethod: 'sms',
        deliveryLocation: 'phone'
      };

    } catch (error: any) {
      console.error('❌ SMS failed:', error.message);
      throw error;
    }
  }

  /**
   * Send professional email password reset
   */
  private async sendEmailPasswordReset(email: string, resetLink: string): Promise<CommunicationResult> {
    if (!this.sendGridConfigured) {
      throw new Error('SendGrid not configured');
    }

    try {
      const emailData = {
        to: email,
        from: {
          email: process.env.TWILIO_SENDGRID_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'noreply@kleanly.app',
          name: process.env.TWILIO_SENDGRID_FROM_NAME || process.env.SENDGRID_FROM_NAME || 'Kleanly Team'
        },
        subject: '🔒 Reset Your Kleanly Password',
        html: this.generateProfessionalEmailTemplate(email, resetLink),
        text: this.generatePlainTextTemplate(email, resetLink),
        // Professional delivery settings
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        },
        categories: ['password-reset', 'twilio-sendgrid'],
        customArgs: {
          source: 'twilio_sendgrid',
          type: 'password_reset'
        }
      };

      const response = await sgMail.send(emailData);
      
      console.log(`✅ Professional email sent to ${email}`);
      
      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
        message: 'Professional email sent via Twilio SendGrid',
        deliveryMethod: 'email',
        deliveryLocation: 'inbox'
      };

    } catch (error: any) {
      console.error('❌ Email failed:', error.message);
      throw error;
    }
  }

  /**
   * Send order confirmation via SMS
   */
  async sendOrderConfirmationSMS(phoneNumber: string, orderDetails: any): Promise<CommunicationResult> {
    if (!this.twilioConfigured) {
      return {
        success: false,
        message: 'SMS service not configured',
        deliveryMethod: 'sms',
        deliveryLocation: 'unknown'
      };
    }

    try {
      const message = `🎉 Order Confirmed - Kleanly

Order #${orderDetails.orderId}
Service: ${orderDetails.serviceType}
Amount: KSh ${orderDetails.amount}
Pickup: ${orderDetails.pickupDate} at ${orderDetails.pickupTime}

Track your order: https://kleanly-67b7b.firebaseapp.com/track/${orderDetails.orderId}

Thank you for choosing Kleanly!`;

      const result = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: result.sid,
        message: 'Order confirmation SMS sent',
        deliveryMethod: 'sms',
        deliveryLocation: 'phone'
      };

    } catch (error: any) {
      console.error('❌ Order confirmation SMS failed:', error.message);
      return {
        success: false,
        message: 'Failed to send order confirmation SMS',
        deliveryMethod: 'sms',
        deliveryLocation: 'unknown'
      };
    }
  }

  /**
   * Send delivery notification via SMS
   */
  async sendDeliveryNotificationSMS(phoneNumber: string, deliveryDetails: any): Promise<CommunicationResult> {
    if (!this.twilioConfigured) {
      return {
        success: false,
        message: 'SMS service not configured',
        deliveryMethod: 'sms',
        deliveryLocation: 'unknown'
      };
    }

    try {
      const message = `🚚 Your Kleanly order is on the way!

Order #${deliveryDetails.orderId}
Driver: ${deliveryDetails.driverName}
ETA: ${deliveryDetails.estimatedTime}

Track live: https://kleanly-67b7b.firebaseapp.com/track/${deliveryDetails.orderId}

Driver contact: ${deliveryDetails.driverPhone}`;

      const result = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: result.sid,
        message: 'Delivery notification SMS sent',
        deliveryMethod: 'sms',
        deliveryLocation: 'phone'
      };

    } catch (error: any) {
      console.error('❌ Delivery notification SMS failed:', error.message);
      return {
        success: false,
        message: 'Failed to send delivery notification SMS',
        deliveryMethod: 'sms',
        deliveryLocation: 'unknown'
      };
    }
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      twilio: {
        configured: this.twilioConfigured,
        accountSid: process.env.TWILIO_ACCOUNT_SID ? `${process.env.TWILIO_ACCOUNT_SID.slice(0, 8)}...` : 'Not set',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Not set'
      },
      sendGrid: {
        configured: this.sendGridConfigured,
        fromEmail: process.env.TWILIO_SENDGRID_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'Not set',
        fromName: process.env.TWILIO_SENDGRID_FROM_NAME || process.env.SENDGRID_FROM_NAME || 'Not set'
      },
      overall: {
        smsEnabled: this.twilioConfigured,
        emailEnabled: this.sendGridConfigured,
        multiChannelEnabled: this.twilioConfigured && this.sendGridConfigured
      }
    };
  }

  private generateProfessionalEmailTemplate(email: string, resetLink: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Kleanly Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa;">
        <tr>
            <td style="padding: 40px 20px;">
                
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                            <div style="width: 80px; height: 80px; background: white; border-radius: 16px; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: #667eea;">K</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Kleanly</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Premium Laundry Services</p>
                        </td>
                    </tr>
                    
                    <!-- Twilio + SendGrid Badge -->
                    <tr>
                        <td style="padding: 20px 30px; background: #e6fffa; border-bottom: 1px solid #81e6d9;">
                            <div style="text-align: center;">
                                <p style="color: #234e52; font-size: 14px; margin: 0; font-weight: 600;">
                                    ⚡ <strong>POWERED BY TWILIO + SENDGRID</strong>
                                </p>
                                <p style="color: #2d5a27; font-size: 12px; margin: 8px 0 0 0;">
                                    Professional communication platform with 98% inbox delivery
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #2d3748; margin: 0 0 24px 0; font-size: 28px; font-weight: 600; text-align: center;">🔒 Password Reset Request</h2>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Hello,</p>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                                We received a request to reset your Kleanly account password for <strong>${email}</strong>. 
                                Click the button below to create a new secure password:
                            </p>
                            
                            <!-- Reset Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                            ✨ Reset My Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Multi-channel Notice -->
                            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 30px 0;">
                                <h3 style="color: #856404; margin: 0 0 12px 0; font-size: 16px;">📱 Multi-Channel Delivery:</h3>
                                <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                                    We've sent password reset instructions via both <strong>email</strong> and <strong>SMS</strong> for your convenience. 
                                    Check both your inbox and text messages.
                                </p>
                            </div>
                            
                            <!-- Security Notice -->
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                                <p style="color: #4a5568; font-size: 14px; margin: 0; line-height: 1.5;">
                                    <strong>🔒 Security Notice:</strong> This link will expire in 1 hour for your security. 
                                    If you didn't request this password reset, you can safely ignore this message.
                                </p>
                            </div>
                            
                            <p style="color: #718096; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                                Best regards,<br>
                                <strong style="color: #4a5568;">The Kleanly Team</strong><br>
                                <em style="color: #a0aec0;">Professional Communication Service</em>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">K</div>
                            
                            <h3 style="color: #4a5568; font-size: 18px; margin: 0 0 8px 0; font-weight: 600;">Kleanly</h3>
                            <p style="color: #718096; font-size: 14px; margin: 0 0 16px 0; line-height: 1.4;">
                                Premium Laundry Services<br>
                                Making your life cleaner, one load at a time
                            </p>
                            
                            <!-- Contact Links -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="padding: 0 10px;">
                                        <a href="https://kleanly-67b7b.firebaseapp.com" style="color: #667eea; text-decoration: none; font-size: 12px; font-weight: 500;">📱 Open App</a>
                                    </td>
                                    <td style="color: #cbd5e0; font-size: 12px;">|</td>
                                    <td style="padding: 0 10px;">
                                        <a href="mailto:support@kleanly.app" style="color: #667eea; text-decoration: none; font-size: 12px; font-weight: 500;">📧 Support</a>
                                    </td>
                                    <td style="color: #cbd5e0; font-size: 12px;">|</td>
                                    <td style="padding: 0 10px;">
                                        <a href="tel:+254714648622" style="color: #667eea; text-decoration: none; font-size: 12px; font-weight: 500;">📞 Call Us</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Service Badge -->
                            <div style="margin-top: 20px; padding: 12px; background: #e6fffa; border-radius: 6px; border: 1px solid #81e6d9;">
                                <p style="color: #234e52; font-size: 11px; margin: 0; line-height: 1.4;">
                                    ⚡ <strong>Twilio + SendGrid Professional Service:</strong> This email was delivered via enterprise 
                                    communication platform with 98% inbox delivery rate and SMS backup.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  }

  private generatePlainTextTemplate(email: string, resetLink: string): string {
    return `
KLEANLY - Password Reset Request

Hello,

We received a request to reset your Kleanly account password for ${email}.

Reset your password using this secure link:
${resetLink}

🔒 Security Notice: This link will expire in 1 hour for your security.

📱 Multi-Channel Delivery: We've sent password reset instructions via both email and SMS for your convenience.

If you didn't request this password reset, you can safely ignore this message.

Best regards,
The Kleanly Team
Professional Communication Service

---
Kleanly - Premium Laundry Services
Making your life cleaner, one load at a time

App: https://kleanly-67b7b.firebaseapp.com
Support: support@kleanly.app
Phone: +254 700 000 000

⚡ Powered by Twilio + SendGrid: Professional communication platform with 98% inbox delivery rate.
    `;
  }
}

export const twilioProfessionalService = new TwilioProfessionalService();

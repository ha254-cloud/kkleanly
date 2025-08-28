/**
 * Secure API Service
 * Handles API requests with proper authentication and error handling
 */

import { config, apiConfig, isDevelopment } from '../config/appConfig';
import { formatKenyanPhoneNumber } from '../utils/phoneValidation';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaymentRequest {
  amount: number;
  phoneNumber: string;
  orderId: string;
  description?: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: 'pending' | 'success' | 'failed';
  checkoutRequestId?: string;
  merchantRequestId?: string;
}

class ApiService {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.consumerKey = apiConfig.consumerKey;
    this.consumerSecret = apiConfig.consumerSecret;

    // Validate credentials in development
    if (isDevelopment()) {
      this.validateCredentials();
    }
  }

  private validateCredentials(): void {
    if (!this.consumerKey || !this.consumerSecret) {
      console.error('⚠️  API credentials not found. Please check your environment configuration.');
      console.error('Required: CONSUMER_KEY and CONSUMER_SECRET');
    }
  }

  /**
   * Get access token for API authentication
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = btoa(`${this.consumerKey}:${this.consumerSecret}`);
      
      const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        // Set expiry to 90% of actual expiry to ensure refresh before expiration
        const expirySeconds = parseInt(data.expires_in) || 3600;
        this.tokenExpiry = Date.now() + (expirySeconds * 900); // 90% of expiry time
        
        return this.accessToken;
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data,
        };
      } else {
        return {
          success: false,
          error: data.errorMessage || data.message || 'Request failed',
        };
      }
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Process payment request
   */
  async processPayment(paymentData: PaymentRequest): Promise<ApiResponse<PaymentResponse>> {
    if (!this.consumerKey || !this.consumerSecret) {
      return {
        success: false,
        error: 'API credentials not configured. Please check your environment settings.',
      };
    }

    // Format and validate phone number using utility function
    const phoneResult = formatKenyanPhoneNumber(paymentData.phoneNumber);
    if (!phoneResult.isValid) {
      return {
        success: false,
        error: phoneResult.error || 'Invalid phone number. Please enter a valid Kenyan mobile number (e.g., 0712345678, 712345678, or 254712345678).',
      };
    }

    const formattedPhone = phoneResult.formatted;

    // Validate amount
    if (paymentData.amount <= 0) {
      return {
        success: false,
        error: 'Payment amount must be greater than 0.',
      };
    }

    const requestBody = {
      BusinessShortCode: "174379", // Sandbox shortcode
      Password: "", // Generated password for M-Pesa
      Timestamp: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
      TransactionType: "CustomerPayBillOnline",
      Amount: paymentData.amount,
      PartyA: formattedPhone,
      PartyB: "174379",
      PhoneNumber: formattedPhone,
      CallBackURL: `${this.baseUrl}/callback/payment`,
      AccountReference: paymentData.orderId,
      TransactionDesc: paymentData.description || `Payment for order ${paymentData.orderId}`,
    };

    return await this.makeRequest<PaymentResponse>('/mpesa/stkpush', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(checkoutRequestId: string): Promise<ApiResponse<PaymentResponse>> {
    return await this.makeRequest<PaymentResponse>(`/mpesa/status/${checkoutRequestId}`);
  }

  /**
   * Send SMS notification
   */
  async sendSMS(phoneNumber: string, message: string): Promise<ApiResponse<any>> {
    const requestBody = {
      phoneNumber,
      message,
    };

    return await this.makeRequest('/sms/send', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Get order details from API
   */
  async getOrder(orderId: string): Promise<ApiResponse<any>> {
    return await this.makeRequest(`/orders/${orderId}`);
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string, additionalData?: any): Promise<ApiResponse<any>> {
    const requestBody = {
      status,
      ...additionalData,
    };

    return await this.makeRequest(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      
      return {
        success: response.ok,
        data: data,
        message: response.ok ? 'API connection successful' : 'API connection failed',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to connect to API',
      };
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

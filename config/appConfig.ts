/**
 * Secure Configuration Management
 * Handles environment variables and API credentials safely
 */

import Constants from 'expo-constants';

interface AppConfig {
  // API Configuration
  consumerKey: string;
  consumerSecret: string;
  
  // Firebase Configuration
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  
  // External APIs
  googleMapsApiKey: string;
  
  // M-Pesa Configuration
  mpesaConsumerKey: string;
  mpesaConsumerSecret: string;
  mpesaEnvironment: 'sandbox' | 'production';
  mpesaShortcode: string;
  mpesaPasskey: string;
  
  // App Configuration
  environment: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  supportEmail: string;
  supportPhone: string;
}

// Get configuration from environment variables or Expo config
const getConfig = (): AppConfig => {
  const extra = Constants.expoConfig?.extra || {};
  
  return {
    // API Credentials - NEVER hardcode these values
    consumerKey: extra.consumerKey || process.env.CONSUMER_KEY || '',
    consumerSecret: extra.consumerSecret || process.env.CONSUMER_SECRET || '',
    
    // Firebase Configuration
    firebaseApiKey: extra.firebaseApiKey || process.env.FIREBASE_API_KEY || '',
    firebaseAuthDomain: extra.firebaseAuthDomain || process.env.FIREBASE_AUTH_DOMAIN || '',
    firebaseProjectId: extra.firebaseProjectId || process.env.FIREBASE_PROJECT_ID || '',
    
    // External APIs
    googleMapsApiKey: extra.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY || '',
    
    // M-Pesa Configuration
    mpesaConsumerKey: extra.mpesaConsumerKey || process.env.MPESA_CONSUMER_KEY || '',
    mpesaConsumerSecret: extra.mpesaConsumerSecret || process.env.MPESA_CONSUMER_SECRET || '',
    mpesaEnvironment: (extra.mpesaEnvironment || process.env.MPESA_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
    mpesaShortcode: extra.mpesaShortcode || process.env.MPESA_SHORTCODE || '',
    mpesaPasskey: extra.mpesaPasskey || process.env.MPESA_PASSKEY || '',
    
    // App Configuration
    environment: (extra.environment || process.env.APP_ENV || 'development') as 'development' | 'staging' | 'production',
    apiBaseUrl: extra.apiBaseUrl || process.env.API_BASE_URL || 'https://api.kleanly.co.ke',
    supportEmail: extra.supportEmail || process.env.SUPPORT_EMAIL || 'kleanlyspt@gmail.com',
    supportPhone: extra.supportPhone || process.env.SUPPORT_PHONE || '+254714648622',
  };
};

// Export the configuration
export const config = getConfig();

// Validation function to ensure required config is present
export const validateConfig = (): { isValid: boolean; missingKeys: string[] } => {
  const requiredKeys: (keyof AppConfig)[] = [
    'firebaseApiKey',
    'firebaseAuthDomain',
    'firebaseProjectId',
  ];
  
  const missingKeys: string[] = [];
  
  requiredKeys.forEach(key => {
    if (!config[key]) {
      missingKeys.push(key);
    }
  });
  
  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
};

// Helper function to check if we're in development mode
export const isDevelopment = (): boolean => {
  return config.environment === 'development';
};

// Helper function to check if we're in production mode
export const isProduction = (): boolean => {
  return config.environment === 'production';
};

// Helper function to get API base URL with proper formatting
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = config.apiBaseUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.replace(/^\//, ''); // Remove leading slash
  return `${baseUrl}/${cleanEndpoint}`;
};

// Console warning for missing configuration in development
if (isDevelopment()) {
  const validation = validateConfig();
  if (!validation.isValid) {
    console.warn('⚠️  Missing configuration keys:', validation.missingKeys);
    console.warn('⚠️  Please check your .env file or app.config.js');
  }
}

// Export individual config sections for easier access
export const apiConfig = {
  consumerKey: config.consumerKey,
  consumerSecret: config.consumerSecret,
  baseUrl: config.apiBaseUrl,
};

export const firebaseConfig = {
  apiKey: config.firebaseApiKey,
  authDomain: config.firebaseAuthDomain,
  projectId: config.firebaseProjectId,
};

export const mpesaConfig = {
  consumerKey: config.mpesaConsumerKey,
  consumerSecret: config.mpesaConsumerSecret,
  environment: config.mpesaEnvironment,
  shortcode: config.mpesaShortcode,
  passkey: config.mpesaPasskey,
};

export const appInfo = {
  environment: config.environment,
  supportEmail: config.supportEmail,
  supportPhone: config.supportPhone,
};

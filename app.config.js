import 'dotenv/config';

export default {
  expo: {
    name: "Kleanly",
    slug: "kleanly-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "kleanly",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/welcome-bg.jpg",
      resizeMode: "cover",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.kleanly.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.kleanly.app"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      // API Configuration - SECURE ENVIRONMENT VARIABLES
      consumerKey: process.env.CONSUMER_KEY,
      consumerSecret: process.env.CONSUMER_SECRET,
      
      // Firebase Configuration
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      
      // External APIs
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      
      // M-Pesa Configuration
      mpesaConsumerKey: process.env.MPESA_CONSUMER_KEY,
      mpesaConsumerSecret: process.env.MPESA_CONSUMER_SECRET,
      mpesaEnvironment: process.env.MPESA_ENVIRONMENT || 'sandbox',
      mpesaShortcode: process.env.MPESA_SHORTCODE,
      mpesaPasskey: process.env.MPESA_PASSKEY,
      
      // App Configuration
      environment: process.env.APP_ENV || 'development',
      apiBaseUrl: process.env.API_BASE_URL || 'https://api.kleanly.co.ke',
      supportEmail: process.env.SUPPORT_EMAIL || 'kleanlyspt@gmail.com',
      supportPhone: process.env.SUPPORT_PHONE || '+254714648622',
      
      // Email Service Configuration
      emailServiceApiKey: process.env.EMAIL_SERVICE_API_KEY,
      emailServiceDomain: process.env.EMAIL_SERVICE_DOMAIN,
      fromEmail: process.env.FROM_EMAIL || 'kleanlyspt@gmail.com',
      
      // Notification Configuration
      oneSignalAppId: process.env.ONESIGNAL_APP_ID,
      
      // Analytics Configuration
      googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
      mixpanelToken: process.env.MIXPANEL_TOKEN,
      
      // Security Configuration
      encryptionKey: process.env.ENCRYPTION_KEY,
      jwtSecret: process.env.JWT_SECRET,
      
      // WhatsApp Configuration
      whatsappBusinessApiKey: process.env.WHATSAPP_BUSINESS_API_KEY,
      whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      
      // Development Configuration
      enableDebugLogging: process.env.ENABLE_DEBUG_LOGGING === 'true',
      enableTestMode: process.env.ENABLE_TEST_MODE === 'true',
    }
  }
};

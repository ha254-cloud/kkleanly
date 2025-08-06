// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyD3EG_vMbeMeuf8mdMhOtu-3ePqff6polo",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "kleanly-67b7b.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "kleanly-67b7b",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "kleanly-67b7b.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "474784025290",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:474784025290:web:92b6bbfa7b85c52f040233",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-GR5WPXRPY9"
};

// Initialize Firebase - prevent duplicate initialization
let app;
try {
  // Check if Firebase is already initialized
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('Firebase app initialized successfully:', app.name);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback initialization
  app = initializeApp(firebaseConfig);
}

// Initialize Firebase Auth with retry mechanism
let auth: Auth;

const initializeAuth = () => {
  try {
    auth = getAuth(app);
    console.log('Firebase Auth initialized successfully');
    return auth;
  } catch (error) {
    console.error('Firebase Auth initialization error:', error);
    throw error;
  }
};

// Try to initialize auth immediately
try {
  auth = initializeAuth();
} catch (error) {
  console.error('Initial auth initialization failed, will retry when accessed');
}

// Helper function to get auth with retry
export const getAuthInstance = (): Auth => {
  if (!auth) {
    console.log('Auth not initialized, retrying...');
    try {
      auth = initializeAuth();
    } catch (error) {
      console.error('Auth retry failed:', error);
      throw new Error('Firebase Auth could not be initialized');
    }
  }
  return auth;
};

// Initialize Firestore
export const db = getFirestore(app);

// Export the auth instance - this will be undefined if initialization failed
export { auth };

// Export app as default for compatibility
export default app;

// Initialize Analytics conditionally
export const initializeAnalytics = async () => {
  if (Platform.OS === 'web') {
    try {
      const supported = await isSupported();
      if (supported) {
        const analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized');
        return analytics;
      } else {
        console.log('Firebase Analytics is not supported in this environment');
        return null;
      }
    } catch (error) {
      console.log('Analytics support check failed:', error);
      return null;
    }
  }
  return null;
};
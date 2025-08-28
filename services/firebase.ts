// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { initializeAuth, getAuth, Auth, connectAuthEmulator, User } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "AIzaSyD3EG_vMbeMeuf8mdMhOtu-3ePqff6polo",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "kleanly-67b7b.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "kleanly-67b7b",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "kleanly-67b7b.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "474784025290",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "1:474784025290:web:92b6bbfa7b85c52f040233",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.GOOGLE_ANALYTICS_ID || "G-GR5WPXRPY9"
};

// Initialize Firebase - prevent duplicate initialization
let app: FirebaseApp;
try {
  // Check if Firebase is already initialized
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('Firebase app initialized successfully:', app.name);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback initialization
  app = initializeApp(firebaseConfig);
}

// Initialize Firebase Auth with AsyncStorage persistence for React Native
let auth: Auth;

const initializeAuthService = () => {
  try {
    if (Platform.OS === 'web') {
      // For web platform, use regular getAuth
      auth = getAuth(app);
      
      // Set persistence to local storage for web
      import('firebase/auth').then(({ setPersistence, browserLocalPersistence }) => {
        setPersistence(auth, browserLocalPersistence).catch(error => {
          console.warn('Could not set auth persistence:', error);
        });
      });
    } else {
      // For React Native, use initializeAuth with default persistence
      try {
        auth = initializeAuth(app);
      } catch (error: any) {
        // If auth is already initialized, get the existing instance
        if (error.code === 'auth/already-initialized') {
          auth = getAuth(app);
        } else {
          throw error;
        }
      }
    }
    
    console.log('Firebase Auth initialized successfully with persistence');
    return auth;
  } catch (error) {
    console.error('Firebase Auth initialization error:', error);
    throw error;
  }
};

// Initialize auth service
initializeAuthService();

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Analytics (only on web)
let analytics: any = null;
if (Platform.OS === 'web') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(console.warn);
}

// Resilient auth getter with retry mechanism
export const getAuthInstance = (): Auth => {
  if (!auth) {
    console.log('Auth not initialized, initializing now...');
    initializeAuthService();
  }
  return auth;
};

// Helper function to get current user safely
export const getCurrentUser = (): User | null => {
  try {
    const authInstance = getAuthInstance();
    return authInstance.currentUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper function to wait for authentication to be ready
export const waitForAuth = (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const authInstance = getAuthInstance();
      
      // If user is already authenticated, resolve immediately
      if (authInstance.currentUser) {
        resolve(true);
        return;
      }

      // Otherwise, wait for auth state change
      const unsubscribe = authInstance.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user !== null);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        try { unsubscribe(); } catch {}
        resolve(false);
      }, 5000);
    } catch (error) {
      console.error('Error waiting for auth:', error);
      resolve(false);
    }
  });
};

// Improved helper: wait for first onAuthStateChanged emission (avoids premature null)
let authReadyPromise: Promise<User | null> | null = null;
export const waitForAuthReady = (): Promise<User | null> => {
  if (authReadyPromise) return authReadyPromise;
  authReadyPromise = new Promise((resolve) => {
    try {
      const authInstance = getAuthInstance();
      let settled = false;
      const unsubscribe = authInstance.onAuthStateChanged((user) => {
        if (settled) return;
        settled = true;
        unsubscribe();
        resolve(user);
      });
      // Safety timeout (8s) – still resolve with currentUser (may be null)
      setTimeout(() => {
        if (!settled) {
          settled = true;
          try { unsubscribe(); } catch {}
          resolve(authInstance.currentUser);
        }
      }, 8000);
    } catch (error) {
      console.error('Error waiting for auth ready:', error);
      resolve(null);
    }
  });
  return authReadyPromise;
};

export { app, auth, db, analytics };
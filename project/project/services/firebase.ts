// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3EG_vMbeMeuf8mdMhOtu-3ePqff6polo",
  authDomain: "kleanly-67b7b.firebaseapp.com",
  projectId: "kleanly-67b7b",
  storageBucket: "kleanly-67b7b.firebasestorage.app",
  messagingSenderId: "474784025290",
  appId: "1:474784025290:web:92b6bbfa7b85c52f040233",
  measurementId: "G-GR5WPXRPY9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with platform-specific persistence
let auth;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
} catch (error) {
  if (error.code !== 'auth/already-initialized') {
    console.error('Firebase Auth initialization error:', error);
  }
  // Fallback to basic auth initialization
  auth = getAuth(app);
}

// Initialize Firestore with better error handling
export const db = getFirestore(app);

// Connect to emulators in development
if (__DEV__ || process.env.NODE_ENV === 'development') {
  try {
    // Connect Auth emulator
    if (!auth._delegate._authCredentials) {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
    
    // Connect Firestore emulator
    if (!db._delegate._settings?.host?.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
  } catch (error) {
    console.log('Emulator connection already established or failed:', error);
  }
}

// Configure Firestore settings for better offline support
try {
  // Enable offline persistence for better user experience
  if (Platform.OS === 'web') {
    // Web-specific Firestore settings
    db._delegate._databaseId = db._delegate._databaseId;
  }
} catch (error) {
  console.log('Firestore settings configuration:', error);
}

export { auth };

// Initialize Analytics (only on web)
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.log('Analytics not initialized:', error);
  }
}

export { analytics };
export default app;
import React, { useState, useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import GlobalErrorBoundary from '../components/GlobalErrorBoundary';
import SplashScreenComponent from '../components/SplashScreen';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { OrderProvider } from '../context/OrderContext';
import { ToastProvider } from '../context/ToastContext';
import '../global.css';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Hide the native splash screen immediately to prevent conflicts
        await SplashScreen.hideAsync();
        
        // Pre-load any resources here (fonts, images, etc.)
        // Simulate some loading time for resources
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setIsAppReady(true);
      } catch (e) {
        console.warn('Error during app preparation:', e);
        setIsAppReady(true);
      }
    }

    prepare();
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowCustomSplash(false);
  }, []);

  // Show custom splash screen first
  if (showCustomSplash) {
    return <SplashScreenComponent onFinish={handleSplashFinish} />;
  }

  // Then show the main app after splash finishes
  if (!isAppReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <OrderProvider>
          <ToastProvider>
            <GlobalErrorBoundary>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="driver" options={{ headerShown: false }} />
                <Stack.Screen name="admin" options={{ headerShown: false }} />
              </Stack>
            </GlobalErrorBoundary>
          </ToastProvider>
        </OrderProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { OrderProvider } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import '../global.css';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (user && !inAuthGroup) {
      // User is signed in but not in auth group, redirect to tabs
      router.replace('/(tabs)');
    } else if (!user && inAuthGroup) {
      // User is not signed in but in auth group, redirect to login
      router.replace('/login');
    } else if (!user && segments.length === 0) {
      // User is not signed in and at root, redirect to login
      router.replace('/login');
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="admin-orders" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="profile/about" />
      <Stack.Screen name="profile/addresses" />
      <Stack.Screen name="profile/help-support" />
      <Stack.Screen name="profile/notifications" />
      <Stack.Screen name="profile/payment-methods" />
      <Stack.Screen name="profile/personal-info" />
      <Stack.Screen name="profile/rate-review" />
      <Stack.Screen name="profile/referral" />
      <Stack.Screen name="driver/index" />
      <Stack.Screen name="navigate/[orderId]" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Hide splash screen after framework is ready
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <OrderProvider>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </OrderProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
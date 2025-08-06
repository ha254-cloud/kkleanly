import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { OrderProvider } from '../context/OrderContext';
import { ToastProvider } from '../context/ToastContext';
import '../global.css';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OrderProvider>
          <ToastProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </ToastProvider>
        </OrderProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
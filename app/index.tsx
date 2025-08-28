import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { isCurrentUserDriver, isCurrentUserAdmin } from '../utils/adminAuth';

export default function IndexScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleRouting = async () => {
      if (!loading && user) {
        try {
          // Check if user is admin
          const isAdmin = isCurrentUserAdmin();
          if (isAdmin) {
            router.replace('/(tabs)');
            return;
          }

          // Check if user is a driver
          const isDriver = await isCurrentUserDriver();
          if (isDriver) {
            console.log('🚚 Driver detected, redirecting to driver dashboard:', user.email);
            router.replace('/driver/' as any);
            return;
          }

          // Regular user, go to main app
          router.replace('/(tabs)');
        } catch (error) {
          console.error('Error checking user role:', error);
          // Fallback to regular user flow
          router.replace('/(tabs)');
        }
      } else if (!loading && !user) {
        // User is not authenticated, go to login
        router.replace('/login');
      }
    };

    handleRouting();
  }, [user, loading]);

  // Show loading screen while checking auth state
  return (
    <View style={styles.container}>
      <Text style={styles.title}>KLEANLY</Text>
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
  },
});
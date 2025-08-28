import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { isCurrentUserAdmin } from '../utils/adminAuth';
import { Colors } from '../constants/Colors';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAdmin = false, 
  fallback 
}) => {
  const { user, loading } = useAuth();
  const [adminChecking, setAdminChecking] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (requireAdmin && user) {
      setAdminChecking(true);
      
      // Check admin status with retry
      const checkAdmin = async () => {
        let adminStatus = isCurrentUserAdmin();
        
        // Retry admin check up to 3 times if initially false
        for (let attempt = 0; attempt < 3 && !adminStatus; attempt++) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          adminStatus = isCurrentUserAdmin();
        }
        
        setIsAdmin(adminStatus);
        setAdminChecking(false);
      };
      
      checkAdmin();
    } else if (!requireAdmin) {
      setIsAdmin(true);
      setAdminChecking(false);
    }
  }, [user, requireAdmin]);

  // Show loading while checking authentication
  if (loading || (requireAdmin && adminChecking)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>
          {loading ? 'Checking authentication...' : 'Verifying permissions...'}
        </Text>
      </View>
    );
  }

  // Show fallback if not authenticated
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Authentication Required</Text>
        <Text style={styles.errorText}>
          Please log in to access this content.
        </Text>
      </View>
    );
  }

  // Show fallback if admin required but user is not admin
  if (requireAdmin && !isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorText}>
          Admin privileges required to access this content.
        </Text>
      </View>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 24,
  },
});

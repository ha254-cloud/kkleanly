import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { router } from 'expo-router';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, getAuthInstance } from '../services/firebase';

type User = FirebaseUser;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth listener');
    
    try {
      // Get auth instance with retry mechanism
      const authInstance = getAuthInstance();
      console.log('AuthProvider: auth instance obtained successfully');

      const unsubscribe = onAuthStateChanged(authInstance, 
        (user: User | null) => {
          console.log('AuthProvider: Auth state changed:', user ? `User logged in: ${user.email}` : 'User logged out');
          
          // Only set user as null if we're sure the user is actually logged out
          if (user) {
            setUser(user);
            setAuthError(null);
          } else {
            // Double-check current user before setting to null
            const currentUser = authInstance.currentUser;
            if (!currentUser) {
              setUser(null);
            }
          }
          setLoading(false);
        },
        (error) => {
          console.error('AuthProvider: Auth state change error:', error);
          setAuthError(error.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error: any) {
      console.error('AuthProvider: Error setting up auth listener:', error);
      setAuthError(error.message || 'Failed to initialize authentication');
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Get auth instance with retry mechanism
      const authInstance = getAuthInstance();
      
      // Add timeout to prevent hanging
      const loginPromise = signInWithEmailAndPassword(authInstance, email, password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 15000)
      );
      
      const result = await Promise.race([loginPromise, timeoutPromise]) as any;
      setUser(result.user);
    } catch (error: any) {
      // Handle timeout errors
      if (error.message === 'Login timeout') {
        throw new Error('Connection timeout. Please check your internet connection and try again.');
      }
      // Handle configuration errors gracefully
      if (error.code === 'auth/configuration-not-found') {
        throw new Error('Authentication service is not properly configured. Please contact support.');
      }
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Get auth instance with retry mechanism
      const authInstance = getAuthInstance();
      
      // Add timeout to prevent hanging
      const registerPromise = createUserWithEmailAndPassword(authInstance, email, password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Registration timeout')), 15000)
      );
      
      const result = await Promise.race([registerPromise, timeoutPromise]) as any;
      setUser(result.user);
    } catch (error: any) {
      // Handle timeout errors
      if (error.message === 'Registration timeout') {
        throw new Error('Connection timeout. Please check your internet connection and try again.');
      }
      // Handle configuration errors gracefully
      if (error.code === 'auth/configuration-not-found') {
        throw new Error('Authentication service is not properly configured. Please contact support.');
      }
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const authInstance = getAuthInstance();
      await signOut(authInstance);
      setUser(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    console.log('🔑 AuthContext: resetPassword called with email:', email);
    
    try {
      // Use our enhanced Firebase email service
      const { EnhancedFirebaseEmailService } = await import('../services/enhancedFirebaseEmailService');
      const emailService = new EnhancedFirebaseEmailService();
      
      const result = await emailService.sendEnhancedPasswordResetEmail(email);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send password reset email');
      }
      
      console.log('✅ AuthContext: Password reset completed successfully');
    } catch (error: any) {
      console.error('❌ AuthContext: Password reset failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error: authError,
    login,
    register,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
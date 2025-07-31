import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { router } from 'expo-router';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

type User = FirebaseUser;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Check if Firebase is properly configured
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      
      // Add timeout to prevent hanging
      const loginPromise = signInWithEmailAndPassword(auth, email, password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 15000)
      );
      
      const result = await Promise.race([loginPromise, timeoutPromise]);
      setUser(result.user);
    } catch (error) {
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
      // Check if Firebase is properly configured
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      
      // Add timeout to prevent hanging
      const registerPromise = createUserWithEmailAndPassword(auth, email, password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Registration timeout')), 15000)
      );
      
      const result = await Promise.race([registerPromise, timeoutPromise]);
      setUser(result.user);
    } catch (error) {
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
      await signOut(auth);
      setUser(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
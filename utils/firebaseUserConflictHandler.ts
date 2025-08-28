/**
 * Firebase User Conflict Detection and Resolution
 * Handles email conflicts and duplicate user accounts
 */

import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  deleteUser,
  fetchSignInMethodsForEmail
} from 'firebase/auth';

/**
 * Check if an email has existing Firebase accounts
 */
export const checkEmailConflicts = async (email: string): Promise<{
  hasAccount: boolean;
  signInMethods: string[];
  conflictLevel: 'none' | 'similar' | 'exact';
  suggestions: string[];
}> => {
  try {
    console.log('🔍 Checking email conflicts for:', email);
    
    // Check exact email match
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    
    if (signInMethods.length > 0) {
      return {
        hasAccount: true,
        signInMethods,
        conflictLevel: 'exact',
        suggestions: [
          'This email already has an account',
          'Try logging in instead of signing up',
          'Use "Forgot Password" if you need to reset your password'
        ]
      };
    }

    // Check for similar emails (Firebase may normalize emails)
    const normalizedEmail = email.toLowerCase().trim();
    const emailParts = normalizedEmail.split('@');
    const username = emailParts[0];
    const domain = emailParts[1];

    // Common email variations that Firebase might consider similar
    const variations = [
      `${username}@${domain}`,
      `${username.replace(/\./g, '')}@${domain}`, // Remove dots
      `${username}+something@${domain}`, // Plus addressing
    ];

    for (const variation of variations) {
      if (variation !== normalizedEmail) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, variation);
          if (methods.length > 0) {
            return {
              hasAccount: true,
              signInMethods: methods,
              conflictLevel: 'similar',
              suggestions: [
                `Similar email found: ${variation}`,
                'Firebase may consider these emails equivalent',
                'Try using a different email address'
              ]
            };
          }
        } catch (error) {
          // Continue checking other variations
        }
      }
    }

    return {
      hasAccount: false,
      signInMethods: [],
      conflictLevel: 'none',
      suggestions: ['Email is available for registration']
    };

  } catch (error) {
    console.error('Error checking email conflicts:', error);
    throw new Error(`Failed to check email conflicts: ${error.message}`);
  }
};

/**
 * Test account creation without actually creating
 */
export const testAccountCreation = async (email: string, password: string): Promise<{
  canCreate: boolean;
  error?: string;
  errorCode?: string;
}> => {
  try {
    console.log('🧪 Testing account creation for:', email);
    
    // First check for existing accounts
    const conflicts = await checkEmailConflicts(email);
    
    if (conflicts.hasAccount) {
      return {
        canCreate: false,
        error: `Email already in use: ${conflicts.suggestions.join(', ')}`,
        errorCode: 'auth/email-already-in-use'
      };
    }

    // Since we can't actually test creation without creating,
    // we'll validate the email format and other requirements
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        canCreate: false,
        error: 'Invalid email format',
        errorCode: 'auth/invalid-email'
      };
    }

    if (password.length < 6) {
      return {
        canCreate: false,
        error: 'Password must be at least 6 characters',
        errorCode: 'auth/weak-password'
      };
    }

    return {
      canCreate: true
    };

  } catch (error) {
    console.error('Error testing account creation:', error);
    return {
      canCreate: false,
      error: error.message,
      errorCode: error.code
    };
  }
};

/**
 * Enhanced registration with conflict detection
 */
export const registerWithConflictDetection = async (email: string, password: string): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  conflictInfo?: any;
}> => {
  try {
    console.log('🔐 Starting enhanced registration for:', email);
    
    // Pre-check for conflicts
    const conflicts = await checkEmailConflicts(email);
    
    if (conflicts.hasAccount) {
      return {
        success: false,
        error: 'Email already in use',
        conflictInfo: conflicts
      };
    }

    // Attempt registration
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    console.log('✅ Registration successful for:', email);
    return {
      success: true,
      user: userCredential.user
    };

  } catch (error) {
    console.error('❌ Registration failed:', error);
    
    // Re-check conflicts if registration fails
    try {
      const conflicts = await checkEmailConflicts(email);
      return {
        success: false,
        error: error.message,
        conflictInfo: conflicts
      };
    } catch (conflictError) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

/**
 * Debug current authentication state
 */
export const debugAuthState = async (): Promise<{
  currentUser: any;
  isSignedIn: boolean;
  userEmail?: string;
  uid?: string;
}> => {
  const currentUser = auth.currentUser;
  
  return {
    currentUser: currentUser ? {
      email: currentUser.email,
      uid: currentUser.uid,
      emailVerified: currentUser.emailVerified,
      displayName: currentUser.displayName,
      creationTime: currentUser.metadata?.creationTime,
      lastSignInTime: currentUser.metadata?.lastSignInTime
    } : null,
    isSignedIn: !!currentUser,
    userEmail: currentUser?.email,
    uid: currentUser?.uid
  };
};

/**
 * Clean up test accounts (admin only)
 */
export const cleanupTestAccounts = async (emailPattern: string): Promise<{
  cleaned: string[];
  errors: string[];
}> => {
  // This would require admin SDK access in a real implementation
  // For now, just return a placeholder
  console.warn('cleanupTestAccounts requires Firebase Admin SDK - not available in client');
  
  return {
    cleaned: [],
    errors: ['Admin SDK required for user cleanup']
  };
};

/**
 * Get detailed error information for auth errors
 */
export const getAuthErrorDetails = (error: any): {
  code: string;
  message: string;
  suggestions: string[];
} => {
  const code = error?.code || 'unknown-error';
  const message = error?.message || 'Unknown error occurred';
  
  const suggestions: string[] = [];
  
  switch (code) {
    case 'auth/email-already-in-use':
      suggestions.push('Try logging in instead of signing up');
      suggestions.push('Use "Forgot Password" if you need to reset');
      suggestions.push('Check if you have multiple email addresses');
      break;
      
    case 'auth/invalid-email':
      suggestions.push('Check email format (example@domain.com)');
      suggestions.push('Remove any extra spaces');
      break;
      
    case 'auth/weak-password':
      suggestions.push('Use at least 6 characters');
      suggestions.push('Include numbers and special characters');
      break;
      
    case 'auth/user-not-found':
      suggestions.push('Try signing up for a new account');
      suggestions.push('Check if you typed the email correctly');
      break;
      
    case 'auth/wrong-password':
      suggestions.push('Check your password');
      suggestions.push('Use "Forgot Password" to reset');
      break;
      
    default:
      suggestions.push('Check your internet connection');
      suggestions.push('Try again in a few moments');
  }
  
  return { code, message, suggestions };
};

export default {
  checkEmailConflicts,
  testAccountCreation,
  registerWithConflictDetection,
  debugAuthState,
  cleanupTestAccounts,
  getAuthErrorDetails
};

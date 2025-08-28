/**
 * Email Duplicate Debugger
 * Tool to investigate why Firebase thinks different emails are the same user
 */

import { auth, db } from '../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail
} from 'firebase/auth';

interface EmailDebugResult {
  email: string;
  normalizedEmail: string;
  existsInAuth: boolean;
  signInMethods: string[];
  firestoreUserProfile: any;
  possibleDuplicates: string[];
}

export class EmailDuplicateDebugger {
  
  /**
   * Normalize email the way Firebase might be doing it
   */
  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Check for potential email similarities that might cause conflicts
   */
  private findSimilarEmails(targetEmail: string, allEmails: string[]): string[] {
    const normalized = this.normalizeEmail(targetEmail);
    const similar: string[] = [];
    
    for (const email of allEmails) {
      const normalizedCheck = this.normalizeEmail(email);
      
      // Check various similarity patterns
      if (normalizedCheck !== normalized) {
        // Check if they share the same username part
        const targetUser = normalized.split('@')[0];
        const checkUser = normalizedCheck.split('@')[0];
        
        // Check if one contains the other
        if (targetUser.includes(checkUser) || checkUser.includes(targetUser)) {
          similar.push(email);
        }
        
        // Check if they're anagrams or similar patterns
        if (this.areEmailsSimilar(targetUser, checkUser)) {
          similar.push(email);
        }
      }
    }
    
    return similar;
  }

  /**
   * Check if two email usernames are similar (anagrams, substrings, etc.)
   */
  private areEmailsSimilar(email1: string, email2: string): boolean {
    // Sort characters to check for anagrams
    const sorted1 = email1.split('').sort().join('');
    const sorted2 = email2.split('').sort().join('');
    
    if (sorted1 === sorted2) return true;
    
    // Check for substring relationships
    if (email1.includes(email2) || email2.includes(email1)) return true;
    
    // Check for common character sequences
    const similarity = this.calculateSimilarity(email1, email2);
    return similarity > 0.8; // 80% similarity threshold
  }

  /**
   * Calculate similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.calculateEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate edit distance between two strings
   */
  private calculateEditDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Debug a specific email to understand why it might be considered a duplicate
   */
  async debugEmail(email: string): Promise<EmailDebugResult> {
    console.log(`🔍 Debugging email: ${email}`);
    
    const normalizedEmail = this.normalizeEmail(email);
    let existsInAuth = false;
    let signInMethods: string[] = [];
    let firestoreUserProfile = null;
    
    try {
      // Check if email exists in Firebase Auth
      signInMethods = await fetchSignInMethodsForEmail(auth, email);
      existsInAuth = signInMethods.length > 0;
      
      console.log(`📧 Email: ${email}`);
      console.log(`📧 Normalized: ${normalizedEmail}`);
      console.log(`📧 Exists in Auth: ${existsInAuth}`);
      console.log(`📧 Sign-in methods: ${signInMethods.join(', ')}`);
      
    } catch (error) {
      console.error(`❌ Error checking email in Auth:`, error);
    }
    
    try {
      // Check all known emails for similarities
      const allKnownEmails = await this.getAllKnownEmails();
      const similarEmails = this.findSimilarEmails(email, allKnownEmails);
      
      console.log(`🔄 Similar emails found: ${similarEmails.length}`);
      similarEmails.forEach(similarEmail => {
        console.log(`   - ${similarEmail}`);
      });
      
      return {
        email,
        normalizedEmail,
        existsInAuth,
        signInMethods,
        firestoreUserProfile,
        possibleDuplicates: similarEmails
      };
      
    } catch (error) {
      console.error(`❌ Error in email debugging:`, error);
      throw error;
    }
  }

  /**
   * Get all known emails from various sources
   */
  private async getAllKnownEmails(): Promise<string[]> {
    const knownEmails: string[] = [];
    
    try {
      // Get emails from user profiles
      const userProfilesQuery = query(collection(db, 'userProfiles'));
      const userProfilesSnapshot = await getDocs(userProfilesQuery);
      
      userProfilesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.email) {
          knownEmails.push(data.email);
        }
      });
      
      // Get emails from drivers
      const driversQuery = query(collection(db, 'drivers'));
      const driversSnapshot = await getDocs(driversQuery);
      
      driversSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.email) {
          knownEmails.push(data.email);
        }
      });
      
      // Add admin email
      knownEmails.push('kleanlyspt@gmail.com');
      
      // Add known driver emails from static list
      const driverEmails = [
        'driver1@kleanly.co.ke',
        'driver2@kleanly.co.ke', 
        'driver3@kleanly.co.ke',
        'driver1@gmail.com',
        'driver2@gmail.com',
        'driver3@gmail.com',
        'testdriver@kleanly.co.ke',
        'john.doe@kleanly.co.ke',
        'jane.smith@kleanly.co.ke',
        'mike.johnson@kleanly.co.ke',
        'driver@kleanly.co.ke',
        'john.driver@kleanly.co.ke',
        'mary.driver@kleanly.co.ke',
        'harrymaina02@gmail.com'
      ];
      
      knownEmails.push(...driverEmails);
      
    } catch (error) {
      console.error('Error fetching known emails:', error);
    }
    
    // Remove duplicates and return
    return [...new Set(knownEmails)];
  }

  /**
   * Test email registration to see what error occurs
   */
  async testEmailRegistration(email: string, password: string = 'TestPassword123!'): Promise<{
    success: boolean;
    error?: any;
    errorCode?: string;
    errorMessage?: string;
  }> {
    try {
      console.log(`🧪 Testing registration for: ${email}`);
      
      // This will not actually create the user, just test the validation
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // If we get here, registration would succeed
      console.log(`✅ Registration would succeed for: ${email}`);
      
      // Clean up - delete the test user immediately
      if (result.user) {
        await result.user.delete();
        console.log(`🧹 Cleaned up test user for: ${email}`);
      }
      
      return { success: true };
      
    } catch (error: any) {
      console.log(`❌ Registration failed for: ${email}`);
      console.log(`❌ Error code: ${error.code}`);
      console.log(`❌ Error message: ${error.message}`);
      
      return {
        success: false,
        error,
        errorCode: error.code,
        errorMessage: error.message
      };
    }
  }

  /**
   * Comprehensive email conflict analysis
   */
  async analyzeEmailConflict(email1: string, email2: string): Promise<{
    areSimilar: boolean;
    similarityScore: number;
    normalizedEmail1: string;
    normalizedEmail2: string;
    conflictReasons: string[];
  }> {
    const normalized1 = this.normalizeEmail(email1);
    const normalized2 = this.normalizeEmail(email2);
    
    const user1 = normalized1.split('@')[0];
    const user2 = normalized2.split('@')[0];
    
    const similarityScore = this.calculateSimilarity(user1, user2);
    const conflictReasons: string[] = [];
    
    // Check various conflict patterns
    if (normalized1 === normalized2) {
      conflictReasons.push('Identical when normalized');
    }
    
    if (user1.includes(user2) || user2.includes(user1)) {
      conflictReasons.push('One username contains the other');
    }
    
    if (this.areEmailsSimilar(user1, user2)) {
      conflictReasons.push('Usernames are very similar (anagram/high similarity)');
    }
    
    const sorted1 = user1.split('').sort().join('');
    const sorted2 = user2.split('').sort().join('');
    if (sorted1 === sorted2) {
      conflictReasons.push('Usernames are anagrams');
    }
    
    return {
      areSimilar: similarityScore > 0.8 || conflictReasons.length > 0,
      similarityScore,
      normalizedEmail1: normalized1,
      normalizedEmail2: normalized2,
      conflictReasons
    };
  }
}

// Export singleton instance
export const emailDebugger = new EmailDuplicateDebugger();

// Convenience functions
export const debugEmailConflict = (email: string) => emailDebugger.debugEmail(email);
export const testEmailRegistration = (email: string, password?: string) => 
  emailDebugger.testEmailRegistration(email, password);
export const analyzeConflict = (email1: string, email2: string) => 
  emailDebugger.analyzeEmailConflict(email1, email2);

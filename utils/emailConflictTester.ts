/**
 * Simple Email Conflict Tester
 * Quick utility to test why Firebase thinks different emails are the same
 */

import { auth } from '../services/firebase';
import { 
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signOut
} from 'firebase/auth';

export interface EmailTestResult {
  email: string;
  canRegister: boolean;
  errorCode?: string;
  errorMessage?: string;
  existingMethods: string[];
}

/**
 * Test if an email can be registered
 */
export async function testEmailRegistration(email: string): Promise<EmailTestResult> {
  console.log(`🧪 Testing email registration for: ${email}`);
  
  let existingMethods: string[] = [];
  let canRegister = false;
  let errorCode: string | undefined;
  let errorMessage: string | undefined;
  
  try {
    // First check if email already has sign-in methods
    existingMethods = await fetchSignInMethodsForEmail(auth, email);
    console.log(`📧 Existing sign-in methods for ${email}:`, existingMethods);
    
    if (existingMethods.length > 0) {
      console.log(`❌ Email ${email} already has existing methods:`, existingMethods);
      return {
        email,
        canRegister: false,
        errorCode: 'auth/email-already-in-use',
        errorMessage: 'Email already has existing authentication methods',
        existingMethods
      };
    }
    
    // Try to create a test user
    console.log(`🔄 Attempting to create test user for: ${email}`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, 'TestPassword123!');
    
    console.log(`✅ Successfully created test user for: ${email}`);
    console.log(`✅ User UID: ${userCredential.user.uid}`);
    
    // Immediately delete the test user to clean up
    if (userCredential.user) {
      await userCredential.user.delete();
      console.log(`🧹 Deleted test user for: ${email}`);
    }
    
    // Sign out to ensure clean state
    await signOut(auth);
    console.log(`🚪 Signed out after test`);
    
    canRegister = true;
    
  } catch (error: any) {
    console.log(`❌ Failed to create user for: ${email}`);
    console.log(`❌ Error code: ${error.code}`);
    console.log(`❌ Error message: ${error.message}`);
    
    errorCode = error.code;
    errorMessage = error.message;
    canRegister = false;
  }
  
  return {
    email,
    canRegister,
    errorCode,
    errorMessage,
    existingMethods
  };
}

/**
 * Test multiple emails and compare results
 */
export async function compareEmailRegistration(emails: string[]): Promise<EmailTestResult[]> {
  console.log(`🔍 Testing ${emails.length} emails for registration conflicts...`);
  
  const results: EmailTestResult[] = [];
  
  for (const email of emails) {
    try {
      const result = await testEmailRegistration(email);
      results.push(result);
      
      // Add a small delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Failed to test email ${email}:`, error);
      results.push({
        email,
        canRegister: false,
        errorCode: 'test-error',
        errorMessage: `Test failed: ${error}`,
        existingMethods: []
      });
    }
  }
  
  // Analyze results
  console.log(`\n📊 EMAIL REGISTRATION TEST RESULTS:`);
  console.log(`==========================================`);
  
  results.forEach(result => {
    console.log(`📧 ${result.email}:`);
    console.log(`   Can Register: ${result.canRegister ? '✅ YES' : '❌ NO'}`);
    if (!result.canRegister) {
      console.log(`   Error Code: ${result.errorCode}`);
      console.log(`   Error Message: ${result.errorMessage}`);
    }
    if (result.existingMethods.length > 0) {
      console.log(`   Existing Methods: ${result.existingMethods.join(', ')}`);
    }
    console.log('');
  });
  
  // Look for patterns
  const conflictingEmails = results.filter(r => !r.canRegister && r.errorCode === 'auth/email-already-in-use');
  if (conflictingEmails.length > 0) {
    console.log(`🚨 CONFLICTING EMAILS DETECTED:`);
    conflictingEmails.forEach(result => {
      console.log(`   - ${result.email} (existing methods: ${result.existingMethods.join(', ')})`);
    });
  }
  
  return results;
}

/**
 * Quick test for the specific case mentioned
 */
export async function testSpecificCase(): Promise<void> {
  console.log(`🎯 Testing specific case: harrymaina02@gmail.com vs mainaharry554@gmail.com`);
  
  const emails = [
    'harrymaina02@gmail.com',
    'mainaharry554@gmail.com'
  ];
  
  const results = await compareEmailRegistration(emails);
  
  // Analyze the specific conflict
  const email1Result = results.find(r => r.email === 'harrymaina02@gmail.com');
  const email2Result = results.find(r => r.email === 'mainaharry554@gmail.com');
  
  if (email1Result && email2Result) {
    console.log(`\n🔍 SPECIFIC CASE ANALYSIS:`);
    console.log(`==========================================`);
    console.log(`Email 1: ${email1Result.email}`);
    console.log(`  Can Register: ${email1Result.canRegister}`);
    console.log(`  Error: ${email1Result.errorMessage || 'None'}`);
    console.log(`Email 2: ${email2Result.email}`);
    console.log(`  Can Register: ${email2Result.canRegister}`);
    console.log(`  Error: ${email2Result.errorMessage || 'None'}`);
    
    if (!email1Result.canRegister && !email2Result.canRegister) {
      console.log(`\n🚨 BOTH EMAILS CANNOT REGISTER!`);
      console.log(`This confirms there's a conflict between these emails.`);
    }
  }
}

/**
 * Check email normalization patterns
 */
export function analyzeEmailPatterns(email1: string, email2: string): {
  normalizedSame: boolean;
  usernameSimilarity: number;
  possibleConflictReasons: string[];
} {
  const normalized1 = email1.toLowerCase().trim();
  const normalized2 = email2.toLowerCase().trim();
  
  const user1 = normalized1.split('@')[0];
  const user2 = normalized2.split('@')[0];
  
  const possibleConflictReasons: string[] = [];
  
  // Check if normalized versions are identical
  const normalizedSame = normalized1 === normalized2;
  if (normalizedSame) {
    possibleConflictReasons.push('Emails are identical when normalized');
  }
  
  // Check username patterns
  if (user1 === user2) {
    possibleConflictReasons.push('Usernames are identical');
  }
  
  // Only flag containment for very short usernames to prevent false positives
  // "mainaharry554" and "mainaharry67" should NOT be flagged as containing each other
  if (user1.length <= 6 || user2.length <= 6) {
    if (user1.includes(user2) || user2.includes(user1)) {
      possibleConflictReasons.push('One username contains the other (short usernames only)');
    }
  }
  
  // Only check anagrams for very short usernames
  if (user1.length <= 8 && user2.length <= 8) {
    const sorted1 = user1.split('').sort().join('');
    const sorted2 = user2.split('').sort().join('');
    if (sorted1 === sorted2) {
      possibleConflictReasons.push('Usernames are anagrams (same letters rearranged)');
    }
  }
  
  // Much stricter similarity threshold - only flag nearly identical usernames
  // This allows "mainaharry554" vs "mainaharry67" to be considered different
  const usernameSimilarity = calculateStringSimilarity(user1, user2);
  if (usernameSimilarity > 0.95) {
    possibleConflictReasons.push(`Usernames are nearly identical (${(usernameSimilarity * 100).toFixed(1)}% similarity)`);
  }
  
  return {
    normalizedSame,
    usernameSimilarity,
    possibleConflictReasons
  };
}

/**
 * Calculate string similarity using Jaro-Winkler algorithm
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0 || len2 === 0) return 0.0;
  
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  if (matchDistance < 0) return 0.0;
  
  const str1Matches = new Array(len1).fill(false);
  const str2Matches = new Array(len2).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    
    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0.0;
  
  // Find transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }
  
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  
  return jaro;
}

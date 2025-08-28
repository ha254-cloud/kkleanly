/**
 * Email Conflict Resolution Utility
 * Helps clean up duplicate/conflicting email accounts
 */

import { auth, db } from '../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { 
  deleteUser,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

export interface ConflictResolutionResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Check if an email exists in various collections
 */
export async function checkEmailExistence(email: string): Promise<{
  inAuth: boolean;
  inDrivers: boolean;
  inUserProfiles: boolean;
  inAdminAuth: boolean;
  details: any;
}> {
  console.log(`🔍 Checking existence of email: ${email}`);
  
  const result = {
    inAuth: false,
    inDrivers: false,
    inUserProfiles: false,
    inAdminAuth: false,
    details: {
      driverRecord: null,
      userProfile: null,
      authMethods: []
    }
  };

  try {
    // Check Firebase Auth
    const { fetchSignInMethodsForEmail } = await import('firebase/auth');
    const authMethods = await fetchSignInMethodsForEmail(auth, email);
    result.inAuth = authMethods.length > 0;
    result.details.authMethods = authMethods;
    console.log(`📧 Auth methods for ${email}:`, authMethods);

    // Check drivers collection
    const driversQuery = query(
      collection(db, 'drivers'),
      where('email', '==', email)
    );
    const driversSnapshot = await getDocs(driversQuery);
    result.inDrivers = !driversSnapshot.empty;
    if (!driversSnapshot.empty) {
      result.details.driverRecord = driversSnapshot.docs[0].data();
      console.log(`🚚 Driver record found for ${email}:`, result.details.driverRecord);
    }

    // Check user profiles collection
    const userProfilesQuery = query(
      collection(db, 'userProfiles'),
      where('email', '==', email)
    );
    const userProfilesSnapshot = await getDocs(userProfilesQuery);
    result.inUserProfiles = !userProfilesSnapshot.empty;
    if (!userProfilesSnapshot.empty) {
      result.details.userProfile = userProfilesSnapshot.docs[0].data();
      console.log(`👤 User profile found for ${email}:`, result.details.userProfile);
    }

    // Check admin auth list
    const { ADMIN_EMAIL } = await import('./adminAuth');
    result.inAdminAuth = email === ADMIN_EMAIL;

    // Check known driver emails from adminAuth.ts
    const knownDriverEmails = [
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
    
    if (knownDriverEmails.includes(email)) {
      result.inAdminAuth = true;
      console.log(`🔒 Email ${email} found in known driver emails list`);
    }

  } catch (error) {
    console.error(`❌ Error checking email existence:`, error);
  }

  return result;
}

/**
 * Remove email from drivers collection
 */
export async function removeFromDrivers(email: string): Promise<ConflictResolutionResult> {
  try {
    console.log(`🗑️ Removing ${email} from drivers collection...`);
    
    const driversQuery = query(
      collection(db, 'drivers'),
      where('email', '==', email)
    );
    const driversSnapshot = await getDocs(driversQuery);
    
    if (driversSnapshot.empty) {
      return {
        success: false,
        message: `Email ${email} not found in drivers collection`
      };
    }

    // Delete all driver records with this email
    for (const driverDoc of driversSnapshot.docs) {
      await deleteDoc(doc(db, 'drivers', driverDoc.id));
      console.log(`✅ Deleted driver record: ${driverDoc.id}`);
    }

    return {
      success: true,
      message: `Successfully removed ${email} from drivers collection`,
      details: { deletedRecords: driversSnapshot.docs.length }
    };

  } catch (error) {
    console.error(`❌ Error removing from drivers:`, error);
    return {
      success: false,
      message: `Failed to remove ${email} from drivers: ${error}`
    };
  }
}

/**
 * Remove email from user profiles collection
 */
export async function removeFromUserProfiles(email: string): Promise<ConflictResolutionResult> {
  try {
    console.log(`🗑️ Removing ${email} from user profiles collection...`);
    
    const userProfilesQuery = query(
      collection(db, 'userProfiles'),
      where('email', '==', email)
    );
    const userProfilesSnapshot = await getDocs(userProfilesQuery);
    
    if (userProfilesSnapshot.empty) {
      return {
        success: false,
        message: `Email ${email} not found in user profiles collection`
      };
    }

    // Delete all user profile records with this email
    for (const userDoc of userProfilesSnapshot.docs) {
      await deleteDoc(doc(db, 'userProfiles', userDoc.id));
      console.log(`✅ Deleted user profile: ${userDoc.id}`);
    }

    return {
      success: true,
      message: `Successfully removed ${email} from user profiles collection`,
      details: { deletedRecords: userProfilesSnapshot.docs.length }
    };

  } catch (error) {
    console.error(`❌ Error removing from user profiles:`, error);
    return {
      success: false,
      message: `Failed to remove ${email} from user profiles: ${error}`
    };
  }
}

/**
 * Complete cleanup of an email from all systems
 */
export async function completeEmailCleanup(email: string, adminPassword?: string): Promise<ConflictResolutionResult> {
  console.log(`🧹 Starting complete cleanup for: ${email}`);
  
  const results: ConflictResolutionResult[] = [];
  
  try {
    // First check what exists
    const existence = await checkEmailExistence(email);
    console.log(`📊 Email existence check:`, existence);

    // Remove from Firestore collections
    if (existence.inDrivers) {
      const driverResult = await removeFromDrivers(email);
      results.push(driverResult);
    }

    if (existence.inUserProfiles) {
      const profileResult = await removeFromUserProfiles(email);
      results.push(profileResult);
    }

    // Note: We cannot easily remove from Firebase Auth without the user's password
    // This would need to be done through Firebase Admin SDK or manually in Firebase Console
    if (existence.inAuth) {
      results.push({
        success: false,
        message: `Email ${email} still exists in Firebase Auth. This requires manual cleanup in Firebase Console or admin SDK.`,
        details: { authMethods: existence.details.authMethods }
      });
    }

    if (existence.inAdminAuth) {
      results.push({
        success: false,
        message: `Email ${email} is in the hardcoded driver emails list in adminAuth.ts. This requires code changes to remove.`
      });
    }

    // Summarize results
    const successCount = results.filter(r => r.success).length;
    const totalOperations = results.length;

    return {
      success: successCount === totalOperations,
      message: `Cleanup completed: ${successCount}/${totalOperations} operations successful`,
      details: { operations: results, existence }
    };

  } catch (error) {
    console.error(`❌ Complete cleanup failed:`, error);
    return {
      success: false,
      message: `Complete cleanup failed: ${error}`,
      details: { error }
    };
  }
}

/**
 * Quick fix for the specific harrymaina02@gmail.com conflict
 */
export async function fixHarryEmailConflict(): Promise<ConflictResolutionResult> {
  console.log(`🎯 Fixing specific conflict: harrymaina02@gmail.com`);
  
  try {
    // Check the current state
    const existence = await checkEmailExistence('harrymaina02@gmail.com');
    
    if (!existence.inDrivers && !existence.inUserProfiles && !existence.inAuth) {
      return {
        success: true,
        message: 'No conflict found! harrymaina02@gmail.com is not in the system.',
        details: existence
      };
    }

    // Remove from drivers if present
    let cleanupResults: ConflictResolutionResult[] = [];
    
    if (existence.inDrivers) {
      const driverCleanup = await removeFromDrivers('harrymaina02@gmail.com');
      cleanupResults.push(driverCleanup);
    }

    if (existence.inUserProfiles) {
      const profileCleanup = await removeFromUserProfiles('harrymaina02@gmail.com');
      cleanupResults.push(profileCleanup);
    }

    const successfulCleanups = cleanupResults.filter(r => r.success).length;
    
    return {
      success: successfulCleanups > 0,
      message: `Removed harrymaina02@gmail.com from ${successfulCleanups} collections. Note: Still needs manual removal from adminAuth.ts and Firebase Auth.`,
      details: { cleanupResults, existence }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to fix Harry email conflict: ${error}`,
      details: { error }
    };
  }
}

/**
 * Generate instructions for manual cleanup
 */
export function generateManualCleanupInstructions(email: string): string {
  return `
📋 MANUAL CLEANUP INSTRUCTIONS for ${email}

1. 🔥 Firebase Console Cleanup:
   - Go to Firebase Console > Authentication > Users
   - Find and delete the user with email: ${email}

2. 📝 Code Cleanup:
   - Edit utils/adminAuth.ts
   - Remove '${email}' from KNOWN_DRIVER_EMAILS array
   - Save and restart the app

3. 🗃️ Database Cleanup (if needed):
   - Check Firebase Console > Firestore Database
   - Look for any remaining documents with this email
   - Delete manually if found

4. ✅ Test Registration:
   - Try creating account with mainaharry554@gmail.com
   - Should now work without conflicts

⚠️  IMPORTANT: Make sure you have admin access before making these changes!
`;
}

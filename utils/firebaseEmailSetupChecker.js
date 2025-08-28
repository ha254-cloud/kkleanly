/**
 * Firebase Email Configuration Checker
 * Run this to verify your Firebase Console email settings
 */

const { initializeApp } = require('firebase/app');
const { getAuth, sendPasswordResetEmail, createUserWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: 'AIzaSyD3EG_vMbeMeuf8mdMhOtu-3ePqff6polo',
  authDomain: 'kleanly-67b7b.firebaseapp.com',
  projectId: 'kleanly-67b7b',
  storageBucket: 'kleanly-67b7b.firebasestorage.app',
  messagingSenderId: '474784025290',
  appId: '1:474784025290:web:92b6bbfa7b85c52f040233'
};

console.log('🔥 Firebase Email Setup Checker');
console.log('=================================');
console.log(`Project: ${firebaseConfig.projectId}`);
console.log(`Auth Domain: ${firebaseConfig.authDomain}`);
console.log('');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function checkEmailConfiguration() {
  console.log('✅ STEP 1: Firebase Configuration Check');
  console.log('Firebase project initialized successfully');
  console.log('');

  console.log('🔧 STEP 2: Firebase Console Configuration Checklist');
  console.log('Please verify these settings in Firebase Console:');
  console.log('');
  
  console.log('📧 EMAIL PROVIDER SETTINGS:');
  console.log('1. Go to: https://console.firebase.google.com/project/kleanly-67b7b/authentication/providers');
  console.log('2. Ensure "Email/Password" provider is ENABLED');
  console.log('3. Check if "Email link (passwordless sign-in)" is configured if needed');
  console.log('');
  
  console.log('📝 EMAIL TEMPLATES:');
  console.log('1. Go to: https://console.firebase.google.com/project/kleanly-67b7b/authentication/templates');
  console.log('2. Click on "Password reset" template');
  console.log('3. Verify the template has:');
  console.log('   - Sender name (e.g., "Kleanly Team")');
  console.log('   - Sender email (should be noreply@kleanly-67b7b.firebaseapp.com)');
  console.log('   - Subject line (e.g., "Reset your Kleanly password")');
  console.log('   - Email body with reset link');
  console.log('');
  
  console.log('🌐 AUTHORIZED DOMAINS:');
  console.log('1. Go to: https://console.firebase.google.com/project/kleanly-67b7b/authentication/settings');
  console.log('2. Check "Authorized domains" section');
  console.log('3. Ensure these domains are listed:');
  console.log('   - localhost');
  console.log('   - kleanly-67b7b.firebaseapp.com');
  console.log('   - Any custom domains you use');
  console.log('');
  
  console.log('📬 EMAIL DELIVERY SETTINGS:');
  console.log('1. Go to: https://console.firebase.google.com/project/kleanly-67b7b/authentication/emails');
  console.log('2. Check if custom SMTP is configured or using Firebase default');
  console.log('3. If using Firebase default, emails come from: noreply@kleanly-67b7b.firebaseapp.com');
  console.log('4. If using custom SMTP, verify SMTP settings are correct');
  console.log('');

  // Test with a real email to see detailed error
  console.log('🧪 STEP 3: Testing Password Reset');
  
  // Try with an existing user first
  const testEmails = [
    'admin@kleanly.com',
    'test@example.com',
    'user@kleanly.com'
  ];

  for (const email of testEmails) {
    console.log(`\nTesting with: ${email}`);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: 'https://kleanly-67b7b.firebaseapp.com/',
        handleCodeInApp: false
      });
      console.log(`✅ Password reset email sent successfully to ${email}`);
      console.log(`📧 Email should arrive at: ${email}`);
      break; // Exit loop on first success
    } catch (error) {
      console.log(`❌ Failed for ${email}: ${error.code}`);
      if (error.code === 'auth/user-not-found') {
        console.log(`   → ${email} is not registered`);
      } else {
        console.log(`   → Error: ${error.message}`);
      }
    }
  }

  console.log('');
  console.log('🔍 TROUBLESHOOTING CHECKLIST:');
  console.log('');
  console.log('If emails are not arriving, check:');
  console.log('1. ✉️ Spam/Junk folder in your email client');
  console.log('2. 🚫 Email filters that might block Firebase emails');
  console.log('3. 📧 Email provider (Gmail, Outlook) security settings');
  console.log('4. ⏰ Wait 5-10 minutes - Firebase emails can be delayed');
  console.log('5. 🔧 Firebase Console > Authentication > Templates');
  console.log('6. 📊 Firebase Console > Authentication > Users (verify user exists)');
  console.log('');
  
  console.log('🔗 QUICK LINKS:');
  console.log(`• Firebase Console: https://console.firebase.google.com/project/kleanly-67b7b`);
  console.log(`• Auth Providers: https://console.firebase.google.com/project/kleanly-67b7b/authentication/providers`);
  console.log(`• Email Templates: https://console.firebase.google.com/project/kleanly-67b7b/authentication/templates`);
  console.log(`• Auth Settings: https://console.firebase.google.com/project/kleanly-67b7b/authentication/settings`);
  console.log(`• Users List: https://console.firebase.google.com/project/kleanly-67b7b/authentication/users`);
}

checkEmailConfiguration().catch(console.error);

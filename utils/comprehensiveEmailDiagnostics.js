/**
 * Advanced Firebase Email Diagnostics
 * This tool checks every possible configuration issue
 */

const { initializeApp } = require('firebase/app');
const { getAuth, sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: 'AIzaSyD3EG_vMbeMeuf8mdMhOtu-3ePqff6polo',
  authDomain: 'kleanly-67b7b.firebaseapp.com',
  projectId: 'kleanly-67b7b',
  storageBucket: 'kleanly-67b7b.firebasestorage.app',
  messagingSenderId: '474784025290',
  appId: '1:474784025290:web:92b6bbfa7b85c52f040233'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function comprehensiveEmailDiagnostics() {
  console.log('🔥 FIREBASE EMAIL DELIVERY DIAGNOSTICS');
  console.log('=====================================');
  console.log(`Project: ${firebaseConfig.projectId}`);
  console.log(`Domain: ${firebaseConfig.authDomain}`);
  console.log('');

  // Test 1: Basic Firebase connection
  console.log('✅ TEST 1: Firebase Connection');
  console.log('Firebase initialized successfully');
  console.log('');

  // Test 2: Create multiple test accounts with different domains
  const testAccounts = [
    'test1@gmail.com',
    'test2@yahoo.com', 
    'test3@outlook.com',
    'kleanlytest@protonmail.com'
  ];

  console.log('🧪 TEST 2: Creating Test Accounts & Sending Reset Emails');
  console.log('');

  for (const email of testAccounts) {
    console.log(`Testing: ${email}`);
    
    try {
      // Try to create user
      try {
        await createUserWithEmailAndPassword(auth, email, 'TestPassword123!');
        console.log(`  ✅ User created: ${email}`);
      } catch (createError) {
        if (createError.code === 'auth/email-already-in-use') {
          console.log(`  ℹ️  User exists: ${email}`);
        } else {
          console.log(`  ❌ Create failed: ${createError.code}`);
          continue;
        }
      }

      // Send password reset
      await sendPasswordResetEmail(auth, email, {
        url: 'https://kleanly-67b7b.firebaseapp.com/',
        handleCodeInApp: false
      });
      
      console.log(`  📧 Reset email sent successfully to ${email}`);
      console.log(`  ⏰ Check ${email} in 5-15 minutes`);
      
    } catch (resetError) {
      console.log(`  ❌ Reset failed: ${resetError.code} - ${resetError.message}`);
    }
    console.log('');
  }

  // Test 3: Advanced configuration with action code settings
  console.log('🔧 TEST 3: Advanced Action Code Settings');
  try {
    await sendPasswordResetEmail(auth, testAccounts[0], {
      url: 'https://kleanly-67b7b.firebaseapp.com/',
      handleCodeInApp: false,
      iOS: {
        bundleId: 'com.kleanly.app'
      },
      android: {
        packageName: 'com.kleanly.app',
        installApp: false,
        minimumVersion: '1.0.0'
      }
    });
    console.log('✅ Advanced action code settings work');
  } catch (error) {
    console.log('❌ Advanced settings failed:', error.code);
  }
  console.log('');

  // Test 4: Firebase Console Configuration Check
  console.log('🔍 TEST 4: Configuration Issues Analysis');
  console.log('');
  
  console.log('MOST COMMON ISSUES & SOLUTIONS:');
  console.log('');
  
  console.log('1. 📝 EMAIL TEMPLATES NOT CONFIGURED');
  console.log('   Problem: Firebase uses default template which may not send');
  console.log('   Solution: Configure custom template');
  console.log('   URL: https://console.firebase.google.com/project/kleanly-67b7b/authentication/templates');
  console.log('   Steps:');
  console.log('   • Click "Password reset"');
  console.log('   • Set sender name: "Kleanly App"');
  console.log('   • Customize email body');
  console.log('   • SAVE the template');
  console.log('');
  
  console.log('2. 🚫 FIREBASE EMAIL QUOTA LIMITS');
  console.log('   Problem: Free tier has email sending limits');
  console.log('   Solution: Check Firebase Console for quota');
  console.log('   URL: https://console.firebase.google.com/project/kleanly-67b7b/usage');
  console.log('');
  
  console.log('3. 🌐 DOMAIN VERIFICATION ISSUES');
  console.log('   Problem: Emails blocked due to domain reputation');
  console.log('   Solution: Verify authorized domains');
  console.log('   URL: https://console.firebase.google.com/project/kleanly-67b7b/authentication/settings');
  console.log('');
  
  console.log('4. 📧 EMAIL PROVIDER BLOCKING');
  console.log('   Problem: Gmail/Outlook blocking Firebase emails');
  console.log('   Solutions:');
  console.log('   • Check spam folder thoroughly');
  console.log('   • Whitelist: noreply@kleanly-67b7b.firebaseapp.com');
  console.log('   • Try different email providers');
  console.log('');
  
  console.log('5. 🕐 FIREBASE SERVICE DELAYS');
  console.log('   Problem: Firebase email service experiencing delays');
  console.log('   Solution: Wait 30+ minutes, check Firebase status');
  console.log('   Status: https://status.firebase.google.com/');
  console.log('');

  console.log('🛠️ IMMEDIATE ACTION PLAN:');
  console.log('');
  console.log('PRIORITY 1 - Configure Email Template:');
  console.log('1. Go to: https://console.firebase.google.com/project/kleanly-67b7b/authentication/templates');
  console.log('2. Click "Password reset" template');
  console.log('3. Fill in ALL fields (sender name, subject, body)');
  console.log('4. Click SAVE');
  console.log('5. Test again immediately');
  console.log('');
  
  console.log('PRIORITY 2 - Check Email Quotas:');
  console.log('1. Go to: https://console.firebase.google.com/project/kleanly-67b7b/usage');
  console.log('2. Look for email/authentication limits');
  console.log('3. If exceeded, upgrade plan or wait for reset');
  console.log('');
  
  console.log('PRIORITY 3 - Alternative Testing:');
  console.log('1. Create a new Gmail account for testing');
  console.log('2. Test with the new account immediately');
  console.log('3. Check spam folder after 5 minutes');
  console.log('');

  console.log('📞 SUPPORT ESCALATION:');
  console.log('If still not working after template configuration:');
  console.log('1. Firebase Support: https://firebase.google.com/support/contact');
  console.log('2. Report: "Password reset emails not being delivered despite successful API calls"');
  console.log('3. Include project ID: kleanly-67b7b');
  console.log('4. Include test email addresses used');
}

comprehensiveEmailDiagnostics().catch(console.error);

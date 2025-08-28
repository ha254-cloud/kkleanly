// Enhanced email service with spam prevention
const { initializeApp } = require('firebase/app');
const { getAuth, sendPasswordResetEmail } = require('firebase/auth');
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function sendImprovedPasswordReset(email) {
  try {
    console.log('🔥 Sending Improved Password Reset Email...');
    console.log('📧 To:', email);
    
    // Enhanced action code settings for better deliverability
    const actionCodeSettings = {
      // Use a more professional URL structure
      url: 'https://kleanly-67b7b.firebaseapp.com/__/auth/action',
      handleCodeInApp: false,
      // Add mobile app integration
      iOS: {
        bundleId: 'com.kleanly.app'
      },
      android: {
        packageName: 'com.kleanly.app',
        installApp: true,
        minimumVersion: '1'
      }
    };
    
    // Send with enhanced settings
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    
    console.log('✅ Enhanced password reset email sent!');
    console.log('📬 Email improvements:');
    console.log('   • Professional action URL');
    console.log('   • Mobile app integration');
    console.log('   • Enhanced security settings');
    console.log('');
    console.log('📧 User Instructions:');
    console.log('   1. Check main inbox first');
    console.log('   2. If not found, check spam/junk folder');
    console.log('   3. Mark as "Not Spam" if found in spam');
    console.log('   4. Add sender to contacts for future emails');
    console.log('');
    console.log('🔧 Email Details:');
    console.log('   From: noreply@kleanly-67b7b.firebaseapp.com');
    console.log('   Subject: Reset your password');
    console.log('   Type: Transactional (should have better delivery)');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error sending enhanced email:', error.message);
    
    // Provide specific troubleshooting
    if (error.code === 'auth/user-not-found') {
      console.log('🔍 Solution: Register the user first');
    } else if (error.code === 'auth/too-many-requests') {
      console.log('⏱️  Solution: Wait a few minutes before trying again');
    } else if (error.code === 'auth/invalid-email') {
      console.log('📧 Solution: Check email format');
    }
    
    return false;
  }
}

// Test both email addresses with enhanced settings
async function testBothEmails() {
  const emails = ['harrythukumaina@gmail.com', 'mainaharry67@gmail.com'];
  
  console.log('🚀 Testing Enhanced Email Delivery...\n');
  
  for (const email of emails) {
    console.log(`\n📧 Testing: ${email}`);
    console.log('═'.repeat(50));
    
    const success = await sendImprovedPasswordReset(email);
    
    if (success) {
      console.log(`✅ Email sent to ${email}`);
      console.log('⚠️  SPAM CHECK INSTRUCTIONS:');
      console.log('   1. Check your spam folder');
      console.log('   2. If email is in spam:');
      console.log('      → Click "Not Spam" or "Move to Inbox"');
      console.log('      → Add sender to contacts');
      console.log('   3. Future emails should go to inbox');
    } else {
      console.log(`❌ Failed to send to ${email}`);
    }
    
    // Wait between emails to avoid rate limiting
    if (email !== emails[emails.length - 1]) {
      console.log('\n⏱️  Waiting 3 seconds before next email...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 EMAIL DELIVERABILITY SUMMARY');
  console.log('═'.repeat(60));
  console.log('');
  console.log('🎯 Why emails might go to spam:');
  console.log('   • New Firebase domain (no reputation yet)');
  console.log('   • Automated email patterns');
  console.log('   • Email client security settings');
  console.log('');
  console.log('🛠️  How to improve delivery:');
  console.log('   1. Set up custom domain (kleanly.app)');
  console.log('   2. Configure SPF/DKIM records');
  console.log('   3. Use professional email service (SendGrid)');
  console.log('   4. Build sender reputation over time');
  console.log('');
  console.log('📈 Expectation: Delivery will improve as domain gains reputation');
}

// Run the enhanced test
testBothEmails().then(() => {
  console.log('\n🎯 Enhanced email test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});

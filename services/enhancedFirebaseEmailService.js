require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getAuth, sendPasswordResetEmail, updateProfile } = require('firebase/auth');

// Enhanced Firebase Email Service with Spam Instructions
class EnhancedFirebaseEmailService {
  constructor() {
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };

    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
  }

  /**
   * Send password reset email with enhanced deliverability instructions
   * @param {string} email - User's email address
   * @returns {Promise<Object>} - Result object with success status and instructions
   */
  async sendEnhancedPasswordResetEmail(email) {
    try {
      console.log('🚀 ENHANCED FIREBASE EMAIL SERVICE');
      console.log('═'.repeat(45));
      console.log(`📧 Sending password reset to: ${email}`);
      console.log('✨ Includes spam folder instructions');
      console.log('');

      // Configure custom action code settings for better email appearance
      const actionCodeSettings = {
        // Custom URL where user will be redirected after clicking the link
        url: 'https://kleanly-67b7b.firebaseapp.com/reset-complete',
        handleCodeInApp: true,
        iOS: {
          bundleId: 'com.kleanly.app'
        },
        android: {
          packageName: 'com.kleanly.app',
          installApp: true,
          minimumVersion: '12'
        },
        dynamicLinkDomain: 'kleanly-67b7b.firebaseapp.com'
      };

      // Send the email
      await sendPasswordResetEmail(this.auth, email, actionCodeSettings);

      console.log('✅ EMAIL SENT SUCCESSFULLY!');
      console.log('📬 Firebase password reset email dispatched');
      console.log('');

      // Return comprehensive instructions for the user
      const instructions = {
        success: true,
        emailSent: true,
        recipient: email,
        deliveryInstructions: {
          primary: "Check your email inbox for a password reset link from Firebase",
          spamCheck: {
            urgent: "⚠️ IMPORTANT: If you don't see the email in your INBOX, please check your SPAM/JUNK folder",
            steps: [
              "1. Open your email app (Gmail, Outlook, etc.)",
              "2. Check your INBOX first",
              "3. If not found, check SPAM/JUNK folder",
              "4. Look for email from 'Firebase' or 'noreply@kleanly-67b7b.firebaseapp.com'",
              "5. If found in spam, mark it as 'Not Spam' or 'Move to Inbox'",
              "6. This helps future emails reach your inbox directly"
            ]
          },
          timeline: "Email should arrive within 1-2 minutes",
          troubleshooting: {
            noEmail: "If you don't receive the email after 5 minutes, check spam folder and try again",
            spamPrevention: "Marking emails as 'Not Spam' improves future delivery",
            contactSupport: "Still having issues? Contact kleanlyspt@gmail.com"
          }
        },
        userMessage: this.generateUserFriendlyMessage(email)
      };

      return instructions;

    } catch (error) {
      console.error('❌ FIREBASE EMAIL ERROR:', error);
      
      return {
        success: false,
        error: error.message,
        userMessage: "Sorry, we couldn't send the password reset email. Please try again or contact support.",
        troubleshooting: {
          commonIssues: [
            "Check if the email address is correct",
            "Ensure you have an internet connection",
            "Try again in a few moments",
            "Contact support if the problem persists"
          ]
        }
      };
    }
  }

  /**
   * Generate user-friendly message with spam instructions
   * @param {string} email - User's email address
   * @returns {string} - Formatted message for the user
   */
  generateUserFriendlyMessage(email) {
    return `
📧 Password reset email sent to: ${email}

📬 Email Tips and Support:
📞 Need help? Contact kleanlyspt@gmail.com
    `;
  }

  /**
   * Display instructions in the console/app
   * @param {Object} result - Result from sendEnhancedPasswordResetEmail
   */
  displayInstructions(result) {
    if (result.success) {
      console.log('📋 USER INSTRUCTIONS:');
      console.log('═'.repeat(50));
      console.log(result.userMessage);
      
      console.log('\n🔧 DETAILED TROUBLESHOOTING:');
      console.log('═'.repeat(35));
      result.deliveryInstructions.spamCheck.steps.forEach(step => {
        console.log(`   ${step}`);
      });
      
      console.log('\n💡 TIPS FOR BETTER DELIVERY:');
      console.log('   • Add noreply@kleanly-67b7b.firebaseapp.com to contacts');
      console.log('   • Always mark Kleanly emails as "Not Spam"');
      console.log('   • Check spam folder first if email is missing');
      console.log('   • Email filters may affect delivery');
      
    } else {
      console.log('❌ EMAIL FAILED:');
      console.log('═'.repeat(20));
      console.log(result.userMessage);
    }
  }
}

// Test the enhanced Firebase email service
async function testEnhancedFirebaseEmail() {
  const emailService = new EnhancedFirebaseEmailService();
  
  // Test with your email
  const testEmail = 'harrythukumaina@gmail.com';
  
  console.log('🧪 TESTING ENHANCED FIREBASE EMAIL SERVICE');
  console.log('═'.repeat(50));
  console.log(`📧 Sending test email to: ${testEmail}`);
  console.log('🎯 Focus: Clear spam folder instructions');
  console.log('');
  
  try {
    const result = await emailService.sendEnhancedPasswordResetEmail(testEmail);
    emailService.displayInstructions(result);
    
    if (result.success) {
      console.log('\n🎉 TEST SUCCESSFUL!');
      console.log('═'.repeat(25));
      console.log('✅ Email sent with enhanced instructions');
      console.log('✅ User will know to check spam folder');
      console.log('✅ Clear steps to mark as "Not Spam"');
      console.log('✅ This improves future email delivery');
      
      console.log('\n📱 NEXT STEPS:');
      console.log('1. Check your email (inbox first, then spam)');
      console.log('2. If in spam, mark as "Not Spam"');
      console.log('3. This helps train email providers');
      console.log('4. Future emails should reach inbox directly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in your app
module.exports = { EnhancedFirebaseEmailService };

// Run test if this file is executed directly
if (require.main === module) {
  testEnhancedFirebaseEmail();
}

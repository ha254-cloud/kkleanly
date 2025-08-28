import { createUserWithEmailAndPassword, Auth, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, getAuthInstance } from './firebase';
import { driverService } from './driverService';

export interface DriverAccountCreationResult {
  driverId: string;
  temporaryPassword: string;
  loginInstructions: string;
  success: boolean;
  error?: string;
}

/**
 * Enhanced driver creation service that creates both:
 * 1. Driver profile in Firestore
 * 2. Firebase Authentication account
 */
export class DriverAccountService {
  
  /**
   * Generate a temporary password for new drivers
   */
  private generateTemporaryPassword(): string {
    const adjectives = ['Fast', 'Quick', 'Swift', 'Rapid', 'Speed'];
    const nouns = ['Driver', 'Delivery', 'Route', 'Express', 'Move'];
    const numbers = Math.floor(Math.random() * 999) + 100;
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective}${noun}${numbers}`;
  }

  /**
   * Create a complete driver account with authentication
   * Falls back to profile-only creation if auth fails
   */
  async createDriverWithAccount(driverData: {
    name: string;
    email: string;
    phone: string;
    vehicleType: 'motorcycle' | 'car' | 'van';
    vehicleNumber: string;
  }): Promise<DriverAccountCreationResult> {
    
    const temporaryPassword = this.generateTemporaryPassword();
    
    try {
      // Step 1: Try to create driver profile first (this is more likely to succeed)
      console.log(`Creating driver profile for ${driverData.name}`);
      
      const driverId = await driverService.createDriver({
        name: driverData.name,
        phone: driverData.phone,
        email: driverData.email,
        vehicleType: driverData.vehicleType,
        vehicleNumber: driverData.vehicleNumber,
        status: 'offline', // Start as offline until first login
        rating: 5.0,
        totalDeliveries: 0,
        totalEarnings: 0,
        averageDeliveryTime: 0,
        completionRate: 100,
        customerRatings: [],
        isOnline: false,
        lastActiveAt: new Date().toISOString(),
        shift: {
          startTime: '',
          endTime: '',
          totalHours: 0,
          earnings: 0
        },
        performance: {
          todayDeliveries: 0,
          weeklyDeliveries: 0,
          monthlyDeliveries: 0,
          todayEarnings: 0,
          weeklyEarnings: 0,
          monthlyEarnings: 0
        },
        preferences: {
          maxRadius: 10, // 10km default radius
          preferredAreas: [],
          notifications: {
            orders: true,
            payments: true,
            promotions: false
          }
        }
      });
      
      console.log(`✅ Driver profile created successfully: ${driverId}`);
      
      // Step 2: Try to create Firebase Authentication account (optional)
      let authCreated = false;
      try {
        console.log(`Attempting to create Firebase auth account for ${driverData.email}`);
        
        const authInstance = getAuthInstance();
        const userCredential = await createUserWithEmailAndPassword(
          authInstance, 
          driverData.email, 
          temporaryPassword
        );
        
        console.log(`✅ Firebase auth account created: ${userCredential.user.uid}`);
        authCreated = true;
        
        // Sign out the new user immediately to restore admin session
        // Note: This is a workaround - in production use Firebase Admin SDK
        await authInstance.signOut();
        
      } catch (authError: any) {
        console.warn(`⚠️ Could not create Firebase auth account: ${authError.message}`);
        // Continue without auth account - driver profile still exists
        authCreated = false;
      }
      
      // Step 3: Generate appropriate instructions
      const loginInstructions = authCreated 
        ? this.generateLoginInstructions(driverData.name, driverData.email, temporaryPassword)
        : this.generateProfileOnlyInstructions(driverData.name, driverData.email);
      
      return {
        driverId,
        temporaryPassword: authCreated ? temporaryPassword : 'No auth account created',
        loginInstructions,
        success: true
      };
      
    } catch (error: any) {
      console.error('❌ Error creating driver:', error);
      
      let errorMessage = 'Failed to create driver';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'A user with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Insufficient permissions to create driver';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        driverId: '',
        temporaryPassword: '',
        loginInstructions: '',
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generate formatted login instructions for the driver
   */
  private generateLoginInstructions(name: string, email: string, password: string): string {
    return `
🚚 KLEANLY DRIVER ACCOUNT CREATED

Hello ${name}!

Your driver account has been created successfully.

📱 LOGIN DETAILS:
Email: ${email}
Temporary Password: ${password}

🔗 ACCESS YOUR DASHBOARD:
1. Open the Kleanly app
2. Tap "Login" 
3. Enter your email and temporary password
4. Navigate to the Driver Dashboard at /driver

⚡ FIRST STEPS:
1. Change your password after first login
2. Toggle your status to "Available" to receive orders
3. Keep your location services enabled for tracking

📞 SUPPORT:
If you need help, contact admin at kleanlyspt@gmail.com

Welcome to the Kleanly driver team! 🎉
`;
  }

  /**
   * Generate instructions for drivers without Firebase auth accounts
   */
  private generateProfileOnlyInstructions(name: string, email: string): string {
    return `
🚚 KLEANLY DRIVER PROFILE CREATED

Hello ${name}!

Your driver profile has been created successfully.

📧 PROFILE EMAIL: ${email}

⏳ ACCOUNT STATUS:
✅ Driver profile created
⏳ Login account setup pending

📱 NEXT STEPS:
You'll receive login credentials via email/SMS shortly.
A full authentication account will be set up for you.

📞 SUPPORT:
If you need immediate assistance, contact admin at kleanlyspt@gmail.com

Welcome to the Kleanly driver team! 🎉
`;
  }

  /**
   * Generate WhatsApp message for driver onboarding
   */
  generateWhatsAppMessage(name: string, email: string, password: string): string {
    return `🚚 *KLEANLY DRIVER ACCOUNT*

Hello ${name}!

Your driver account is ready:

📧 *Email:* ${email}
🔑 *Password:* ${password}

📱 *Get Started:*
1. Download the Kleanly app
2. Login with your credentials  
3. Go to Driver Dashboard (/driver)
4. Toggle to "Available" to receive orders

Change your password after first login.

Welcome to Kleanly! 🎉`;
  }

  /**
   * Generate SMS message for driver onboarding
   */
  generateSMSMessage(name: string, email: string, password: string): string {
    return `KLEANLY DRIVER ACCOUNT\n\nHi ${name}!\n\nLogin: ${email}\nPassword: ${password}\n\nDownload the app and go to /driver to start receiving orders.\n\nWelcome to Kleanly!`;
  }
}

export const driverAccountService = new DriverAccountService();

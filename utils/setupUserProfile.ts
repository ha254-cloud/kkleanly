import { auth, db } from '../services/firebase';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Sample data for Kleanly app
const sampleUserProfile = {
  firstName: 'John',
  lastName: 'Kamau',
  phone: '+254712345678',
  dateOfBirth: '1990-05-15',
  membershipLevel: 'Premium',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleAddresses = [
  {
    label: 'Home',
    address: 'Apartment 4B, Valley Arcade Apartments',
    city: 'Nairobi',
    postalCode: '00100',
    instructions: 'Gate code: 1234. Call when you arrive.',
    type: 'home',
    isDefault: true,
    createdAt: new Date(),
  },
  {
    label: 'Office',
    address: 'ABC Plaza, 8th Floor, Waiyaki Way',
    city: 'Nairobi',
    postalCode: '00200',
    instructions: 'Reception desk will collect. Ask for John from Marketing.',
    type: 'work',
    isDefault: false,
    createdAt: new Date(),
  },
  {
    label: 'Mom\'s House',
    address: 'House No. 15, Kileleshwa Gardens',
    city: 'Nairobi',
    postalCode: '00100',
    instructions: 'Green gate, ring bell twice',
    type: 'other',
    isDefault: false,
    createdAt: new Date(),
  },
];

const samplePaymentMethods = [
  {
    type: 'mpesa',
    label: 'M-Pesa Primary',
    details: '+254712345678',
    isDefault: true,
    createdAt: new Date(),
  },
  {
    type: 'card',
    label: 'Visa ending in 4532',
    details: '****4532',
    isDefault: false,
    createdAt: new Date(),
  },
  {
    type: 'cash',
    label: 'Cash on Delivery',
    details: 'Pay on delivery',
    isDefault: false,
    createdAt: new Date(),
  },
];

const samplePreferences = {
  notifications: {
    orderUpdates: true,
    promotions: true,
    newServices: false,
    reminder: true,
  },
  communication: {
    email: true,
    sms: true,
    push: true,
  },
  privacy: {
    shareData: false,
    analytics: true,
  },
  updatedAt: new Date(),
};

export const setupCompleteUserProfile = async () => {
  console.log('🔧 Setting up complete user profile...');
  
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('✅ User authenticated:', user.email);
        
        try {
          // 1. Create/Update User Profile
          console.log('📝 Creating user profile...');
          await setDoc(doc(db, 'userProfiles', user.uid), {
            ...sampleUserProfile,
            id: user.uid,
            email: user.email,
          });
          console.log('✅ User profile created');

          // 2. Add Saved Addresses
          console.log('🏠 Adding saved addresses...');
          for (const address of sampleAddresses) {
            await addDoc(collection(db, 'userAddresses'), {
              ...address,
              userId: user.uid,
            });
          }
          console.log('✅ Addresses added');

          // 3. Add Payment Methods
          console.log('💳 Adding payment methods...');
          for (const payment of samplePaymentMethods) {
            await addDoc(collection(db, 'userPaymentMethods'), {
              ...payment,
              userId: user.uid,
            });
          }
          console.log('✅ Payment methods added');

          // 4. Set User Preferences
          console.log('⚙️ Setting user preferences...');
          await setDoc(doc(db, 'userPreferences', user.uid), samplePreferences);
          console.log('✅ Preferences set');

          console.log('🎉 Complete user profile setup finished!');
          resolve(true);
        } catch (error) {
          console.error('❌ Error setting up profile:', error);
          resolve(false);
        }
      } else {
        console.log('❌ User not authenticated');
        resolve(false);
      }
    });
  });
};

// Premium membership benefits for Kleanly
export const membershipBenefits = {
  Basic: [
    'Standard pickup & delivery',
    'Basic wash & fold service',
    'Email notifications',
    '3-day delivery window',
  ],
  Premium: [
    'Priority pickup & delivery',
    'Premium care treatment',
    'Same-day service available',
    'SMS & email notifications',
    '10% discount on dry cleaning',
    'Free stain treatment',
    '24-hour delivery window',
  ],
  VIP: [
    'Express 2-hour pickup',
    'Luxury care treatment',
    'Guaranteed same-day delivery',
    'Personal laundry consultant',
    '20% discount on all services',
    'Free pickup & delivery',
    'Priority customer support',
    'Complimentary garment protection',
    'White glove service',
  ],
};

// Laundry care tips for Kenya
export const laundryTips = [
  {
    title: 'Kenyan Cotton Care',
    tip: 'Wash cotton clothes in cold water to prevent shrinking in Nairobi\'s climate.',
  },
  {
    title: 'Rainy Season Protection',
    tip: 'During rainy season, use our express indoor drying service to prevent mold.',
  },
  {
    title: 'Dust Protection',
    tip: 'In dusty areas like Kasarani, shake out clothes before washing for better results.',
  },
  {
    title: 'Kikoy & Leso Care',
    tip: 'Traditional fabrics need gentle care - our premium service handles them perfectly.',
  },
];

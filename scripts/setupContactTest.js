import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase.ts';

// Create a test customer profile
const testCustomer = {
  firstName: 'John',
  lastName: 'Doe', 
  email: 'john.doe@example.com',
  phone: '+254712345678',
  addresses: [{
    type: 'home',
    street: 'Kimathi Street',
    city: 'Nairobi',
    state: 'Nairobi',
    zipCode: '00100',
    country: 'Kenya'
  }],
  createdAt: new Date().toISOString(),
  preferences: {
    notifications: true,
    smsUpdates: true
  }
};

// Test driver ID (should be the current logged in driver)
const testDriverId = 'q3RaIcutqTWVbUKONmz8ZPYawVf1';

async function setupContactTest() {
  console.log('🧪 Setting up contact functionality test...');
  
  try {
    // 1. Create customer profile
    console.log('📱 Creating test customer profile...');
    const customerDocRef = doc(collection(db, 'userProfiles'));
    const customerId = customerDocRef.id;
    
    await setDoc(customerDocRef, {
      ...testCustomer,
      createdAt: serverTimestamp()
    });
    console.log(`✅ Customer profile created with ID: ${customerId}`);
    
    // 2. Create test order
    console.log('📦 Creating test order...');
    const orderDocRef = doc(collection(db, 'orders'));
    const orderId = orderDocRef.id;
    
    await setDoc(orderDocRef, {
      userID: customerId,
      category: 'wash-fold',
      items: ['shirts', 'pants'],
      status: 'confirmed',
      total: 1500,
      createdAt: serverTimestamp(),
      pickup: {
        address: 'Kimathi Street, CBD, Nairobi',
        phone: testCustomer.phone,
        notes: 'Near Hilton Hotel'
      },
      delivery: {
        address: 'Westlands Mall, Nairobi', 
        phone: testCustomer.phone,
        notes: 'Customer will be at main entrance'
      }
    });
    console.log(`✅ Order created with ID: ${orderId}`);
    
    // 3. Create delivery tracking assigned to driver
    console.log('🚚 Creating delivery tracking...');
    const trackingDocRef = doc(collection(db, 'deliveryTracking'));
    
    await setDoc(trackingDocRef, {
      orderId: orderId,
      driverId: testDriverId,
      status: 'assigned',
      pickupLocation: {
        address: 'Kimathi Street, CBD, Nairobi',
        latitude: -1.2841,
        longitude: 36.8155
      },
      deliveryLocation: {
        address: 'Westlands Mall, Nairobi',
        latitude: -1.2676,
        longitude: 36.8108
      },
      driverLocation: {
        latitude: -1.2921,
        longitude: 36.8219
      },
      estimatedArrival: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`✅ Delivery tracking created for order ${orderId}`);
    
    console.log('\n🎉 Test setup complete!');
    console.log(`📞 Customer: ${testCustomer.firstName} ${testCustomer.lastName}`);
    console.log(`📱 Phone: ${testCustomer.phone}`);
    console.log(`📦 Order ID: ${orderId}`);
    console.log(`🚚 Driver ID: ${testDriverId}`);
    console.log('\nYou can now test the contact functionality by:');
    console.log('1. Going to the driver dashboard');
    console.log('2. Clicking on the assigned order');
    console.log('3. Testing the contact button');
    
    return {
      customerId,
      orderId,
      customerPhone: testCustomer.phone
    };
    
  } catch (error) {
    console.error('❌ Failed to setup test:', error);
    return null;
  }
}

// Run the setup
setupContactTest();

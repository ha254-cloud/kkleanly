import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

// Sample test orders to populate the database
const testOrders = [
  {
    userID: 'MAakOISXk0T9D2b1Zlc0DWtXybs1', // Your user account ID
    category: 'wash-fold',
    items: ['shirts', 'pants', 'socks'],
    status: 'pending',
    createdAt: new Date().toISOString(),
    total: 1250,
    address: 'Westlands, Nairobi',
    phone: '+254714648622',
    pickup: {
      address: 'Westlands Shopping Mall, Nairobi',
      phone: '+254714648622',
      notes: 'Ground floor, near Nakumatt entrance'
    },
    delivery: {
      address: 'Westlands, Nairobi',
      phone: '+254714648622',
      notes: 'Same location as pickup'
    }
  },
  {
    userID: 'MAakOISXk0T9D2b1Zlc0DWtXybs1',
    category: 'dry-cleaning',
    items: ['suit', 'dress'],
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    total: 2500,
    address: 'Karen, Nairobi',
    phone: '+254714648622',
    pickup: {
      address: 'Karen Shopping Centre, Nairobi',
      phone: '+254714648622',
      notes: 'First floor, near Java House'
    },
    delivery: {
      address: 'Karen, Nairobi',
      phone: '+254714648622',
      notes: 'Residential area near the shopping center'
    }
  },
  {
    userID: 'MAakOISXk0T9D2b1Zlc0DWtXybs1',
    category: 'ironing',
    items: ['shirts', 'blouses'],
    status: 'pending',
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    total: 800,
    address: 'CBD, Nairobi',
    phone: '+254714648622',
    pickup: {
      address: 'City Market, Nairobi',
      phone: '+254714648622',
      notes: 'Main entrance'
    },
    delivery: {
      address: 'CBD Office Building, Nairobi',
      phone: '+254714648622',
      notes: 'Reception desk, 5th floor'
    }
  }
];

export async function createTestOrders() {
  console.log('Creating test orders...');
  
  try {
    const ordersCollection = collection(db, 'orders');
    
    for (let i = 0; i < testOrders.length; i++) {
      const order = testOrders[i];
      const docRef = await addDoc(ordersCollection, {
        ...order,
        createdAt: serverTimestamp(), // Use Firebase server timestamp
      });
      
      console.log(`✅ Test order ${i + 1} created with ID: ${docRef.id}`);
    }
    
    console.log(`🎉 Successfully created ${testOrders.length} test orders!`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create test orders:', error);
    return false;
  }
}

// Uncomment the line below and run this script to create test orders
createTestOrders();

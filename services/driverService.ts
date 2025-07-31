import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

export interface Driver {
  id?: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: 'motorcycle' | 'car' | 'van';
  vehicleNumber: string;
  status: 'available' | 'busy' | 'offline';
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  rating: number;
  totalDeliveries: number;
  createdAt: string;
}

export interface DeliveryTracking {
  id?: string;
  orderId: string;
  driverId: string;
  status: 'assigned' | 'pickup_started' | 'picked_up' | 'delivery_started' | 'delivered';
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  deliveryLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  estimatedPickupTime?: string;
  estimatedDeliveryTime?: string;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  route?: any; // Google Maps route data
  createdAt: string;
  updatedAt: string;
}

export const driverService = {
  async createDriver(driverData: Omit<Driver, 'id' | 'createdAt'>): Promise<string> {
    try {
      const driver = {
        ...driverData,
        createdAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'drivers'), driver);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  async getAllDrivers(): Promise<Driver[]> {
    try {
      const q = query(
        collection(db, 'drivers'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Driver));
    } catch (error) {
      throw error;
    }
  },

  async getAvailableDrivers(): Promise<Driver[]> {
    try {
      const q = query(
        collection(db, 'drivers'),
        where('status', '==', 'available')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Driver));
    } catch (error) {
      throw error;
    }
  },

  async updateDriverStatus(driverId: string, status: Driver['status']): Promise<void> {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, { 
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  },

  async updateDriverLocation(driverId: string, location: { latitude: number; longitude: number }): Promise<void> {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, { 
        currentLocation: {
          ...location,
          timestamp: new Date().toISOString()
        },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  },

  async assignDriverToOrder(orderId: string, driverId: string, pickupLocation: any, deliveryLocation: any): Promise<string> {
    try {
      const tracking: Omit<DeliveryTracking, 'id'> = {
        orderId,
        driverId,
        status: 'assigned',
        pickupLocation,
        deliveryLocation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'delivery_tracking'), tracking);
      
      // Update driver status to busy
      await this.updateDriverStatus(driverId, 'busy');
      
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  async updateDeliveryStatus(trackingId: string, status: DeliveryTracking['status'], location?: { latitude: number; longitude: number }): Promise<void> {
    try {
      const trackingRef = doc(db, 'delivery_tracking', trackingId);
      const updateData: any = { 
        status,
        updatedAt: serverTimestamp()
      };

      if (location) {
        updateData.currentLocation = {
          ...location,
          timestamp: new Date().toISOString()
        };
      }

      // Add timestamps for specific statuses
      if (status === 'picked_up') {
        updateData.actualPickupTime = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.actualDeliveryTime = new Date().toISOString();
      }

      await updateDoc(trackingRef, updateData);
    } catch (error) {
      throw error;
    }
  },

  async getDeliveryTracking(orderId: string): Promise<DeliveryTracking | null> {
    try {
      const q = query(
        collection(db, 'delivery_tracking'),
        where('orderId', '==', orderId)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as DeliveryTracking;
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  subscribeToDeliveryTracking(orderId: string, callback: (tracking: DeliveryTracking | null) => void) {
    const q = query(
      collection(db, 'delivery_tracking'),
      where('orderId', '==', orderId)
    );
    
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        callback({
          id: doc.id,
          ...doc.data()
        } as DeliveryTracking);
      } else {
        callback(null);
      }
    });
  },

  async getDriverById(driverId: string): Promise<Driver | null> {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      const docSnap = await getDoc(driverRef);
      
      if (docSnap.exists()) {
        return { 
          id: docSnap.id, 
          ...docSnap.data() 
        } as Driver;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }
};
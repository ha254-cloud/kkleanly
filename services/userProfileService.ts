import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Type definitions
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  membershipLevel: 'Basic' | 'Premium' | 'VIP';
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  postalCode: string;
  instructions?: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
  createdAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'mpesa' | 'cash';
  label: string;
  details: string; // Last 4 digits for card, phone number for M-Pesa
  isDefault: boolean;
  createdAt: Date;
}

export interface UserPreferences {
  notifications: {
    orderUpdates: boolean;
    promotions: boolean;
    newServices: boolean;
    reminder: boolean;
  };
  communication: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
}

export interface UserStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date | null;
  favoriteServices: string[];
  completedOrders: number;
  cancelledOrders: number;
}

// Add Order and OrderItem types
interface OrderItem {
  type: string;
  [key: string]: any;
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: { toDate: () => Date };
  items: OrderItem[];
  [key: string]: any;
}

class UserProfileService {
  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'userProfiles', userId));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: userDoc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          dateOfBirth: data.dateOfBirth || '',
          membershipLevel: data.membershipLevel || 'Basic',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    try {
      const userDocRef = doc(db, 'userProfiles', userId);
      const updateData = {
        ...profileData,
        updatedAt: serverTimestamp(),
      };
      
      // Check if document exists
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        await updateDoc(userDocRef, updateData);
      } else {
        // Create new profile if it doesn't exist
        await setDoc(userDocRef, {
          ...updateData,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Define ordersQuery to fetch user's orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userID', '==', userId) // Changed from 'userId' to 'userID' to match Firestore rules
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          status: data.status,
          total: data.total,
          createdAt: data.createdAt,
          items: Array.isArray(data.items) ? data.items.map((item: any) => ({ type: item.type })) : [],
          ...data
        } as Order;
      });

      // Calculate statistics
      const totalOrders = orders.length;
      const completedOrders = orders.filter(order => order.status === 'delivered').length;
      const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
      const totalSpent = orders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + (order.total || 0), 0);
      
      const averageOrderValue = completedOrders > 0 ? totalSpent / completedOrders : 0;
      
      // Get last order date
      const lastOrder = orders
        .filter(order => order.createdAt)
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
          return dateB.getTime() - dateA.getTime();
        })[0];
      
      const lastOrderDate = lastOrder && lastOrder.createdAt?.toDate ? lastOrder.createdAt.toDate() : null;
      
      // Get favorite services (most common service types)
      const serviceTypes = orders
        .filter(order => Array.isArray(order.items) && order.items.length > 0)
        .flatMap(order => order.items.map((item: OrderItem) => item.type || 'Unknown'));
      
      const serviceCount = serviceTypes.reduce((acc: Record<string, number>, service: string) => {
        acc[service] = (acc[service] || 0) + 1;
        return acc;
      }, {});
      
      const favoriteServices = Object.entries(serviceCount)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([service]) => service);

      return {
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate,
        favoriteServices,
        completedOrders,
        cancelledOrders,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      // Return default stats if error
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastOrderDate: null,
        favoriteServices: [],
        completedOrders: 0,
        cancelledOrders: 0,
      };
    }
  }

  // Get saved addresses
  async getSavedAddresses(userId: string): Promise<SavedAddress[]> {
    try {
      const addressesQuery = query(
        collection(db, 'userAddresses'),
        where('userId', '==', userId)
      );
      
      const addressesSnapshot = await getDocs(addressesQuery);
      return addressesSnapshot.docs.map(doc => ({
        id: doc.id,
        label: doc.data().label,
        address: doc.data().address,
        city: doc.data().city,
        postalCode: doc.data().postalCode,
        instructions: doc.data().instructions,
        type: doc.data().type,
        isDefault: doc.data().isDefault || false,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
    } catch (error) {
      console.error('Error getting saved addresses:', error);
      throw error;
    }
  }

  // Add saved address
  async addSavedAddress(userId: string, addressData: Omit<SavedAddress, 'id' | 'createdAt'>): Promise<void> {
    try {
      await addDoc(collection(db, 'userAddresses'), {
        ...addressData,
        userId,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding saved address:', error);
      throw error;
    }
  }

  // Update saved address
  async updateSavedAddress(userId: string, addressId: string, addressData: Partial<SavedAddress>): Promise<void> {
    try {
      const addressDocRef = doc(db, 'userAddresses', addressId);
      await updateDoc(addressDocRef, {
        ...addressData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating saved address:', error);
      throw error;
    }
  }

  // Delete saved address
  async deleteSavedAddress(userId: string, addressId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'userAddresses', addressId));
    } catch (error) {
      console.error('Error deleting saved address:', error);
      throw error;
    }
  }

  // Get payment methods
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const paymentMethodsQuery = query(
        collection(db, 'userPaymentMethods'),
        where('userId', '==', userId)
      );
      
      const paymentMethodsSnapshot = await getDocs(paymentMethodsQuery);
      return paymentMethodsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: doc.data().type,
        label: doc.data().label,
        details: doc.data().details,
        isDefault: doc.data().isDefault || false,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }

  // Add payment method
  async addPaymentMethod(userId: string, paymentData: Omit<PaymentMethod, 'id' | 'createdAt'>): Promise<void> {
    try {
      console.log('Adding payment method for user:', userId);
      const docData = {
        ...paymentData,
        userId, // Ensure this matches the Firestore rule
        createdAt: serverTimestamp(),
      };
      console.log('Payment method data:', docData);
      
      await addDoc(collection(db, 'userPaymentMethods'), docData);
      console.log('Payment method added successfully');
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  // Update payment method
  async updatePaymentMethod(userId: string, paymentId: string, paymentData: Partial<PaymentMethod>): Promise<void> {
    try {
      const paymentDocRef = doc(db, 'userPaymentMethods', paymentId);
      await updateDoc(paymentDocRef, {
        ...paymentData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  }

  // Delete payment method
  async deletePaymentMethod(userId: string, paymentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'userPaymentMethods', paymentId));
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const preferencesDoc = await getDoc(doc(db, 'userPreferences', userId));
      
      if (preferencesDoc.exists()) {
        return preferencesDoc.data() as UserPreferences;
      }
      
      // Return default preferences if none exist
      const defaultPreferences: UserPreferences = {
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
          analytics: false,
        },
      };
      
      return defaultPreferences;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    try {
      await setDoc(doc(db, 'userPreferences', userId), {
        ...preferences,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
}

// Export a single instance
const userProfileService = new UserProfileService();
export default userProfileService;

// Named exports for easier access
export const getUserProfile = (userId: string) => userProfileService.getUserProfile(userId);
export const updateUserProfile = (userId: string, profileData: Partial<UserProfile>) => userProfileService.updateUserProfile(userId, profileData);
export const getUserStats = (userId: string) => userProfileService.getUserStats(userId);
export const getSavedAddresses = (userId: string) => userProfileService.getSavedAddresses(userId);
export const addSavedAddress = (userId: string, addressData: Omit<SavedAddress, 'id' | 'createdAt'>) => userProfileService.addSavedAddress(userId, addressData);
export const updateSavedAddress = (userId: string, addressId: string, addressData: Partial<SavedAddress>) => userProfileService.updateSavedAddress(userId, addressId, addressData);
export const deleteSavedAddress = (userId: string, addressId: string) => userProfileService.deleteSavedAddress(userId, addressId);
export const getPaymentMethods = (userId: string) => userProfileService.getPaymentMethods(userId);
export const getUserPaymentMethods = (userId: string) => userProfileService.getPaymentMethods(userId); // Alias for compatibility
export const addPaymentMethod = (userId: string, paymentData: Omit<PaymentMethod, 'id' | 'createdAt'>) => userProfileService.addPaymentMethod(userId, paymentData);
export const addUserPaymentMethod = (userId: string, paymentData: Omit<PaymentMethod, 'id' | 'createdAt'>) => userProfileService.addPaymentMethod(userId, paymentData); // Alias for compatibility
export const updatePaymentMethod = (userId: string, paymentId: string, paymentData: Partial<PaymentMethod>) => userProfileService.updatePaymentMethod(userId, paymentId, paymentData);
export const deletePaymentMethod = (userId: string, paymentId: string) => userProfileService.deletePaymentMethod(userId, paymentId);
export const getUserPreferences = (userId: string) => userProfileService.getUserPreferences(userId);
export const updateUserPreferences = (userId: string, preferences: UserPreferences) => userProfileService.updateUserPreferences(userId, preferences);
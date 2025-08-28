import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
  sendEmailVerification,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { getAuthInstance, db } from './firebase';

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'driver' | 'admin';
  addresses: Address[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isEmailVerified: boolean;
  profilePicture?: string;
}

export interface Address {
  id: string;
  label: string; // e.g., "Home", "Office"
  street: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
}

export interface Order {
  id?: string;
  userId: string;
  serviceType: string;
  pickupAddress: Address;
  deliveryAddress?: Address;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'picked_up' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'mpesa' | 'cash' | 'card';
  pickupDate: Timestamp;
  deliveryDate?: Timestamp;
  driverId?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
}

class AuthService {
  // Register new user
  async registerUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string
  ): Promise<{ user: User; profile: UserProfile }> {
    try {
      const auth = getAuthInstance();
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      // Send email verification
      await sendEmailVerification(user);

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        firstName,
        lastName,
        phone,
        role: 'customer',
        addresses: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isEmailVerified: false,
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      return { user, profile: userProfile };
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Sign in user
  async signInUser(email: string, password: string): Promise<{ user: User; profile: UserProfile }> {
    try {
      const auth = getAuthInstance();
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user profile
      const profile = await this.getUserProfile(user.uid);
      if (!profile) {
        throw new Error('User profile not found');
      }

      return { user, profile };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Sign out user
  async signOutUser(): Promise<void> {
    try {
      const auth = getAuthInstance();
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  // Send password reset email
  async resetPassword(email: string): Promise<void> {
    try {
      const auth = getAuthInstance();
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Get user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw new Error('Failed to get user profile');
    }
  }

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Update user profile error:', error);
      throw new Error('Failed to update user profile');
    }
  }

  // Error message helper
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      default:
        return 'An error occurred. Please try again';
    }
  }
}

class OrderService {
  // Create new order
  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const orderData: Omit<Order, 'id'> = {
        ...order,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      return docRef.id;
    } catch (error) {
      console.error('Create order error:', error);
      throw new Error('Failed to create order');
    }
  }

  // Get user orders
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
      });
      
      return orders;
    } catch (error) {
      console.error('Get user orders error:', error);
      throw new Error('Failed to get orders');
    }
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Update order status error:', error);
      throw new Error('Failed to update order status');
    }
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
      }
      return null;
    } catch (error) {
      console.error('Get order error:', error);
      throw new Error('Failed to get order');
    }
  }
}

class AddressService {
  // Add address to user profile
  async addAddress(userId: string, address: Omit<Address, 'id'>): Promise<string> {
    try {
      const userProfile = await authService.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const newAddress: Address = {
        ...address,
        id: Date.now().toString(), // Simple ID generation
      };

      const updatedAddresses = [...userProfile.addresses, newAddress];
      
      await authService.updateUserProfile(userId, { addresses: updatedAddresses });
      
      return newAddress.id;
    } catch (error) {
      console.error('Add address error:', error);
      throw new Error('Failed to add address');
    }
  }

  // Update address
  async updateAddress(userId: string, addressId: string, updates: Partial<Address>): Promise<void> {
    try {
      const userProfile = await authService.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const updatedAddresses = userProfile.addresses.map(addr =>
        addr.id === addressId ? { ...addr, ...updates } : addr
      );
      
      await authService.updateUserProfile(userId, { addresses: updatedAddresses });
    } catch (error) {
      console.error('Update address error:', error);
      throw new Error('Failed to update address');
    }
  }

  // Delete address
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    try {
      const userProfile = await authService.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const updatedAddresses = userProfile.addresses.filter(addr => addr.id !== addressId);
      
      await authService.updateUserProfile(userId, { addresses: updatedAddresses });
    } catch (error) {
      console.error('Delete address error:', error);
      throw new Error('Failed to delete address');
    }
  }
}

// Export service instances
export const authService = new AuthService();
export const orderService = new OrderService();
export const addressService = new AddressService();

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

export const createAdminAccount = async () => {
  try {
    const adminEmail = 'admin@kleanly.co.ke';
    const adminPassword = 'admin123';
    
    console.log('Creating admin account...');
    const result = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('Admin account created successfully:', result.user.email);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin account already exists');
      return null;
    }
    console.error('Error creating admin account:', error);
    throw error;
  }
};

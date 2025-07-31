    import { CreditCard, MapPin, Package } from 'lucide-react-native';
import { useRouter } from 'next/navigation';
import React from 'react';
    
const router = useRouter();

// TODO: Replace this with your actual logic to determine if the user is an admin
const isAdmin = false;

const menuItems = [
  {
    icon: <MapPin size={20} color="#3B82F6" />,
    title: 'Delivery Addresses',
    subtitle: 'Manage your saved addresses',
    color: '#3B82F6',
    onPress: () => router.push('/profile/addresses'),
  },
  ...(isAdmin ? [{
    icon: <Package size={20} color="#8B5CF6" />,
    title: 'Drivers Management',
    subtitle: 'Manage delivery drivers',
    color: '#8B5CF6',
    onPress: () => router.push('/admin/drivers'),
    badge: 'Admin',
  }, {
    icon: <Package size={20} color="#FF6B6B" />,
    title: 'Dispatch Center',
    subtitle: 'Assign drivers to orders',
    color: '#FF6B6B',
    onPress: () => router.push('/admin/dispatch'),
    badge: 'Admin',
  }] : []),
  {
    icon: <CreditCard size={20} color="#8B5CF6" />,
    title: 'Payment Methods',
    subtitle: 'Manage cards and M-Pesa',
    color: '#8B5CF6',
    onPress: () => router.push('/profile/payment-methods'),
  },
];
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { driverService, Driver, DeliveryTracking } from '../../services/driverService';
import { orderService } from '../../services/orderService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface AssignedOrder {
  id: string;
  customerName: string;
  pickupAddress: string;
  serviceType: string;
  status: 'assigned' | 'pickup_started' | 'picked_up' | 'delivery_started' | 'delivered';
  deliveryTracking: DeliveryTracking;
  orderDetails: any;
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<AssignedOrder[]>([]);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    if (!user?.email) {
      Alert.alert('Authentication Required', 'Please log in to access the driver dashboard.', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
      return;
    }

    loadDriverData();
  }, [user]);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      
      // Find driver by email
      const drivers = await driverService.getAllDrivers();
      const currentDriver = drivers.find(d => d.email === user?.email);
      
      if (!currentDriver) {
        Alert.alert(
          'Driver Not Found', 
          'You are not registered as a driver. Please contact administration.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
      
      setDriver(currentDriver);
      setIsOnline(currentDriver.status === 'available');
      
      // Subscribe to assigned orders
      const unsubscribe = onSnapshot(
        query(
          collection(db, 'deliveryTracking'),
          where('driverId', '==', currentDriver.id)
        ),
        async (snapshot) => {
          const trackingDocs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as DeliveryTracking));
          
          // Get order details for each tracking
          const assignedOrders: AssignedOrder[] = [];
          let todayCompleted = 0;
          const today = new Date().toDateString();
          
          for (const tracking of trackingDocs) {
            try {
              const orderDetails = await orderService.getOrderById(tracking.orderId);
              if (orderDetails) {
                assignedOrders.push({
                  id: tracking.orderId,
                  customerName: orderDetails.userID, // We'll need to fetch user details separately
                  pickupAddress: tracking.pickupLocation.address,
                  serviceType: orderDetails.category.replace('-', ' '),
                  status: tracking.status,
                  deliveryTracking: tracking,
                  orderDetails
                });
                
                // Count completed orders today
                if (tracking.status === 'delivered' && 
                    tracking.actualDeliveryTime && 
                    new Date(tracking.actualDeliveryTime).toDateString() === today) {
                  todayCompleted++;
                }
              }
            } catch (error) {
              console.error('Error loading order details:', error);
            }
          }
          
          setOrders(assignedOrders);
          setCompletedToday(todayCompleted);
        },
        (error) => {
          console.error('Error in driver delivery tracking subscription:', error);
          if (error.code === 'permission-denied') {
            Alert.alert('Access Denied', 'You do not have permission to access driver data.');
          }
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error('Error loading driver data:', error);
      Alert.alert('Error', 'Failed to load driver data');
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!driver) return;
    
    try {
      const newStatus = isOnline ? 'offline' : 'available';
      await driverService.updateDriverStatus(driver.id!, newStatus);
      setIsOnline(!isOnline);
      
      // Update local driver object
      setDriver({ ...driver, status: newStatus });
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const navigateToOrder = (orderId: string) => {
    router.push(`/navigate/${orderId}` as any);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Dashboard</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isOnline ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.length}</Text>
          <Text style={styles.statLabel}>Assigned Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedToday}</Text>
          <Text style={styles.statLabel}>Completed Today</Text>
        </View>
      </View>

      <View style={styles.ordersSection}>
        <Text style={styles.sectionTitle}>Assigned Orders</Text>
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No orders assigned</Text>
            <Text style={styles.emptySubtext}>
              You'll receive notifications when new orders are assigned
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => navigateToOrder(item.id)}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>Order #{item.id.slice(-6).toUpperCase()}</Text>
                  <Text style={[styles.orderStatus, { color: getStatusColor(item.status) }]}>
                    {getStatusText(item.status)}
                  </Text>
                </View>
                <Text style={styles.customerName}>{item.customerName}</Text>
                <Text style={styles.address}>{item.pickupAddress}</Text>
                <View style={styles.orderFooter}>
                  <Text style={styles.service}>{item.serviceType}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'assigned': return '#FF9500';
    case 'pickup_started': return '#007AFF';
    case 'picked_up': return '#34C759';
    case 'delivery_started': return '#5856D6';
    case 'delivered': return '#34C759';
    default: return '#666';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'assigned': return 'Assigned';
    case 'pickup_started': return 'Going to Pickup';
    case 'picked_up': return 'Picked Up';
    case 'delivery_started': return 'Delivering';
    case 'delivered': return 'Delivered';
    default: return status;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  ordersSection: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  orderCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  customerName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  service: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

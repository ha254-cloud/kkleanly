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
import { driverService, Driver, Order } from '../../../services/driverService';
import { locationService, LocationUpdate } from '../../../services/locationService';
import { notificationService } from '../../../services/notificationService';

export default function DriverDashboard() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationTracking, setLocationTracking] = useState(false);

  // Mock driver ID - in real app, this would come from authentication
  const driverId = 'driver-1';

  useEffect(() => {
    initializeDriver();
    loadAssignedOrders();
    
    // Initialize notifications
    notificationService.initialize();
    
    return () => {
      if (locationTracking) {
        locationService.stopBackgroundLocationTracking();
      }
    };
  }, []);

  const initializeDriver = async () => {
    try {
      const driverData = await driverService.getDriver(driverId);
      if (driverData) {
        setDriver(driverData);
        setIsOnline(driverData.status === 'available');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading driver:', error);
      setLoading(false);
    }
  };

  const loadAssignedOrders = async () => {
    try {
      const assignedOrders = await driverService.getDriverOrders(driverId);
      setOrders(assignedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!driver) return;

    try {
      const newStatus = isOnline ? 'offline' : 'available';
      await driverService.updateDriverStatus(driverId, newStatus);
      
      setIsOnline(!isOnline);
      setDriver({ ...driver, status: newStatus });

      if (!isOnline) {
        // Going online - start location tracking
        startLocationTracking();
      } else {
        // Going offline - stop location tracking
        stopLocationTracking();
      }

      Alert.alert(
        'Status Updated',
        `You are now ${newStatus === 'available' ? 'online and available' : 'offline'}`
      );
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const startLocationTracking = async () => {
    const success = await locationService.startBackgroundLocationTracking(
      driverId,
      handleLocationUpdate
    );
    
    if (success) {
      setLocationTracking(true);
      console.log('Location tracking started');
    } else {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permissions to receive delivery assignments'
      );
    }
  };

  const stopLocationTracking = async () => {
    await locationService.stopBackgroundLocationTracking();
    setLocationTracking(false);
    console.log('Location tracking stopped');
  };

  const handleLocationUpdate = async (location: LocationUpdate) => {
    try {
      // Update driver location in database
      await driverService.updateDriverLocation(driverId, location.coords);
      
      // Update any active orders with new location
      const activeOrders = orders.filter(order => 
        order.status === 'assigned' || order.status === 'picked_up'
      );
      
      for (const order of activeOrders) {
        await driverService.updateOrderDriverLocation(order.id, location.coords);
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      await driverService.updateOrderStatus(orderId, 'assigned');
      await loadAssignedOrders();
      
      Alert.alert('Order Accepted', 'You have accepted this delivery');
      
      // Send notification to customer
      const order = orders.find(o => o.id === orderId);
      if (order && driver) {
        await notificationService.sendOrderAssignedNotification(orderId, driver.name);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', 'Failed to accept order');
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await driverService.updateOrderStatus(orderId, status);
      await loadAssignedOrders();
      
      const statusMessages = {
        picked_up: 'Pickup completed',
        delivered: 'Delivery completed',
        assigned: 'Order assigned',
        pending: 'Order pending',
      };
      
      Alert.alert('Status Updated', statusMessages[status]);
      
      // Send appropriate notification
      if (status === 'picked_up') {
        await notificationService.sendPickupCompletedNotification(orderId);
      } else if (status === 'delivered') {
        await notificationService.sendDeliveryCompletedNotification(orderId);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.customerName}>{item.customerName}</Text>
      <Text style={styles.address}>{item.address}</Text>
      <Text style={styles.items}>{item.items.join(', ')}</Text>
      
      <View style={styles.orderActions}>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => acceptOrder(item.id)}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'assigned' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.pickupButton]}
            onPress={() => updateOrderStatus(item.id, 'picked_up')}
          >
            <Text style={styles.buttonText}>Mark Picked Up</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'picked_up' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deliverButton]}
            onPress={() => updateOrderStatus(item.id, 'delivered')}
          >
            <Text style={styles.buttonText}>Mark Delivered</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.navigateButton]}
          onPress={() => router.push(`/driver/navigate/${item.id}`)}
        >
          <Ionicons name="navigate" size={16} color="white" />
          <Text style={styles.buttonText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'assigned': return '#3B82F6';
      case 'picked_up': return '#8B5CF6';
      case 'delivered': return '#10B981';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.driverName}>{driver?.name}</Text>
        </View>
        
        <View style={styles.statusToggle}>
          <Text style={styles.statusLabel}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor={isOnline ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.length}</Text>
          <Text style={styles.statLabel}>Active Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{driver?.rating || '5.0'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{driver?.completedDeliveries || 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Orders List */}
      <View style={styles.ordersSection}>
        <Text style={styles.sectionTitle}>Your Orders</Text>
        
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {isOnline ? 'No orders assigned yet' : 'Go online to receive orders'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ordersList}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusToggle: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  ordersSection: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  items: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  pickupButton: {
    backgroundColor: '#3B82F6',
  },
  deliverButton: {
    backgroundColor: '#8B5CF6',
  },
  navigateButton: {
    backgroundColor: '#6B7280',
    flex: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
});
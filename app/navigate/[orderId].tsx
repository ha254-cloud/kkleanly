import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LiveTrackingMap } from '../../components/LiveTrackingMap';
import { driverService, DeliveryTracking } from '../../services/driverService';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';

export default function OrderNavigation() {
  const { orderId } = useLocalSearchParams();
  const { user } = useAuth();
  const [orderData, setOrderData] = useState<any>(null);
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
      
      // Subscribe to tracking updates
      const unsubscribe = driverService.subscribeToDeliveryTracking(
        orderId as string, 
        (trackingData) => {
          setTracking(trackingData);
        }
      );
      
      return unsubscribe;
    }
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      const order = await orderService.getOrderById(orderId as string);
      setOrderData(order);
      
      const trackingData = await driverService.getDeliveryTracking(orderId as string);
      setTracking(trackingData);
    } catch (error) {
      console.error('Error loading order data:', error);
      Alert.alert('Error', 'Failed to load order data');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (newStatus: DeliveryTracking['status']) => {
    if (!tracking) return;
    
    try {
      await driverService.updateDeliveryStatus(tracking.id!, newStatus);
      Alert.alert('Status Updated', `Order status updated to: ${getStatusText(newStatus)}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
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

  const makePhoneCall = (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'assigned': return 'pickup_started';
      case 'pickup_started': return 'picked_up';
      case 'picked_up': return 'delivery_started';
      case 'delivery_started': return 'delivered';
      default: return null;
    }
  };

  const getStatusButtonText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'assigned': return 'Start Pickup';
      case 'pickup_started': return 'Confirm Pickup';
      case 'picked_up': return 'Start Delivery';
      case 'delivery_started': return 'Complete Delivery';
      default: return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!orderData || !tracking) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Navigation</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Order Info */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderId}>Order #{typeof orderId === 'string' ? orderId.slice(-6).toUpperCase() : 'N/A'}</Text>
        <Text style={styles.customerName}>User: {orderData.userID}</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status: </Text>
          <Text style={[styles.status, { color: getStatusColor(tracking.status) }]}>
            {getStatusText(tracking.status)}
          </Text>
        </View>
      </View>

      {/* Customer Contact */}
      <View style={styles.contactCard}>
        <Text style={styles.cardTitle}>Customer Contact</Text>
        <View style={styles.contactRow}>
          <Text style={styles.contactInfo}>Contact via order system</Text>
          <TouchableOpacity 
            style={[styles.callButton, { backgroundColor: '#666' }]}
            disabled
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.callButtonText}>N/A</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Addresses */}
      <View style={styles.addressCard}>
        <Text style={styles.cardTitle}>Delivery Information</Text>
        
        <View style={styles.addressSection}>
          <View style={styles.addressHeader}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.addressLabel}>Pickup Location</Text>
          </View>
          <Text style={styles.addressText}>{tracking.pickupLocation.address}</Text>
        </View>

        <View style={styles.addressSection}>
          <View style={styles.addressHeader}>
            <Ionicons name="home" size={20} color="#34C759" />
            <Text style={styles.addressLabel}>Delivery Address</Text>
          </View>
          <Text style={styles.addressText}>{tracking.deliveryLocation.address}</Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <Text style={styles.cardTitle}>Live Tracking</Text>
        <LiveTrackingMap orderId={orderId as string} />
      </View>

      {/* Action Button */}
      {tracking.status !== 'delivered' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              const nextStatus = getNextStatus(tracking.status);
              if (nextStatus) {
                Alert.alert(
                  'Update Status',
                  `Update order status to: ${getStatusText(nextStatus)}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm', onPress: () => updateDeliveryStatus(nextStatus) }
                  ]
                );
              }
            }}
          >
            <Text style={styles.actionButtonText}>
              {getStatusButtonText(tracking.status)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'assigned': return '#FF9500';
      case 'pickup_started': return '#007AFF';
      case 'picked_up': return '#34C759';
      case 'delivery_started': return '#5856D6';
      case 'delivered': return '#34C759';
      default: return '#666';
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginTop: 15,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  orderInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactCard: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressCard: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '600',
  },
  addressSection: {
    marginBottom: 15,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    paddingLeft: 28,
  },
  mapContainer: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    height: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionContainer: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

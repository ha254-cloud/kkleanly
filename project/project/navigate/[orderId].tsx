import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GoogleMapComponent from '../../../components/GoogleMapComponent';
import { driverService, Order } from '../../../services/driverService';
import { locationService } from '../../../services/locationService';
import { mapsService, LocationCoords } from '../../../services/mapsService';
import { notificationService } from '../../../services/notificationService';

export default function NavigateScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [driverLocation, setDriverLocation] = useState<LocationCoords | null>(null);
  const [customerLocation, setCustomerLocation] = useState<LocationCoords | null>(null);
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [trackingLocation, setTrackingLocation] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder();
      startLocationTracking();
    }

    return () => {
      locationService.stopLocationTracking();
    };
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const orderData = await driverService.getOrder(orderId);
      if (orderData) {
        setOrder(orderData);
        
        // Geocode customer address
        const coords = await mapsService.geocodeAddress(orderData.address);
        if (coords) {
          setCustomerLocation(coords);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading order:', error);
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    const success = await locationService.startLocationTracking(
      (location) => {
        setDriverLocation(location.coords);
        updateETA(location.coords);
      },
      {
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Update every 10 meters
      }
    );

    if (success) {
      setTrackingLocation(true);
    } else {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permissions for navigation'
      );
    }
  };

  const updateETA = async (currentLocation: LocationCoords) => {
    if (!customerLocation) return;

    try {
      const etaInfo = await mapsService.calculateETA(currentLocation, customerLocation);
      if (etaInfo) {
        setEta(etaInfo.duration);
        setDistance(etaInfo.distance);
      }
    } catch (error) {
      console.error('Error calculating ETA:', error);
    }
  };

  const openInGoogleMaps = () => {
    if (!customerLocation || !order) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${customerLocation.latitude},${customerLocation.longitude}&travelmode=driving`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open Google Maps');
    });
  };

  const openInAppleMaps = () => {
    if (!customerLocation || !order) return;

    const url = `http://maps.apple.com/?daddr=${customerLocation.latitude},${customerLocation.longitude}&dirflg=d`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open Apple Maps');
    });
  };

  const callCustomer = () => {
    if (!order?.phone) return;
    
    Linking.openURL(`tel:${order.phone}`).catch(() => {
      Alert.alert('Error', 'Could not make phone call');
    });
  };

  const markArrived = async () => {
    if (!order) return;

    Alert.alert(
      'Mark as Arrived',
      'Have you arrived at the customer location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I\'ve Arrived',
          onPress: async () => {
            try {
              await driverService.updateOrderStatus(order.id, 'assigned');
              await notificationService.sendDriverArrivedNotification(order.id, order.address);
              Alert.alert('Success', 'Customer has been notified of your arrival');
            } catch (error) {
              console.error('Error marking arrived:', error);
              Alert.alert('Error', 'Failed to update status');
            }
          }
        }
      ]
    );
  };

  const completePickup = async () => {
    if (!order) return;

    Alert.alert(
      'Complete Pickup',
      'Have you picked up the laundry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Picked Up',
          onPress: async () => {
            try {
              await driverService.updateOrderStatus(order.id, 'picked_up');
              await notificationService.sendPickupCompletedNotification(order.id);
              Alert.alert('Success', 'Pickup completed! Customer has been notified');
              router.back();
            } catch (error) {
              console.error('Error completing pickup:', error);
              Alert.alert('Error', 'Failed to update status');
            }
          }
        }
      ]
    );
  };

  const completeDelivery = async () => {
    if (!order) return;

    Alert.alert(
      'Complete Delivery',
      'Have you delivered the laundry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delivered',
          onPress: async () => {
            try {
              await driverService.updateOrderStatus(order.id, 'delivered');
              await notificationService.sendDeliveryCompletedNotification(order.id);
              Alert.alert('Success', 'Delivery completed! Customer has been notified');
              router.back();
            } catch (error) {
              console.error('Error completing delivery:', error);
              Alert.alert('Error', 'Failed to update status');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading navigation...</Text>
      </View>
    );
  }

  if (!order || !customerLocation) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navigate to Customer</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <GoogleMapComponent
          driverLocation={driverLocation || undefined}
          customerLocation={customerLocation}
          showRoute={true}
          mapHeight={400}
          zoom={15}
        />
      </View>

      {/* Order Info */}
      <View style={styles.orderInfo}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <Text style={styles.address}>{order.address}</Text>
          {eta && distance && (
            <Text style={styles.etaText}>ETA: {eta} • {distance}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.callButton} onPress={callCustomer}>
          <Ionicons name="call" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Navigation Actions */}
      <View style={styles.navigationActions}>
        <TouchableOpacity style={styles.mapsButton} onPress={openInGoogleMaps}>
          <Ionicons name="navigate" size={20} color="white" />
          <Text style={styles.buttonText}>Google Maps</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mapsButton} onPress={openInAppleMaps}>
          <Ionicons name="map" size={20} color="white" />
          <Text style={styles.buttonText}>Apple Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Status Actions */}
      <View style={styles.statusActions}>
        <TouchableOpacity style={styles.arrivedButton} onPress={markArrived}>
          <Text style={styles.buttonText}>Mark as Arrived</Text>
        </TouchableOpacity>

        {order.status === 'assigned' && (
          <TouchableOpacity style={styles.pickupButton} onPress={completePickup}>
            <Text style={styles.buttonText}>Complete Pickup</Text>
          </TouchableOpacity>
        )}

        {order.status === 'picked_up' && (
          <TouchableOpacity style={styles.deliveryButton} onPress={completeDelivery}>
            <Text style={styles.buttonText}>Complete Delivery</Text>
          </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  etaText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginTop: 4,
  },
  callButton: {
    backgroundColor: '#10B981',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  mapsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  statusActions: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  arrivedButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickupButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  deliveryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
});
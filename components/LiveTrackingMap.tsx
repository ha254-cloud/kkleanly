import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MapPin, Navigation, Phone, MessageCircle, Clock, Package } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { driverService, DeliveryTracking, Driver } from '../services/driverService';
import { orderService } from '../services/orderService';
import GoogleMapComponent from './GoogleMapComponent';
import { LocationCoords, mapsService } from '../services/mapsService';
import { locationService } from '../services/locationService';
import { notificationService } from '../services/notificationService';

const { width, height } = Dimensions.get('window');

interface LiveTrackingMapProps {
  orderId: string;
  onDriverCall?: (phone: string) => void;
  onDriverMessage?: (phone: string) => void;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  orderId,
  onDriverCall,
  onDriverMessage,
}) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const colors = isDark ? Colors.dark : Colors.light;
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [customerLocation, setCustomerLocation] = useState<LocationCoords | null>(null);
  const [pickupLocation, setPickupLocation] = useState<LocationCoords | null>(null);
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<string>('');

  console.log('🗺️ LiveTrackingMap initialized for orderId:', orderId);

  useEffect(() => {
    console.log('🗺️ Setting up LiveTrackingMap for orderId:', orderId);
    
    // Show map immediately with default Nairobi location
    const defaultLocation: LocationCoords = {
      latitude: -1.2921,
      longitude: 36.8219
    };
    setCustomerLocation(defaultLocation);
    setPickupLocation(defaultLocation);
    
    // Show map immediately, don't wait for any data
    setLoading(false);

    if (!orderId) {
      console.error('❌ No orderId provided');
      return;
    }

    // Load tracking data in background without blocking UI
    const loadTrackingData = async () => {
      try {
        // Subscribe to delivery tracking updates
        const unsubscribe = driverService.subscribeToDeliveryTracking(orderId, async (trackingData) => {
          console.log('📦 Tracking data received:', trackingData);
          setTracking(trackingData);
          
          // Load driver data in background
          if (trackingData?.driverId) {
            setTimeout(() => {
              driverService.getDriverById(trackingData.driverId)
                .then(driverData => {
                  console.log('👤 Driver data loaded:', driverData);
                  setDriver(driverData);
                })
                .catch(error => {
                  console.error('Error fetching driver:', error);
                });
            }, 100);
          }

          // Load locations in background
          setTimeout(() => {
            loadLocations(trackingData);
          }, 200);
        });

        unsubscribeRef.current = unsubscribe;
      } catch (error) {
        console.error('Error setting up tracking subscription:', error);
      }
    };

    // Start loading data after a short delay to let UI render first
    setTimeout(loadTrackingData, 50);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [orderId]);

  const loadLocations = async (trackingData: DeliveryTracking) => {
    try {
      console.log('📍 Loading location data from tracking:', trackingData);
      
      // Helper: determine if provided coordinates look like placeholders (random Nairobi seed or (0,0))
      const looksLikePlaceholder = (lat?: number, lng?: number, address?: string) => {
        if (lat === undefined || lng === undefined) return true;
        if (lat === 0 && lng === 0) return true;
        // Default Nairobi center used as placeholder in app
        const defaultLat = -1.2921;
        const defaultLng = 36.8219;
        const nearDefault = Math.abs(lat - defaultLat) < 0.02 && Math.abs(lng - defaultLng) < 0.02;
        if (!nearDefault) return false;
        if (!address) return true;
        // If address references a different city (e.g., Eldoret, Mombasa) or has a plus code, treat as placeholder
        if (/eldoret|mombasa|kisumu|nakuru|naivasha|thika/i.test(address)) return true;
        if (/[A-Z0-9]{4}\+[A-Z0-9]{2,3}/i.test(address)) return true; // Plus Code
        return false;
      };

      const deliveryAddress = trackingData.deliveryLocation?.address;
      const dLat = trackingData.deliveryLocation?.latitude;
      const dLng = trackingData.deliveryLocation?.longitude;

      // Without external geocoding, just trust provided coords unless clearly placeholder
      if (dLat && dLng && !looksLikePlaceholder(dLat, dLng, deliveryAddress)) {
        const customerCoords = { latitude: dLat, longitude: dLng };
        setCustomerLocation(customerCoords);
        console.log('📍 Using provided customer coordinates:', customerCoords);
      } else {
        // Keep default; still show address overlay so driver sees textual destination
        console.log('📍 Placeholder or missing delivery coordinates – default map center retained');
      }

      if (trackingData.pickupLocation?.latitude && trackingData.pickupLocation?.longitude) {
        const pickupCoords = {
          latitude: trackingData.pickupLocation.latitude,
          longitude: trackingData.pickupLocation.longitude
        };
        setPickupLocation(pickupCoords);
        console.log('📍 Using direct pickup coordinates:', pickupCoords);
      } else if (trackingData.pickupLocation?.address) {
        // Only geocode if no coordinates available
  // No geocoding function available; leave default or provided coords
      }
      
    } catch (error) {
      console.error('❌ Error loading location data:', error);
      // Don't throw the error - let the component continue with default locations
    }
  };

  // Update ETA when driver location changes - but debounce it to avoid too frequent calls
  useEffect(() => {
    if (tracking?.currentLocation && customerLocation) {
      // Debounce ETA updates to avoid excessive API calls
      const timer = setTimeout(() => {
        updateETA();
      }, 2000); // Wait 2 seconds before updating ETA
      
      return () => clearTimeout(timer);
    }
  }, [tracking?.currentLocation, customerLocation]);

  const updateETA = async () => {
    if (!tracking?.currentLocation || !customerLocation) return;

    try {
      // Only calculate ETA if we have actual coordinates (not default ones)
      if (customerLocation.latitude === -1.2921 && customerLocation.longitude === 36.8219) {
        console.log('📍 Skipping ETA calculation - using default coordinates');
        setEta('Calculating...');
        setDistance('...');
        return;
      }

      // Calculate ETA in background without blocking UI
      setTimeout(async () => {
        try {
          // Approximate distance & ETA using Haversine (mapsService.calculateDistance in km)
          const km = mapsService.calculateDistance(
            { latitude: tracking.currentLocation.latitude, longitude: tracking.currentLocation.longitude },
            { latitude: customerLocation.latitude, longitude: customerLocation.longitude }
          );
          const avgSpeedKmh = 25; // heuristic urban speed
          const hours = km / avgSpeedKmh;
          const minutes = Math.round(hours * 60);
          setEta(minutes <= 1 ? '1 min' : `${minutes} mins`);
          setDistance(km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);
        } catch (error) {
          console.warn('⚠️ Could not calculate ETA:', error);
        }
      }, 100);
    } catch (error) {
      console.warn('⚠️ Error in ETA calculation setup:', error);
      // Don't throw - ETA is nice to have but not critical
    }
  };

  const getStatusDisplay = (status: DeliveryTracking['status']) => {
    switch (status) {
      case 'assigned':
        return { text: 'Driver Assigned', color: colors.primary, icon: '👤' };
      case 'pickup_started':
        return { text: 'Heading to Pickup', color: colors.warning, icon: '🚗' };
      case 'picked_up':
        return { text: 'Items Picked Up', color: colors.success, icon: '📦' };
      case 'delivery_started':
        return { text: 'Out for Delivery', color: colors.primary, icon: '🚚' };
      case 'delivered':
        return { text: 'Delivered', color: colors.success, icon: '✅' };
      default:
        return { text: 'Unknown Status', color: colors.textSecondary, icon: '❓' };
    }
  };

  const getEstimatedTime = () => {
    if (!tracking) return 'Calculating...';
    
    if (tracking.status === 'assigned' || tracking.status === 'pickup_started') {
      return tracking.estimatedPickupTime || 'Calculating pickup time...';
    } else if (tracking.status === 'picked_up' || tracking.status === 'delivery_started') {
      return tracking.estimatedDeliveryTime || 'Calculating delivery time...';
    } else if (tracking.status === 'delivered') {
      return 'Delivered!';
    }
    
    return 'Calculating...';
  };

  const handleCallDriver = () => {
    if (driver?.phone) {
      if (onDriverCall) {
        onDriverCall(driver.phone);
      } else {
        Alert.alert('Call Driver', `Calling ${driver.name} at ${driver.phone}`);
      }
    }
  };

  const handleMessageDriver = () => {
    if (driver?.phone) {
      if (onDriverMessage) {
        onDriverMessage(driver.phone);
      } else {
        Alert.alert('Message Driver', `Messaging ${driver.name} at ${driver.phone}`);
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Show map with loading overlay instead of blocking entirely */}
        <View style={styles.mapContainer}>
          <GoogleMapComponent
            driverLocation={undefined}
            customerLocation={{ latitude: -1.2921, longitude: 36.8219 }}
            pickupLocation={{ latitude: -1.2921, longitude: 36.8219 }}
            // showRoute prop removed (component doesn't accept it)
            selectable={false}
            showBuildings={false}
            mapHeight={height * 0.4}
            zoom={12}
          />
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading tracking...
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!tracking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Card style={styles.noTrackingCard}>
          <Package size={48} color={colors.textSecondary} />
          <Text style={[styles.noTrackingTitle, { color: colors.text }]}>
            No Tracking Available
          </Text>
          <Text style={[styles.noTrackingText, { color: colors.textSecondary }]}>
            Driver hasn't been assigned yet. You'll see live tracking once a driver is assigned to your order.
          </Text>
        </Card>
      </View>
    );
  }

  // Always show map with default location if customerLocation is not set
  const displayLocation = customerLocation || { latitude: -1.2921, longitude: 36.8219 };

  const statusInfo = getStatusDisplay(tracking.status);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Map Component */}
      <View style={styles.mapContainer}>
        <GoogleMapComponent
          driverLocation={tracking?.currentLocation || undefined}
          customerLocation={displayLocation}
          pickupLocation={pickupLocation || { latitude: -1.2921, longitude: 36.8219 }}
          // showRoute prop removed (component doesn't accept it)
          selectable={false}
          showBuildings={true}
          mapHeight={height * 0.4}
          zoom={14}
          onMapReady={() => console.log('Map loaded successfully')}
        />
        {/* Delivery Address Overlay */}
        {tracking?.deliveryLocation?.address && (
          <View style={styles.simpleAddressOverlay} pointerEvents="box-none">
            <View style={styles.simpleAddressCard}>
              <MapPin size={14} color={colors.primary} />
              <Text style={[styles.simpleAddressText, { color: colors.text }]} numberOfLines={2}>
                {tracking.deliveryLocation.address}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Status Card */}
      <Card style={styles.statusCard}>
        <LinearGradient
          colors={[statusInfo.color + '15', statusInfo.color + '08']}
          style={styles.statusGradient}
        >
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: statusInfo.color + '20' }]}>
              <Text style={styles.statusEmoji}>{statusInfo.icon}</Text>
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {statusInfo.text}
              </Text>
              <View style={styles.timeContainer}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                  ETA: {eta || getEstimatedTime()}
                </Text>
              </View>
              {distance && (
                <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
                  Distance: {distance}
                </Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </Card>

      {/* Driver Info Card */}
      {driver && (
        <Card style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <View style={[styles.driverAvatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.driverInitial, { color: colors.primary }]}>
                {driver.name?.charAt(0)?.toUpperCase() || 'D'}
              </Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: colors.text }]}>
                {driver.name || 'Unknown Driver'}
              </Text>
              <Text style={[styles.driverDetails, { color: colors.textSecondary }]}>
                {driver.vehicleType?.charAt(0)?.toUpperCase() + driver.vehicleType?.slice(1) || 'Unknown'} • {driver.vehicleNumber || 'No plate'}
              </Text>
              <View style={styles.driverRating}>
                <Text style={[styles.ratingText, { color: colors.warning }]}>
                  ⭐ {driver.rating.toFixed(1)} ({driver.totalDeliveries} deliveries)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.driverActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
              onPress={handleCallDriver}
            >
              <Phone size={20} color={colors.success} />
              <Text style={[styles.actionButtonText, { color: colors.success }]}>
                Call
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
              onPress={handleMessageDriver}
            >
              <MessageCircle size={20} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                Message
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Delivery Progress */}
      <Card style={styles.progressCard}>
        <Text style={[styles.progressTitle, { color: colors.text }]}>
          Delivery Progress
        </Text>
        
        <View style={styles.progressSteps}>
          {[
            { key: 'assigned', label: 'Driver Assigned', icon: '👤' },
            { key: 'pickup_started', label: 'Heading to Pickup', icon: '🚗' },
            { key: 'picked_up', label: 'Items Picked Up', icon: '📦' },
            { key: 'delivery_started', label: 'Out for Delivery', icon: '🚚' },
            { key: 'delivered', label: 'Delivered', icon: '✅' },
          ].map((step, index) => {
            const isCompleted = getStepIndex(tracking.status) >= index;
            const isCurrent = getStepIndex(tracking.status) === index;
            
            return (
              <View key={step.key} style={styles.progressStep}>
                <View style={styles.progressStepIndicator}>
                  <View
                    style={[
                      styles.progressStepDot,
                      {
                        backgroundColor: isCompleted ? colors.success : colors.border,
                        borderColor: isCurrent ? colors.primary : 'transparent',
                        borderWidth: isCurrent ? 2 : 0,
                      },
                    ]}
                  >
                    <Text style={styles.progressStepEmoji}>
                      {isCompleted ? '✓' : step.icon}
                    </Text>
                  </View>
                  {index < 4 && (
                    <View
                      style={[
                        styles.progressStepLine,
                        { backgroundColor: isCompleted ? colors.success : colors.border },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.progressStepLabel,
                    {
                      color: isCompleted ? colors.text : colors.textSecondary,
                      fontWeight: isCurrent ? '700' : '500',
                    },
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
};

const getStepIndex = (status: DeliveryTracking['status']): number => {
  const steps = ['assigned', 'pickup_started', 'picked_up', 'delivery_started', 'delivered'];
  return steps.indexOf(status);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  noTrackingCard: {
    margin: 20,
    padding: 40,
    alignItems: 'center',
  },
  noTrackingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noTrackingText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  mapContainer: {
    height: height * 0.4,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  simpleAddressOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
  },
  simpleAddressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  simpleAddressText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusEmoji: {
    fontSize: 20,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
  },
  distanceText: {
    fontSize: 12,
    marginTop: 1,
  },
  driverCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  driverInitial: {
    fontSize: 20,
    fontWeight: '700',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  driverDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  progressSteps: {
    gap: 16,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStepIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  progressStepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepEmoji: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  progressStepLine: {
    width: 2,
    height: 20,
    marginTop: 4,
  },
  progressStepLabel: {
    fontSize: 14,
    flex: 1,
  },
  noTrackingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noTrackingMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
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
});
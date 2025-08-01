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
import { Colors } from '../constants/Colors';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { driverService, DeliveryTracking, Driver } from '../../services/driverService';
import GoogleMapComponent from '../../components/GoogleMapComponent';
import { LocationCoords, mapsService } from '../../services/mapsService';
import { locationService } from '../../services/locationService';
import { notificationService } from '../../services/notificationService';

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
  const colors = isDark ? Colors.dark : Colors.light;
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [customerLocation, setCustomerLocation] = useState<LocationCoords | null>(null);
  const [pickupLocation, setPickupLocation] = useState<LocationCoords | null>(null);
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);

  useEffect(() => {
    initializeLocations();
    // Subscribe to real-time tracking updates
    const unsubscribe = driverService.subscribeToDeliveryTracking(orderId, async (trackingData) => {
      setTracking(trackingData);
      
      if (trackingData?.driverId) {
        try {
          const driverData = await driverService.getDriverById(trackingData.driverId);
          setDriver(driverData);
        } catch (error) {
          console.error('Error fetching driver:', error);
        }
      }
      
      setLoading(false);
    });

    unsubscribeRef.current = unsubscribe;
    
    // Initialize notifications
    notificationService.initialize();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [orderId]);

  const initializeLocations = async () => {
    try {
      // Geocode customer address
      if (tracking?.customerAddress) {
        const customerCoords = await mapsService.geocodeAddress(tracking.customerAddress);
        if (customerCoords) {
          setCustomerLocation(customerCoords);
        }
      }

      // Set pickup location (could be laundromat address)
      const pickupCoords = await mapsService.geocodeAddress('123 Laundry St, City, State');
      if (pickupCoords) {
        setPickupLocation(pickupCoords);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing locations:', error);
      setLoading(false);
    }
  };

  // Update ETA when driver location changes
  useEffect(() => {
    if (tracking?.currentLocation && customerLocation) {
      updateETA();
    }
  }, [tracking?.currentLocation, customerLocation]);

  const updateETA = async () => {
    if (!tracking?.currentLocation || !customerLocation) return;

    try {
      const etaInfo = await mapsService.calculateETA(tracking.currentLocation, customerLocation);
      if (etaInfo) {
        setEta(etaInfo.duration);
        setDistance(etaInfo.distance);
        
        // Send ETA notification if significant change (every 5 minutes max)
        const now = Date.now();
        if (now - lastNotificationTime > 300000) { // 5 minutes
          await notificationService.sendETAUpdateNotification(orderId, etaInfo.duration);
          setLastNotificationTime(now);
        }
      }
    } catch (error) {
      console.error('Error calculating ETA:', error);
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading tracking information...
          </Text>
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

  if (!customerLocation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <MapPin size={48} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Unable to load location</Text>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusDisplay(tracking.status);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Map Component */}
      <View style={styles.mapContainer}>
        <GoogleMapComponent
          driverLocation={tracking.currentLocation || undefined}
          customerLocation={customerLocation}
          pickupLocation={pickupLocation || undefined}
          showRoute={true}
          mapHeight={height * 0.4}
          zoom={14}
        />
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
                {driver.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: colors.text }]}>
                {driver.name}
              </Text>
              <Text style={[styles.driverDetails, { color: colors.textSecondary }]}>
                {driver.vehicleType.charAt(0).toUpperCase() + driver.vehicleType.slice(1)} • {driver.vehicleNumber}
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
});
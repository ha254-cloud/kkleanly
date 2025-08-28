import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Clock, CheckCircle, Truck, Package, MapPin, Phone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Card } from './ui/Card';
import { Order } from '../services/orderService';
import { driverService } from '../services/driverService';
import { notificationService } from '../services/notificationService';

interface EnhancedOrderFlowProps {
  order: Order;
  onStatusUpdate?: (newStatus: Order['status']) => void;
}

export const EnhancedOrderFlow: React.FC<EnhancedOrderFlowProps> = ({
  order,
  onStatusUpdate,
}) => {
  const colors = Colors.light;
  const [currentStep, setCurrentStep] = useState(0);
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const progressAnimation = new Animated.Value(0);

  const orderSteps = [
    {
      id: 'pending',
      title: 'Order Placed',
      description: 'Your order has been received',
      icon: <Package size={20} color="#FFFFFF" />,
      color: colors.warning,
    },
    {
      id: 'confirmed',
      title: 'Order Confirmed',
      description: 'Driver will be assigned soon',
      icon: <CheckCircle size={20} color="#FFFFFF" />,
      color: colors.primary,
    },
    {
      id: 'driver-assigned',
      title: 'Driver Assigned',
      description: 'Driver is on the way for pickup',
      icon: <Truck size={20} color="#FFFFFF" />,
      color: colors.success,
    },
    {
      id: 'in-progress',
      title: 'Items Picked Up',
      description: 'Your items are being processed',
      icon: <Clock size={20} color="#FFFFFF" />,
      color: colors.primary,
    },
    {
      id: 'completed',
      title: 'Ready for Delivery',
      description: 'Clean items ready for delivery',
      icon: <CheckCircle size={20} color="#FFFFFF" />,
      color: colors.success,
    },
  ];

  useEffect(() => {
    // Determine current step based on order status
    const stepIndex = orderSteps.findIndex(step => step.id === order.status);
    setCurrentStep(stepIndex >= 0 ? stepIndex : 0);

    // Animate progress
    Animated.timing(progressAnimation, {
      toValue: stepIndex >= 0 ? stepIndex : 0,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Load driver info if order is in progress
    if (order.status === 'in-progress' || order.status === 'confirmed') {
      loadDriverInfo();
    }

    // Set estimated time
    updateEstimatedTime();
  }, [order.status]);

  const loadDriverInfo = async () => {
    try {
      // Check if driver is assigned to this order
      const tracking = await driverService.getDeliveryTracking(order.id!);
      if (tracking?.driverId) {
        const driver = await driverService.getDriverById(tracking.driverId);
        setDriverInfo(driver);
      }
    } catch (error) {
      console.error('Error loading driver info:', error);
    }
  };

  const updateEstimatedTime = () => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const hoursSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60));

    switch (order.status) {
      case 'pending':
        setEstimatedTime('Driver assignment in 30 minutes');
        break;
      case 'confirmed':
        setEstimatedTime('Pickup within 2 hours');
        break;
      case 'in-progress':
        setEstimatedTime('Processing - 24-48 hours');
        break;
      case 'completed':
        setEstimatedTime('Ready for delivery');
        break;
      default:
        setEstimatedTime('Calculating...');
    }
  };

  const handleCallDriver = () => {
    if (driverInfo?.phone) {
      Alert.alert(
        'Call Driver',
        `Call ${driverInfo.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => {
            // In a real app, this would open the phone dialer
            Alert.alert('Calling...', `Calling ${driverInfo.phone}`);
          }}
        ]
      );
    }
  };

  const handleTrackOrder = () => {
    // Navigate to live tracking
    Alert.alert('Live Tracking', 'Opening live tracking map...');
  };

  return (
    <Card style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <Text style={[styles.progressTitle, { color: colors.text }]}>
          Order Progress
        </Text>
        <Text style={[styles.estimatedTime, { color: colors.textSecondary }]}>
          {estimatedTime}
        </Text>
      </View>

      {/* Progress Steps */}
      <View style={styles.stepsContainer}>
        {orderSteps.map((step, index) => {
          const isCompleted = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <View key={step.id} style={styles.stepContainer}>
              <View style={styles.stepIndicator}>
                <Animated.View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: isCompleted ? step.color : colors.border,
                      transform: [{
                        scale: progressAnimation.interpolate({
                          inputRange: [index - 0.5, index, index + 0.5],
                          outputRange: [1, 1.2, 1],
                          extrapolate: 'clamp',
                        })
                      }]
                    },
                  ]}
                >
                  {isCompleted && step.icon}
                </Animated.View>
                {index < orderSteps.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      {
                        backgroundColor: isCompleted ? step.color : colors.border,
                      },
                    ]}
                  />
                )}
              </View>
              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepTitle,
                    {
                      color: isCompleted ? colors.text : colors.textSecondary,
                      fontWeight: isCurrent ? '700' : '600',
                    },
                  ]}
                >
                  {step.title}
                </Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  {step.description}
                </Text>
                {isCurrent && (
                  <View style={[styles.currentBadge, { backgroundColor: step.color + '20' }]}>
                    <Text style={[styles.currentBadgeText, { color: step.color }]}>
                      Current
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Driver Info */}
      {driverInfo && (
        <View style={styles.driverSection}>
          <Text style={[styles.driverSectionTitle, { color: colors.text }]}>
            Your Driver
          </Text>
          <View style={styles.driverCard}>
            <View style={[styles.driverAvatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.driverInitial, { color: colors.primary }]}>
                {driverInfo.name?.charAt(0)?.toUpperCase() || 'D'}
              </Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: colors.text }]}>
                {driverInfo.name || 'Unknown Driver'}
              </Text>
              <Text style={[styles.driverDetails, { color: colors.textSecondary }]}>
                {driverInfo.vehicleType} • {driverInfo.vehicleNumber}
              </Text>
              <Text style={[styles.driverRating, { color: colors.warning }]}>
                ⭐ {driverInfo.rating.toFixed(1)} rating
              </Text>
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity
                style={[styles.driverActionButton, { backgroundColor: colors.success }]}
                onPress={handleCallDriver}
              >
                <Phone size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.driverActionButton, { backgroundColor: colors.primary }]}
                onPress={handleTrackOrder}
              >
                <MapPin size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {order.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.warning + '20' }]}
            onPress={() => Alert.alert('Order Status', 'Your order is being processed and will be confirmed soon.')}
          >
            <Clock size={16} color={colors.warning} />
            <Text style={[styles.actionButtonText, { color: colors.warning }]}>
              Awaiting Confirmation
            </Text>
          </TouchableOpacity>
        )}
        
        {(order.status === 'confirmed' || order.status === 'in-progress') && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
            onPress={handleTrackOrder}
          >
            <MapPin size={16} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Track Live
            </Text>
          </TouchableOpacity>
        )}
        
        {order.status === 'completed' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
            onPress={() => Alert.alert('Order Complete', 'Your order has been completed successfully!')}
          >
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.actionButtonText, { color: colors.success }]}>
              Order Complete
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 20,
  },
  progressHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  estimatedTime: {
    fontSize: 14,
  },
  stepsContainer: {
    marginBottom: 24,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepLine: {
    width: 2,
    height: 24,
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  currentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  driverSection: {
    marginBottom: 20,
  },
  driverSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 16,
    borderRadius: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  driverDetails: {
    fontSize: 12,
    marginBottom: 2,
  },
  driverRating: {
    fontSize: 12,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  driverActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
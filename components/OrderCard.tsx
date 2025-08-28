import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { X, AlertCircle } from 'lucide-react-native';
import { Card } from './ui/Card';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Order } from '../services/orderService';
import { orderService } from '../services/orderService';
import { notificationService } from '../services/notificationService';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  onOrderUpdated?: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress, onOrderUpdated }) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'confirmed':
        return colors.primary;
      case 'in-progress':
        return '#3B82F6';
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canCancelOrder = (status: Order['status']) => {
    return status === 'pending' || status === 'confirmed';
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        {
          text: 'Keep Order',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => showCancellationReasons(),
        },
      ]
    );
  };

  const showCancellationReasons = () => {
    const reasons = [
      'Changed my mind',
      'Found cheaper alternative',
      'No longer need the service',
      'Scheduling conflict',
      'Emergency situation',
      'Other reason',
    ];

    Alert.alert(
      'Cancellation Reason',
      'Please select a reason for cancellation:',
      [
        ...reasons.map((reason) => ({
          text: reason,
          onPress: () => confirmCancellation(reason),
        })),
        {
          text: 'Back',
          style: 'cancel',
        },
      ]
    );
  };

  const confirmCancellation = async (reason: string) => {
    try {
      // Cancel the order
      await orderService.cancelOrder(order.id!, reason);
      
      // Send comprehensive notification to admin
      await notificationService.sendLocalNotification({
        orderId: order.id!,
        type: 'order_assigned',
        title: '❌ Order Cancelled by Customer',
        body: `Order #${order.id?.slice(-6)} cancelled. Customer: ${order.address?.split(',')[0] || 'Unknown'} | Reason: ${reason} | Amount: KSH ${order.total?.toLocaleString()}`,
        data: {
          orderDetails: {
            orderId: order.id,
            customerInfo: order.address?.split(',')[0] || 'Unknown',
            cancellationReason: reason,
            orderTotal: order.total,
            cancelledAt: new Date().toISOString(),
            originalStatus: order.status,
          }
        }
      });

      // Show success message to customer
      Alert.alert(
        'Order Cancelled',
        'Your order has been cancelled successfully. Any payment will be refunded within 3-5 business days.',
        [{ text: 'OK' }]
      );

      // Refresh the orders list
      onOrderUpdated?.();
    } catch (error) {
      console.error('Error cancelling order:', error);
      Alert.alert(
        'Cancellation Failed',
        'Unable to cancel your order. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={{
        ...styles.card,
        backgroundColor: colors.surface,
        shadowColor: isDark ? '#000' : '#000',
      }}>
        <View style={styles.header}>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderId, { color: colors.text }]}>
              #{order.id?.slice(-6).toUpperCase()}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatDate(order.createdAt)}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{order.status?.toUpperCase()}</Text>
            </View>
            {canCancelOrder(order.status) && (
              <TouchableOpacity
                style={[styles.cancelButton, { 
                  backgroundColor: isDark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.08)',
                  borderColor: 'rgba(255, 59, 48, 0.25)',
                }]}
                onPress={handleCancelOrder}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <X size={16} color="#FF3B30" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.details}>
          <Text style={[styles.category, { color: colors.text }]}>
            {order.category?.replace('-', ' ').toUpperCase()}
          </Text>
          <Text style={[styles.address, { color: colors.textSecondary }]}>
            {order.address}
          </Text>
          {/* Display detailed address information if available */}
          {order.addressDetails && (
            <View style={styles.addressDetailsContainer}>
              {order.addressDetails.buildingName && (
                <Text style={[styles.addressDetail, { color: colors.textSecondary }]}>
                  🏢 {order.addressDetails.buildingName}
                </Text>
              )}
              {(order.addressDetails.floorNumber || order.addressDetails.doorNumber) && (
                <Text style={[styles.addressDetail, { color: colors.textSecondary }]}>
                  📍 {order.addressDetails.floorNumber && `Floor ${order.addressDetails.floorNumber}`}
                  {order.addressDetails.floorNumber && order.addressDetails.doorNumber && ', '}
                  {order.addressDetails.doorNumber && `Door ${order.addressDetails.doorNumber}`}
                </Text>
              )}
              {order.addressDetails.placeType && (
                <Text style={[styles.addressDetail, { color: colors.textSecondary }]}>
                  🏠 {order.addressDetails.placeType.charAt(0).toUpperCase() + order.addressDetails.placeType.slice(1)}
                </Text>
              )}
              {order.addressDetails.additionalInfo && (
                <Text style={[styles.addressDetail, { color: colors.textSecondary }]}>
                  📝 {order.addressDetails.additionalInfo}
                </Text>
              )}
            </View>
          )}
          <Text style={[styles.items, { color: colors.textSecondary }]}>
            {order.items?.length || 0} items
          </Text>
        </View>

        {order.status === 'cancelled' && order.cancellationReason && (
          <View style={[styles.cancellationInfo, {
            backgroundColor: isDark ? 'rgba(255, 59, 48, 0.12)' : 'rgba(255, 59, 48, 0.08)',
          }]}>
            <AlertCircle size={18} color="#FF3B30" />
            <Text style={[styles.cancellationText, { color: colors.error }]}>
              Cancelled: {order.cancellationReason}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={[styles.total, { color: colors.text }]}>
            KSH {order.total?.toLocaleString()}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  details: {
    marginBottom: 16,
  },
  category: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  address: {
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
    fontWeight: '500',
  },
  addressDetailsContainer: {
    marginTop: 4,
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#14b8a6',
  },
  addressDetail: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  items: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
  cancellationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  cancellationText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  total: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
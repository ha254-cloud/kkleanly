import { WhatsAppButton } from '../../components/ui/WhatsAppButton';
import { LiveTrackingMap } from '../../components/LiveTrackingMap';
import OrderCancellationModal from '../../components/OrderCancellationModal';
import TimeSelectionModal from '../../components/TimeSelectionModal';
import React, { useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui/Card';
import { formatOrderId, formatDate } from '@/utils/formatters';
import { Package, MapPin, Calendar, Award, TrendingUp, Clock, Truck, CheckCircle, Star, ChevronDown, X, Edit3, MessageCircle, Phone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useOrders } from '@/context/OrderContext';

// Example colors object, replace with your theme or actual color values as needed
const colors = {
  text: '#222222',
  textSecondary: '#888888',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E42',
  border: '#E5E7EB',
};

const { width } = Dimensions.get('window');

export default function TrackScreen() {
  const { orders, loading, cancelOrder, updateOrderTimes } = useOrders();
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  
  // Get the most recent order by default, or allow user to select different order
  const selectedOrder = orders.length > 0 ? orders[selectedOrderIndex] : null;

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'processing':
        return colors.primary;
      case 'completed':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pending':
        return <Clock size={16} color={getStatusColor(status)} />;
      case 'processing':
        return <Truck size={16} color={getStatusColor(status)} />;
      case 'completed':
        return <CheckCircle size={16} color={getStatusColor(status)} />;
      default:
        return <Package size={16} color={getStatusColor(status)} />;
    }
  }

  function getEstimatedDelivery(order: any) {
    const deliveryDate = new Date(order.createdAt);
    deliveryDate.setDate(deliveryDate.getDate() + 2);
    return formatDate(deliveryDate.toISOString());
  }

  function getStatusSteps(status: string) {
    const steps = [
      {
        key: 'placed',
        label: 'Order Placed',
        description: 'Your order has been received',
        icon: <Package size={12} color="white" />,
        isActive: true,
        isCurrent: status === 'pending',
      },
      {
        key: 'processing',
        label: 'Processing',
        description: 'Your items are being processed',
        icon: <Truck size={12} color="white" />,
        isActive: status !== 'pending',
        isCurrent: status === 'processing',
      },
      {
        key: 'delivery',
        label: 'Out for Delivery',
        description: 'Your order is on the way',
        icon: <MapPin size={12} color="white" />,
        isActive: status === 'delivery' || status === 'completed',
        isCurrent: status === 'delivery',
      },
      {
        key: 'completed',
        label: 'Delivered',
        description: 'Order completed successfully',
        icon: <CheckCircle size={12} color="white" />,
        isActive: status === 'completed',
        isCurrent: status === 'completed',
      },
    ];
    return steps;
  }

  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your orders...
          </Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Orders Found
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            You haven't placed any orders yet.{'\n'}
            Create an order to track its progress here!
          </Text>
        </View>
      ) : (
        <View>
          {/* Order Selector */}
          {orders.length > 1 && (
            <Card style={styles.selectorCard}>
              <Text style={[styles.selectorLabel, { color: colors.text }]}>
                Select Order to Track:
              </Text>
              <TouchableOpacity 
                style={[styles.orderSelector, { borderColor: colors.border }]}
                onPress={() => {
                  setSelectedOrderIndex((prev) => (prev + 1) % orders.length);
                }}
              >
                <View style={styles.selectorContent}>
                  <Text style={[styles.selectorText, { color: colors.text }]}>
                    {formatOrderId(selectedOrder?.id)} - {(selectedOrder?.status || 'pending').toUpperCase()}
                  </Text>
                  <ChevronDown size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </Card>
          )}

          {selectedOrder && (
            <View style={styles.orderSection}>
              <Card style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={[styles.orderId, { color: colors.text }]}>
                      {formatOrderId(selectedOrder.id)}
                    </Text>
                    <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                      Placed on {formatDate(selectedOrder.createdAt)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status || 'pending') + '20' }]}>
                      {getStatusIcon(selectedOrder.status || 'pending')}
                      <Text style={[styles.statusText, { color: getStatusColor(selectedOrder.status || 'pending') }]}>
                        {(selectedOrder.status || 'pending').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Time Selection Button - Only show for editable orders */}
                  {(['pending', 'confirmed'].includes(selectedOrder.status || 'pending')) && (
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowTimeModal(true)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[colors.primary, colors.primary + 'E6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.timeButtonGradient}
                      >
                        <View style={styles.timeButtonContent}>
                          <View style={styles.timeButtonIconContainer}>
                            <Edit3 size={16} color="#FFFFFF" />
                          </View>
                          <Text style={styles.timeButtonText}>
                            Edit Times
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Order Summary */}
                <View style={styles.orderSummary}>
                  <View style={styles.summaryRow}>
                    <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Calendar size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Pickup:
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      {selectedOrder.pickupTime ? formatDate(selectedOrder.pickupTime) : 'Not scheduled'}
                    </Text>
                  </View>
                  
                  {selectedOrder.preferredDeliveryTime && (
                    <View style={styles.summaryRow}>
                      <View style={[styles.summaryIcon, { backgroundColor: colors.success + '20' }]}>
                        <Truck size={16} color={colors.success} />
                      </View>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        Delivery:
                      </Text>
                      <Text style={[styles.summaryValue, { color: colors.text }]}>
                        {formatDate(selectedOrder.preferredDeliveryTime)}
                      </Text>
                    </View>
                  )}
                  
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <View style={[styles.summaryIcon, { backgroundColor: colors.success + '20' }]}>
                      <Package size={16} color={colors.success} />
                    </View>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Total:
                    </Text>
                    <Text style={[styles.totalAmount, { color: colors.success }]}>
                      KSh {(selectedOrder.total || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Card>

              <LiveTrackingMap 
                orderId={selectedOrder.id!}
                onDriverCall={(phone) => Alert.alert('Call Driver', `Calling ${phone}`)}
                onDriverMessage={(phone) => Alert.alert('Message Driver', `Messaging ${phone}`)}
              />
            </View>
          )}
        </View>
      )}
      
      {/* Time Selection Modal */}
      {selectedOrder && (
        <TimeSelectionModal
          visible={showTimeModal}
          onClose={() => setShowTimeModal(false)}
          onSave={async (pickupTime?: string, deliveryTime?: string) => {
            await updateOrderTimes(selectedOrder.id!, pickupTime, deliveryTime);
          }}
          currentPickupTime={selectedOrder.pickupTime}
          currentDeliveryTime={selectedOrder.preferredDeliveryTime}
          orderStatus={selectedOrder.status}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  orderSection: {
    padding: 16,
  },
  orderGradient: {
    borderRadius: 12,
    marginBottom: 16,
  },
  orderCard: {
    padding: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  timeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  timeButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  timeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timeButtonIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  orderId: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderSummary: {
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    minWidth: 80,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  totalRow: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressGradient: {
    borderRadius: 12,
    marginBottom: 16,
  },
  progressCard: {
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  progressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressHeaderText: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
  },
  timelineContainer: {
    gap: 20,
  },
  timelineStep: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineIndicator: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    height: 40,
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  currentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemsGradient: {
    borderRadius: 12,
  },
  itemsCard: {
    padding: 20,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  itemsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsHeaderText: {
    flex: 1,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemsSubtitle: {
    fontSize: 14,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  itemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemText: {
    fontSize: 16,
    flex: 1,
  },
  // New styles for loading, empty states, and order selector
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  selectorCard: {
    margin: 16,
    padding: 16,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  orderSelector: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  selectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 16,
    flex: 1,
  },
});
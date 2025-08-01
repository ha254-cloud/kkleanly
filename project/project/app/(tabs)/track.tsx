import { WhatsAppButton } from '../../components/ui/WhatsAppButton';
import { LiveTrackingMap } from '../../components/LiveTrackingMap';
import React from 'react';
import { Alert, Dimensions, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { formatOrderId, formatDate } from '@/utils/formatters';
import { Package, MapPin, Calendar, Award, TrendingUp, Clock, Truck, CheckCircle, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  // TODO: Replace this mock with actual order selection logic or prop.
  // Example: const selectedOrder = orders.find(order => order.id === selectedOrderId);
  const selectedOrder = {
    id: 'ORDER123',
    createdAt: new Date(),
    status: 'pending',
    category: 'laundry',
    address: '123 Main St',
    total: 2500,
    items: ['Shirt', 'Pants', 'Jacket'],
  };

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
    return formatDate(deliveryDate);
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
    <View style={styles.container}>
      {selectedOrder && (
        <View style={styles.orderSection}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFF']}
            style={styles.orderGradient}
          >
            <Card style={styles.orderCard}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <Text style={[styles.orderId, { color: colors.text }]}>
                    {formatOrderId(selectedOrder.id)}
                  </Text>
                  <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                    Placed on {formatDate(selectedOrder.createdAt)}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusColor(selectedOrder.status) + '20' }
                ]}>
                  {getStatusIcon(selectedOrder.status)}
                  <Text style={[
                    styles.statusText, 
                    { color: getStatusColor(selectedOrder.status) }
                  ]}>
                    {selectedOrder.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Order Summary */}
              <View style={styles.orderSummary}>
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Package size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Service:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {selectedOrder.category.replace('-', ' ').toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryIcon, { backgroundColor: colors.success + '20' }]}>
                    <MapPin size={16} color={colors.success} />
                  </View>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Area:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {selectedOrder.address}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Calendar size={16} color={colors.warning} />
                  </View>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Est. Delivery:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {getEstimatedDelivery(selectedOrder)}
                  </Text>
                </View>
                
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Award size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: '700' }]}>Total:</Text>
                  <Text style={[styles.totalAmount, { color: colors.primary }]}>
                    KSH {selectedOrder.total.toLocaleString()}
                  </Text>
                </View>
              </View>
            </Card>
          </LinearGradient>

          {/* Progress Timeline */}
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFF']}
            style={styles.progressGradient}
          >
            <Card style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <View style={[styles.progressIconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <TrendingUp size={24} color={colors.primary} />
                </View>
                <View style={styles.progressHeaderText}>
                  <Text style={[styles.progressTitle, { color: colors.text }]}>
                    Order Progress
                  </Text>
                  <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                    Track your order journey step by step
                  </Text>
                </View>
              </View>
              
              <View style={styles.timelineContainer}>
                {getStatusSteps(selectedOrder.status).map((step, index) => (
                  <View key={step.key} style={styles.timelineStep}>
                    <View style={styles.timelineIndicator}>
                      <View
                        style={[
                          styles.timelineDot,
                          {
                            backgroundColor: step.isActive ? getStatusColor(selectedOrder.status) : colors.border,
                          },
                        ]}
                      >
                        {step.isActive && step.icon}
                      </View>
                      {index < 3 && (
                        <View
                          style={[
                            styles.timelineLine,
                            {
                              backgroundColor: step.isActive && index < getStatusSteps(selectedOrder.status).findIndex(s => s.isCurrent) 
                                ? getStatusColor(selectedOrder.status) 
                                : colors.border,
                            },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.timelineLabel,
                          {
                            color: step.isActive ? colors.text : colors.textSecondary,
                            fontWeight: step.isCurrent ? '700' : '600',
                          },
                        ]}
                      >
                        {step.label}
                      </Text>
                      <Text style={[styles.timelineDescription, { color: colors.textSecondary }]}>
                        {step.description}
                      </Text>
                      {step.isCurrent && (
                        <View style={[styles.currentBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
                          <Text style={[styles.currentBadgeText, { color: getStatusColor(selectedOrder.status) }]}>
                            Current Status
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </LinearGradient>

          {/* Items List */}
          {selectedOrder.items && selectedOrder.items.length > 0 && (
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFF']}
              style={styles.itemsGradient}
            >
              <Card style={styles.itemsCard}>
                <View style={styles.itemsHeader}>
                  <View style={[styles.itemsIconContainer, { backgroundColor: colors.success + '20' }]}>
                    <Package size={24} color={colors.success} />
                  </View>
                  <View style={styles.itemsHeaderText}>
                    <Text style={[styles.itemsTitle, { color: colors.text }]}>
                      Items in Order ({selectedOrder.items.length})
                    </Text>
                    <Text style={[styles.itemsSubtitle, { color: colors.textSecondary }]}>
                      Your laundry items being processed
                    </Text>
                  </View>
                </View>
                
                <View style={styles.itemsList}>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                      <View style={[styles.itemIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={[styles.itemNumber, { color: colors.primary }]}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text style={[styles.itemText, { color: colors.text }]}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            </LinearGradient>
          )}
        </View>
      )}
      
      <LiveTrackingMap 
        orderId={selectedOrder.id!}
        onDriverCall={(phone) => Alert.alert('Call Driver', `Calling ${phone}`)}
        onDriverMessage={(phone) => Alert.alert('Message Driver', `Messaging ${phone}`)}
      />
    </View>
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
});
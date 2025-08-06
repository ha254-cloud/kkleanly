import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { orderService } from '../services/orderService';
import type { Order } from '../services/orderService';

const ORDER_STATUSES: Order['status'][] = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];

const AdminOrdersScreen = () => {
  const { orders, loading, refreshOrders } = useAdminOrders();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    refreshOrders();
  }, []);

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    setUpdatingId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, status);
    } catch (e) {
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${dayName}, ${day} ${month} ${year} at ${time}`;
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'mpesa': return '📱 M-Pesa';
      case 'card': return '💳 Card Payment';
      case 'cash': return '💵 Cash on Delivery';
      default: return method || 'Not specified';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'confirmed': return '#007AFF';
      case 'in-progress': return '#5856D6';
      case 'completed': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const renderOrder = ({ item }: any) => {
    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item.id?.slice(-8) || 'N/A'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusBadgeText}>{item.status?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Customer Information</Text>
          <Text style={styles.infoText}>Name: {item.customerInfo?.name || item.address?.split(',')[0] || 'N/A'}</Text>
          <Text style={styles.infoText}>Phone: {item.phone || 'N/A'}</Text>
          <Text style={styles.infoText}>Address: {item.address || 'N/A'}</Text>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛍️ Order Details</Text>
          <Text style={styles.infoText}>Category: {item.category?.replace('-', ' ') || 'N/A'}</Text>
          <Text style={styles.infoText}>Type: {item.orderType || 'N/A'}</Text>
          {item.items && item.items.length > 0 && (
            <View style={styles.itemsList}>
              <Text style={styles.itemsTitle}>Items:</Text>
              {item.items.map((orderItem: any, index: number) => (
                <Text key={index} style={styles.itemText}>
                  • {orderItem.quantity}x {orderItem.service || orderItem.name} - KSH {orderItem.price?.toLocaleString()}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payment Information</Text>
          <Text style={styles.infoText}>Method: {getPaymentMethodDisplay(item.paymentMethod)}</Text>
          <Text style={[styles.infoText, styles.totalAmount]}>
            Total Amount: KSH {item.total?.toLocaleString() || '0'}
          </Text>
          <Text style={[styles.infoText, item.isPaid ? styles.paidStatus : styles.unpaidStatus]}>
            Payment Status: {item.isPaid ? '✅ PAID' : '⏳ PENDING'}
          </Text>
        </View>

        {/* Detailed Scheduling Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Detailed Scheduling</Text>
          
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>📝 Order Placed:</Text>
            <Text style={styles.scheduleValue}>{formatDateTime(item.createdAt)}</Text>
          </View>
          
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>📦 Pickup Scheduled:</Text>
            <Text style={styles.scheduleValue}>
              {item.pickupTime || 'Tomorrow, 9:00 AM - 5:00 PM'}
            </Text>
          </View>
          
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>🚚 Delivery Expected:</Text>
            <Text style={styles.scheduleValue}>
              {item.deliveryTime || 'Within 24-48 hours after pickup'}
            </Text>
          </View>

          {/* Additional timing details */}
          <View style={styles.timingDetails}>
            <Text style={styles.timingTitle}>⏰ Service Timeline:</Text>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Pickup Window:</Text>
              <Text style={styles.timelineText}>Monday-Friday: 9:00 AM - 5:00 PM</Text>
            </View>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Processing Time:</Text>
              <Text style={styles.timelineText}>24-48 hours</Text>
            </View>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Delivery Window:</Text>
              <Text style={styles.timelineText}>Monday-Saturday: 10:00 AM - 6:00 PM</Text>
            </View>
          </View>
        </View>

        {/* Status Update Controls */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>🔄 Update Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.statusRow}>
              {ORDER_STATUSES.map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusBtn,
                    item.status === status && styles.selectedStatus,
                    { borderColor: getStatusColor(status) }
                  ]}
                  disabled={item.status === status || updatingId === item.id}
                  onPress={() => handleStatusChange(item.id, status)}
                >
                  <Text style={[
                    styles.statusText,
                    item.status === status && styles.selectedStatusText
                  ]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {updatingId === item.id && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007bff" />
              <Text style={styles.loadingText}>Updating status...</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color="#007bff" />
      <Text style={styles.loadingText}>Loading orders...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Admin Order Management</Text>
        <Text style={styles.subtitle}>Total Orders: {orders.length}</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={item => item.id || ''}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa', 
    paddingTop: 50 
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  listContainer: { 
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  orderCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20, 
    marginBottom: 16, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  orderId: { 
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
    lineHeight: 20,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  paidStatus: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  unpaidStatus: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  itemsList: {
    marginTop: 8,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 6,
  },
  itemText: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  scheduleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
  },
  scheduleValue: {
    fontSize: 14,
    color: '#6c757d',
    flex: 2,
    textAlign: 'right',
  },
  timingDetails: {
    marginTop: 12,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007bff',
  },
  timingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6c757d',
  },
  timelineText: {
    fontSize: 13,
    color: '#6c757d',
  },
  statusSection: {
    marginTop: 8,
  },
  statusRow: { 
    flexDirection: 'row', 
    marginTop: 8,
  },
  statusBtn: { 
    paddingHorizontal: 16,
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  selectedStatus: { 
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  statusText: { 
    color: '#495057', 
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  selectedStatusText: {
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6c757d',
    fontSize: 14,
  },
});

export default AdminOrdersScreen;

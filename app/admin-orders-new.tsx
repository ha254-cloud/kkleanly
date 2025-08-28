import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { orderService } from '../services/orderService';
import type { Order } from '../services/orderService';
// Extend the Order type to include the phone property
type ExtendedOrder = Order & { phone?: string };
import { isCurrentUserAdminAsync } from '../utils/adminAuth'; // Fixed import path

const ORDER_STATUSES: Order['status'][] = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];

const AdminOrdersScreen = () => {
  const { orders, loading, refreshOrders } = useAdminOrders();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    refreshOrders();
  }, []);

  // Check admin status properly using async function
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const adminStatus = await isCurrentUserAdminAsync();
        console.log('🔐 Admin Orders check result:', { isAdmin: adminStatus });
        if (mounted) setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Admin check error:', error);
        if (mounted) setIsAdmin(false);
      }
    })();
    
    return () => { mounted = false; };
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
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${dayName}, ${month} ${day}, ${year} at ${hours}:${minutes}`;
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      pending: '#fbbf24',      // amber
      confirmed: '#3b82f6',    // blue
      'in-progress': '#8b5cf6', // purple
      completed: '#10b981',    // emerald
      cancelled: '#ef4444',    // red
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getScentInfo = (order: any) => {
    if (!order.scent) {
      return { hasScent: false, name: '', price: 0 };
    }

    const scentPrices: { [key: string]: number } = {
      'Lavender Mist': 50,
      'Ocean Breeze': 50,
      'African Jasmine': 75,
      'Vanilla Dreams': 60,
      'Fresh Cotton': 40,
      'Citrus Burst': 45,
      'No Scent': 0
    };

    return {
      hasScent: order.scent !== 'No Scent',
      name: order.scent,
      price: scentPrices[order.scent] || 0
    };
  };

  const getDetailedPaymentInfo = (order: any) => {
    const paymentMethods = {
      'mpesa': { 
        icon: '📱', 
        name: 'M-Pesa', 
        color: '#10b981',
        description: 'Mobile Money',
        provider: 'Safaricom'
      },
      'card': { 
        icon: '💳', 
        name: 'Card Payment', 
        color: '#3b82f6',
        description: 'Credit/Debit Card',
        provider: 'Visa/Mastercard'
      },
      'cash': { 
        icon: '💵', 
        name: 'Cash on Delivery', 
        color: '#10b981',
        description: 'Pay on Delivery',
        provider: 'Cash Payment'
      },
      'bank': { 
        icon: '🏦', 
        name: 'Bank Transfer', 
        color: '#3b82f6',
        description: 'Direct Bank Transfer',
        provider: 'Banking Network'
      },
    };

    const method = paymentMethods[order.paymentMethod as keyof typeof paymentMethods] || 
                  { 
                    icon: '💰', 
                    name: order.paymentMethod || 'Not specified', 
                    color: '#6b7280',
                    description: 'Payment method not specified',
                    provider: 'Unknown'
                  };

    const orderDate = new Date(order.createdAt);
    const paymentDate = order.paymentDate ? new Date(order.paymentDate) : null;
    const timingInfo = paymentDate ? 
      `Paid ${Math.floor((paymentDate.getTime() - orderDate.getTime()) / (1000 * 60))} minutes after order` :
      order.isPaid ? 'Payment confirmed' : 'Payment pending';

    return {
      ...method,
      isPaid: order.isPaid || false,
      amount: order.total || 0,
      transactionId: order.transactionId || null,
      paymentDate: order.paymentDate || null,
      timingInfo,
      mpesaPhone: order.mpesaPhone || null,
      cardLast4: order.cardLast4 || null,
      bankReference: order.bankReference || null
    };
  };

  const getOrderTypeDetails = (order: any) => {
    const types = {
      'per-item': { icon: '📝', name: 'Per Item Pricing', desc: 'Individual item pricing' },
      'per-bag': { icon: '🛍️', name: 'Per Bag Pricing', desc: 'Bulk bag pricing' },
    };

    return types[order.orderType as keyof typeof types] || 
           { icon: '📦', name: order.orderType || 'Standard', desc: 'Standard service' };
  };

  const getCategoryDetails = (category: string) => {
    const categories = {
      'wash-fold': { icon: '👕', name: 'Wash & Fold', color: '#3b82f6' },
      'dry-cleaning': { icon: '🧥', name: 'Dry Cleaning', color: '#8b5cf6' },
      'ironing': { icon: '🔥', name: 'Ironing Service', color: '#f59e0b' },
      'shoe-cleaning': { icon: '👟', name: 'Shoe Cleaning', color: '#10b981' },
      'premium-care': { icon: '✨', name: 'Premium Care', color: '#ec4899' },
    };

    return categories[category as keyof typeof categories] || 
           { icon: '🧺', name: category?.replace('-', ' ') || 'Service', color: '#6b7280' };
  };

  const openDetailModal = (order: ExtendedOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const renderOrder = ({ item }: any) => {
    const scentInfo = getScentInfo(item);
    const paymentInfo = getDetailedPaymentInfo(item);
    const orderTypeInfo = getOrderTypeDetails(item);
    const categoryInfo = getCategoryDetails(item.category);

    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderId}>#{item.id?.slice(-6).toUpperCase()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{(item.status || 'pending').toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.orderDate}>{formatDateTime(item.createdAt)}</Text>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Customer Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>
                {item.customerInfo?.name || item.address?.split(',')[0] || 'Not provided'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{item.phone || 'Not provided'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>
                {item.customerInfo?.email || 'Not provided'}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location Details</Text>
          <Text style={styles.addressText}>{item.address || 'Address not provided'}</Text>
        </View>

        {/* Service Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛍️ Service Details</Text>
          <View style={styles.serviceGrid}>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceLabel}>Category:</Text>
              <Text style={[styles.serviceValue, { color: categoryInfo.color }]}>
                {categoryInfo.icon} {categoryInfo.name}
              </Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceLabel}>Type:</Text>
              <Text style={styles.serviceValue}>
                {orderTypeInfo.icon} {orderTypeInfo.name}
              </Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceLabel}>Total Items:</Text>
              <Text style={styles.serviceValue}>{item.items?.length || 0}</Text>
            </View>
          </View>
        </View>

        {/* Items Ordered */}
        {item.items && item.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 Items Ordered</Text>
            {item.items.map((orderItem: any, index: number) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemDetails}>
                  {orderItem.quantity || 1}x {orderItem.service || orderItem.name || `Item ${index + 1}`}
                </Text>
                <Text style={styles.itemPrice}>
                  KSH {(orderItem.price || 0).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Scent Selection */}
        {scentInfo.hasScent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌸 Scent Selection</Text>
            <View style={styles.scentInfo}>
              <Text style={styles.scentName}>{scentInfo.name}</Text>
              {scentInfo.price > 0 && (
                <Text style={styles.scentPrice}>+KSH {scentInfo.price}</Text>
              )}
            </View>
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payment Information</Text>
          <View style={styles.paymentGrid}>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Method:</Text>
              <Text style={[styles.paymentValue, { color: paymentInfo.color }]}>
                {paymentInfo.icon} {paymentInfo.name}
              </Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Status:</Text>
              <Text style={[
                styles.paymentStatus,
                paymentInfo.isPaid ? styles.paidStatus : styles.unpaidStatus
              ]}>
                {paymentInfo.isPaid ? '✅ PAID' : '⏳ PENDING'}
              </Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Amount:</Text>
              <Text style={styles.paymentAmount}>
                KSH {paymentInfo.amount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Provider:</Text>
              <Text style={styles.paymentProvider}>{paymentInfo.provider}</Text>
            </View>
          </View>
          
          {/* Additional Payment Details */}
          {paymentInfo.mpesaPhone && (
            <Text style={styles.paymentExtra}>M-Pesa: {paymentInfo.mpesaPhone}</Text>
          )}
          {paymentInfo.cardLast4 && (
            <Text style={styles.paymentExtra}>Card: **** {paymentInfo.cardLast4}</Text>
          )}
          {paymentInfo.bankReference && (
            <Text style={styles.paymentExtra}>Ref: {paymentInfo.bankReference}</Text>
          )}
        </View>

        {/* Timing Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Timing Details</Text>
          <View style={styles.timingGrid}>
            <View style={styles.timingItem}>
              <Text style={styles.timingLabel}>Ordered:</Text>
              <Text style={styles.timingValue}>{formatDateTime(item.createdAt)}</Text>
            </View>
            {item.pickupTime && (
              <View style={styles.timingItem}>
                <Text style={styles.timingLabel}>Pickup:</Text>
                <Text style={styles.timingValue}>{formatDateTime(item.pickupTime)}</Text>
              </View>
            )}
            {item.deliveryTime && (
              <View style={styles.timingItem}>
                <Text style={styles.timingLabel}>Delivery:</Text>
                <Text style={styles.timingValue}>{formatDateTime(item.deliveryTime)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes Section */}
        {item.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Order Notes</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        {/* Status Update Buttons */}
        <View style={styles.statusButtons}>
          {ORDER_STATUSES.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                { backgroundColor: getStatusColor(status) },
                item.status === status && styles.activeStatusButton
              ]}
              onPress={() => handleStatusChange(item.id, status)}
              disabled={updatingId === item.id}
            >
              <Text style={styles.statusButtonText}>
                {status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => openDetailModal(item)}
        >
          <Text style={styles.viewDetailsText}>VIEW FULL DETAILS</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Prevent render until admin check complete
  if (isAdmin === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Checking admin access...</Text>
      </View>
    );
  }
  
  if (!isAdmin) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: '#ef4444' }]}>Access Denied</Text>
        <Text style={[styles.loadingText, { fontSize: 14, marginTop: 8 }]}>
          Admin access required
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Orders Dashboard</Text>
        <Text style={styles.orderCount}>{orders.length} Total Orders</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={refreshOrders}
      />

      {/* Order Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {selectedOrder && (
            <View style={styles.modalContent}>
              <Text style={styles.modalOrderId}>Order #{selectedOrder.id}</Text>
              <Text style={styles.modalText}>Status: {selectedOrder.status}</Text>
              <Text style={styles.modalText}>Total: KSH {selectedOrder.total?.toLocaleString()}</Text>
              <Text style={styles.modalText}>Phone: {selectedOrder?.phone || 'Not provided'}</Text>
              <Text style={styles.modalText}>Address: {selectedOrder.address}</Text>
              {selectedOrder.notes && (
                <Text style={styles.modalText}>Notes: {selectedOrder.notes}</Text>
              )}
            </View>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  infoGrid: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  addressText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  serviceGrid: {
    gap: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  serviceValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  itemDetails: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  scentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scentName: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  scentPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  paymentGrid: {
    gap: 8,
    marginBottom: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  paidStatus: {
    color: '#059669',
  },
  unpaidStatus: {
    color: '#d97706',
  },
  paymentAmount: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '700',
    textAlign: 'right',
  },
  paymentProvider: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
  },
  paymentExtra: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  timingGrid: {
    gap: 8,
  },
  timingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timingLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  timingValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
  },
  activeStatusButton: {
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  statusButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  viewDetailsButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    padding: 20,
  },
  modalOrderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 24,
  },
});

export default AdminOrdersScreen;

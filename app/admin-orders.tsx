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

const ORDER_STATUSES: Order['status'][] = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];

const AdminOrdersScreen = () => {
  const { orders, loading, refreshOrders } = useAdminOrders();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

    // Handle both string and object scent formats
    const scentName = typeof order.scent === 'string' ? order.scent : 
                     (order.scent?.name || order.scent?.id || 'No Scent');

    return {
      hasScent: scentName !== 'No Scent',
      name: scentName,
      price: scentPrices[scentName] || 0
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

  const openDetailModal = (order: Order) => {
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
                {String(item.customerInfo?.name || item.address?.split(',')[0] || 'Not provided')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{String(item.customerPhone || 'Not provided')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>
                {String(item.customerInfo?.email || 'Not provided')}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location Details</Text>
          <Text style={styles.addressText}>{String(item.address || 'Address not provided')}</Text>
          {item.estate && (
            <View style={{ marginTop:8, alignSelf:'flex-start', paddingHorizontal:12, paddingVertical:6, borderRadius:18, backgroundColor:'#e0f2fe', borderWidth:1, borderColor:'#7dd3fc' }}>
              <Text style={{ fontSize:12, fontWeight:'600', color:'#075985' }}>Estate: {String(item.estate)}</Text>
            </View>
          )}
          
          {/* Display detailed address information */}
          {item.addressDetails && (
            <View style={styles.addressDetailsContainer}>
              {item.addressDetails.buildingName && (
                <View style={styles.addressDetailRow}>
                  <Text style={styles.addressDetailLabel}>🏢 Building:</Text>
                  <Text style={styles.addressDetailValue}>{item.addressDetails.buildingName}</Text>
                </View>
              )}
              {item.addressDetails.floorNumber && (
                <View style={styles.addressDetailRow}>
                  <Text style={styles.addressDetailLabel}>📍 Floor:</Text>
                  <Text style={styles.addressDetailValue}>{item.addressDetails.floorNumber}</Text>
                </View>
              )}
              {item.addressDetails.doorNumber && (
                <View style={styles.addressDetailRow}>
                  <Text style={styles.addressDetailLabel}>🚪 Door:</Text>
                  <Text style={styles.addressDetailValue}>{item.addressDetails.doorNumber}</Text>
                </View>
              )}
              {item.addressDetails.placeType && (
                <View style={styles.addressDetailRow}>
                  <Text style={styles.addressDetailLabel}>🏠 Type:</Text>
                  <Text style={styles.addressDetailValue}>{item.addressDetails.placeType.charAt(0).toUpperCase() + item.addressDetails.placeType.slice(1)}</Text>
                </View>
              )}
              {item.addressDetails.additionalInfo && (
                <View style={styles.addressDetailRow}>
                  <Text style={styles.addressDetailLabel}>📝 Notes:</Text>
                  <Text style={styles.addressDetailValue}>{item.addressDetails.additionalInfo}</Text>
                </View>
              )}
              {item.addressDetails.label && (
                <View style={styles.addressDetailRow}>
                  <Text style={styles.addressDetailLabel}>🏷️ Label:</Text>
                  <Text style={styles.addressDetailValue}>{item.addressDetails.label.charAt(0).toUpperCase() + item.addressDetails.label.slice(1)}</Text>
                </View>
              )}
            </View>
          )}
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
            <Text style={styles.sectionTitle}>📦 Items Ordered ({item.items.length} items)</Text>
            {item.items.map((orderItem: any, index: number) => {
              // Extract specific item details
              const itemName = String(orderItem.name || orderItem.service || orderItem.type || `Item ${index + 1}`);
              const itemCategory = String(orderItem.category || orderItem.serviceType || '');
              const orderType = String(orderItem.orderType || item.orderType || '');
              const quantity = Number(orderItem.quantity) || 1;
              const unitPrice = Number(orderItem.price) || Number(orderItem.unitPrice) || 0;
              const totalPrice = unitPrice * quantity;
              
              // Determine if this is a specific clothing item or a bag service
              const isSpecificItem = itemName.toLowerCase().includes('shirt') || 
                                   itemName.toLowerCase().includes('jeans') || 
                                   itemName.toLowerCase().includes('dress') || 
                                   itemName.toLowerCase().includes('trouser') || 
                                   itemName.toLowerCase().includes('blouse') ||
                                   itemName.toLowerCase().includes('jacket') ||
                                   itemName.toLowerCase().includes('skirt') ||
                                   itemName.toLowerCase().includes('underwear') ||
                                   itemName.toLowerCase().includes('sock') ||
                                   itemName.toLowerCase().includes('sweater');
              
              const isBagService = orderType.toLowerCase().includes('bag') || 
                                  itemName.toLowerCase().includes('bag');
              
              return (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemNameSection}>
                      <Text style={styles.itemName}>
                        {quantity}x {itemName}
                      </Text>
                      {isBagService && (
                        <Text style={styles.bagServiceTag}>🛍️ BAG SERVICE</Text>
                      )}
                      {isSpecificItem && (
                        <Text style={styles.specificItemTag}>👕 SPECIFIC ITEM</Text>
                      )}
                      {itemCategory && (
                        <Text style={styles.itemCategoryTag}>
                          📂 {itemCategory.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.itemPrice}>
                      KSH {totalPrice.toLocaleString()}
                    </Text>
                  </View>
                
                <View style={styles.itemDetails}>
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemLabel}>Quantity:</Text>
                    <Text style={styles.itemValue}>{orderItem.quantity || 1}</Text>
                  </View>
                  
                  {orderItem.category && (
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemLabel}>Category:</Text>
                      <Text style={styles.itemValue}>{String(orderItem.category)}</Text>
                    </View>
                  )}
                  
                  {orderItem.size && (
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemLabel}>Size:</Text>
                      <Text style={styles.itemValue}>{String(orderItem.size)}</Text>
                    </View>
                  )}
                  
                  {orderItem.color && (
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemLabel}>Color:</Text>
                      <Text style={styles.itemValue}>{String(orderItem.color)}</Text>
                    </View>
                  )}
                  
                  {orderItem.material && (
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemLabel}>Material:</Text>
                      <Text style={styles.itemValue}>{String(orderItem.material)}</Text>
                    </View>
                  )}
                  
                  {orderItem.specialInstructions && (
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemLabel}>Instructions:</Text>
                      <Text style={styles.itemValue}>{String(orderItem.specialInstructions)}</Text>
                    </View>
                  )}
                  
                  {orderItem.urgency && (
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemLabel}>Urgency:</Text>
                      <Text style={[styles.itemValue, 
                        orderItem.urgency === 'urgent' ? styles.urgentText : 
                        orderItem.urgency === 'express' ? styles.expressText : styles.normalText
                      ]}>
                        {String(orderItem.urgency).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  
                  {orderItem.condition && (
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemLabel}>Condition:</Text>
                      <Text style={styles.itemValue}>{String(orderItem.condition)}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.itemFooter}>
                  <Text style={styles.itemSubtotal}>
                    Subtotal: KSH {((Number(orderItem.price) || 0) * (orderItem.quantity || 1)).toLocaleString()}
                  </Text>
                  {orderItem.unitPrice && orderItem.unitPrice !== orderItem.price && (
                    <Text style={styles.unitPrice}>
                      Unit: KSH {(Number(orderItem.unitPrice) || 0).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
              );
            })}
            
            {/* Items Summary */}
            <View style={styles.itemsSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Items:</Text>
                <Text style={styles.summaryValue}>{item.items.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Quantity:</Text>
                <Text style={styles.summaryValue}>
                  {item.items.reduce((sum: number, orderItem: any) => sum + (orderItem.quantity || 1), 0)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items Subtotal:</Text>
                <Text style={styles.summaryValue}>
                  KSH {item.items.reduce((sum: number, orderItem: any) => 
                    sum + ((Number(orderItem.price) || 0) * (orderItem.quantity || 1)), 0
                  ).toLocaleString()}
                </Text>
              </View>
            </View>
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

            {/* Preferred delivery (new) */}
            {item.preferredDeliveryTime && (
              <View style={styles.timingItem}>
                <Text style={styles.timingLabel}>Preferred Delivery:</Text>
                <Text style={styles.timingValue}>{formatDateTime(item.preferredDeliveryTime)}</Text>
              </View>
            )}

            {/* Legacy fallback */}
            {!item.preferredDeliveryTime && item.deliveryTime && (
              <View style={styles.timingItem}>
                <Text style={styles.timingLabel}>Delivery:</Text>
                <Text style={styles.timingValue}>{formatDateTime(item.deliveryTime)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes Section - Enhanced for Item Details */}
        {item.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Order Notes & Item Details</Text>
            <Text style={styles.notesText}>{String(item.notes)}</Text>
            {/* Extract item details from notes if available */}
            {String(item.notes).toLowerCase().includes('phone:') && (
              <View style={styles.extractedInfo}>
                <Text style={styles.extractedInfoTitle}>📞 Extracted Details:</Text>
                {String(item.notes).match(/phone:\s*([^\,]+)/i) && (
                  <Text style={styles.extractedDetail}>
                    Phone: {String(item.notes).match(/phone:\s*([^\,]+)/i)?.[1]?.trim()}
                  </Text>
                )}
                {String(item.notes).match(/payment:\s*([^\,]+)/i) && (
                  <Text style={styles.extractedDetail}>
                    Payment Method: {String(item.notes).match(/payment:\s*([^\,]+)/i)?.[1]?.trim()}
                  </Text>
                )}
                {String(item.notes).match(/scent:\s*([^\,]+)/i) && (
                  <Text style={styles.extractedDetail}>
                    Scent Preference: {String(item.notes).match(/scent:\s*([^\,]+)/i)?.[1]?.trim()}
                  </Text>
                )}
                {String(item.notes).match(/order type:\s*([^\,]+)/i) && (
                  <Text style={styles.extractedDetail}>
                    Order Type: {String(item.notes).match(/order type:\s*([^\,]+)/i)?.[1]?.trim()}
                  </Text>
                )}
                {String(item.notes).match(/estate:\s*([^\,]+)/i) && (
                  <Text style={styles.extractedDetail}>
                    Estate: {String(item.notes).match(/estate:\s*([^\,]+)/i)?.[1]?.trim()}
                  </Text>
                )}
              </View>
            )}
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
              <Text style={styles.modalText}>Phone: {selectedOrder.customerPhone || 'Not provided'}</Text>
              <Text style={styles.modalText}>Address: {selectedOrder.address}</Text>
              {selectedOrder.estate && (
                <Text style={styles.modalText}>Estate: {selectedOrder.estate}</Text>
              )}
              
              {/* Display detailed address information in modal */}
              {selectedOrder.addressDetails && (
                <View style={styles.modalAddressDetails}>
                  <Text style={styles.modalSectionTitle}>📍 Detailed Address Information</Text>
                  {selectedOrder.addressDetails.buildingName && (
                    <Text style={styles.modalText}>🏢 Building: {selectedOrder.addressDetails.buildingName}</Text>
                  )}
                  {selectedOrder.addressDetails.floorNumber && (
                    <Text style={styles.modalText}>📍 Floor: {selectedOrder.addressDetails.floorNumber}</Text>
                  )}
                  {selectedOrder.addressDetails.doorNumber && (
                    <Text style={styles.modalText}>🚪 Door: {selectedOrder.addressDetails.doorNumber}</Text>
                  )}
                  {selectedOrder.addressDetails.placeType && (
                    <Text style={styles.modalText}>🏠 Type: {selectedOrder.addressDetails.placeType.charAt(0).toUpperCase() + selectedOrder.addressDetails.placeType.slice(1)}</Text>
                  )}
                  {selectedOrder.addressDetails.additionalInfo && (
                    <Text style={styles.modalText}>📝 Notes: {selectedOrder.addressDetails.additionalInfo}</Text>
                  )}
                  {selectedOrder.addressDetails.label && (
                    <Text style={styles.modalText}>🏷️ Label: {selectedOrder.addressDetails.label.charAt(0).toUpperCase() + selectedOrder.addressDetails.label.slice(1)}</Text>
                  )}
                </View>
              )}
              
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
  // Enhanced Item Styles
  itemCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  itemLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  itemValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  unitPrice: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  urgentText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  expressText: {
    color: '#f59e0b',
    fontWeight: '700',
  },
  normalText: {
    color: '#10b981',
    fontWeight: '600',
  },
  itemsSummary: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '700',
  },
  itemNameSection: {
    flex: 1,
  },
  bagServiceTag: {
    fontSize: 11,
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  specificItemTag: {
    fontSize: 11,
    color: '#7c3aed',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  itemCategoryTag: {
    fontSize: 11,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  extractedInfo: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  extractedInfoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  extractedDetail: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 3,
    paddingLeft: 8,
  },
  addressDetailsContainer: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addressDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressDetailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    minWidth: 80,
  },
  addressDetailValue: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    marginLeft: 8,
  },
  modalAddressDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
});

export default AdminOrdersScreen;

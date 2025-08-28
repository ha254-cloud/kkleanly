import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LiveTrackingMap } from '../../components/LiveTrackingMap';
import { driverService, DeliveryTracking } from '../../services/driverService';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';

export default function OrderNavigation() {
  const { orderId } = useLocalSearchParams();
  const { user } = useAuth();
  const [orderData, setOrderData] = useState<any>(null);
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
      
      // Subscribe to tracking updates
      const unsubscribe = driverService.subscribeToDeliveryTracking(
        orderId as string, 
        (trackingData) => {
          setTracking(trackingData);
        }
      );
      
      return unsubscribe;
    }
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      const order = await orderService.getOrderById(orderId as string);
      setOrderData(order);
      
      console.log('📞 Order data loaded:', order);
      
      // Extract phone number from notes field
      const extractPhoneFromNotes = (notes: string) => {
        if (!notes) return null;
        const phoneMatch = notes.match(/Phone:\s*([0-9+\-\s()]+)/i);
        return phoneMatch ? phoneMatch[1].trim() : null;
      };
      
      const customerPhone = order?.customerPhone || extractPhoneFromNotes(order?.notes || '');
      const customerName = order?.customerName || 'Customer';
      
      console.log('📞 Customer contact info from order:', {
        name: customerName,
        phone: customerPhone,
        email: order?.customerEmail,
        extractedFromNotes: extractPhoneFromNotes(order?.notes || ''),
        rawNotes: order?.notes
      });
      
      // Update order data with extracted contact info
      setOrderData({
        ...order,
        customerPhone,
        customerName
      });
      
      const trackingData = await driverService.getDeliveryTracking(orderId as string);
      setTracking(trackingData);
    } catch (error) {
      console.error('Error loading order data:', error);
      Alert.alert('Error', 'Failed to load order data');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (newStatus: DeliveryTracking['status']) => {
    if (!tracking || !tracking.id) {
      Alert.alert('Error', 'No tracking data available');
      return;
    }
    
    try {
      console.log('🔄 Updating delivery status:', {
        trackingId: tracking.id,
        currentStatus: tracking.status,
        newStatus: newStatus,
        driverId: tracking.driverId,
        orderId: tracking.orderId
      });
      
      await driverService.updateDeliveryStatus(tracking.id, newStatus);
      
      // Also update the order status to keep it in sync
      let orderStatus = 'in-progress';
      if (newStatus === 'delivered') {
        orderStatus = 'completed';
      } else if (newStatus === 'pickup_started') {
        orderStatus = 'confirmed';
      }
      
      await driverService.updateOrderStatus(tracking.orderId, orderStatus);
      
      Alert.alert('Status Updated', `Order status updated to: ${getStatusText(newStatus)}`);
    } catch (error: any) {
      console.error('❌ Error updating delivery status:', error);
      Alert.alert('Error', `Failed to update status: ${error.message || 'Unknown error'}`);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return 'Assigned';
      case 'pickup_started': return 'Going to Pickup';
      case 'picked_up': return 'Picked Up';
      case 'delivery_started': return 'Delivering';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  const makePhoneCall = (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'assigned': return 'pickup_started';
      case 'pickup_started': return 'picked_up';
      case 'picked_up': return 'delivery_started';
      case 'delivery_started': return 'delivered';
      default: return null;
    }
  };

  const getStatusButtonText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'assigned': return 'Start Pickup';
      case 'pickup_started': return 'Confirm Pickup';
      case 'picked_up': return 'Start Delivery';
      case 'delivery_started': return 'Complete Delivery';
      default: return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!orderData || !tracking) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Navigation</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Order Info */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderId}>Order #{typeof orderId === 'string' ? orderId.slice(-6).toUpperCase() : 'N/A'}</Text>
        <Text style={styles.customerName}>User: {orderData.userID}</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status: </Text>
          <Text style={[styles.status, { color: getStatusColor(tracking.status) }]}>
            {getStatusText(tracking.status)}
          </Text>
        </View>
      </View>

      {/* Customer Contact */}
      <View style={styles.contactCard}>
        <Text style={styles.cardTitle}>Customer Contact</Text>
        <View style={styles.contactRow}>
          <Text style={styles.contactInfo}>
            {orderData?.customerPhone ? 
              `${orderData.customerName || 'Customer'}: ${orderData.customerPhone}` :
              'Contact via order system'
            }
          </Text>
          <TouchableOpacity 
            style={[styles.callButton, { 
              backgroundColor: orderData?.customerPhone ? '#34C759' : '#666' 
            }]}
            disabled={!orderData?.customerPhone}
            onPress={() => orderData?.customerPhone && makePhoneCall(orderData.customerPhone)}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.callButtonText}>
              {orderData?.customerPhone ? 'Call' : 'N/A'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Addresses */}
      <View style={styles.addressCard}>
        <Text style={styles.cardTitle}>Delivery Information</Text>
        
        <View style={styles.addressSection}>
          <View style={styles.addressHeader}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.addressLabel}>Pickup Location</Text>
          </View>
          <Text style={styles.addressText}>{tracking.pickupLocation.address}</Text>
        </View>

        <View style={styles.addressSection}>
          <View style={styles.addressHeader}>
            <Ionicons name="home" size={20} color="#34C759" />
            <Text style={styles.addressLabel}>Delivery Address</Text>
          </View>
          <Text style={styles.addressText}>{tracking.deliveryLocation.address}</Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <View style={styles.mapWrapper}>
          {/* Minimal status indicator */}
          <View style={styles.statusBar}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(tracking.status) }]} />
            <Text style={styles.statusText}>{getStatusText(tracking.status)}</Text>
          </View>
          
          {/* Full map visibility */}
          <LiveTrackingMap orderId={orderId as string} />
          
          {/* Quick info panel - slide up from bottom */}
          <View style={styles.quickInfoPanel}>
            <TouchableOpacity style={styles.infoToggle}>
              <View style={styles.infoToggleBar} />
            </TouchableOpacity>
            
            <View style={styles.routeInfo}>
              <View style={styles.routeStep}>
                <Ionicons name="radio-button-on" size={16} color="#007AFF" />
                <Text style={styles.routeStepText} numberOfLines={1}>
                  {tracking.pickupLocation.address.split(',')[0]}
                </Text>
              </View>
              
              <View style={styles.routeConnector} />
              
              <View style={styles.routeStep}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.routeStepText} numberOfLines={1}>
                  {tracking.deliveryLocation.address.split(',')[0]}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Action Button - Prominent and Clear */}
      {tracking.status !== 'delivered' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: getActionButtonColor(tracking.status) }]}
            onPress={() => {
              const nextStatus = getNextStatus(tracking.status);
              if (nextStatus) {
                Alert.alert(
                  'Update Status',
                  `${getStatusButtonText(tracking.status)}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm', onPress: () => updateDeliveryStatus(nextStatus) }
                  ]
                );
              }
            }}
          >
            <Ionicons 
              name={getActionButtonIcon(tracking.status)} 
              size={24} 
              color="white" 
              style={styles.actionButtonIcon}
            />
            <Text style={styles.actionButtonText}>
              {getStatusButtonText(tracking.status)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'assigned': return '#FF9500';
      case 'pickup_started': return '#007AFF';
      case 'picked_up': return '#34C759';
      case 'delivery_started': return '#5856D6';
      case 'delivered': return '#34C759';
      default: return '#666';
    }
  }

  function getActionButtonColor(status: string) {
    switch (status) {
      case 'assigned': return '#007AFF';
      case 'pickup_started': return '#34C759';
      case 'picked_up': return '#5856D6';
      case 'delivery_started': return '#FF3B30';
      default: return '#007AFF';
    }
  }

  function getActionButtonIcon(status: string) {
    switch (status) {
      case 'assigned': return 'car-outline';
      case 'pickup_started': return 'checkmark-circle-outline';
      case 'picked_up': return 'arrow-forward-outline';
      case 'delivery_started': return 'checkmark-done-outline';
      default: return 'play-outline';
    }
  }

  // Structured delivery detail extraction (estate, plus code, city)
  function renderStructuredDeliveryDetails(fullAddress: string) {
    if (!fullAddress) return null;

    // Plus code pattern (e.g., G78P+FX6)
    const plusCodeMatch = fullAddress.match(/[A-Z0-9]{4}\+[A-Z0-9]{2,3}/);
    const plusCode = plusCodeMatch ? plusCodeMatch[0] : undefined;

    // Split by commas and trim
    const segments = fullAddress.split(',').map(s => s.trim()).filter(Boolean);
    let estate: string | undefined;
    if (segments.length > 0) {
      const first = segments[0];
      if (/estate|phase|court|gardens|heights|villas|apartments/i.test(first)) {
        estate = first;
      }
    }

    // Attempt to get city (last segment if looks like a city word)
    const city = segments.length > 1 ? segments[segments.length - 2] : undefined;

    if (!estate && !plusCode) return null; // nothing extra worth showing

    return (
      <View style={{ marginTop: 4, gap: 6 }}>
        {estate && (
          <View style={{ flexDirection:'row', alignItems:'center', flexWrap:'wrap', gap:6 }}>
            <View style={{
              backgroundColor:'#e0f2fe',
              paddingHorizontal:10,
              paddingVertical:4,
              borderRadius:14,
              borderWidth:1,
              borderColor:'#7dd3fc'
            }}>
              <Text style={{ fontSize:11, fontWeight:'600', color:'#075985' }}>Estate: {estate}</Text>
            </View>
            {city && (
              <View style={{
                backgroundColor:'#f1f5f9',
                paddingHorizontal:10,
                paddingVertical:4,
                borderRadius:14,
              }}>
                <Text style={{ fontSize:11, fontWeight:'500', color:'#334155' }}>{city}</Text>
              </View>
            )}
          </View>
        )}
        {plusCode && (
          <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
            <Ionicons name="pricetag" size={14} color="#6366f1" />
            <Text style={{ fontSize:11, color:'#4338ca', fontWeight:'600' }}>Plus Code: {plusCode}</Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginTop: 15,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  orderInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactCard: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressCard: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '600',
  },
  addressSection: {
    marginBottom: 15,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    paddingLeft: 28,
  },
  mapContainer: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    height: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  statusBar: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quickInfoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  infoToggle: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  infoToggleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  routeStep: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeStepText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  routeConnector: {
    width: 30,
    height: 2,
    backgroundColor: '#ddd',
    marginHorizontal: 10,
  },
  mapFallback: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonIcon: {
    marginRight: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

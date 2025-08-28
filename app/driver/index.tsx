import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Switch,
  ActivityIndicator,
  RefreshControl,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import driverService, { Driver, DeliveryTracking } from '../../services/driverService';
import { orderService } from '../../services/orderService';

import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth } from '../../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { db } from '../../services/firebase';
import { Colors } from '../../constants/Colors';

interface AssignedOrder {
  id: string;
  customerName: string;
  pickupAddress: string;
  deliveryAddress?: string;
  // Optional extracted estate shown separately when available
  estate?: string;
  // Detailed address information
  addressDetails?: {
    buildingName?: string;
    floorNumber?: string;
    doorNumber?: string;
    additionalInfo?: string;
    label?: string;
    placeType?: string;
  };
  serviceType: string;
  status: 'assigned' | 'pickup_started' | 'picked_up' | 'delivery_started' | 'delivered';
  deliveryTracking: DeliveryTracking;
  orderDetails: any;
  paymentMethod?: string;
  paymentStatus?: string;
  pickupTime?: string;
  preferredDeliveryTime?: string;
  orderTotal?: number;
  scheduledPickupTime?: string;
  scheduledDeliveryTime?: string;
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const colors = Colors.light;
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<AssignedOrder[]>([]);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [completedToday, setCompletedToday] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({ orders: 0, earnings: 0 });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeTracking: (() => void) | null = null;
    
    const loadDriverData = async () => {
      if (!user?.email || !isMounted) return;

      try {
        setLoading(true);
        console.log('🔍 Loading driver data for:', user.email);

        // Get driver info
        const driverData = await driverService.getDriverByEmail(user.email);
        if (!driverData || !isMounted) {
          console.log('❌ No driver data found');
          setLoading(false);
          return;
        }

        setDriver(driverData);
        console.log('✅ Driver data loaded:', driverData.id);

        // Wait for auth to be ready before setting up tracking
        await new Promise(resolve => {
          if (auth.currentUser) {
            resolve(true);
            return;
          }
          
          const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user || !isMounted) {
              unsubscribeAuth();
              resolve(true);
            }
          });
          
          // Timeout after 5 seconds
          setTimeout(() => {
            unsubscribeAuth();
            resolve(false);
          }, 5000);
        });

        if (!auth.currentUser || !isMounted) {
          console.log('❌ Auth not ready or component unmounted');
          setLoading(false);
          return;
        }

        // Load delivery tracking data with real-time subscription
        console.log('🔍 Loading delivery tracking for driver:', driverData.id);
        
        const trackingQuery = query(
          collection(db, 'deliveryTracking'),
          where('driverId', '==', driverData.id)
        );

        unsubscribeTracking = onSnapshot(
          trackingQuery, 
          async (snapshot) => {
            if (!isMounted) return;
            
            console.log('📦 Delivery tracking snapshot received, docs:', snapshot.docs.length);
            
            const assignedOrders: AssignedOrder[] = [];
            let todayCompleted = 0;
            let weeklyOrdersCount = 0;
            let weeklyEarningsTotal = 0;

            const today = new Date().toDateString();
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());

            // Process tracking data
            for (const doc of snapshot.docs) {
              if (!isMounted) break;
              
              const tracking = { id: doc.id, ...doc.data() } as DeliveryTracking;
              console.log('🔍 Processing tracking for:', tracking.orderId);

              // Get order details
              try {
                const orderDoc = await orderService.getOrderById(tracking.orderId);
                if (!orderDoc || !isMounted) continue;

                // Count completed orders
                if (tracking.status === 'delivered' && tracking.actualDeliveryTime) {
                  const deliveryDate = new Date(tracking.actualDeliveryTime);
                  
                  if (deliveryDate.toDateString() === today) {
                    todayCompleted++;
                  }
                  
                  if (deliveryDate >= weekStart) {
                    weeklyOrdersCount++;
                    weeklyEarningsTotal += 15; // Mock earnings per delivery
                  }
                }
                
                // Add to assigned orders if not delivered
                if (tracking.status !== 'delivered') {
                  assignedOrders.push({
                    id: tracking.orderId,
                    customerName: `Customer for ${tracking.orderId}`,
                    pickupAddress: tracking.pickupLocation?.address || 'Unknown pickup',
                    deliveryAddress: tracking.deliveryLocation?.address || 'Unknown delivery',
                    status: tracking.status,
                    orderTotal: orderDoc.total || 1500,
                    scheduledPickupTime: tracking.estimatedPickupTime || new Date().toISOString(),
                    scheduledDeliveryTime: tracking.estimatedDeliveryTime || new Date().toISOString(),
                    deliveryTracking: tracking,
                    orderDetails: orderDoc,
                    pickupTime: orderDoc.pickupTime,
                    preferredDeliveryTime: orderDoc.preferredDeliveryTime,
                    serviceType: orderDoc.category || 'wash-fold',
                    addressDetails: orderDoc.addressDetails,
                  });
                }
              } catch (orderError) {
                console.error('Error fetching order:', orderError);
                continue;
              }
            }

            if (!isMounted) return;

            console.log('📊 Final stats:', {
              assignedOrders: assignedOrders.length,
              todayCompleted,
              weeklyEarningsTotal,
              weeklyOrdersCount
            });

            setOrders(assignedOrders);
            setCompletedToday(todayCompleted);
            setWeeklyStats({ 
              orders: weeklyOrdersCount, 
              earnings: weeklyEarningsTotal 
            });
            setLoading(false);
          },
          (error) => {
            if (!isMounted) return;
            
            console.error('❌ Error loading delivery tracking:', error);
            if (error.code === 'permission-denied') {
              console.log('🔐 Permission denied - checking user auth state');
              console.log('👤 Current user:', auth.currentUser?.email);
              console.log('🆔 Driver ID:', driverData.id);
              
              // Check if user is still authenticated
              if (!auth.currentUser) {
                console.log('🚪 User not authenticated - redirecting to login');
                // Could redirect to login here if needed
                return;
              }
            }
            
            // Show empty state instead of crashing
            console.log('🔄 Showing empty state due to error');
            setOrders([]);
            setCompletedToday(0);
            setWeeklyStats({ orders: 0, earnings: 0 });
            setLoading(false);
          }
        );
        
      } catch (error) {
        if (!isMounted) return;
        console.error('❌ Error loading driver data:', error);
        setLoading(false);
      }
    };

    loadDriverData();

    // Cleanup function
    return () => {
      isMounted = false;
      if (unsubscribeTracking) {
        unsubscribeTracking();
      }
    };
  }, [user?.email]);

  // Enhanced function to fetch full order details
  const enhanceOrdersWithDetails = async (orders) => {
    const enhancedOrders = await Promise.all(
      orders.map(async (order) => {
        try {
          // Fetch the full order details from Firestore
          const orderDoc = await orderService.getOrderById(order.id);
          
          if (orderDoc) {
            // Set default payment method to cash
            let paymentMethod = 'cash';
            
            // Try to extract payment method from notes
            if (orderDoc.notes && orderDoc.notes.includes('Payment:')) {
              if (orderDoc.notes.includes('Payment: mpesa') || 
                  orderDoc.notes.includes('Payment: m-pesa')) {
                paymentMethod = 'mpesa';
              }
            }
            
            return {
              ...order,
              customerName: orderDoc.customerName || order.customerName,
              estate: orderDoc.estate || order.estate,
              addressDetails: orderDoc.addressDetails || null,
              serviceType: orderDoc.category?.replace('-', ' ').toUpperCase() || order.serviceType,
              pickupTime: orderDoc.pickupTime,
              preferredDeliveryTime: orderDoc.preferredDeliveryTime,
              orderDetails: {
                ...order.orderDetails,
                total: orderDoc.total || order.orderDetails.total,
                category: orderDoc.category || order.orderDetails.category,
                items: orderDoc.items || order.orderDetails.items,
                notes: orderDoc.notes || order.orderDetails.notes,
                paymentMethod: paymentMethod,
                paymentStatus: orderDoc.paymentStatus || 'pending',
              },
            };
          }
        } catch (error) {
          console.log('⚠️ Could not fetch details for order:', order.id, error);
        }
        
        // If we couldn't get details, return order with default cash payment
        return {
          ...order,
          pickupTime: order.orderDetails?.pickupTime,
          preferredDeliveryTime: order.orderDetails?.preferredDeliveryTime,
          orderDetails: {
            ...order.orderDetails,
            paymentMethod: 'cash',
            paymentStatus: 'pending',
          },
        };
      })
    );
    
    return enhancedOrders;
  };

  const loadOrders = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      console.log('🔍 Loading driver data for:', user.email);

      // Get driver info
      const driverData = await driverService.getDriverByEmail(user.email);
      if (!driverData) {
        console.log('❌ No driver data found');
        setLoading(false);
        return;
      }

      setDriver(driverData);
      console.log('✅ Driver data loaded:', driverData.id);

      // Load delivery tracking data with better error handling
      console.log('🔍 Loading delivery tracking for driver:', driverData.id);
      
      try {
        // First try the new method with better error handling
        const trackingData = await driverService.getDriverDeliveryTracking(driverData.id);
        console.log('📦 Delivery tracking loaded:', trackingData.length);
        
        // Process tracking data into assigned orders
        const assignedOrders: AssignedOrder[] = [];
        let todayCompleted = 0;
        let weeklyOrdersCount = 0;
        let weeklyEarningsTotal = 0;

        const today = new Date().toDateString();
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());

        trackingData.forEach((tracking) => {
          // Process tracking for stats (completed deliveries)
          if (tracking.status === 'delivered' && tracking.actualDeliveryTime) {
            const deliveryDate = new Date(tracking.actualDeliveryTime);
            
            if (deliveryDate.toDateString() === today) {
              todayCompleted++;
            }
            
            if (deliveryDate >= weekStart) {
              weeklyOrdersCount++;
              // Use actual order total if available
              weeklyEarningsTotal += tracking.orderTotal || 0;
            }
          }
          
          // Add to assigned orders if not delivered
          if (tracking.status !== 'delivered') {
            assignedOrders.push({
              id: tracking.orderId,
              customerName: tracking.customerName || '',
              pickupAddress: tracking.pickupLocation?.address || 'Address not available',
              deliveryAddress: tracking.deliveryLocation?.address || 'Address not available',
              status: tracking.status,
              orderTotal: tracking.orderTotal || 0,
              scheduledPickupTime: tracking.estimatedPickupTime || new Date().toISOString(),
              scheduledDeliveryTime: tracking.estimatedDeliveryTime || new Date().toISOString(),
              deliveryTracking: tracking,
              serviceType: '', // Will be populated by enhanceOrdersWithDetails
              orderDetails: {} // Will be populated by enhanceOrdersWithDetails
            });
          }
        });

        // Enhance orders with real data from Firestore
        if (assignedOrders.length > 0) {
          const enhancedOrders = await enhanceOrdersWithDetails(assignedOrders);
          assignedOrders.splice(0, assignedOrders.length, ...enhancedOrders);
        }

        setOrders(assignedOrders);
        setCompletedToday(todayCompleted);
        setWeeklyStats({ orders: weeklyOrdersCount, earnings: weeklyEarningsTotal });
        setLoading(false);
        setRefreshing(false);
        
      } catch (trackingError) {
        console.error('❌ Error loading delivery tracking:', trackingError);
        console.log('🔄 Showing empty state due to tracking error');
        
        // Set empty state instead of crashing
        setOrders([]);
        setCompletedToday(0);
        setWeeklyStats({ orders: 0, earnings: 0 });
        setLoading(false);
        setRefreshing(false);
      }
      
    } catch (error) {
      console.error('❌ Error loading driver data:', error);
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!driver) return;
    
    try {
      const newStatus = isOnline ? 'offline' : 'available';
      await driverService.updateDriverStatus(driver.id!, newStatus);
      setIsOnline(!isOnline);
      
      // Update local driver object
      setDriver({ ...driver, status: newStatus });
      
      Alert.alert(
        'Status Updated',
        `You are now ${newStatus === 'available' ? 'online and available for orders' : 'offline'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error updating driver status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const navigateToOrder = (orderId: string) => {
    router.push(`/navigate/${orderId}` as any);
  };

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return '#007AFF';
      case 'pickup_started': return '#FF9500';
      case 'picked_up': return '#34C759';
      case 'delivery_started': return '#5856D6';
      case 'delivered': return '#32D74B';
      default: return '#8E8E93';
    }
  };

  const renderHeader = () => (
    <>
      {/* Enhanced Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="list-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {orders.filter(o => o.status !== 'delivered').length}
          </Text>
          <Text style={styles.statLabel}>Assigned Orders</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.success + '15' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
          </View>
          <Text style={[styles.statNumber, { color: colors.success }]}>
            {completedToday}
          </Text>
          <Text style={styles.statLabel}>Completed Today</Text>
        </View>
      </View>

      {/* Weekly Stats Only */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.text + '10' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="trending-up-outline" size={24} color={colors.text} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {weeklyStats.orders}
          </Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </View>

      {/* Orders Section Header */}
      <View style={styles.ordersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Assigned Orders</Text>
          {orders.length > 0 && (
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="clipboard-outline" size={64} color="#E0E0E0" />
      </View>
      <Text style={styles.emptyText}>No orders assigned</Text>
      <Text style={styles.emptySubtext}>
        You'll receive notifications when new orders are assigned
      </Text>
      {!isOnline && (
        <TouchableOpacity 
          style={styles.goOnlineButton}
          onPress={toggleOnlineStatus}
        >
          <Text style={styles.goOnlineText}>Go Online to Receive Orders</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const handleMarkPaid = async (orderId: string, method: 'cash' | 'mpesa', amount?: number) => {
    try {
      setUpdatingId(orderId);
      await orderService.updateOrderPaymentStatus(orderId, {
        status: 'paid',
        method,
        amount,
        actorRole: 'driver',
      });

      // Optimistically reflect in local UI immediately
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? { ...o, orderDetails: { ...o.orderDetails, paymentStatus: 'paid' } }
            : o
        )
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const markPaymentReceived = (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) {
      Alert.alert('Error', 'Order details not found');
      return;
    }
    const amount = order.orderDetails?.total || 0;

    Alert.alert(
      'Confirm Payment',
      `Mark payment of KSh ${amount} as received?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await handleMarkPaid(id, 'cash', amount);
              Alert.alert('Success', 'Payment marked as received');
            } catch (e) {
              console.error('Error marking payment as received:', e);
              Alert.alert('Error', 'Failed to update payment status');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primary + 'DD']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Driver Dashboard</Text>
            <Text style={styles.driverName}>
              Welcome, {driver?.name || user?.displayName || 'Driver'}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isOnline ? colors.success + '40' : colors.error + '40' }
            ]}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: isOnline ? colors.success : colors.error }
              ]} />
              <Text style={styles.statusText}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <Switch
              style={styles.switch}
              value={isOnline}
              onValueChange={toggleOnlineStatus}
              trackColor={{ false: '#767577', true: colors.success }}
              thumbColor={isOnline ? '#f4f3f4' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={orders.filter(o => o.status !== 'delivered')}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => navigateToOrder(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderNumberContainer}>
                  <Text style={styles.orderNumber}>
                    #{item.id.slice(-6).toUpperCase()}
                  </Text>
                  <View style={[
                    styles.statusBadgeSmall,
                    { backgroundColor: getStatusColor(item.status) }
                  ]}>
                    <Text style={[
                      styles.orderStatus,
                      { color: '#FFFFFF' }
                    ]}>
                      {item.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.chevronContainer}>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </View>
              
              <View style={styles.orderBody}>
                <View style={styles.customerRow}>
                  <Ionicons name="person-outline" size={18} color="#007AFF" />
                  <Text style={styles.customerName}>{item.customerName}</Text>
                </View>
                
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={18} color="#34C759" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.address} numberOfLines={2}>
                      {item.pickupAddress}
                    </Text>
                    
                    {/* Simplified address details for driver view */}
                    {item.addressDetails && (
                      <View style={styles.quickAddressInfo}>
                        {item.addressDetails.buildingName && (
                          <View style={styles.addressChip}>
                            <Text style={styles.addressChipText}>
                              {item.addressDetails.buildingName}
                            </Text>
                          </View>
                        )}
                        {(item.addressDetails.floorNumber || item.addressDetails.doorNumber) && (
                          <View style={styles.addressChip}>
                            <Text style={styles.addressChipText}>
                              {item.addressDetails.floorNumber && `Fl ${item.addressDetails.floorNumber}`}
                              {item.addressDetails.floorNumber && item.addressDetails.doorNumber && ', '}
                              {item.addressDetails.doorNumber && `Dr ${item.addressDetails.doorNumber}`}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.orderFooter}>
                  <View style={styles.serviceContainer}>
                    <Ionicons name="shirt-outline" size={16} color={colors.primary} />
                    <Text style={styles.service}>{item.serviceType}</Text>
                  </View>
                  
                  {/* Show preferred delivery time instead of creation time */}
                  <View style={styles.timeContainer}>
                    {item.preferredDeliveryTime && (
                      <View style={styles.timeSection}>
                        <View style={styles.timeHeader}>
                          <Ionicons name="time-outline" size={20} color="#007AFF" />
                          <Text style={styles.timeTitle}>Preferred Delivery</Text>
                        </View>
                        <Text style={styles.timeDisplay}>
                          {new Date(item.preferredDeliveryTime).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })} at {new Date(item.preferredDeliveryTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    )}
                    
                    {item.pickupTime && (
                      <View style={styles.timeSection}>
                        <View style={styles.timeHeader}>
                          <Ionicons name="car-outline" size={20} color="#34C759" />
                          <Text style={styles.timeTitle}>Pickup Time</Text>
                        </View>
                        <Text style={styles.timeDisplay}>
                          {new Date(item.pickupTime).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })} at {new Date(item.pickupTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {/* Payment Section - Only for cash orders */}
                {(item.orderDetails?.paymentMethod === 'cash' || !item.orderDetails?.paymentMethod) && (
                  <View style={styles.paymentSection}>
                    <View style={styles.paymentInfo}>
                      <Ionicons name="cash-outline" size={18} color="#F59E0B" />
                      <Text style={styles.paymentText}>
                        Cash Payment: KSh {item.orderDetails?.total || 0}
                      </Text>
                    </View>
                    
                    {(!item.orderDetails?.paymentStatus || item.orderDetails?.paymentStatus === 'pending' || item.orderDetails?.paymentStatus === 'unpaid') ? (
                      <TouchableOpacity
                        style={[styles.paymentButton, updatingId === item.id && { opacity: 0.6 }]}
                        onPress={() => markPaymentReceived(item.id)}
                        disabled={updatingId === item.id}
                      >
                        <Text style={styles.paymentButtonText}>
                          {updatingId === item.id ? 'Updating...' : 'Mark as Paid'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.paymentConfirmed}>
                        <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                        <Text style={styles.paymentConfirmedText}>Payment Received</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  } as ViewStyle,
  centered: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  } as ViewStyle,
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  } as ViewStyle,
  headerContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  } as ViewStyle,
  headerLeft: {
    flex: 1,
  } as ViewStyle,
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  } as TextStyle,
  driverName: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  } as TextStyle,
  statusContainer: {
    alignItems: 'center' as const,
    gap: 12,
  } as ViewStyle,
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  } as ViewStyle,
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  } as TextStyle,
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  } as ViewStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  statsContainer: {
    flexDirection: 'row' as const,
    padding: 20,
    gap: 15,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  statIconContainer: {
    marginBottom: 8,
  } as ViewStyle,
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  } as TextStyle,
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
  } as TextStyle,
  ordersSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#333',
  } as TextStyle,
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF20',
  } as ViewStyle,
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 60,
  } as ViewStyle,
  emptyIconContainer: {
    marginBottom: 20,
  } as ViewStyle,
  emptyText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 8,
  } as TextStyle,
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center' as const,
    paddingHorizontal: 40,
    lineHeight: 22,
    marginBottom: 20,
  } as TextStyle,
  goOnlineButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  } as ViewStyle,
  goOnlineText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  } as TextStyle,
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden' as const,
  } as ViewStyle,
  orderHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  } as ViewStyle,
  orderNumberContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  } as ViewStyle,
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
  } as TextStyle,
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  } as ViewStyle,
  orderStatus: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  } as TextStyle,
  chevronContainer: {
    padding: 4,
  } as ViewStyle,
  orderBody: {
    padding: 16,
  } as ViewStyle,
  customerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 12,
  } as ViewStyle,
  customerName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600' as const,
  } as TextStyle,
  addressRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    marginBottom: 16,
  } as ViewStyle,
  address: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  } as TextStyle,
  quickAddressInfo: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 8,
  } as ViewStyle,
  addressChip: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b3d9f2',
  } as ViewStyle,
  addressChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#2563eb',
  } as TextStyle,
  orderFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  } as ViewStyle,
  serviceContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  } as ViewStyle,
  service: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500' as const,
    textTransform: 'capitalize' as const,
  } as TextStyle,
  timeContainer: {
    alignItems: 'flex-end' as const,
    gap: 4,
  } as ViewStyle,
  timeSection: {
    marginBottom: 8,
  } as ViewStyle,
  timeHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 2,
  } as ViewStyle,
  timeTitle: {
    fontSize: 16,  // Increased from 13
    color: '#666',
    fontWeight: '500' as const,
  } as TextStyle,
  timeDisplay: {
    fontSize: 18,  // Increased from 14
    color: '#333',
    fontWeight: '600' as const,
    marginLeft: 22,
  } as TextStyle,
  orderTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  } as TextStyle,
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  } as TextStyle,
  paymentSection: {
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 12,
    marginTop: 8,
  } as ViewStyle,
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  } as ViewStyle,
  paymentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F59E0B',
  } as TextStyle,
  paymentButton: {
    backgroundColor: '#34C759',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  } as ViewStyle,
  paymentButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  paymentConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#34C75920',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  } as ViewStyle,
  paymentConfirmedText: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '500',
  } as TextStyle,
  payButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#0A1931',
  },
  payButtonText: { color: '#fff', fontWeight: '600' },
};

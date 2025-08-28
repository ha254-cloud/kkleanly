import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Truck, User, MapPin, Clock, Package, CheckCircle, RefreshCw, ChevronDown, ChevronUp, CreditCard, Phone, Mail, Sparkles, FileText } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { driverService, Driver, generateVehicleNumber } from '../../services/driverService';
import { Order, orderService } from '../../services/orderService';
import { DriverDebugPanel } from '../../components/DriverDebugPanel';
import SimpleDeliveryReceipt from '../../components/SimpleDeliveryReceipt';
import { isCurrentUserAdmin, isCurrentUserAdminAsync } from '../../utils/adminAuth';

// Helper function to get status color
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

export default function DispatchScreen() {
  // wait for auth to be ready before making decisions
  const { user, loading: authLoading } = useAuth();
  const { orders, refreshOrders, error } = useAdminOrders();
  const colors = Colors.light;
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignedOrders, setAssignedOrders] = useState<Set<string>>(new Set());
  // Map of orderId -> assigned driver name
  const [assignedDriverNames, setAssignedDriverNames] = useState<Record<string, string>>({});
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin status properly using async function
  useEffect(() => {
    if (authLoading) return;
    
    let mounted = true;
    (async () => {
      try {
        const adminStatus = await isCurrentUserAdminAsync();
        console.log('🔐 Admin check result:', { 
          email: user?.email, 
          isAdmin: adminStatus 
        });
        if (mounted) setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Admin check error:', error);
        if (mounted) setIsAdmin(false);
      }
    })();
    
    return () => { mounted = false; };
  }, [authLoading, user?.email]);

  useEffect(() => {
    // Wait until auth is settled and admin check is complete
    if (authLoading || isAdmin === null) return;

    if (!isAdmin) {
      Alert.alert(
        'Access Denied',
        `This section is only available to administrators.\n\nRequired: kleanlyspt@gmail.com\nCurrent: ${user?.email || 'Not logged in'}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    console.log('✅ Admin access granted for:', user?.email);
    loadData();
  }, [authLoading, isAdmin, user?.email]);

  const loadData = async () => {
    try {
      setLoading(true);
      await refreshOrders();
      
  // Load all drivers so we can re-use drivers even if they are already busy (multiple concurrent orders)
  const allDrivers = await driverService.getAllDrivers();
  // Exclude offline drivers only; allow 'available' and 'busy'
  const availableDrivers = allDrivers.filter(d => d.status !== 'offline');
      
      // Check for orders that already have drivers assigned
      const currentAssigned = new Set<string>();
      const confirmedOrders = orders.filter(order => order.status === 'confirmed');
      
      const driverNameMap: Record<string,string> = {};
      for (const order of confirmedOrders) {
        try {
          // Check if this order has tracking data (indicates driver assignment)
          const trackingData = await driverService.getDeliveryTracking(order.id!);
          if (trackingData) {
            currentAssigned.add(order.id!);
            // Fetch driver name once
            if (trackingData.driverId) {
              try {
                const drv = await driverService.getDriverById(trackingData.driverId);
                if (drv?.name) driverNameMap[order.id!] = drv.name;
              } catch {}
            }
          }
        } catch (error) {
          // No tracking data found, order not assigned
        }
      }
      
      setAssignedOrders(currentAssigned);
      if (Object.keys(driverNameMap).length) setAssignedDriverNames(driverNameMap);
      
      // If no drivers exist, create test drivers
  if (availableDrivers.length === 0) {
        console.log('No drivers found, creating test drivers...');
        const testDrivers = [
          {
            name: 'John Kiprotich',
            phone: '+254712345678',
            email: 'john.driver@kleanly.co.ke',
            vehicleType: 'motorcycle' as const,
            vehicleNumber: generateVehicleNumber('motorcycle'),
            status: 'available' as const,
            rating: 4.8,
            totalDeliveries: 245,
            totalEarnings: 25000,
            averageDeliveryTime: 22,
            completionRate: 98,
            customerRatings: [],
            pendingPayouts: 0,
            activeDeliveries: 0,
            location: null,
            isOnline: true,
            lastActiveAt: new Date().toISOString(),
            performance: {
              todayDeliveries: 5,
              weeklyDeliveries: 28,
              monthlyDeliveries: 120,
              todayEarnings: 2500,
              weeklyEarnings: 12000,
              monthlyEarnings: 48000
            },
            preferences: {
              maxRadius: 25,
              preferredAreas: ['Nairobi CBD', 'Westlands', 'Karen'],
              notifications: {
                orders: true,
                payments: true,
                promotions: false
              }
            }
          },
          {
            name: 'Mary Wanjiku',
            phone: '+254723456789',
            email: 'mary.driver@kleanly.co.ke',
            vehicleType: 'car' as const,
            vehicleNumber: generateVehicleNumber('car'),
            status: 'available' as const,
            rating: 4.6,
            totalDeliveries: 189,
            totalEarnings: 19500,
            averageDeliveryTime: 25,
            completionRate: 96,
            customerRatings: [],
            pendingPayouts: 0,
            activeDeliveries: 0,
            location: null,
            isOnline: true,
            lastActiveAt: new Date().toISOString(),
            performance: {
              todayDeliveries: 3,
              weeklyDeliveries: 22,
              monthlyDeliveries: 95,
              todayEarnings: 1800,
              weeklyEarnings: 9500,
              monthlyEarnings: 38000
            },
            preferences: {
              maxRadius: 30,
              preferredAreas: ['Kileleshwa', 'Lavington', 'Kilimani'],
              notifications: {
                orders: true,
                payments: true,
                promotions: true
              }
            }
          },
          {
            name: 'Peter Otieno',
            phone: '+254734567890',
            email: 'peter.driver@kleanly.co.ke',
            vehicleType: 'van' as const,
            vehicleNumber: generateVehicleNumber('van'),
            status: 'available' as const,
            rating: 4.9,
            totalDeliveries: 312,
            totalEarnings: 42000,
            averageDeliveryTime: 28,
            completionRate: 99,
            customerRatings: [],
            pendingPayouts: 0,
            activeDeliveries: 0,
            location: null,
            isOnline: true,
            lastActiveAt: new Date().toISOString(),
            performance: {
              todayDeliveries: 7,
              weeklyDeliveries: 35,
              monthlyDeliveries: 150,
              todayEarnings: 3500,
              weeklyEarnings: 15000,
              monthlyEarnings: 60000
            },
            preferences: {
              maxRadius: 40,
              preferredAreas: ['Industrial Area', 'South B', 'South C', 'Embakasi'],
              notifications: {
                orders: true,
                payments: true,
                promotions: false
              }
            }
          }
        ];
        
        for (const driver of testDrivers) {
          await driverService.createDriver(driver);
        }
        
        // Reload drivers after creating them
        const newDrivers = await driverService.getAvailableDrivers();
        setDrivers(newDrivers);
      } else {
        setDrivers(availableDrivers);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReceipt = (order: Order) => {
    console.log('Admin: Sending receipt for order:', order.id);
    setSelectedReceiptOrder(order);
    setShowReceiptModal(true);
  };

  const handleAssignDriver = (order: Order) => {
    console.log('Admin: Assigning driver to order:', order.id);
    setSelectedOrder(order);
    setShowDriverModal(true);
  };

  const confirmDriverAssignment = async (driver: Driver) => {
    if (!selectedOrder) return;

    try {
      // Create pickup and delivery locations (mock data for demo)
      const pickupLocation = {
        latitude: -1.2921, // Nairobi coordinates
        longitude: 36.8219,
        address: 'Kleanly Pickup Center, Nairobi'
      };

      const deliveryLocation = {
        latitude: -1.2921 + (Math.random() - 0.5) * 0.1, // Random nearby location
        longitude: 36.8219 + (Math.random() - 0.5) * 0.1,
  // Prepend estate to address so drivers instantly see estate context
  address: selectedOrder.estate ? `${selectedOrder.estate}, ${selectedOrder.address}` : selectedOrder.address
      };

      const trackingId = await driverService.assignDriverToOrder(
        selectedOrder.id!,
        driver.id!,
        pickupLocation,
        deliveryLocation
      );

      // Update order status to confirmed using tracking ID
      await driverService.updateDeliveryStatus(trackingId, 'assigned');

      // Automatically update the order status to "confirmed" after driver assignment
      await orderService.updateOrderStatus(selectedOrder.id!, 'confirmed');

      // Track this order as assigned in local state
      setAssignedOrders(prev => new Set([...prev, selectedOrder.id!]));

      setShowDriverModal(false);
      setSelectedOrder(null);
      loadData();

      Alert.alert(
        'Driver Assigned Successfully!',
        `${driver.name} has been assigned to order #${selectedOrder.id?.slice(-6).toUpperCase()}\n\nStatus updated to ASSIGNED for admin view.\nOrder confirmed for customer.\nThe driver can now see this order in their dashboard.`
      );
    } catch (error) {
      console.error('Driver assignment error:', error);
      Alert.alert('Error', `Failed to assign driver: ${error.message || 'Unknown error'}`);
    }
  };

  const getOrderStatusColor = (status: Order['status']) => {
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

  // Get display status for admin view (shows "ASSIGNED" for confirmed orders with drivers)
  const getAdminDisplayStatus = (order: Order) => {
    if (assignedOrders.has(order.id!) && order.status === 'confirmed') {
      return 'ASSIGNED';
    }
    return (order.status || 'pending').toUpperCase();
  };

  // Get color for admin display status
  const getAdminStatusColor = (order: Order) => {
    if (assignedOrders.has(order.id!) && order.status === 'confirmed') {
      return '#10B981'; // Green for assigned
    }
    return getOrderStatusColor(order.status);
  };

  const formatOrderId = (id?: string) => {
    return id ? `#${id.slice(-6).toUpperCase()}` : '#------';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const renderOrderItems = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      return (
        <Text style={[styles.noItemsText, { color: colors.textSecondary }]}>
          No detailed items available
        </Text>
      );
    }

    return order.items.map((item, index) => (
      <View key={index} style={styles.orderItemRow}>
        <Text style={[styles.orderItemName, { color: colors.text }]}>
          • {item}
        </Text>
      </View>
    ));
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'mpesa':
        return '📱';
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      default:
        return '💰';
    }
  };

  // Filter orders that need driver assignment (pending or confirmed without driver)
  const ordersNeedingAssignment = orders.filter((order) => 
    order.status === 'pending' || order.status === 'confirmed'
  );

  // Prevent UI render until auth finished and admin check complete
  if (authLoading || isAdmin === null) {
    return null; // or a small loading indicator if you prefer
  }
  if (!isAdmin) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primary + 'E6']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dispatch Center</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setShowDebugPanel(true)} style={styles.debugButton}>
            <Text style={styles.debugButtonText}>🔧 Debug</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => loadData()} style={styles.refreshButton}>
            <RefreshCw size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Assign drivers to pending orders
        </Text>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
              <Package size={24} color={colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {ordersNeedingAssignment.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Pending Orders
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
              <User size={24} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {drivers.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Available Drivers
            </Text>
          </Card>
        </View>

        {/* Orders List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Orders Awaiting Assignment
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading orders...
            </Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={[styles.errorTitle, { color: colors.error }]}>
              ⚠️ Access Error
            </Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {error}
            </Text>
            <Text style={[styles.errorHint, { color: colors.textSecondary }]}>
              Only administrators can view all orders.
            </Text>
          </Card>
        ) : ordersNeedingAssignment.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Truck size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              All Orders Assigned
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No orders are currently waiting for driver assignment
            </Text>
          </Card>
        ) : (
          ordersNeedingAssignment.map((order) => (
            <Card key={`assignment-${order.id}`} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={[styles.orderId, { color: colors.text }]}>
                    {formatOrderId(order.id)}
                  </Text>
                  <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                    {formatDate(order.createdAt)}
                  </Text>
                </View>
                <View style={styles.orderHeaderActions}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getAdminStatusColor(order) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getAdminStatusColor(order) }
                    ]}>
                      {getAdminDisplayStatus(order)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => toggleOrderExpansion(order.id!)}
                    style={styles.expandButton}
                  >
                    {expandedOrders.has(order.id!) ? 
                      <ChevronUp size={20} color={colors.textSecondary} /> : 
                      <ChevronDown size={20} color={colors.textSecondary} />
                    }
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Package size={16} color={colors.primary} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {(order.category || 'service').replace('-', ' ').toUpperCase()
                    }
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <MapPin size={16} color={colors.success} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {order.address}
                  </Text>
                </View>
                {order.estate && (
                  <View style={[styles.detailRow, { marginTop: -4 }]}> 
                    <View style={{
                      backgroundColor: '#e0f2fe',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: '#7dd3fc'
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#075985' }}>Estate: {order.estate}</Text>
                    </View>
                  </View>
                )}
                {assignedOrders.has(order.id!) && assignedDriverNames[order.id!] && (
                  <View style={[styles.detailRow, { marginTop: 4 }]}> 
                    <Truck size={16} color={colors.primary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>Driver: {assignedDriverNames[order.id!]}</Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Clock size={16} color={colors.warning} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    KSH {(order.total || 0).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Payment Status Badge - NEWLY ADDED */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={[
                    styles.badge,
                    order.paymentStatus === 'paid' ? styles.badgePaid : styles.badgeUnpaid,
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                  </Text>
                </View>
                {order.paymentMethod ? (
                  <Text style={{ color: '#4A7FA7' }}>
                    {order.paymentMethod.toUpperCase()}
                  </Text>
                ) : null}
              </View>

              {/* Expanded Details */}
              {expandedOrders.has(order.id!) && (
                <View style={styles.expandedDetails}>
                  <View style={[styles.separator, { backgroundColor: colors.border }]} />
                  
                  {/* Customer Information */}
                  <View style={styles.detailSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      👤 Customer Information
                    </Text>
                    {order.customerName && (
                      <View style={styles.detailRow}>
                        <User size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          {order.customerName}
                        </Text>
                      </View>
                    )}
                    {order.customerName && (
                      <View style={styles.detailRow}>
                        <Phone size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          {order.customerName}
                        </Text>
                      </View>
                    )}
                    {order.customerEmail && (
                      <View style={styles.detailRow}>
                        <Mail size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          {order.customerEmail}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Order Items */}
                  <View style={styles.detailSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      📦 Order Items
                    </Text>
                    <View style={styles.itemsList}>
                      {renderOrderItems(order)}
                    </View>
                  </View>

                  {/* Payment & Special Requests */}
                  <View style={styles.detailSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      💳 Payment & Extras
                    </Text>
                    
                    {/* Extract payment method from notes */}
                    {order.notes && order.notes.includes('Payment:') && (
                      <View style={styles.detailRow}>
                        <CreditCard size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          {getPaymentMethodIcon(order.notes.split('Payment: ')[1]?.split(',')[0] || 'unknown')} {order.notes.split('Payment: ')[1]?.split(',')[0] || 'Not specified'}
                        </Text>
                      </View>
                    )}
                    
                    {/* Extract scent information from notes */}
                    {order.notes && order.notes.includes('Scent:') && (
                      <View style={styles.detailRow}>
                        <Sparkles size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          🌸 {order.notes.split('Scent: ')[1]?.split(',')[0] || 'Selected'}
                        </Text>
                      </View>
                    )}
                    
                    {/* Order Type */}
                    {order.notes && order.notes.includes('Order Type:') && (
                      <View style={styles.detailRow}>
                        <Package size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          📋 {order.notes.split('Order Type: ')[1]?.split(',')[0] || 'Standard'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Schedule Information */}
                  <View style={styles.detailSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      ⏰ Schedule
                    </Text>
                    {order.pickupTime && (
                      <View style={styles.detailRow}>
                        <Clock size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          Pickup: {order.pickupTime}
                        </Text>
                      </View>
                    )}
                    {order.preferredDeliveryTime && (
                      <View style={styles.detailRow}>
                        <Clock size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          Delivery: {order.preferredDeliveryTime}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Additional Notes */}
                  {order.notes && (
                    <View style={styles.detailSection}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        📝 Notes
                      </Text>
                      <View style={[styles.notesContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                          {order.notes}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {assignedOrders.has(order.id!) ? (
                <View style={[styles.assignedBadge, { backgroundColor: '#10B981' + '20' }]}>
                  <CheckCircle size={20} color="#10B981" />
                  <Text style={[styles.assignedText, { color: '#10B981' }]}>
                    Driver Assigned
                  </Text>
                </View>
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.primary + 'E6']}
                  style={styles.assignButtonGradient}
                >
                  <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => handleAssignDriver(order)}
                  >
                    <Truck size={20} color="#FFFFFF" />
                    <Text style={styles.assignButtonText}>Assign Driver</Text>
                  </TouchableOpacity>
                </LinearGradient>
              )}
            </Card>
          ))
        )}
        
        {/* All Orders - For Receipt Management */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 32 }]}>
          All Orders - Receipt Management
        </Text>
        
        {orders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Package size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Orders Found
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No orders available for receipt management
            </Text>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={`receipt-${order.id}`} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={[styles.orderId, { color: colors.text }]}>
                    {formatOrderId(order.id)}
                  </Text>
                  <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                    {formatDate(order.createdAt)}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(order.status) + '20' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(order.status) }
                  ]}>
                    {getAdminDisplayStatus(order)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Package size={16} color={colors.primary} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {(order.category || 'service').replace('-', ' ').toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <MapPin size={16} color={colors.success} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {order.address}
                  </Text>
                </View>
                {order.estate && (
                  <View style={[styles.detailRow, { marginTop: -4 }]}> 
                    <View style={{
                      backgroundColor: '#e0f2fe',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: '#7dd3fc'
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#075985' }}>Estate: {order.estate}</Text>
                    </View>
                  </View>
                )}
                {assignedOrders.has(order.id!) && assignedDriverNames[order.id!] && (
                  <View style={[styles.detailRow, { marginTop: 4 }]}> 
                    <Truck size={16} color={colors.primary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>Driver: {assignedDriverNames[order.id!]}</Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Clock size={16} color={colors.warning} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    KSH {(order.total || 0).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Send Receipt Button - Available for all orders */}
              <LinearGradient
                colors={['#059669', '#059669' + 'E6']}
                style={styles.assignButtonGradient}
              >
                <TouchableOpacity
                  style={styles.assignButton}
                  onPress={() => handleSendReceipt(order)}
                >
                  <Package size={20} color="#FFFFFF" />
                  <Text style={styles.assignButtonText}>Send Receipt</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Driver Selection Modal */}
      <Modal
        visible={showDriverModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDriverModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Driver
            </Text>
            <TouchableOpacity
              onPress={() => setShowDriverModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={[styles.modalCloseText, { color: colors.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedOrder && (
              <Card style={styles.selectedOrderCard}>
                <Text style={[styles.selectedOrderTitle, { color: colors.text }]}>
                  Order {formatOrderId(selectedOrder.id)}
                </Text>
                <Text style={[styles.selectedOrderDetails, { color: colors.textSecondary }]}>
                  {selectedOrder.category.replace('-', ' ')} • {selectedOrder.estate ? `${selectedOrder.estate}, ` : ''}{selectedOrder.address}
                </Text>
              </Card>
            )}

            <Text style={[styles.driversListTitle, { color: colors.text }]}>
              Available Drivers ({drivers.length})
            </Text>

            {drivers.length === 0 ? (
              <Card style={styles.noDriversCard}>
                <User size={48} color={colors.textSecondary} />
                <Text style={[styles.noDriversTitle, { color: colors.text }]}>
                  No Available Drivers
                </Text>
                <Text style={[styles.noDriversText, { color: colors.textSecondary }]}>
                  All drivers are currently busy or offline
                </Text>
              </Card>
            ) : (
              drivers.map((driver) => {
                const statusColor = driver.status === 'available' ? colors.success : driver.status === 'busy' ? colors.warning : colors.error;
                const badgeLabel = driver.status.toUpperCase();
                return (
                  <TouchableOpacity
                    key={driver.id}
                    onPress={() => {
                      const warning = driver.status === 'busy' ? '\n\nNote: Driver is currently BUSY and will have multiple active orders.' : '';
                      Alert.alert(
                        'Assign Driver',
                        `Assign ${driver.name} to order #${selectedOrder?.id?.slice(-6).toUpperCase()}?${warning}`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Assign', onPress: () => confirmDriverAssignment(driver) }
                        ]
                      );
                    }}
                  >
                    <Card style={styles.driverCard}>
                      <View style={styles.driverInfo}>
                        <View style={[styles.driverAvatar, { backgroundColor: colors.primary + '20' }]}>
                          <Text style={[styles.driverInitial, { color: colors.primary }]}>
                            {driver.name?.charAt(0)?.toUpperCase() || 'D'}
                          </Text>
                        </View>
                        <View style={styles.driverDetails}>
                          <Text style={[styles.driverName, { color: colors.text }]}>
                            {driver.name || 'Unknown Driver'}
                          </Text>
                          <Text style={[styles.driverVehicle, { color: colors.textSecondary }]}>
                            {driver.vehicleType ? (driver.vehicleType.charAt(0)?.toUpperCase() + driver.vehicleType.slice(1)) : 'Unknown'} • {driver.vehicleNumber || 'No plate'}
                          </Text>
                          <Text style={[styles.driverRating, { color: colors.warning }]}>
                            ⭐ {driver.rating?.toFixed(1) || '0.0'} ({driver.totalDeliveries || 0} deliveries)
                          </Text>
                        </View>
                        <View style={[styles.availableBadge, { backgroundColor: statusColor }]}>
                          <Text style={styles.availableText}>{badgeLabel}</Text>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
    })
  )}
</ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Debug Panel */}
      <DriverDebugPanel 
        visible={showDebugPanel} 
        onClose={() => setShowDebugPanel(false)} 
      />

      {/* Receipt Modal */}
      <Modal
        visible={showReceiptModal && selectedReceiptOrder !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowReceiptModal(false);
          setSelectedReceiptOrder(null);
        }}
      >
        {selectedReceiptOrder && (
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Delivery Receipt
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowReceiptModal(false);
                  setSelectedReceiptOrder(null);
                }}
                style={styles.modalCloseButton}
              >
                <Text style={[styles.modalCloseText, { color: colors.primary }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
            <SimpleDeliveryReceipt 
              order={selectedReceiptOrder} visible={false} onClose={function (): void {
                throw new Error('Function not implemented.');
              } }            />
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  orderCard: {
    marginBottom: 16,
    padding: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  assignButtonGradient: {
    borderRadius: 12,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  selectedOrderCard: {
    padding: 16,
    marginBottom: 20,
  },
  selectedOrderTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  selectedOrderDetails: {
    fontSize: 14,
  },
  driversListTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  noDriversCard: {
    padding: 40,
    alignItems: 'center',
  },
  noDriversTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  noDriversText: {
    fontSize: 14,
    textAlign: 'center',
  },
  driverCard: {
    marginBottom: 12,
    padding: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  driverInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  driverVehicle: {
    fontSize: 14,
    marginBottom: 2,
  },
  driverRating: {
    fontSize: 12,
  },
  availableBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availableText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  assignedText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  debugButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Enhanced order details styles
  orderHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expandButton: {
    padding: 4,
  },
  expandedDetails: {
    marginTop: 16,
  },
  separator: {
    height: 1,
    marginVertical: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  itemsList: {
    marginLeft: 8,
  },
  orderItemRow: {
    marginBottom: 4,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  noItemsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  notesContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  // New styles for payment status badge
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  badgePaid: { backgroundColor: '#16a34a20', borderWidth: 1, borderColor: '#16a34a' },
  badgeUnpaid: { backgroundColor: '#dc262620', borderWidth: 1, borderColor: '#dc2626' },
  badgeText: { color: '#0A1931', fontWeight: '700' },
});

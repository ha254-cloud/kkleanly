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
import { ArrowLeft, Truck, User, MapPin, Clock, Package, CheckCircle, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { driverService, Driver } from '../../services/driverService';
import { Order, orderService } from '../../services/orderService';

export default function DispatchScreen() {
  const { user } = useAuth();
  const { orders, refreshOrders, error } = useAdminOrders();
  const colors = Colors.light;
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignedOrders, setAssignedOrders] = useState<Set<string>>(new Set());

  // Check if user is admin
  const isAdmin = user?.email === 'admin@kleanly.co.ke';

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert(
        'Access Denied', 
        `This section is only available to administrators.\n\nRequired: admin@kleanly.co.ke\nCurrent: ${user?.email || 'Not logged in'}`, 
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }
    
    console.log('✅ Admin access granted for:', user?.email);
    loadData();
  }, [isAdmin, user?.email]);

  const loadData = async () => {
    try {
      setLoading(true);
      await refreshOrders();
      
      const availableDrivers = await driverService.getAvailableDrivers();
      
      // Check for orders that already have drivers assigned
      const currentAssigned = new Set<string>();
      const confirmedOrders = orders.filter(order => order.status === 'confirmed');
      
      for (const order of confirmedOrders) {
        try {
          // Check if this order has tracking data (indicates driver assignment)
          const trackingData = await driverService.getDeliveryTracking(order.id!);
          if (trackingData) {
            currentAssigned.add(order.id!);
          }
        } catch (error) {
          // No tracking data found, order not assigned
        }
      }
      
      setAssignedOrders(currentAssigned);
      
      // If no drivers exist, create test drivers
      if (availableDrivers.length === 0) {
        console.log('No drivers found, creating test drivers...');
        const testDrivers = [
          {
            name: 'John Kiprotich',
            phone: '+254712345678',
            email: 'john.driver@kleanly.co.ke',
            vehicleType: 'motorcycle' as const,
            vehicleNumber: 'KCA 123A',
            status: 'available' as const,
            rating: 4.8,
            totalDeliveries: 245,
          },
          {
            name: 'Mary Wanjiku',
            phone: '+254723456789',
            email: 'mary.driver@kleanly.co.ke',
            vehicleType: 'car' as const,
            vehicleNumber: 'KCB 456B',
            status: 'available' as const,
            rating: 4.6,
            totalDeliveries: 189,
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
        address: selectedOrder.address
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

  // Filter orders that need driver assignment (pending or confirmed without driver)
  const ordersNeedingAssignment = orders.filter((order) => 
    order.status === 'pending' || order.status === 'confirmed'
  );

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
            <Card key={order.id} style={styles.orderCard}>
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
                  { backgroundColor: getAdminStatusColor(order) + '20' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getAdminStatusColor(order) }
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
                
                <View style={styles.detailRow}>
                  <Clock size={16} color={colors.warning} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    KSH {(order.total || 0).toLocaleString()}
                  </Text>
                </View>
              </View>

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
                  {selectedOrder.category.replace('-', ' ')} • {selectedOrder.address}
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
              drivers.map((driver) => (
                <TouchableOpacity
                  key={driver.id}
                  onPress={() => {
                    Alert.alert(
                      'Assign Driver',
                      `Assign ${driver.name} to order #${selectedOrder?.id?.slice(-6).toUpperCase()}?`,
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
                          {driver.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.driverDetails}>
                        <Text style={[styles.driverName, { color: colors.text }]}>
                          {driver.name}
                        </Text>
                        <Text style={[styles.driverVehicle, { color: colors.textSecondary }]}>
                          {driver.vehicleType.charAt(0).toUpperCase() + driver.vehicleType.slice(1)} • {driver.vehicleNumber}
                        </Text>
                        <Text style={[styles.driverRating, { color: colors.warning }]}>
                          ⭐ {driver.rating.toFixed(1)} ({driver.totalDeliveries} deliveries)
                        </Text>
                      </View>
                      <View style={[styles.availableBadge, { backgroundColor: colors.success }]}>
                        <Text style={styles.availableText}>AVAILABLE</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
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
});

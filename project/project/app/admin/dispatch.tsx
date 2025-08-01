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
import { ArrowLeft, Truck, User, MapPin, Clock, Package } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { driverService, Driver } from '../../services/driverService';
import { Order } from '../../services/orderService';

export default function DispatchScreen() {
  const { user } = useAuth();
  const { orders, refreshOrders } = useOrders();
  const colors = Colors.light;
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  const isAdmin = user?.email === 'admin@kleanly.co.ke';

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'This section is only available to administrators.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }
    
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      await refreshOrders();
      const availableDrivers = await driverService.getAvailableDrivers();
      setDrivers(availableDrivers);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = (order: Order) => {
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

      await driverService.assignDriverToOrder(
        selectedOrder.id!,
        driver.id!,
        pickupLocation,
        deliveryLocation
      );

      // Update order status to confirmed
      await driverService.updateDeliveryStatus(selectedOrder.id!, 'assigned');

      setShowDriverModal(false);
      setSelectedOrder(null);
      loadData();

      Alert.alert(
        'Driver Assigned',
        `${driver.name} has been assigned to order #${selectedOrder.id?.slice(-6).toUpperCase()}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to assign driver');
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
        <View style={{ width: 24 }} />
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
                  { backgroundColor: getOrderStatusColor(order.status) + '20' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getOrderStatusColor(order.status) }
                  ]}>
                    {order.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Package size={16} color={colors.primary} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {order.category.replace('-', ' ').toUpperCase()}
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
                    KSH {order.total.toLocaleString()}
                  </Text>
                </View>
              </View>

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
                  onPress={() => confirmDriverAssignment(driver)}
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
});
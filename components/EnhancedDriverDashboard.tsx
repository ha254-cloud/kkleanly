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
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { 
  TrendingUp, 
  Clock, 
  Star, 
  DollarSign, 
  Package, 
  MapPin,
  Award,
  Target
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { driverService, Driver, EarningsRecord } from '../services/driverService';
import { orderService, Order } from '../services/orderService';
import { Colors } from '../constants/Colors';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface DriverStats {
  todayEarnings: number;
  todayDeliveries: number;
  weeklyEarnings: number;
  weeklyDeliveries: number;
  rating: number;
  completionRate: number;
  avgDeliveryTime: number;
}

export const EnhancedDriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);
  const [earnings, setEarnings] = useState<{
    today: number;
    week: number;
    month: number;
    total: number;
  }>({ today: 0, week: 0, month: 0, total: 0 });

  useEffect(() => {
    initializeDriver();
    loadDriverData();
  }, []);

  const initializeDriver = async () => {
    try {
      if (!user?.email) return;
      
      const drivers = await driverService.getAllDrivers();
      const currentDriver = drivers.find(d => d.email === user.email);
      
      if (currentDriver) {
        setDriver(currentDriver);
        setIsOnline(currentDriver.isOnline || false);
        setShiftActive(!!currentDriver.shift?.startTime && !currentDriver.shift?.endTime);
        await loadDriverStats(currentDriver.id!);
        await loadDriverOrders(currentDriver.id!);
        await loadDriverEarnings(currentDriver.id!);
      }
    } catch (error) {
      console.error('Error initializing driver:', error);
      Alert.alert('Error', 'Failed to load driver data');
    } finally {
      setLoading(false);
    }
  };

  const loadDriverData = async () => {
    if (driver) {
      await Promise.all([
        loadDriverStats(driver.id!),
        loadDriverOrders(driver.id!),
        loadDriverEarnings(driver.id!),
      ]);
    }
  };

  const loadDriverStats = async (driverId: string) => {
    try {
      const driverData = await driverService.getDriverById(driverId);
      if (driverData) {
        setStats({
          todayEarnings: driverData.performance?.todayEarnings || 0,
          todayDeliveries: driverData.performance?.todayDeliveries || 0,
          weeklyEarnings: driverData.performance?.weeklyEarnings || 0,
          weeklyDeliveries: driverData.performance?.weeklyDeliveries || 0,
          rating: driverData.rating || 0,
          completionRate: driverData.completionRate || 0,
          avgDeliveryTime: driverData.averageDeliveryTime || 0,
        });
      }
    } catch (error) {
      console.error('Error loading driver stats:', error);
    }
  };

  const loadDriverOrders = async (driverId: string) => {
    try {
      const driverOrders = await driverService.getDriverOrders(driverId);
      setOrders(driverOrders);
    } catch (error) {
      console.error('Error loading driver orders:', error);
    }
  };

  const loadDriverEarnings = async (driverId: string) => {
    try {
      const [todayEarnings, weekEarnings, monthEarnings, totalEarnings] = await Promise.all([
        driverService.getDriverEarnings(driverId, 'today'),
        driverService.getDriverEarnings(driverId, 'week'),
        driverService.getDriverEarnings(driverId, 'month'),
        driverService.getDriverEarnings(driverId, 'all'),
      ]);

      setEarnings({
        today: todayEarnings.totalEarnings,
        week: weekEarnings.totalEarnings,
        month: monthEarnings.totalEarnings,
        total: totalEarnings.totalEarnings,
      });
    } catch (error) {
      console.error('Error loading driver earnings:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!driver) return;

    try {
      const newStatus = isOnline ? 'offline' : 'available';
      await driverService.updateDriverStatus(driver.id!, newStatus);
      setIsOnline(!isOnline);

      // Start/end shift automatically
      if (!isOnline && !shiftActive) {
        await startShift();
      } else if (isOnline && shiftActive) {
        await endShift();
      }

      Alert.alert(
        'Status Updated',
        `You are now ${newStatus === 'available' ? 'online and available' : 'offline'}`
      );
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const startShift = async () => {
    if (!driver) return;
    
    try {
      await driverService.startDriverShift(driver.id!);
      setShiftActive(true);
      Alert.alert('Shift Started', 'Your shift has been started. Good luck with deliveries!');
    } catch (error) {
      console.error('Error starting shift:', error);
      Alert.alert('Error', 'Failed to start shift');
    }
  };

  const endShift = async () => {
    if (!driver) return;
    
    Alert.alert(
      'End Shift',
      'Are you sure you want to end your shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Shift',
          style: 'destructive',
          onPress: async () => {
            try {
              await driverService.endDriverShift(driver.id!);
              setShiftActive(false);
              setIsOnline(false);
              Alert.alert('Shift Ended', 'Your shift has been ended. Great work today!');
            } catch (error) {
              console.error('Error ending shift:', error);
              Alert.alert('Error', 'Failed to end shift');
            }
          },
        },
      ]
    );
  };

  const acceptOrder = async (orderId: string) => {
    try {
      await driverService.updateOrderStatus(orderId, 'confirmed');
      await loadDriverData();
      Alert.alert('Order Accepted', 'You have accepted this delivery');
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', 'Failed to accept order');
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await driverService.updateOrderStatus(orderId, status);
      await loadDriverData();
      
      // Update earnings if order is completed
      if (status === 'completed') {
        const order = orders.find(o => o.id === orderId);
        if (order && driver) {
          await driverService.updateDriverEarnings(driver.id!, order.total, 30); // 30 min avg delivery
          await loadDriverEarnings(driver.id!);
        }
      }
      
      Alert.alert('Success', `Order status updated to ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDriverData();
    setRefreshing(false);
  };

  const renderStatsCard = () => (
    <Card style={styles.statsCard}>
      <Text style={styles.statsTitle}>Today's Performance</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <DollarSign size={20} color={Colors.light.success} />
          <Text style={styles.statValue}>KSh {earnings.today.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </View>
        <View style={styles.statItem}>
          <Package size={20} color={Colors.light.primary} />
          <Text style={styles.statValue}>{stats?.todayDeliveries || 0}</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </View>
        <View style={styles.statItem}>
          <Star size={20} color={Colors.light.warning} />
          <Text style={styles.statValue}>{(stats?.rating || 0).toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statItem}>
          <Clock size={20} color={Colors.light.info} />
          <Text style={styles.statValue}>{Math.round(stats?.avgDeliveryTime || 0)}m</Text>
          <Text style={styles.statLabel}>Avg Time</Text>
        </View>
      </View>
    </Card>
  );

  const renderEarningsCard = () => (
    <Card style={styles.earningsCard}>
      <View style={styles.earningsHeader}>
        <Text style={styles.earningsTitle}>Earnings Overview</Text>
        <TouchableOpacity 
          onPress={() => router.push('/driver/earnings')}
          style={styles.viewMoreButton}
        >
          <Text style={styles.viewMoreText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.earningsRow}>
        <View style={styles.earningsItem}>
          <Text style={styles.earningsLabel}>This Week</Text>
          <Text style={styles.earningsValue}>KSh {earnings.week.toLocaleString()}</Text>
        </View>
        <View style={styles.earningsItem}>
          <Text style={styles.earningsLabel}>This Month</Text>
          <Text style={styles.earningsValue}>KSh {earnings.month.toLocaleString()}</Text>
        </View>
        <View style={styles.earningsItem}>
          <Text style={styles.earningsLabel}>Total</Text>
          <Text style={styles.earningsValue}>KSh {earnings.total.toLocaleString()}</Text>
        </View>
      </View>
    </Card>
  );

  const renderOrderItem = ({ item }: { item: Order }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.id?.slice(-6).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.customerName}>{item.recipient}</Text>
      <View style={styles.orderDetails}>
        <MapPin size={14} color={Colors.light.textSecondary} />
        <Text style={styles.address}>{item.address}</Text>
      </View>
      <Text style={styles.orderValue}>KSh {item.total.toLocaleString()}</Text>
      
      <View style={styles.orderActions}>
        {item.status === 'pending' && (
          <Button
            title="Accept"
            onPress={() => acceptOrder(item.id)}
            style={styles.actionButton}
          />
        )}
        {item.status === 'confirmed' && (
          <Button
            title="Start Pickup"
            onPress={() => updateOrderStatus(item.id, 'in-progress')}
            style={styles.actionButton}
          />
        )}
        {item.status === 'in-progress' && (
          <Button
            title="Complete"
            onPress={() => updateOrderStatus(item.id, 'completed')}
            style={styles.actionButton}
          />
        )}
        <Button
          title="Navigate"
          variant="outline"
          onPress={() => router.push(`/driver/navigate/${item.id}` as any)}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return Colors.light.warning;
      case 'confirmed': return Colors.light.primary;
      case 'in-progress': return Colors.light.info;
      case 'completed': return Colors.light.success;
      case 'cancelled': return Colors.light.error;
      default: return Colors.light.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.driverName}>{driver?.name}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={[styles.statusLabel, { color: isOnline ? Colors.light.success : Colors.light.error }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#D1D5DB', true: Colors.light.success }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Shift Controls */}
      {isOnline && (
        <Card style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <Text style={styles.shiftTitle}>
              {shiftActive ? 'Shift Active' : 'Ready to Start Shift'}
            </Text>
            {shiftActive && (
              <View style={styles.shiftBadge}>
                <Text style={styles.shiftBadgeText}>ACTIVE</Text>
              </View>
            )}
          </View>
          {!shiftActive && (
            <Button
              title="Start Shift"
              onPress={startShift}
              icon={<Clock size={16} color="#FFFFFF" />}
              style={styles.shiftButton}
            />
          )}
          {shiftActive && (
            <Button
              title="End Shift"
              onPress={endShift}
              variant="outline"
              style={styles.shiftButton}
            />
          )}
        </Card>
      )}

      {/* Stats Cards */}
      {renderStatsCard()}
      {renderEarningsCard()}

      {/* Active Orders */}
      <View style={styles.ordersSection}>
        <Text style={styles.sectionTitle}>Active Orders ({orders.length})</Text>
        {orders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Package size={48} color={Colors.light.textSecondary} />
            <Text style={styles.emptyText}>No active orders</Text>
            <Text style={styles.emptySubtext}>
              {isOnline ? 'New orders will appear here' : 'Go online to receive orders'}
            </Text>
          </Card>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/driver/earnings')}
          >
            <TrendingUp size={24} color={Colors.light.primary} />
            <Text style={styles.actionText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/driver/performance')}
          >
            <Award size={24} color={Colors.light.success} />
            <Text style={styles.actionText}>Performance</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/driver/history')}
          >
            <Clock size={24} color={Colors.light.info} />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/driver/settings' as any)}
          >
            <Ionicons name="settings" size={24} color={Colors.light.textSecondary} />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.light.surface,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  driverName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  shiftCard: {
    margin: 20,
    marginBottom: 0,
    padding: 16,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  shiftBadge: {
    backgroundColor: Colors.light.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shiftBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shiftButton: {
    marginTop: 8,
  },
  statsCard: {
    margin: 20,
    marginBottom: 0,
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  earningsCard: {
    margin: 20,
    marginBottom: 0,
    padding: 20,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    color: Colors.light.primary,
    marginRight: 4,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningsItem: {
    alignItems: 'center',
    flex: 1,
  },
  earningsLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  ordersSection: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  orderCard: {
    marginBottom: 12,
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  orderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  orderValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 12,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  actionsCard: {
    margin: 20,
    padding: 20,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 16,
  },
  actionText: {
    fontSize: 12,
    color: Colors.light.text,
    marginTop: 8,
    textAlign: 'center',
  },
});

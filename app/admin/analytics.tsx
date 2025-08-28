import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { orderService } from '../../services/orderService';
import { isCurrentUserAdmin, isCurrentUserAdminAsync } from '../../utils/adminAuth';

const { width } = Dimensions.get('window');

export default function AdminAnalyticsScreen() {
  const { user, loading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    recentOrders: []
  });

  // Check admin status properly using async function
  useEffect(() => {
    if (authLoading) return;
    
    let mounted = true;
    (async () => {
      try {
        const adminStatus = await isCurrentUserAdminAsync();
        console.log('🔐 Analytics Admin check result:', { 
          email: user?.email, 
          isAdmin: adminStatus 
        });
        if (mounted) setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Analytics Admin check error:', error);
        if (mounted) setIsAdmin(false);
      }
    })();
    
    return () => { mounted = false; };
  }, [authLoading, user?.email]);

  useEffect(() => {
    // wait until auth completes and admin check is done
    if (authLoading || isAdmin === null) return;

    // Check admin access after auth ready
    if (!isAdmin) {
      Alert.alert(
        'Access Denied',
        'This page is only accessible to administrators.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    loadAnalytics();
  }, [authLoading, isAdmin]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Subscribe to all orders for real-time analytics
      const unsubscribe = orderService.subscribeToAllOrders(
        (orders) => {
          console.log('📊 Admin Analytics: Received orders update:', orders.length);
          
          // Calculate statistics
          const totalOrders = orders.length;
          const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
          const activeOrders = orders.filter(o => ['pending', 'confirmed', 'in-progress'].includes(o.status)).length;
          const completedOrders = orders.filter(o => o.status === 'completed').length;
          const pendingOrders = orders.filter(o => o.status === 'pending').length;
          
          // Get unique customers
          const uniqueCustomers = new Set(orders.map(o => o.userID)).size;
          
          // Calculate average order value
          const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
          
          // Get recent orders (last 5)
          const recentOrders = orders
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

          setStats({
            totalOrders,
            totalRevenue,
            activeOrders,
            completedOrders,
            pendingOrders,
            totalCustomers: uniqueCustomers,
            averageOrderValue,
            recentOrders
          });
          
          setLoading(false);
        },
        (error) => {
          console.error('📊 Analytics error:', error);
          Alert.alert('Error', 'Failed to load analytics data');
          setLoading(false);
        }
      );

      // Cleanup subscription on unmount
      return () => unsubscribe?.();
    } catch (error) {
      console.error('📊 Analytics setup error:', error);
      Alert.alert('Error', 'Failed to initialize analytics');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
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

  // Prevent UI render until auth finished and admin check complete
  if (authLoading || isAdmin === null) {
    return null; // or a small loading indicator if you prefer
  }
  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading Analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
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
        <Text style={styles.headerTitle}>Admin Analytics</Text>
        <View style={styles.headerRight}>
          <BarChart3 size={24} color="#FFFFFF" />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.primary + '20' }]}>
              <ShoppingBag size={24} color={colors.primary} />
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {stats.totalOrders}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Total Orders
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#34C759' + '20' }]}>
              <DollarSign size={24} color="#34C759" />
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {formatCurrency(stats.totalRevenue)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Total Revenue
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#FF9500' + '20' }]}>
              <Clock size={24} color="#FF9500" />
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {stats.activeOrders}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Active Orders
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#007AFF' + '20' }]}>
              <Users size={24} color="#007AFF" />
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {stats.totalCustomers}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Customers
            </Text>
          </Card>
        </View>

        {/* Order Status Breakdown */}
        <Card style={styles.statusCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Order Status Breakdown
          </Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#FF9500' }]} />
              <Text style={[styles.statusText, { color: colors.text }]}>
                Pending: {stats.pendingOrders}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
              <Text style={[styles.statusText, { color: colors.text }]}>
                Completed: {stats.completedOrders}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#007AFF' }]} />
              <Text style={[styles.statusText, { color: colors.text }]}>
                Active: {stats.activeOrders}
              </Text>
            </View>
          </View>
          <View style={styles.averageOrderValue}>
            <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>
              Average Order Value
            </Text>
            <Text style={[styles.averageValue, { color: colors.primary }]}>
              {formatCurrency(stats.averageOrderValue)}
            </Text>
          </View>
        </Card>

        {/* Recent Orders */}
        <Card style={styles.recentOrdersCard}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Recent Orders
            </Text>
            <TouchableOpacity onPress={() => router.push('/admin-orders')}>
              <Text style={[styles.viewAllButton, { color: colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          
          {stats.recentOrders.length > 0 ? (
            stats.recentOrders.map((order: any, index: number) => (
              <View key={order.id || index} style={[styles.orderItem, { borderBottomColor: colors.border }]}>
                <View style={styles.orderLeft}>
                  <Text style={[styles.orderId, { color: colors.text }]}>
                    #{order.id?.slice(-8) || 'N/A'}
                  </Text>
                  <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={[styles.orderAmount, { color: colors.text }]}>
                    {formatCurrency(order.total || 0)}
                  </Text>
                  <View style={[styles.orderStatus, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                    <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.noOrdersText, { color: colors.textSecondary }]}>
              No recent orders found
            </Text>
          )}
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
              onPress={() => router.push('/admin-orders')}
            >
              <ShoppingBag size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>
                Manage Orders
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#007AFF' + '20' }]}
              onPress={() => router.push('/admin/drivers')}
            >
              <Users size={20} color="#007AFF" />
              <Text style={[styles.actionText, { color: '#007AFF' }]}>
                Driver Management
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: (width - 60) / 2,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statusCard: {
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '48%',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
  },
  averageOrderValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  averageLabel: {
    fontSize: 14,
  },
  averageValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentOrdersCard: {
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  orderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  noOrdersText: {
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  actionsCard: {
    padding: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});

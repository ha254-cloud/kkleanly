import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  MapPin, 
  Phone,
  CheckCircle,
  XCircle,
  Filter,
  Search
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { driverService } from '../../services/driverService';

interface OrderHistoryItem {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: 'completed' | 'cancelled' | 'in-progress';
  date: string;
  amount: number;
  tip?: number;
  rating?: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryTime?: string;
  notes?: string;
}

const DriverHistory = () => {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadOrderHistory();
  }, [filter]);

  const loadOrderHistory = async () => {
    try {
      setLoading(true);
      const driverId = 'current-driver-id'; // Get from auth context
      
      // Mock order history data - to be replaced with actual API call
      const mockOrders: OrderHistoryItem[] = [
        {
          id: '1',
          orderId: 'ORD-2025-001',
          customerName: 'Sarah Johnson',
          customerPhone: '+254712345678',
          pickupAddress: 'Westlands Shopping Mall, Nairobi',
          deliveryAddress: 'Karen Estate, House No. 45',
          status: 'completed',
          date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          amount: 1500,
          tip: 200,
          rating: 5,
          deliveryTime: '25 mins',
          items: [
            { name: 'Dry Cleaning - Suit', quantity: 1, price: 800 },
            { name: 'Shirt Laundry', quantity: 3, price: 700 }
          ],
          notes: 'Please handle with care - delicate fabric'
        },
        {
          id: '2',
          orderId: 'ORD-2025-002',
          customerName: 'Michael Chen',
          customerPhone: '+254798765432',
          pickupAddress: 'CBD Office Complex, Nairobi',
          deliveryAddress: 'Kilimani, ABC Apartments',
          status: 'completed',
          date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          amount: 2200,
          rating: 4,
          deliveryTime: '32 mins',
          items: [
            { name: 'Premium Cleaning Service', quantity: 1, price: 2200 }
          ]
        },
        {
          id: '3',
          orderId: 'ORD-2025-003',
          customerName: 'Grace Mwangi',
          customerPhone: '+254723456789',
          pickupAddress: 'Sarit Centre, Westlands',
          deliveryAddress: 'Muthaiga Estate',
          status: 'cancelled',
          date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          amount: 1800,
          items: [
            { name: 'Wash & Fold Service', quantity: 1, price: 1800 }
          ],
          notes: 'Customer cancelled due to emergency'
        }
      ];
      
      const filteredOrders = filter === 'all' 
        ? mockOrders 
        : mockOrders.filter(order => order.status === filter);
      
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error loading order history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrderHistory();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.light.success;
      case 'cancelled':
        return Colors.light.error;
      case 'in-progress':
        return Colors.light.warning;
      default:
        return Colors.light.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color={Colors.light.success} />;
      case 'cancelled':
        return <XCircle size={16} color={Colors.light.error} />;
      case 'in-progress':
        return <Clock size={16} color={Colors.light.warning} />;
      default:
        return <Package size={16} color={Colors.light.textSecondary} />;
    }
  };

  const handleOrderPress = (order: OrderHistoryItem) => {
    Alert.alert(
      'Order Details',
      `Order ID: ${order.orderId}\nCustomer: ${order.customerName}\nAmount: KSh ${order.amount.toLocaleString()}\nStatus: ${order.status}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Call Customer', onPress: () => handleCallCustomer(order.customerPhone) }
      ]
    );
  };

  const handleCallCustomer = (phone: string) => {
    // Implement phone call functionality
    console.log('Calling customer:', phone);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Text key={index} style={styles.star}>
        {index < Math.floor(rating) ? '★' : '☆'}
      </Text>
    ));
  };

  if (loading && orders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Order History</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading order history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Order History</Text>
        <TouchableOpacity>
          <Search size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'completed', 'cancelled'] as const).map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterTab,
              filter === filterOption && styles.activeFilterTab
            ]}
            onPress={() => setFilter(filterOption)}
          >
            <Text style={[
              styles.filterTabText,
              filter === filterOption && styles.activeFilterTabText
            ]}>
              {filterOption ? (filterOption.charAt(0)?.toUpperCase() + filterOption.slice(1)) : 'Filter'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {orders.length > 0 ? (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => handleOrderPress(order)}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>#{order.orderId}</Text>
                  <View style={styles.statusContainer}>
                    {getStatusIcon(order.status)}
                    <Text style={[styles.status, { color: getStatusColor(order.status) }]}>
                      {order.status ? (order.status.charAt(0)?.toUpperCase() + order.status.slice(1)) : 'Unknown'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.amount}>KSh {order.amount.toLocaleString()}</Text>
              </View>

              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{order.customerName}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>

              <View style={styles.addressContainer}>
                <View style={styles.addressRow}>
                  <MapPin size={14} color={Colors.light.primary} />
                  <Text style={styles.addressText} numberOfLines={1}>
                    Pickup: {order.pickupAddress}
                  </Text>
                </View>
                <View style={styles.addressRow}>
                  <MapPin size={14} color={Colors.light.success} />
                  <Text style={styles.addressText} numberOfLines={1}>
                    Delivery: {order.deliveryAddress}
                  </Text>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.leftFooter}>
                  {order.deliveryTime && (
                    <View style={styles.timeContainer}>
                      <Clock size={14} color={Colors.light.textSecondary} />
                      <Text style={styles.deliveryTime}>{order.deliveryTime}</Text>
                    </View>
                  )}
                  {order.rating && (
                    <View style={styles.ratingContainer}>
                      {renderStars(order.rating)}
                    </View>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.phoneButton}
                  onPress={() => handleCallCustomer(order.customerPhone)}
                >
                  <Phone size={16} color={Colors.light.primary} />
                </TouchableOpacity>
              </View>

              {order.tip && (
                <View style={styles.tipContainer}>
                  <Text style={styles.tipText}>Tip: KSh {order.tip.toLocaleString()}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Package size={64} color={Colors.light.border} />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? 'You haven\'t completed any orders yet.' 
                : `No ${filter} orders found.`}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
  },
  activeFilterTab: {
    backgroundColor: Colors.light.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  activeFilterTabText: {
    color: 'white',
  },
  filterButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  orderCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  addressContainer: {
    marginBottom: 12,
    gap: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 14,
    color: Colors.light.warning,
  },
  phoneButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  tipContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  tipText: {
    fontSize: 12,
    color: Colors.light.success,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DriverHistory;

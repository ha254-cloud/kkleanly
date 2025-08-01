import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Package, Clock, CheckCircle, Truck, Search, Filter } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useOrders } from '../../context/OrderContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { OrderCard } from '../../components/OrderCard';
import { Order } from '../../services/orderService';

export default function OrdersScreen() {
  const { isDark } = useTheme();
  const { orders, refreshOrders, loading } = useOrders();
  const colors = isDark ? Colors.dark : Colors.light;
  const [selectedFilter, setSelectedFilter] = useState<'all' | Order['status']>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshOrders();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh orders');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredOrders = selectedFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedFilter);

  const getStatusCount = (status: Order['status']) => {
    return orders.filter(order => order.status === status).length;
  };

  const filterOptions = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'pending', label: 'Pending', count: getStatusCount('pending') },
    { id: 'confirmed', label: 'Confirmed', count: getStatusCount('confirmed') },
    { id: 'in-progress', label: 'In Progress', count: getStatusCount('in-progress') },
    { id: 'completed', label: 'Completed', count: getStatusCount('completed') },
  ];

  const handleOrderPress = (order: Order) => {
    // Navigate to order details or tracking
    router.push(`/(tabs)/track`);
  };

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
        <Text style={styles.headerTitle}>Order History</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/track')} style={styles.searchButton}>
          <Search size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: selectedFilter === filter.id ? colors.primary : colors.surface,
                    borderColor: selectedFilter === filter.id ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setSelectedFilter(filter.id as any)}
              >
                <Text style={[
                  styles.filterTabText,
                  { color: selectedFilter === filter.id ? '#FFFFFF' : colors.text }
                ]}>
                  {filter.label}
                </Text>
                {filter.count > 0 && (
                  <View style={[
                    styles.filterBadge,
                    { backgroundColor: selectedFilter === filter.id ? 'rgba(255,255,255,0.3)' : colors.primary }
                  ]}>
                    <Text style={[
                      styles.filterBadgeText,
                      { color: selectedFilter === filter.id ? '#FFFFFF' : '#FFFFFF' }
                    ]}>
                      {filter.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Orders List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Package size={48} color={colors.textSecondary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading your orders...
            </Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={[colors.primary + '10', colors.primary + '05']}
              style={styles.emptyGradient}
            >
              <Card style={styles.emptyCard}>
                <Package size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {selectedFilter === 'all' ? 'No Orders Yet' : `No ${selectedFilter} Orders`}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {selectedFilter === 'all' 
                    ? 'Start by booking your first laundry service!'
                    : `You don't have any ${selectedFilter} orders at the moment.`
                  }
                </Text>
                {selectedFilter === 'all' && (
                  <LinearGradient
                    colors={[colors.primary, colors.primary + 'E6']}
                    style={styles.emptyButtonGradient}
                  >
                    <TouchableOpacity
                      style={styles.emptyButton}
                      onPress={() => router.push('/(tabs)/order')}
                    >
                      <Text style={styles.emptyButtonText}>Book Service</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                )}
              </Card>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => handleOrderPress(order)}
              />
            ))}
          </View>
        )}
      </ScrollView>
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
  searchButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  filterSection: {
    paddingVertical: 16,
  },
  filterContainer: {
    paddingLeft: 20,
  },
  filterContent: {
    paddingRight: 20,
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
  },
  emptyGradient: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButtonGradient: {
    borderRadius: 16,
  },
  emptyButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  ordersList: {
    padding: 12,
  },
});
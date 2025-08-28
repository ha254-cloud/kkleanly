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
import { useTheme } from '../context/ThemeContext';
import { useOrders } from '../context/OrderContext';
import { Colors } from '../constants/Colors';
import { Card } from '../components/ui/Card';
import { OrderCard } from '../components/OrderCard';
import { Order } from '../services/orderService';

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

  const handleOrderUpdated = () => {
    refreshOrders();
  };

  const filteredOrders = selectedFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedFilter);

  const getStatusCount = (status: Order['status']) => {
    return orders.filter(order => order.status === status).length;
  };

  const filterOptions = [
    { key: 'all' as const, label: 'All', count: orders.length, icon: Package },
    { key: 'pending' as const, label: 'Pending', count: getStatusCount('pending'), icon: Clock },
    { key: 'confirmed' as const, label: 'Confirmed', count: getStatusCount('confirmed'), icon: CheckCircle },
    { key: 'in-progress' as const, label: 'In Progress', count: getStatusCount('in-progress'), icon: Truck },
    { key: 'completed' as const, label: 'Completed', count: getStatusCount('completed'), icon: CheckCircle },
    { key: 'cancelled' as const, label: 'Cancelled', count: getStatusCount('cancelled'), icon: Package },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={
            (Array.isArray(colors.gradient.primary) && colors.gradient.primary.length >= 2
              ? colors.gradient.primary
              : ['#4F8EF7', '#3066BE']) as [string, string, ...string[]]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>My Orders</Text>
              <Text style={styles.headerSubtitle}>
                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.searchButton}>
              <Search size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filterOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedFilter === option.key;
            
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterTab,
                  { 
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setSelectedFilter(option.key)}
              >
                <Icon 
                  size={16} 
                  color={isSelected ? '#FFFFFF' : colors.textSecondary} 
                />
                <Text style={[
                  styles.filterTabText,
                  { 
                    color: isSelected ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: isSelected ? '600' : '500',
                  }
                ]}>
                  {option.label}
                </Text>
                {option.count > 0 && (
                  <View style={[
                    styles.countBadge,
                    { 
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.3)' : colors.primary + '20',
                    }
                  ]}>
                    <Text style={[
                      styles.countText,
                      { color: isSelected ? '#FFFFFF' : colors.primary }
                    ]}>
                      {option.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
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
        {loading && orders.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading orders...
            </Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {selectedFilter === 'all' ? 'No orders yet' : `No ${selectedFilter} orders`}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {selectedFilter === 'all' 
                ? 'Your orders will appear here once you place them'
                : `You don't have any ${selectedFilter} orders at the moment`
              }
            </Text>
            {selectedFilter === 'all' && (
              <TouchableOpacity 
                style={[styles.createOrderButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/order')}
              >
                <Text style={styles.createOrderText}>Place Your First Order</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.ordersList}>
            {filteredOrders.map((order, index) => (
              <OrderCard
                key={`${order.id}-${index}`}
                order={order}
                onPress={() => router.push(`/(tabs)/order-details/${order.id}` as any)}
                onOrderUpdated={handleOrderUpdated}
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
    marginBottom: 0,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterTabText: {
    fontSize: 14,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createOrderButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  createOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ordersList: {
    paddingBottom: 40,
  },
});
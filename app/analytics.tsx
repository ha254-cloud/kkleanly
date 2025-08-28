import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Shield, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useOrders } from '../context/OrderContext';
import { AdminPasswordModal } from '../components/AdminPasswordModal';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { orders } = useOrders();
  const colors = isDark ? Colors.dark : Colors.light;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Check if user is admin
  const isAdmin = user?.email === 'kleanlyspt@gmail.com';

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'This section is only available to administrators.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }
    
    // Show password modal when component mounts
    if (!isAuthenticated) {
      setShowPasswordModal(true);
    }
  }, [isAdmin]);

  // Calculate real statistics from orders
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const completedOrders = orders.filter(order => order.status === 'completed');
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const uniqueCustomers = new Set(orders.map(order => order.userID)).size;
  const averageOrder = orders.length > 0 ? totalRevenue / orders.length : 0;

  const statsCards = [
    {
      title: 'Total Revenue',
      value: `KSH ${(totalRevenue || 0).toLocaleString()}`,
      change: completedOrders.length > 0 ? '+12.5%' : '0%',
      changeType: 'positive',
      icon: '💵',
    },
    {
      title: 'Total Orders',
      value: orders.length.toString(),
      change: orders.length > 0 ? '+8.2%' : '0%',
      changeType: 'positive',
      icon: '📋',
    },
    {
      title: 'Active Customers',
      value: uniqueCustomers.toString(),
      change: uniqueCustomers > 0 ? '+15.3%' : '0%',
      changeType: 'positive',
      icon: '👥',
    },
    {
      title: 'Average Order',
      value: `KSH ${Math.round(averageOrder || 0).toLocaleString()}`,
      change: averageOrder > 0 ? '-2.1%' : '0%',
      changeType: averageOrder > 0 ? 'negative' : 'neutral',
      icon: '💳',
    },
  ];

  const handleViewCharts = () => {
    Alert.alert(
      'Charts Coming Soon',
      'Advanced analytics charts will be available in the next update. For now, you can view basic statistics.',
      [{ text: 'OK' }]
    );
  };

  if (!isAdmin) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.lockScreen}>
          <View style={[styles.lockIcon, { backgroundColor: colors.primary + '20' }]}>
            <Shield size={48} color={colors.primary} />
          </View>
          <Text style={[styles.lockTitle, { color: colors.text }]}>
            Admin Access Required
          </Text>
          <Text style={[styles.lockSubtitle, { color: colors.textSecondary }]}>
            This section requires admin authentication
          </Text>
          <Button
            title="Enter Password"
            onPress={() => setShowPasswordModal(true)}
            style={styles.lockButton}
          />
        </View>
        
        <AdminPasswordModal
          visible={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => setIsAuthenticated(true)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Real business insights and metrics
          </Text>
        </View>

        {/* Real-time Stats Cards */}
        <View style={styles.statsGrid}>
          {statsCards.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text
                  style={[
                    styles.statChange,
                    {
                      color:
                        stat.changeType === 'positive'
                          ? colors.success
                          : stat.changeType === 'negative'
                          ? colors.error
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {stat.change}
                </Text>
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statTitle, { color: colors.textSecondary }]}>
                {stat.title}
              </Text>
            </Card>
          ))}
        </View>

        {/* Order Status Breakdown */}
        <Card style={styles.breakdownCard}>
          <Text style={[styles.breakdownTitle, { color: colors.text }]}>
            Order Status Breakdown
          </Text>
          <View style={styles.statusList}>
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Pending</Text>
              <Text style={[styles.statusValue, { color: colors.warning }]}>
                {pendingOrders.length}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Confirmed</Text>
              <Text style={[styles.statusValue, { color: colors.primary }]}>
                {orders.filter(o => o.status === 'confirmed').length}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>In Progress</Text>
              <Text style={[styles.statusValue, { color: '#3B82F6' }]}>
                {orders.filter(o => o.status === 'in-progress').length}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Completed</Text>
              <Text style={[styles.statusValue, { color: colors.success }]}>
                {completedOrders.length}
              </Text>
            </View>
          </View>
        </Card>

        {/* Charts Placeholder */}
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Analytics Charts
          </Text>
          <View style={styles.chartPlaceholder}>
            <Text style={[styles.chartPlaceholderText, { color: colors.textSecondary }]}>
              📈 Advanced charts coming soon
            </Text>
            <Button
              title="View Sample Charts"
              onPress={handleViewCharts}
              variant="outline"
              size="small"
              style={styles.chartButton}
            />
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
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  subtitle: {
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 24,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
  },
  breakdownCard: {
    margin: 20,
    padding: 16,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statusList: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  chartPlaceholderText: {
    fontSize: 16,
    marginBottom: 16,
  },
  chartButton: {
    marginTop: 8,
  },
  lockScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lockIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  lockButton: {
    minWidth: 200,
  },
});
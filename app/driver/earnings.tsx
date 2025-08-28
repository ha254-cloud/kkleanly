import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Award } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors } from '../../constants/Colors';
import { driverService } from '../../services/driverService';

interface EarningsData {
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  totalEarnings: number;
  ordersCompleted: number;
  averageOrderValue: number;
  tips: number;
  bonuses: number;
  earningsHistory: Array<{
    date: string;
    amount: number;
    orders: number;
  }>;
}

const DriverEarnings = () => {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'today'>('week');
  const [refreshing, setRefreshing] = useState(false);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadEarningsData();
  }, [selectedPeriod]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      const driverId = 'current-driver-id'; // Get from auth context
      const rawData = await driverService.getDriverEarnings(driverId, selectedPeriod);
      
      // Transform the data to match our interface
      const earningsData: EarningsData = {
        todayEarnings: selectedPeriod === 'today' ? rawData.totalEarnings : 0,
        weeklyEarnings: selectedPeriod === 'week' ? rawData.totalEarnings : 0,
        monthlyEarnings: selectedPeriod === 'month' ? rawData.totalEarnings : 0,
        totalEarnings: rawData.totalEarnings,
        ordersCompleted: rawData.totalOrders,
        averageOrderValue: rawData.averageOrderValue,
        tips: 0, // Calculate from records if available
        bonuses: 0, // Calculate from records if available
        earningsHistory: rawData.records?.map((record: any) => ({
          date: record.date || new Date().toISOString(),
          amount: record.amount || 0,
          orders: record.orders || 0,
        })) || []
      };
      
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  };

  const chartData = {
    labels: earnings?.earningsHistory.slice(-7).map(item => 
      new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    ) || [],
    datasets: [{
      data: earnings?.earningsHistory.slice(-7).map(item => item.amount) || [],
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      strokeWidth: 2
    }]
  };

  const orderChartData = {
    labels: earnings?.earningsHistory.slice(-7).map(item => 
      new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    ) || [],
    datasets: [{
      data: earnings?.earningsHistory.slice(-7).map(item => item.orders) || []
    }]
  };

  const chartConfig = {
    backgroundColor: Colors.light.background,
    backgroundGradientFrom: Colors.light.background,
    backgroundGradientTo: Colors.light.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: Colors.light.primary
    }
  };

  if (loading && !earnings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Earnings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading earnings...</Text>
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
        <Text style={styles.title}>Earnings</Text>
        <TouchableOpacity>
          <Calendar size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.primaryCard]}>
            <DollarSign size={24} color="white" />
            <Text style={styles.summaryAmount}>KSh {earnings?.todayEarnings?.toLocaleString() || '0'}</Text>
            <Text style={styles.summaryLabel}>Today's Earnings</Text>
          </View>

          <View style={styles.summaryCard}>
            <TrendingUp size={20} color={Colors.light.primary} />
            <Text style={styles.summaryValue}>KSh {earnings?.weeklyEarnings?.toLocaleString() || '0'}</Text>
            <Text style={styles.summaryTitle}>This Week</Text>
          </View>

          <View style={styles.summaryCard}>
            <Award size={20} color={Colors.light.success} />
            <Text style={styles.summaryValue}>KSh {earnings?.monthlyEarnings?.toLocaleString() || '0'}</Text>
            <Text style={styles.summaryTitle}>This Month</Text>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'today'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.selectedPeriodButton
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.selectedPeriodButtonText
              ]}>
                {period ? (period.charAt(0)?.toUpperCase() + period.slice(1)) : 'Period'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Earnings Trend</Text>
          {earnings?.earningsHistory && earnings.earningsHistory.length > 0 ? (
            <LineChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No earnings data available</Text>
            </View>
          )}
        </View>

        {/* Orders Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Orders Completed</Text>
          {earnings?.earningsHistory && earnings.earningsHistory.length > 0 ? (
            <BarChart
              data={orderChartData}
              width={screenWidth - 40}
              height={200}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={styles.chart}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No order data available</Text>
            </View>
          )}
        </View>

        {/* Breakdown Section */}
        <View style={styles.breakdownContainer}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Base Earnings</Text>
            <Text style={styles.breakdownValue}>
              KSh {((earnings?.totalEarnings || 0) - (earnings?.tips || 0) - (earnings?.bonuses || 0)).toLocaleString()}
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Tips</Text>
            <Text style={styles.breakdownValue}>KSh {earnings?.tips?.toLocaleString() || '0'}</Text>
          </View>

          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Bonuses</Text>
            <Text style={styles.breakdownValue}>KSh {earnings?.bonuses?.toLocaleString() || '0'}</Text>
          </View>

          <View style={[styles.breakdownItem, styles.totalItem]}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalValue}>KSh {earnings?.totalEarnings?.toLocaleString() || '0'}</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Performance Stats</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{earnings?.ordersCompleted || 0}</Text>
              <Text style={styles.statLabel}>Orders Completed</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>KSh {earnings?.averageOrderValue?.toLocaleString() || '0'}</Text>
              <Text style={styles.statLabel}>Avg. Order Value</Text>
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
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
  summaryGrid: {
    padding: 20,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: Colors.light.card,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryCard: {
    backgroundColor: Colors.light.primary,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  summaryTitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  selectedPeriodButton: {
    backgroundColor: Colors.light.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  selectedPeriodButtonText: {
    color: 'white',
  },
  chartContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  breakdownContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  breakdownLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  totalItem: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: Colors.light.primary,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 20,
  },
  statRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});

export default DriverEarnings;

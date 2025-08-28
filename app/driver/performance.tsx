import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Target,
  Award,
  Calendar
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { driverService } from '../../services/driverService';

interface PerformanceData {
  rating: number;
  totalRatings: number;
  completionRate: number;
  onTimeRate: number;
  totalDeliveries: number;
  averageDeliveryTime: number;
  customerSatisfaction: number;
  monthlyGoal: number;
  monthlyProgress: number;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    earnedAt: string;
  }>;
  recentRatings: Array<{
    id: string;
    rating: number;
    comment: string;
    date: string;
    orderId: string;
  }>;
  performanceHistory: Array<{
    date: string;
    deliveries: number;
    rating: number;
    onTime: boolean;
  }>;
}

const DriverPerformance = () => {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'ratings' | 'badges'>('overview');

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const driverId = 'current-driver-id'; // Get from auth context
      
      // Mock performance data for now - to be replaced with actual API call
      const performanceData: PerformanceData = {
        rating: 4.7,
        totalRatings: 156,
        completionRate: 95.2,
        onTimeRate: 88.5,
        totalDeliveries: 234,
        averageDeliveryTime: 28,
        customerSatisfaction: 92.3,
        monthlyGoal: 100,
        monthlyProgress: 67,
        badges: [
          {
            id: '1',
            name: 'Speed Demon',
            icon: 'zap',
            description: 'Complete 50 deliveries in record time',
            earnedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Customer Favorite',
            icon: 'heart',
            description: 'Maintain 4.5+ rating for 30 days',
            earnedAt: new Date().toISOString(),
          }
        ],
        recentRatings: [
          {
            id: '1',
            rating: 5,
            comment: 'Excellent service, very fast delivery!',
            date: new Date().toISOString(),
            orderId: 'ORD-001',
          },
          {
            id: '2',
            rating: 4,
            comment: 'Good service, arrived on time.',
            date: new Date().toISOString(),
            orderId: 'ORD-002',
          }
        ],
        performanceHistory: []
      };
      
      setPerformance(performanceData);
    } catch (error) {
      console.error('Error loading performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPerformanceData();
    setRefreshing(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        color={index < Math.floor(rating) ? Colors.light.warning : Colors.light.border}
        fill={index < Math.floor(rating) ? Colors.light.warning : 'transparent'}
      />
    ));
  };

  const renderOverview = () => (
    <View>
      {/* Rating Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Rating</Text>
        <View style={styles.ratingContainer}>
          <View style={styles.ratingDisplay}>
            <Text style={styles.ratingValue}>{performance?.rating?.toFixed(1) || '0.0'}</Text>
            <View style={styles.starsContainer}>
              {renderStars(performance?.rating || 0)}
            </View>
            <Text style={styles.ratingCount}>
              Based on {performance?.totalRatings || 0} reviews
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <CheckCircle size={24} color={Colors.light.success} />
            <Text style={styles.metricValue}>{performance?.completionRate?.toFixed(1) || '0'}%</Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
          </View>

          <View style={styles.metricCard}>
            <Clock size={24} color={Colors.light.info} />
            <Text style={styles.metricValue}>{performance?.onTimeRate?.toFixed(1) || '0'}%</Text>
            <Text style={styles.metricLabel}>On-Time Delivery</Text>
          </View>

          <View style={styles.metricCard}>
            <Target size={24} color={Colors.light.primary} />
            <Text style={styles.metricValue}>{performance?.totalDeliveries || 0}</Text>
            <Text style={styles.metricLabel}>Total Deliveries</Text>
          </View>

          <View style={styles.metricCard}>
            <TrendingUp size={24} color={Colors.light.warning} />
            <Text style={styles.metricValue}>{performance?.averageDeliveryTime || 0} min</Text>
            <Text style={styles.metricLabel}>Avg. Delivery Time</Text>
          </View>
        </View>
      </View>

      {/* Monthly Goal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Goal</Text>
        <View style={styles.goalContainer}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Delivery Target</Text>
            <Text style={styles.goalValue}>
              {performance?.monthlyProgress || 0} / {performance?.monthlyGoal || 0}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(
                    ((performance?.monthlyProgress || 0) / (performance?.monthlyGoal || 1)) * 100, 
                    100
                  )}%` 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(((performance?.monthlyProgress || 0) / (performance?.monthlyGoal || 1)) * 100)}% Complete
          </Text>
        </View>
      </View>

      {/* Customer Satisfaction */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Satisfaction</Text>
        <View style={styles.satisfactionContainer}>
          <View style={styles.satisfactionScore}>
            <Text style={styles.satisfactionValue}>
              {performance?.customerSatisfaction?.toFixed(1) || '0.0'}%
            </Text>
            <Text style={styles.satisfactionLabel}>Satisfaction Score</Text>
          </View>
          <Text style={styles.satisfactionDescription}>
            Based on customer feedback and ratings from recent deliveries.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderRatings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Ratings & Reviews</Text>
      {performance?.recentRatings && performance.recentRatings.length > 0 ? (
        performance.recentRatings.map((rating) => (
          <View key={rating.id} style={styles.ratingItem}>
            <View style={styles.ratingHeader}>
              <View style={styles.ratingStars}>
                {renderStars(rating.rating)}
              </View>
              <Text style={styles.ratingDate}>
                {new Date(rating.date).toLocaleDateString()}
              </Text>
            </View>
            {rating.comment && (
              <Text style={styles.ratingComment}>"{rating.comment}"</Text>
            )}
            <Text style={styles.ratingOrderId}>Order #{rating.orderId}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No ratings yet</Text>
        </View>
      )}
    </View>
  );

  const renderBadges = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Achievements & Badges</Text>
      {performance?.badges && performance.badges.length > 0 ? (
        <View style={styles.badgesGrid}>
          {performance.badges.map((badge) => (
            <View key={badge.id} style={styles.badgeCard}>
              <View style={styles.badgeIcon}>
                <Award size={32} color={Colors.light.warning} />
              </View>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>
              <Text style={styles.badgeDate}>
                Earned {new Date(badge.earnedAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Award size={48} color={Colors.light.border} />
          <Text style={styles.emptyText}>No badges earned yet</Text>
          <Text style={styles.emptySubtext}>
            Complete more deliveries to earn achievement badges!
          </Text>
        </View>
      )}
    </View>
  );

  if (loading && !performance) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Performance</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading performance data...</Text>
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
        <Text style={styles.title}>Performance</Text>
        <TouchableOpacity>
          <Calendar size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'ratings' && styles.activeTab]}
          onPress={() => setSelectedTab('ratings')}
        >
          <Text style={[styles.tabText, selectedTab === 'ratings' && styles.activeTabText]}>
            Ratings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'badges' && styles.activeTab]}
          onPress={() => setSelectedTab('badges')}
        >
          <Text style={[styles.tabText, selectedTab === 'badges' && styles.activeTabText]}>
            Badges
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'ratings' && renderRatings()}
        {selectedTab === 'badges' && renderBadges()}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  activeTabText: {
    color: 'white',
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  ratingContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginVertical: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  goalContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  satisfactionContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  satisfactionScore: {
    alignItems: 'center',
    marginBottom: 12,
  },
  satisfactionValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.light.success,
  },
  satisfactionLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  satisfactionDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  ratingItem: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  ratingComment: {
    fontSize: 14,
    color: Colors.light.text,
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 20,
  },
  ratingOrderId: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
  },
  badgeIcon: {
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  badgeDate: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  emptyState: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DriverPerformance;

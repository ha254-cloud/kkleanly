import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Package, Gift, Star, CircleAlert as AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  color: string;
}

export default function NotificationsScreen() {
  const colors = Colors.light;
  
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: 'order_updates',
      title: 'Order Updates',
      description: 'Get notified about order status changes',
      icon: <Package size={20} color={colors.primary} />,
      enabled: true,
      color: colors.primary,
    },
    {
      id: 'promotions',
      title: 'Promotions & Offers',
      description: 'Receive special deals and discounts',
      icon: <Gift size={20} color={colors.success} />,
      enabled: true,
      color: colors.success,
    },
    {
      id: 'reminders',
      title: 'Pickup Reminders',
      description: 'Reminders for scheduled pickups',
      icon: <Bell size={20} color={colors.warning} />,
      enabled: false,
      color: colors.warning,
    },
    {
      id: 'reviews',
      title: 'Review Requests',
      description: 'Requests to rate completed orders',
      icon: <Star size={20} color="#EF4444" />,
      enabled: true,
      color: '#EF4444',
    },
    {
      id: 'alerts',
      title: 'Service Alerts',
      description: 'Important service announcements',
      icon: <AlertCircle size={20} color="#8B5CF6" />,
      enabled: true,
      color: '#8B5CF6',
    },
  ]);

  const toggleNotification = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, enabled: !notif.enabled } : notif
    ));
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage your notification preferences
        </Text>

        {notifications.map((notification) => (
          <Card key={notification.id} style={styles.notificationCard}>
            <View style={styles.notificationContent}>
              <View style={styles.notificationLeft}>
                <View style={[styles.iconContainer, { backgroundColor: notification.color + '20' }]}>
                  {notification.icon}
                </View>
                <View style={styles.notificationInfo}>
                  <Text style={[styles.notificationTitle, { color: colors.text }]}>
                    {notification.title}
                  </Text>
                  <Text style={[styles.notificationDescription, { color: colors.textSecondary }]}>
                    {notification.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={notification.enabled}
                onValueChange={() => toggleNotification(notification.id)}
                trackColor={{ false: colors.surface, true: notification.color }}
                thumbColor={notification.enabled ? '#FFFFFF' : colors.textSecondary}
              />
            </View>
          </Card>
        ))}

        <Card style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            🔔 Notification Settings
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Notifications help you stay updated on your orders{'\n'}
            • You can disable any notification type anytime{'\n'}
            • Important service alerts cannot be disabled{'\n'}
            • Push notifications require app permissions
          </Text>
        </Card>

        <Card style={styles.timingCard}>
          <Text style={[styles.timingTitle, { color: colors.text }]}>
            ⏰ Notification Timing
          </Text>
          <View style={styles.timingOptions}>
            <View style={styles.timingOption}>
              <Text style={[styles.timingLabel, { color: colors.textSecondary }]}>
                Order Updates:
              </Text>
              <Text style={[styles.timingValue, { color: colors.text }]}>
                Instant
              </Text>
            </View>
            <View style={styles.timingOption}>
              <Text style={[styles.timingLabel, { color: colors.textSecondary }]}>
                Promotions:
              </Text>
              <Text style={[styles.timingValue, { color: colors.text }]}>
                Weekly
              </Text>
            </View>
            <View style={styles.timingOption}>
              <Text style={[styles.timingLabel, { color: colors.textSecondary }]}>
                Reminders:
              </Text>
              <Text style={[styles.timingValue, { color: colors.text }]}>
                1 hour before
              </Text>
            </View>
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
  notificationCard: {
    marginBottom: 16,
    padding: 20,
  },
  notificationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
  },
  infoCard: {
    padding: 20,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timingCard: {
    padding: 20,
    marginTop: 16,
  },
  timingTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  timingOptions: {
    gap: 12,
  },
  timingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timingLabel: {
    fontSize: 14,
  },
  timingValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
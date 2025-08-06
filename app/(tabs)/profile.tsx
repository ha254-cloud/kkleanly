import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { router } from 'expo-router';
import { User, Settings, Moon, Sun, LogOut, CircleHelp as HelpCircle, Bell, MapPin, CreditCard, Star, Gift, Shield, ChartBar as BarChart3, ShoppingBag, Package } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { isCurrentUserAdmin, isCurrentUserDriver } from '../../utils/adminAuth';
import userProfileService, { UserProfile, UserStats } from '../../services/userProfileService';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isDark, theme, setTheme } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  
  // Role-based access states
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDriver, setIsDriver] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);

  // User profile states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Check user roles when component mounts or user changes
  useEffect(() => {
    const checkUserRoles = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsDriver(false);
        setRolesLoading(false);
        return;
      }

      try {
        setRolesLoading(true);
        
        // Check admin status (synchronous)
        const adminStatus = isCurrentUserAdmin();
        setIsAdmin(adminStatus);
        
        console.log('🔍 DEBUG: Admin check results');
        console.log('🔍 User email:', user?.email);
        console.log('🔍 User UID:', user?.uid);
        console.log('🔍 Admin email constant:', 'admin@kleanly.co.ke');
        console.log('🔍 Is admin?', adminStatus);
        console.log('🔍 Email comparison:', user?.email === 'admin@kleanly.co.ke');
        
        // Check driver status (asynchronous)
        const driverStatus = await isCurrentUserDriver();
        setIsDriver(driverStatus);
        
      } catch (error) {
        console.error('Error checking user roles:', error);
        setIsAdmin(false);
        setIsDriver(false);
      } finally {
        setRolesLoading(false);
      }
    };

    checkUserRoles();
  }, [user]);

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.uid) return;
      
      try {
        setProfileLoading(true);
        const [profile, stats] = await Promise.all([
          userProfileService.getUserProfile(user.uid),
          userProfileService.getUserStats(user.uid)
        ]);
        
        setUserProfile(profile);
        setUserStats(stats);
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const menuItems = [
    {
      icon: <ShoppingBag size={20} color={colors.primary} />,
      title: 'Order History',
      subtitle: 'View your past and current orders',
      color: colors.primary,
      onPress: () => router.push('/orders'),
    },
    {
      icon: <Package size={20} color="#10B981" />,
      title: 'Track Orders',
      subtitle: 'Track your current orders',
      color: '#10B981',
      onPress: () => router.push('/(tabs)/track'),
    },
    {
      icon: <User size={20} color={colors.primary} />,
      title: 'Personal Information',
      subtitle: 'Update your profile details',
      color: colors.primary,
      onPress: () => router.push('/profile/personal-info'),
    },
    
    // 🚛 DRIVER-ONLY ACCESS: Only show driver dashboard to registered drivers
    ...(isDriver ? [{
      icon: <Package size={20} color="#FF6B35" />,
      title: '🚗 Driver Dashboard',
      subtitle: 'Access driver interface for deliveries',
      color: '#FF6B35',
      onPress: () => router.push('/driver'),
    }] : []),
    
    // 🔒 ADMIN-ONLY ACCESS: Only show admin features to administrators
    ...(isAdmin ? [{
      icon: <BarChart3 size={20} color="#8B5CF6" />,
      title: 'Analytics Dashboard',
      subtitle: 'View business metrics and insights',
      color: '#8B5CF6',
      onPress: () => router.push('/analytics'),
    }, {
      icon: <Package size={20} color="#007bff" />,
      title: 'Admin: Manage Orders',
      subtitle: 'Update order statuses',
      color: '#007bff',
      onPress: () => router.push('/admin-orders'),
    }, {
      icon: <Package size={20} color="#8B5CF6" />,
      title: '👥 Drivers Management',
      subtitle: 'Manage delivery drivers',
      color: '#8B5CF6',
      onPress: () => router.push('/admin/drivers'),
    }, {
      icon: <Package size={20} color="#FF6B6B" />,
      title: 'Dispatch Center',
      subtitle: 'Assign drivers to orders',
      color: '#FF6B6B',
      onPress: () => router.push('/admin/dispatch'),
    }] : []),
    {
      icon: <MapPin size={20} color="#3B82F6" />,
      title: 'Delivery Addresses',
      subtitle: 'Manage your saved addresses',
      color: '#3B82F6',
      onPress: () => router.push('/profile/addresses'),
    },
    {
      icon: <CreditCard size={20} color="#8B5CF6" />,
      title: 'Payment Methods',
      subtitle: 'Manage cards and M-Pesa',
      color: '#8B5CF6',
      onPress: () => router.push('/profile/payment-methods'),
    },
    {
      icon: <Bell size={20} color="#F59E0B" />,
      title: 'Notifications',
      subtitle: 'Order updates and promotions',
      color: '#F59E0B',
      onPress: () => router.push('/profile/notifications'),
    },
    {
      icon: <Star size={20} color="#EF4444" />,
      title: 'Rate & Review',
      subtitle: 'Share your experience',
      color: '#EF4444',
      onPress: () => router.push('/profile/rate-review'),
    },
    {
      icon: <Gift size={20} color="#10B981" />,
      title: 'Referral Program',
      subtitle: 'Invite friends and earn rewards',
      color: '#10B981',
      onPress: () => router.push('/profile/referral'),
    },
    {
      icon: <HelpCircle size={20} color="#6366F1" />,
      title: 'Help & Support',
      subtitle: 'Get help or contact support',
      color: '#6366F1',
      onPress: () => router.push('/profile/help-support'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={colors.gradient.primary as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                <Text style={styles.avatarText}>
                  {userProfile?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {userProfile?.firstName && userProfile?.lastName
                    ? `${userProfile.firstName} ${userProfile.lastName}`
                    : user?.email?.split('@')[0] || 'User'}
                </Text>
                <Text style={styles.userEmail}>
                  {user?.email || 'user@example.com'}
                </Text>

                <View style={styles.membershipBadge}>
                  <Shield size={12} color="#FFFFFF" />
                  <Text style={styles.membershipText}>
                    {userProfile?.membershipLevel || 'Premium'} Member
                  </Text>
                </View>

                {/* Add user stats */}
                {userStats && (
                  <View style={styles.statsContainer}>
                    <Text style={styles.statsText}>
                      {userStats.totalOrders} orders • {userStats.totalSpent.toLocaleString('en-KE', {
                        style: 'currency',
                        currency: 'KES'
                      })} spent
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        <Card style={styles.themeCard}>
          <View style={styles.themeToggle}>
            <View style={styles.themeInfo}>
              <View style={[styles.themeIconContainer, { backgroundColor: colors.warning + '20' }]}>
                {isDark ? (
                  <Moon size={20} color={colors.warning} />
                ) : (
                  <Sun size={20} color={colors.warning} />
                )}
              </View>
              <View style={styles.themeText}>
                <Text style={[styles.themeTitle, { color: colors.text }]}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text style={[styles.themeSubtitle, { color: colors.textSecondary }]}>
                  Switch between light and dark themes
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.surface, true: colors.primary }}
              thumbColor={isDark ? '#FFFFFF' : colors.primary}
              style={styles.switch} />
          </View>
        </Card>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              activeOpacity={0.8}
              style={styles.menuItemWrapper}
            >
              <Card style={styles.menuItem}>
                <View style={styles.menuItemContent}>
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIconContainer, { backgroundColor: item.color + '20' }]}>
                      {item.icon}
                    </View>
                    <View style={styles.menuItemText}>
                      <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.menuItemArrow, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.arrowText, { color: colors.textSecondary }]}>
                      →
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="primary"
            icon={<LogOut size={20} color="#FFFFFF" />}
            style={styles.logoutButton}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
            Kleanly v1.0.0
          </Text>
          <Text style={[styles.appCopyright, { color: colors.textSecondary }]}>
            © 2024 Kleanly. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  profileHeader: {
    marginBottom: 20,
  } as ViewStyle,
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  } as ViewStyle,
  headerContent: {
    alignItems: 'center',
  } as ViewStyle,
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  } as ViewStyle,
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  } as TextStyle,
  userDetails: {
    flex: 1,
  } as ViewStyle,
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    color: '#FFFFFF',
  } as TextStyle,
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  } as TextStyle,
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  } as ViewStyle,
  membershipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  } as TextStyle,
  statsContainer: {
    marginTop: 8,
  } as ViewStyle,
  statsText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  } as TextStyle,
  themeCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
  } as ViewStyle,
  themeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  } as ViewStyle,
  themeText: {
    flex: 1,
  } as ViewStyle,
  themeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  } as TextStyle,
  themeSubtitle: {
    fontSize: 14,
  } as TextStyle,
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  } as ViewStyle,
  menuSection: {
    paddingHorizontal: 20,
  } as ViewStyle,
  menuItemWrapper: {
    marginBottom: 12,
  } as ViewStyle,
  menuItem: {
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  menuItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  } as ViewStyle,
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  } as ViewStyle,
  menuItemText: {
    flex: 1,
  } as ViewStyle,
  menuItemTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  } as TextStyle,
  menuItemSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  menuItemArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  arrowText: {
    fontSize: 16,
    fontWeight: '700',
  } as TextStyle,
  logoutSection: {
    padding: 20,
    paddingTop: 32,
  } as ViewStyle,
  logoutButton: {
    marginTop: 0,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  appInfo: {
    alignItems: 'center',
    paddingBottom: 40,
  } as ViewStyle,
  appVersion: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  } as TextStyle,
  appCopyright: {
    fontSize: 11,
    fontWeight: '500',
  } as TextStyle,
});
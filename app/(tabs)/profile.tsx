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
  Animated,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { User, Settings, Moon, Sun, LogOut, MapPin, Shield, ChartBar as BarChart3, Package, Zap, TrendingUp, ChevronRight, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { isCurrentUserAdmin, isCurrentUserDriver } from '../../utils/adminAuth';
import userProfileService, { UserProfile, UserStats } from '../../services/userProfileService';
import { setupCompleteUserProfile } from '../../utils/setupUserProfile';
import { ProfileCompletionWidget } from '../../components/ProfileCompletionWidget';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isDark, setTheme } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { width: screenWidth } = Dimensions.get('window');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDriver, setIsDriver] = useState(false);

  // Simple Animation Value
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    // Simple fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        if (user?.uid) {
          try {
            const [profile, stats, userAddresses, userPaymentMethods] = await Promise.all([
              userProfileService.getUserProfile(user.uid),
              userProfileService.getUserStats(user.uid),
              userProfileService.getSavedAddresses(user.uid),
              userProfileService.getPaymentMethods(user.uid),
            ]);

            setUserProfile(profile);
            setUserStats(stats);
            setAddresses(userAddresses);
            setPaymentMethods(userPaymentMethods);
          } catch (error) {
            console.error('Error loading profile data:', error);
          }
        }
      };

      const checkRoles = async () => {
        const adminStatus = await isCurrentUserAdmin();
        const driverStatus = await isCurrentUserDriver();
        setIsAdmin(adminStatus);
        setIsDriver(driverStatus);
      };

      loadData();
      checkRoles();
    }, [user])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleSetupProfile = () => {
    setupCompleteUserProfile();
  };

  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#666';

  const getStyles = () => StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    
    // Hero Section Styles
    heroContainer: {
      height: 400,
      position: 'relative',
    },
    heroBackground: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    heroImageStyle: {
      resizeMode: 'cover',
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    heartIcon: {
      position: 'absolute',
      top: 60,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileSection: {
      position: 'absolute',
      bottom: 40,
      left: 20,
      right: 20,
      alignItems: 'center',
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 16,
      overflow: 'hidden',
    },
    avatarGradient: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 28,
      fontWeight: '700',
      color: '#333',
    },
    userName: {
      fontSize: 28,
      fontWeight: '700',
      color: '#fff',
      textAlign: 'center',
      marginBottom: 8,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    userQuote: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      fontStyle: 'italic',
      lineHeight: 22,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    
    // Menu Section Styles
    menuContainer: {
      backgroundColor: isDark ? colors.card : '#fff',
      marginHorizontal: 20,
      marginTop: 16,
      borderRadius: 16,
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : 'transparent',
    },
    menuItem: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? colors.border : '#f5f5f5',
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 24,
      height: 24,
      marginRight: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuItemText: {
      fontSize: 16,
      fontWeight: '500',
      flex: 1,
    },
    logoutItem: {
      borderBottomWidth: 0,
    },
    
    // Bottom Spacing
    bottomSpacing: {
      height: 100,
    },
  });

  const styles = getStyles();

  const menuItems = [
    {
      icon: <User size={22} color={iconColor} />,
      title: 'Account',
      onPress: () => router.push('/profile/personal-info'),
    },
    {
      icon: <MapPin size={22} color={iconColor} />,
      title: 'My Address',
      onPress: () => router.push('/profile/addresses'),
    },
    {
      icon: <Shield size={22} color={iconColor} />,
      title: 'Help & Support',
      onPress: () => router.push('/profile/help-support'),
    },
    {
      icon: <Settings size={22} color={iconColor} />,
      title: 'Settings',
      onPress: handleSetupProfile,
    },
    
    // DRIVER ACCESS
    ...(isDriver ? [{
      icon: <TrendingUp size={22} color={iconColor} />,
      title: 'Driver Dashboard',
      onPress: () => router.push('/driver'),
    }] : []),
    
    // ADMIN ACCESS
    ...(isAdmin ? [{
      icon: <BarChart3 size={22} color={iconColor} />,
      title: 'Analytics',
      onPress: () => router.push('/analytics'),
    }, {
      icon: <Package size={22} color={iconColor} />,
      title: 'Order Management',
      onPress: () => router.push('/admin-orders'),
    }, {
      icon: <User size={22} color={iconColor} />,
      title: 'Driver Management',
      onPress: () => router.push('/admin/drivers'),
    }, {
      icon: <Zap size={22} color={iconColor} />,
      title: 'Dispatch Center',
      onPress: () => router.push('/admin/dispatch'),
    }] : []),
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* BEAUTIFUL HERO SECTION */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={require('../../assets/images/welcome-bg.jpg')}
            style={styles.heroBackground}
            imageStyle={styles.heroImageStyle}
          >
            {/* Overlay for better text readability */}
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
              style={styles.heroOverlay}
            />
            
            {/* Heart Icon */}
            <TouchableOpacity style={styles.heartIcon}>
              <Heart size={24} color="#fff" />
            </TouchableOpacity>
            
            {/* User Profile Section */}
            <Animated.View style={[
              styles.profileSection,
              { opacity: fadeAnim }
            ]}>
              {/* Profile Avatar */}
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#fff', '#f8f9fa']}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </LinearGradient>
              </View>
              
              {/* User Info */}
              <Text style={styles.userName}>
                {userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() || user?.email?.split('@')[0] || 'User' : user?.email?.split('@')[0] || 'User'}
              </Text>
              
              <Text style={styles.userQuote}>
                Work hard in silence. Let your success be the noise.
              </Text>
            </Animated.View>
          </ImageBackground>
        </View>

        {/* CLEAN MENU SECTION */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconContainer}>
                    {item.icon}
                  </View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>
                    {item.title}
                  </Text>
                </View>
                <ChevronRight size={20} color={isDark ? 'rgba(255,255,255,0.4)' : "#ccc"} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* THEME TOGGLE */}
        <View style={styles.menuContainer}>
          <View style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  {isDark ? (
                    <Moon size={22} color={colors.text} />
                  ) : (
                    <Sun size={22} color={colors.text} />
                  )}
                </View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={'#FFFFFF'}
              />
            </View>
          </View>
        </View>

        {/* LOGOUT SECTION */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.menuItem, styles.logoutItem]}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <LogOut size={22} color="#EF4444" />
                </View>
                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>
                  Sign Out
                </Text>
              </View>
              <ChevronRight size={20} color="#EF4444" />
            </View>
          </TouchableOpacity>
        </View>

        {/* BOTTOM SPACING */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

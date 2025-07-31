import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { Star, Clock, Truck, Plus, ArrowRight, Sparkles, TrendingUp, Zap, Award, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { OrderCard } from '../../components/OrderCard';
import { BlurView } from 'expo-blur';
import { WhatsAppButton } from '../../components/ui/WhatsAppButton';

const { width } = Dimensions.get('window');

interface ServiceCardProps {
  title: string;
  description: string;
  icon: any;
  onPress: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, icon, onPress }) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.serviceCardWrapper}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFF', '#F0F4FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.serviceCardGradient}
      >
        <View style={styles.serviceCard}>
          <View style={styles.serviceCardHeader}>
            <View style={styles.serviceCardContent}>
              <View style={[styles.serviceIconContainer, { 
                backgroundColor: colors.primary + '12',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 8,
              }]}>
                <Image source={icon} style={styles.serviceIcon} resizeMode="cover" />
                <View style={[styles.iconGlow, { backgroundColor: colors.primary + '08' }]} />
                <View style={[styles.iconRing, { borderColor: colors.primary + '20' }]} />
              </View>
              <View style={styles.serviceTextContainer}>
                <Text style={[styles.serviceTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.serviceDescription, { color: colors.textSecondary }]}>
                  {description}
                </Text>
                <View style={[styles.serviceBadge, { backgroundColor: colors.success + '15' }]}>
                  <Zap size={12} color={colors.success} />
                  <Text style={[styles.serviceBadgeText, { color: colors.success }]}>Popular</Text>
                </View>
              </View>
              <View style={[styles.serviceArrow, { 
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }]}>
                <ArrowRight size={18} color="#FFFFFF" />
              </View>
            </View>
          </View>
          <View style={[styles.serviceCardFooter, { backgroundColor: colors.primary + '05' }]}>
            <Text style={[styles.serviceFooterText, { color: colors.primary }]}>
              Starting from KSH 150
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; value: string; label: string; color: string }> = ({ 
  icon, value, label, color 
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFF', '#F0F4FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statCardGradient}
    >
      <Card style={styles.statCard}>
        <View style={styles.statContent}>
          <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
            {icon}
            <View style={[styles.statIconGlow, { backgroundColor: color + '08' }]} />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
          </View>
          <View style={[styles.statTrend, { backgroundColor: Colors.light.success + '20' }]}>
            <TrendingUp size={12} color={Colors.light.success} />
          </View>
        </View>
      </Card>
    </LinearGradient>
  );
};

const WelcomeCard: React.FC<{ user: any; colors: any }> = ({ user, colors }) => {
  return (
    <View style={styles.welcomeContainer}>
      <ImageBackground
        source={require('../../assets/images/welcome-bg.jpg')}
        style={styles.welcomeBackground}
        imageStyle={styles.welcomeBackgroundImage}
      >
        <View style={styles.welcomeOverlay} />
        <View style={styles.welcomeContent}>
          <View style={styles.welcomeHeader}>
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <Logo size="medium" showText={false} />
                <View style={[styles.logoGlow, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
                <View style={[styles.logoRing, { borderColor: 'rgba(255,255,255,0.2)' }]} />
              </View>
              <View style={styles.brandText}>
                <Text style={styles.brandName}>KLEANLY</Text>
                <Text style={styles.brandTagline}>Premium Laundry Service</Text>
              </View>
            </View>
            <View style={styles.premiumBadge}>
              <Award size={14} color="#FFFFFF" />
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          </View>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              Welcome back, {user?.email?.split('@')[0] || 'User'}! 
            </Text>
            <Text style={styles.welcomeSubtext}>
              Ready for fresh, clean laundry delivered to your door?
            </Text>
            <View style={styles.welcomeStats}>
              <View style={styles.welcomeStatItem}>
                <Shield size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.welcomeStatText}>Trusted</Text>
              </View>
              <View style={styles.welcomeStatDivider} />
              <View style={styles.welcomeStatItem}>
                <Star size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.welcomeStatText}>4.9 Rating</Text>
              </View>
              <View style={styles.welcomeStatDivider} />
              <View style={styles.welcomeStatItem}>
                <Clock size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.welcomeStatText}>24h Service</Text>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const QuickStatsSection: React.FC<{ colors: any }> = ({ colors }) => {
  return (
    <View style={styles.statsSection}>
      <Text style={[styles.statsSectionTitle, { color: colors.text }]}>
        Why Choose Kleanly?
      </Text>
      <View style={styles.statsContainer}>
        <StatCard
          icon={<Star size={20} color={colors.warning} />}
          value="4.9★"
          label="Customer Rating"
          color={colors.warning}
        />
        <StatCard
          icon={<Clock size={20} color={colors.primary} />}
          value="24h"
          label="Fast Delivery"
          color={colors.primary}
        />
        <StatCard
          icon={<Truck size={20} color={colors.success} />}
          value="Free"
          label="Pickup & Drop"
          color={colors.success}
        />
      </View>
    </View>
  );
};

const ServicesSection: React.FC<{ services: any[]; onServicePress: () => void; colors: any }> = ({ 
  services, onServicePress, colors 
}) => {
  return (
    <View style={styles.servicesSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Premium Services</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Professional care for all your laundry needs
          </Text>
        </View>
        <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '15' }]}>
          <Sparkles size={12} color={colors.primary} />
          <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>4 Services</Text>
        </View>
      </View>
      <View style={styles.servicesGrid}>
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            title={service.title}
            description={service.description}
            icon={service.icon}
            onPress={onServicePress}
          />
        ))}
      </View>
    </View>
  );
};

const RecentOrdersSection: React.FC<{ recentOrders: any[]; colors: any }> = ({ recentOrders, colors }) => {
  return (
    <View style={styles.recentOrdersSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Track your laundry journey</Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/orders')}
          style={[styles.viewAllButton, { backgroundColor: colors.primary + '15' }]}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          <ArrowRight size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.ordersContainer}>
        {recentOrders.map((order) => (
          <View key={order.id} style={styles.orderCardWrapper}>
            <OrderCard order={order} />
          </View>
        ))}
      </View>
    </View>
  );
};

const CallToActionSection: React.FC<{ orders: any[]; colors: any }> = ({ orders, colors }) => {
  return (
    <LinearGradient
      colors={[colors.primary + '08', colors.primary + '12', colors.primary + '05']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.ctaGradient}
    >
      <Card style={styles.ctaCard}>
        <View style={styles.ctaContent}>
          <View style={[styles.ctaIconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Plus size={28} color={colors.primary} />
            <View style={[styles.ctaIconGlow, { backgroundColor: colors.primary + '10' }]} />
          </View>
          <Text style={[styles.ctaTitle, { color: colors.text }]}>
            {orders.length === 0 ? 'Ready to get started?' : 'Need another service?'}
          </Text>
          <Text style={[styles.ctaSubtitle, { color: colors.textSecondary }]}>
            {orders.length === 0 
              ? 'Book your first order and experience premium laundry service'
              : 'Book another order for fresh, clean clothes'
            }
          </Text>
          <LinearGradient
            colors={[colors.primary, colors.primary + 'F0', colors.primary + 'E6']}
            source={require('../../assets/images/space.jpg')}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButtonGradient}
          >
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/(tabs)/order')}
              activeOpacity={0.9}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.ctaButtonText}>
                {orders.length === 0 ? 'Book Your First Order' : 'Book Another Order'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Card>
    </LinearGradient>
  );
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { orders, refreshOrders } = useOrders();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    refreshOrders();
  }, []);

  const services = [
    {
      id: 'wash-fold',
      title: 'Wash & Fold',
      description: 'Professional washing and folding service',
      icon: require('../../assets/images/wash-fold.jpg'),
    },
    {
      id: 'dry-cleaning',
      title: 'Dry Cleaning',
      description: 'Premium dry cleaning for delicate items',
      icon: require('../../assets/images/dry cleaning.jpg'),
    },
    {
      id: 'ironing',
      title: 'Ironing',
      description: 'Professional pressing and ironing',
      icon: require('../../assets/images/ironing.jpg'),
    },
    {
      id: 'shoe-cleaning',
      title: 'Shoe Cleaning',
      description: 'Specialized shoe cleaning service',
      icon: require('../../assets/images/shoe cleaning.jpg'),
    },
  ];

  const handleServicePress = () => {
    router.push('/(tabs)/order');
  };

  const recentOrders = orders.slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Premium Welcome Header */}
        <WelcomeCard user={user} colors={colors} />

        {/* Enhanced Quick Stats */}
        <QuickStatsSection colors={colors} />

        {/* Premium Services Section */}
        <ServicesSection 
          services={services} 
          onServicePress={handleServicePress} 
          colors={colors} 
        />

        {/* Recent Orders with Premium Design */}
        {recentOrders.length > 0 && (
          <RecentOrdersSection recentOrders={recentOrders} colors={colors} />
        )}

        {/* Premium Call to Action */}
        <CallToActionSection orders={orders} colors={colors} />
      </ScrollView>
      
      {/* Floating WhatsApp Button */}
      <WhatsAppButton 
        phoneNumber="+254700000000" 
        message="Hello Kleanly! I need help with my laundry service." 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  
  // Welcome Card Styles
  welcomeContainer: {
    marginBottom: 32,
    overflow: 'hidden',
  },
  welcomeBackground: {
    paddingTop: 60,
    paddingBottom: 48,
    paddingHorizontal: 20,
    position: 'relative',
  },
  welcomeBackgroundImage: {
    borderRadius: 0,
    resizeMode: 'cover',
  },
  welcomeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    shadowColor: '#1A3D63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  welcomeContent: {
    gap: 28,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.2,
    zIndex: -1,
  },
  logoRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    opacity: 0.3,
    zIndex: -1,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    marginLeft: 12,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandTagline: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  premiumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  welcomeSection: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcomeSubtext: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    lineHeight: 24,
  },
  welcomeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  welcomeStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  welcomeStatText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  welcomeStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  
  // Stats Section Styles
  statsSection: {
    marginBottom: 40,
  },
  statsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  statCardGradient: {
    flex: 1,
    borderRadius: 24,
    shadowColor: '#1A3D63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  statCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  statContent: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconGlow: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    opacity: 0.3,
    zIndex: -1,
  },
  statTextContainer: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  statTrend: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Services Section Styles
  servicesSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    opacity: 0.8,
  },
  sectionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  servicesGrid: {
    gap: 16,
  },
  serviceCardWrapper: {
    marginBottom: 4,
  },
  serviceCardGradient: {
    borderRadius: 28,
    shadowColor: '#1A3D63',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  serviceCard: {
    borderRadius: 28,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  serviceCardHeader: {
    padding: 24,
  },
  serviceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceCardFooter: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  serviceFooterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  serviceIconContainer: {
    position: 'relative',
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 20,
  },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  iconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
    zIndex: -1,
  },
  iconRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    opacity: 0.4,
    zIndex: -1,
  },
  serviceTextContainer: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  serviceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  serviceArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Recent Orders Section Styles
  recentOrdersSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ordersContainer: {
    gap: 12,
  },
  orderCardWrapper: {
    shadowColor: '#1A3D63',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderRadius: 20,
  },
  
  // Call to Action Section Styles
  ctaGradient: {
    margin: 20,
    borderRadius: 32,
    shadowColor: '#1A3D63',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  ctaCard: {
    padding: 36,
    borderRadius: 32,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  ctaContent: {
    alignItems: 'center',
  },
  ctaIconContainer: {
    position: 'relative',
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#1A3D63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaIconGlow: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    opacity: 0.3,
    zIndex: -1,
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 36,
    fontWeight: '500',
    opacity: 0.9,
  },
  ctaButtonGradient: {
    borderRadius: 28,
    shadowColor: '#1A3D63',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 36,
    gap: 12,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
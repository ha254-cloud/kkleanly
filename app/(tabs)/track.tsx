import OrderCancellationModal from '../../components/OrderCancellationModal';
import TimeSelectionModal from '../../components/TimeSelectionModal';
import React, { useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { Card } from '@/components/ui/Card';
import { formatOrderId, formatDate } from '@/utils/formatters';
import { Package, MapPin, Calendar, Award, TrendingUp, Clock, Truck, CheckCircle, Star, ChevronDown, X, Edit3, MessageCircle, Phone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useOrders } from '@/context/OrderContext';
import { useTheme } from '@/context/ThemeContext';

// Theme-aware color palette function
const getColors = (isDark: boolean) => {
  const baseColors = {
    // Main UI Colors from the blue palette
    darkNavy: '#0A1931',
    lightBlue: '#B3CFE5',
    mediumBlue: '#4A7FA7',
    deepBlue: '#1A3D63',
    paleBlue: '#F6FAFD',
  };

  if (isDark) {
    return {
      ...baseColors,
      // Dark mode text colors
      text: '#F6FAFD', // pale blue for text on dark background
      textSecondary: '#B3CFE5', // light blue for secondary text
      textTertiary: '#4A7FA7', // medium blue for tertiary text
      textOnDark: '#F6FAFD', // pale blue
      textOnLight: '#0A1931', // dark navy
      
      // Primary colors
      primary: '#4A7FA7',
      primaryDark: '#1A3D63',
      primaryLight: '#B3CFE5',
      
      // Success colors
      success: '#10B981',
      successLight: '#34D399',
      
      // Warning colors
      warning: '#B3CFE5',
      warningLight: '#D4E5F0',
      warningDark: '#4A7FA7',
      
      // Dark mode backgrounds
      background: '#0A1931', // dark navy background
      surface: '#1A3D63', // deep blue for surfaces
      surfaceElevated: '#2D4F75', // lighter blue for elevated surfaces
      surfaceDark: '#0A1931',
      
      // Dark mode borders
      border: '#4A7FA7',
      borderLight: '#1A3D63',
      
      // Gradient combinations for dark mode
      gradient: {
        primary: ['#4A7FA7', '#1A3D63'] as readonly [string, string],
        success: ['#10B981', '#059669'] as readonly [string, string],
        warning: ['#B3CFE5', '#4A7FA7'] as readonly [string, string],
        neutral: ['#1A3D63', '#0A1931'] as readonly [string, string],
        elegant: ['#4A7FA7', '#B3CFE5'] as readonly [string, string],
        dark: ['#0A1931', '#1A3D63'] as readonly [string, string],
        ocean: ['#4A7FA7', '#B3CFE5'] as readonly [string, string],
      },
    };
  } else {
    return {
      ...baseColors,
      // Light mode text colors
      text: '#0A1931', // dark navy
      textSecondary: '#1A3D63', // deep blue
      textTertiary: '#4A7FA7', // medium blue
      textOnDark: '#F6FAFD', // pale blue
      textOnLight: '#0A1931', // dark navy
      
      // Primary colors
      primary: '#4A7FA7',
      primaryDark: '#1A3D63',
      primaryLight: '#B3CFE5',
      
      // Success colors
      success: '#059669',
      successLight: '#10B981',
      
      // Warning colors
      warning: '#B3CFE5',
      warningLight: '#D4E5F0',
      warningDark: '#4A7FA7',
      
      // Light mode backgrounds
      background: '#F6FAFD', // pale blue from palette
      surface: '#FFFFFF',
      surfaceElevated: '#FAFBFC',
      surfaceDark: '#0A1931',
      
      // Light mode borders
      border: '#B3CFE5',
      borderLight: '#E8F4FD',
      
      // Gradient combinations for light mode
      gradient: {
        primary: ['#4A7FA7', '#1A3D63'] as readonly [string, string],
        success: ['#11998E', '#38EF7D'] as readonly [string, string],
        warning: ['#B3CFE5', '#4A7FA7'] as readonly [string, string],
        neutral: ['#0A1931', '#1A3D63'] as readonly [string, string],
        elegant: ['#B3CFE5', '#F6FAFD'] as readonly [string, string],
        dark: ['#0A1931', '#1A3D63'] as readonly [string, string],
        ocean: ['#4A7FA7', '#B3CFE5'] as readonly [string, string],
      },
    };
  }
};

const { width } = Dimensions.get('window');

export default function TrackScreen() {
  const { orders, loading, cancelOrder, updateOrderTimes } = useOrders();
  const { isDark } = useTheme();
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  
  // Get theme-aware colors
  const colors = getColors(isDark);
  
  // Get the most recent order by default, or allow user to select different order
  const selectedOrder = orders.length > 0 ? orders[selectedOrderIndex] : null;

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return colors.warningLight;
      case 'processing':
        return colors.primary;
      case 'completed':
        return colors.successLight;
      default:
        return colors.textSecondary;
    }
  }

  function getStatusGradient(status: string): readonly [string, string] {
    switch (status) {
      case 'pending':
        return colors.gradient.warning;
      case 'processing':
        return colors.gradient.primary;
      case 'completed':
        return colors.gradient.success;
      default:
        return colors.gradient.neutral;
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pending':
        return <Clock size={16} color={getStatusColor(status)} />;
      case 'processing':
        return <Truck size={16} color={getStatusColor(status)} />;
      case 'completed':
        return <CheckCircle size={16} color={getStatusColor(status)} />;
      default:
        return <Package size={16} color={getStatusColor(status)} />;
    }
  }

  function getEstimatedDelivery(order: any) {
    const deliveryDate = new Date(order.createdAt);
    deliveryDate.setDate(deliveryDate.getDate() + 2);
    return formatDate(deliveryDate.toISOString());
  }

  const handleDriverCall = async (phone: string) => {
    try {
      const phoneUrl = `tel:${phone}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open phone app');
    }
  };

  const handleDriverMessage = async (phone: string) => {
    try {
      let messageUrl: string;
      
      if (Platform.OS === 'ios') {
        messageUrl = `sms:${phone}`;
      } else {
        messageUrl = `sms:${phone}`;
      }
      
      const supported = await Linking.canOpenURL(messageUrl);
      
      if (supported) {
        await Linking.openURL(messageUrl);
      } else {
        // Fallback to WhatsApp if SMS is not available
        const whatsappUrl = `whatsapp://send?phone=${phone}&text=Hello, I'm contacting you regarding my laundry order.`;
        const whatsappSupported = await Linking.canOpenURL(whatsappUrl);
        
        if (whatsappSupported) {
          await Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('Error', 'Messaging apps are not available on this device');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open messaging app');
    }
  };

  const openWhatsApp = async (message: string) => {
    try {
      const phoneNumber = '+254714648622'; // Support phone number
      const formattedNumber = phoneNumber.replace(/[+\s-]/g, '');
      const encodedMessage = encodeURIComponent(message);
      
      // WhatsApp URL scheme
      const whatsappUrl = `whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`;
      
      // Check if WhatsApp is installed
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        const webWhatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
        await Linking.openURL(webWhatsappUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open WhatsApp. Please make sure WhatsApp is installed.');
    }
  };

  function getStatusSteps(status: string) {
    const steps = [
      {
        key: 'placed',
        label: 'Order Placed',
        description: 'Your order has been received',
        icon: <Package size={12} color="white" />,
        isActive: true,
        isCurrent: status === 'pending',
      },
      {
        key: 'processing',
        label: 'Processing',
        description: 'Your items are being processed',
        icon: <Truck size={12} color="white" />,
        isActive: status !== 'pending',
        isCurrent: status === 'processing',
      },
      {
        key: 'delivery',
        label: 'Out for Delivery',
        description: 'Your order is on the way',
        icon: <MapPin size={12} color="white" />,
        isActive: status === 'delivery' || status === 'completed',
        isCurrent: status === 'delivery',
      },
      {
        key: 'completed',
        label: 'Delivered',
        description: 'Order completed successfully',
        icon: <CheckCircle size={12} color="white" />,
        isActive: status === 'completed',
        isCurrent: status === 'completed',
      },
    ];
    return steps;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? [colors.background, colors.surface] : [colors.background, '#FAFAFA']}
        style={styles.backgroundGradient}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <LinearGradient
                colors={colors.gradient.primary}
                style={styles.loadingCard}
              >
                <Package size={48} color={colors.textOnDark} />
                <Text style={[styles.loadingText, { color: colors.textOnDark }]}>
                  Loading your orders...
                </Text>
                <Text style={[styles.loadingSubtext, { color: colors.textOnDark, opacity: 0.8 }]}>
                  Please wait while we fetch your order details
                </Text>
              </LinearGradient>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={[colors.surface, colors.surfaceElevated]}
                style={styles.emptyCard}
              >
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={colors.gradient.primary}
                    style={styles.emptyIconGradient}
                  >
                    <Package size={32} color={colors.textOnDark} />
                  </LinearGradient>
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No Active Orders
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  You haven't placed any orders yet.{'\n'}
                  Create your first order to track its progress here!
                </Text>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.contentContainer}>
              {/* Header Section */}
              <View style={styles.headerSection}>
                <LinearGradient
                  colors={colors.gradient.ocean}
                  style={styles.headerGradient}
                >
                  <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: colors.textOnDark }]}>Order Tracking</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textOnDark, opacity: 0.9 }]}>
                      Track your laundry service in real-time
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Order Selector */}
              {orders.length > 1 && (
                <View style={styles.selectorSection}>
                  <LinearGradient
                    colors={[colors.surface, colors.surfaceElevated]}
                    style={styles.selectorCard}
                  >
                    <Text style={[styles.selectorLabel, { color: colors.text }]}>
                      Select Order to Track
                    </Text>
                    <TouchableOpacity 
                      style={[styles.orderSelector, { borderColor: colors.border }]}
                      onPress={() => {
                        setSelectedOrderIndex((prev) => (prev + 1) % orders.length);
                      }}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={[colors.surface, colors.surfaceElevated]}
                        style={styles.selectorGradient}
                      >
                        <View style={styles.selectorContent}>
                          <View style={styles.selectorLeft}>
                            <Text style={[styles.selectorOrderId, { color: colors.text }]}>
                              {formatOrderId(selectedOrder?.id)}
                            </Text>
                            <Text style={[styles.selectorStatus, { color: colors.textSecondary }]}>
                              Status: {(selectedOrder?.status || 'pending').toUpperCase()}
                            </Text>
                          </View>
                          <View style={[styles.selectorIcon, { backgroundColor: colors.primary + '20' }]}>
                            <ChevronDown size={20} color={colors.primary} />
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              )}

              {selectedOrder && (
                <View style={styles.orderSection}>
                  {/* Main Order Card */}
                  <LinearGradient
                    colors={[colors.surface, colors.surfaceElevated]}
                    style={styles.orderCardGradient}
                  >
                    <View style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <View style={styles.orderHeaderLeft}>
                          <View style={styles.orderIdSection}>
                            <Text style={[styles.orderId, { color: colors.text }]}>
                              {formatOrderId(selectedOrder.id)}
                            </Text>
                            <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                              Placed on {formatDate(selectedOrder.createdAt)}
                            </Text>
                          </View>
                          
                          <LinearGradient
                            colors={getStatusGradient(selectedOrder.status || 'pending')}
                            style={styles.statusBadge}
                          >
                            <View style={styles.statusContent}>
                              {getStatusIcon(selectedOrder.status || 'pending')}
                              <Text style={styles.statusText}>
                                {(selectedOrder.status || 'pending').toUpperCase()}
                              </Text>
                            </View>
                          </LinearGradient>
                        </View>
                        
                        {/* Time Selection Button */}
                        {(['pending', 'confirmed'].includes(selectedOrder.status || 'pending')) && (
                          <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => setShowTimeModal(true)}
                            activeOpacity={0.8}
                          >
                            <LinearGradient
                              colors={colors.gradient.primary}
                              style={styles.timeButtonGradient}
                            >
                              <View style={styles.timeButtonContent}>
                                <View style={styles.timeButtonIconContainer}>
                                  <Edit3 size={14} color="#FFFFFF" />
                                </View>
                                <Text style={styles.timeButtonText}>
                                  Edit Times
                                </Text>
                              </View>
                            </LinearGradient>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Order Summary */}
                      <View style={styles.orderSummary}>
                        <View style={styles.summaryRow}>
                          <LinearGradient
                            colors={colors.gradient.primary}
                            style={styles.summaryIcon}
                          >
                            <Calendar size={16} color="white" />
                          </LinearGradient>
                          <View style={styles.summaryTextContainer}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                              Pickup Time
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>
                              {selectedOrder.pickupTime ? formatDate(selectedOrder.pickupTime) : 'Not scheduled'}
                            </Text>
                          </View>
                        </View>
                        
                        {selectedOrder.preferredDeliveryTime && (
                          <View style={styles.summaryRow}>
                            <LinearGradient
                              colors={colors.gradient.success}
                              style={styles.summaryIcon}
                            >
                              <Truck size={16} color="white" />
                            </LinearGradient>
                            <View style={styles.summaryTextContainer}>
                              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                                Delivery Time
                              </Text>
                              <Text style={[styles.summaryValue, { color: colors.text }]}>
                                {formatDate(selectedOrder.preferredDeliveryTime)}
                              </Text>
                            </View>
                          </View>
                        )}
                        
                        <View style={[styles.summaryRow, styles.totalRow]}>
                          <LinearGradient
                            colors={colors.gradient.success}
                            style={styles.summaryIcon}
                          >
                            <Package size={16} color="white" />
                          </LinearGradient>
                          <View style={styles.summaryTextContainer}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                              Total Amount
                            </Text>
                            <Text style={[styles.totalAmount, { color: colors.success }]}>
                              KSh {(selectedOrder.total || 0).toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Progress Tracking */}
                  <LinearGradient
                    colors={[colors.surface, colors.surfaceElevated]}
                    style={styles.progressCardGradient}
                  >
                    <View style={styles.progressCard}>
                      <View style={styles.progressHeader}>
                        <LinearGradient
                          colors={colors.gradient.primary}
                          style={styles.progressIconContainer}
                        >
                          <TrendingUp size={24} color="white" />
                        </LinearGradient>
                        <View style={styles.progressHeaderText}>
                          <Text style={[styles.progressTitle, { color: colors.text }]}>
                            Order Progress
                          </Text>
                          <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                            Track your order status in real-time
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.timelineContainer}>
                        {getStatusSteps(selectedOrder.status || 'pending').map((step, index) => (
                          <View key={step.key} style={styles.timelineStep}>
                            <View style={styles.timelineIndicator}>
                              <LinearGradient
                                colors={step.isActive ? colors.gradient.success : [colors.borderLight, colors.border]}
                                style={[
                                  styles.timelineDot,
                                  step.isCurrent && styles.currentTimelineDot
                                ]}
                              >
                                {step.icon}
                              </LinearGradient>
                              {index < getStatusSteps(selectedOrder.status || 'pending').length - 1 && (
                                <View 
                                  style={[
                                    styles.timelineLine, 
                                    { backgroundColor: step.isActive ? colors.success : colors.borderLight }
                                  ]} 
                                />
                              )}
                            </View>
                            <View style={styles.timelineContent}>
                              <Text style={[styles.timelineLabel, { color: step.isActive ? colors.text : colors.textSecondary }]}>
                                {step.label}
                              </Text>
                              <Text style={[styles.timelineDescription, { color: colors.textSecondary }]}>
                                {step.description}
                              </Text>
                              {step.isCurrent && (
                                <LinearGradient
                                  colors={colors.gradient.warning}
                                  style={styles.currentBadge}
                                >
                                  <Text style={styles.currentBadgeText}>Current</Text>
                                </LinearGradient>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Support Card */}
                  <LinearGradient
                    colors={colors.gradient.dark}
                    style={styles.supportCardGradient}
                  >
                    <View style={styles.supportCard}>
                      <View style={styles.supportHeader}>
                        <View style={styles.supportIconContainer}>
                          <MessageCircle size={24} color={colors.primaryLight} />
                        </View>
                        <View style={styles.supportTextContainer}>
                          <Text style={styles.supportTitle}>
                            Need Help with Your Order?
                          </Text>
                          <Text style={styles.supportSubtitle}>
                            Contact our support team on WhatsApp
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.whatsappButton}
                        onPress={() => openWhatsApp(`Hello! I need help with my order ${formatOrderId(selectedOrder.id)}. Status: ${(selectedOrder.status || 'pending').toUpperCase()}`)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.whatsappButtonContent}>
                          <MessageCircle size={20} color={colors.text} />
                          <Text style={[styles.whatsappButtonText, { color: colors.text }]}>Contact Support</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>

                  {/* Quick Actions */}
                  <LinearGradient
                    colors={[colors.surface, colors.surfaceElevated]}
                    style={styles.actionsCardGradient}
                  >
                    <View style={styles.actionsCard}>
                      <View style={styles.actionsHeader}>
                        <LinearGradient
                          colors={colors.gradient.primary}
                          style={styles.actionsIconContainer}
                        >
                          <Phone size={24} color="white" />
                        </LinearGradient>
                        <Text style={[styles.actionsTitle, { color: colors.text }]}>
                          Quick Actions
                        </Text>
                      </View>
                      
                      <View style={styles.actionsContainer}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleDriverCall('0714648622')}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={colors.gradient.primary}
                            style={styles.actionGradient}
                          >
                            <Phone size={18} color="white" />
                            <Text style={styles.actionButtonText}>Call Support</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleDriverMessage('0714648622')}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={colors.gradient.success}
                            style={styles.actionGradient}
                          >
                            <MessageCircle size={18} color="white" />
                            <Text style={styles.actionButtonText}>Send Message</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
      
      {/* Time Selection Modal */}
      {selectedOrder && (
        <TimeSelectionModal
          visible={showTimeModal}
          onClose={() => setShowTimeModal(false)}
          onSave={async (pickupTime?: string, deliveryTime?: string) => {
            await updateOrderTimes(selectedOrder.id!, pickupTime, deliveryTime);
          }}
          currentPickupTime={selectedOrder.pickupTime}
          currentDeliveryTime={selectedOrder.preferredDeliveryTime}
          orderStatus={selectedOrder.status}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  contentContainer: {
    flex: 1,
  },
  
  // Header Section
  headerSection: {
    marginBottom: 16,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    paddingTop: 50,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
    maxWidth: 300,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Order Selector
  selectorSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  selectorCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  selectorLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  orderSelector: {
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectorGradient: {
    padding: 16,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorLeft: {
    flex: 1,
  },
  selectorOrderId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectorStatus: {
    fontSize: 14,
  },
  selectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Order Section
  orderSection: {
    paddingHorizontal: 16,
    gap: 16,
  },
  
  // Main Order Card
  orderCardGradient: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  orderCard: {
    padding: 24,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  orderHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  orderIdSection: {
    marginBottom: 16,
  },
  orderId: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  orderDate: {
    fontSize: 15,
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  
  // Time Button
  timeButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  timeButtonGradient: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  timeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  timeButtonIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  
  // Order Summary
  orderSummary: {
    gap: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 4,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  
  // Progress Card
  progressCardGradient: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  progressCard: {
    padding: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 16,
  },
  progressIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeaderText: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  progressSubtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  
  // Timeline
  timelineContainer: {
    gap: 24,
  },
  timelineStep: {
    flexDirection: 'row',
    gap: 20,
  },
  timelineIndicator: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentTimelineDot: {
    transform: [{ scale: 1.1 }],
  },
  timelineLine: {
    width: 3,
    height: 32,
    marginTop: 12,
    borderRadius: 1.5,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 8,
  },
  timelineLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  timelineDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  currentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  
  // Support Card
  supportCardGradient: {
    borderRadius: 20,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  supportCard: {
    padding: 24,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  supportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTextContainer: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF', // Light color for text on dark background
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  supportSubtitle: {
    fontSize: 14,
    color: '#FFFFFF', // Light color for text on dark background
    opacity: 0.8,
    fontWeight: '500',
    lineHeight: 20,
  },
  whatsappButton: {
    backgroundColor: '#B3CFE5', // Using direct color value instead of colors reference
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4A7FA7', // Using direct color value instead of colors reference
  },
  whatsappButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  whatsappButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  // Actions Card
  actionsCardGradient: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  actionsCard: {
    padding: 24,
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  actionsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, 
  CircleCheck as CheckCircle, 
  Package, 
  Clock, 
  MapPin, 
  Phone, 
  Star,
  Share2,
  MessageCircle,
  Calendar,
  Truck,
  Bell,
  Gift,
  Sparkles
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { EnhancedReceiptModal } from './EnhancedReceiptModal';

const { width } = Dimensions.get('window');

interface OrderConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  orderDetails: {
    id: string;
    service: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    area: string;
  estate?: string;
    phone: string;
    pickupTime: string;
    paymentMethod: string;
    status: string;
  } | null;
}

export default function OrderConfirmationModal({
  visible,
  onClose,
  orderDetails,
}: OrderConfirmationModalProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const [showReceiptModal, setShowReceiptModal] = useState(false);

  if (!orderDetails) return null;

  const isPaid = orderDetails.paymentMethod !== 'cash';

  // Handler functions for buttons
  const handleWhatsApp = () => {
    const message = `Hi! I have a question about my order #${orderDetails.id.slice(-6).toUpperCase()}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('WhatsApp not installed', 'Please install WhatsApp to use this feature');
    });
  };

  const handleShare = async () => {
    try {
      const message = `My Kleanly order is confirmed!\n\nOrder: #${orderDetails.id.slice(-6).toUpperCase()}\nService: ${orderDetails.service}\nPickup: ${orderDetails.pickupTime}\n\nTry Kleanly for premium laundry services!`;
      await Share.share({
        message,
        title: 'My Kleanly Order',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleNotifications = () => {
    Alert.alert(
      'Notifications',
      'You will receive SMS and WhatsApp updates about your order status.',
      [{ text: 'OK' }]
    );
  };

  const handleCall = () => {
    const phoneNumber = 'tel:+254714648622'; // Support team contact number
    Linking.openURL(phoneNumber).catch(() => {
      Alert.alert('Cannot make call', 'Please dial +254 700 000 000 manually');
    });
  };

  const handleReferral = () => {
    Alert.alert(
      'Referral Program',
      'Share your referral code and earn KSH 200 for each successful referral!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Share Now', onPress: handleShare }
      ]
    );
  };

  // Transform orderDetails to match the Order type expected by EnhancedReceiptModal
  const orderForReceipt = {
    ...orderDetails,
    userID: 'default-user-id',
    category: orderDetails.service,
    date: new Date().toISOString(),
    address: orderDetails.area,
    createdAt: new Date().toISOString(),
    paymentMethod: orderDetails.paymentMethod as "card" | "cash" | "other" | "mpesa",
    status: orderDetails.status as "pending" | "confirmed" | "in-progress" | "completed" | "cancelled",
    items: orderDetails.items.map(item => `${item.name} (x${item.quantity})`),
    isPaid: isPaid,
    completedAt: orderDetails.status === 'completed' ? new Date().toISOString() : null,
    specialInstructions: ''
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={[colors.gradient.primary[0], colors.gradient.primary[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.8}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.successIcon}>
              <View style={styles.successIconContainer}>
                <CheckCircle size={48} color="#FFFFFF" />
                <View style={styles.successGlow} />
              </View>
            </View>
            <Text style={styles.headerTitle}>Order Confirmed!</Text>
            <Text style={styles.headerSubtitle}>
              {isPaid ? 'Payment Successful' : 'Pay on Pickup'}
            </Text>
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdLabel}>Order ID:</Text>
              <Text style={styles.orderIdValue}>#{orderDetails.id.slice(-6).toUpperCase()}</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.primary + '20' }]}
              onPress={handleWhatsApp}
            >
              <MessageCircle size={20} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.primary }]}>WhatsApp Us</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.success + '20' }]}
              onPress={handleShare}
            >
              <Share2 size={20} color={colors.success} />
              <Text style={[styles.quickActionText, { color: colors.success }]}>Share Order</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.warning + '20' }]}
              onPress={handleNotifications}
            >
              <Bell size={20} color={colors.warning} />
              <Text style={[styles.quickActionText, { color: colors.warning }]}>Notifications</Text>
            </TouchableOpacity>
          </View>

          {/* Order Details Card */}
          <Card style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={[styles.orderTitle, { color: colors.text }]}>
                Order Details
              </Text>
              <View style={[styles.orderIdBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.orderIdText, { color: colors.primary }]}>
                  #{orderDetails.id.slice(-6).toUpperCase()}
                </Text>
              </View>
              {orderDetails.estate ? (
                <View style={{ marginLeft:8, paddingHorizontal:10, paddingVertical:4, borderRadius:14, backgroundColor: colors.success + '20', borderWidth:1, borderColor: colors.success + '55' }}>
                  <Text style={{ fontSize:11, fontWeight:'600', color: colors.success }}>{orderDetails.estate}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.orderInfo}>
              <View style={styles.infoRow}>
                <Package size={20} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>Service:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {orderDetails.service}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Clock size={20} color={colors.warning} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>Pickup:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {orderDetails.pickupTime}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <MapPin size={20} color={colors.success} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>Area:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {orderDetails.area}
                </Text>
              </View>
              {orderDetails.estate ? (
                <View style={styles.infoRow}>
                  <View style={{ width:20, alignItems:'center' }}>
                    <MapPin size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>Estate:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{orderDetails.estate}</Text>
                </View>
              ) : null}

              <View style={styles.infoRow}>
                <Phone size={20} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>Phone:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {orderDetails.phone}
                </Text>
              </View>
            </View>
          </Card>

          {/* Items List */}
          <Card style={styles.itemsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Items ({orderDetails.items.length})
            </Text>
            {orderDetails.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={[styles.itemName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>
                  x{item.quantity}
                </Text>
                <Text style={[styles.itemPrice, { color: colors.text }]}>
                  KSH {item.price * item.quantity}
                </Text>
              </View>
            ))}
            
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>
                KSH {orderDetails.total}
              </Text>
            </View>
          </Card>

          {/* Timeline - What Happens Next */}
          <Card style={styles.timelineCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              What Happens Next?
            </Text>
            <View style={styles.timeline}>
              <View style={styles.timelineStep}>
                <View style={[styles.timelineIcon, { backgroundColor: colors.primary }]}>
                  <Truck size={16} color="#FFFFFF" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: colors.text }]}>
                    Pickup Scheduled
                  </Text>
                  <Text style={[styles.timelineDescription, { color: colors.textSecondary }]}>
                    We'll collect your items at {orderDetails.pickupTime}
                  </Text>
                </View>
              </View>
              
              <View style={styles.timelineStep}>
                <View style={[styles.timelineIcon, { backgroundColor: colors.warning }]}>
                  <Sparkles size={16} color="#FFFFFF" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: colors.text }]}>
                    Professional Cleaning
                  </Text>
                  <Text style={[styles.timelineDescription, { color: colors.textSecondary }]}>
                    Your items will be cleaned with premium care
                  </Text>
                </View>
              </View>
              
              <View style={styles.timelineStep}>
                <View style={[styles.timelineIcon, { backgroundColor: colors.success }]}>
                  <CheckCircle size={16} color="#FFFFFF" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: colors.text }]}>
                    Fresh Delivery
                  </Text>
                  <Text style={[styles.timelineDescription, { color: colors.textSecondary }]}>
                    Clean items delivered back to you within 24-48 hours
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Customer Care */}
          <Card style={styles.careCard}>
            <LinearGradient
              colors={[colors.primary + '10', colors.primary + '05']}
              style={styles.careGradient}
            >
              <View style={styles.careHeader}>
                <View style={[styles.careIcon, { backgroundColor: colors.primary + '20' }]}>
                  <MessageCircle size={24} color={colors.primary} />
                </View>
                <Text style={[styles.careTitle, { color: colors.text }]}>
                  Need Help?
                </Text>
              </View>
              <Text style={[styles.careDescription, { color: colors.textSecondary }]}>
                Our customer care team is here 24/7 to assist you with any questions about your order.
              </Text>
              <View style={styles.careActions}>
                <TouchableOpacity 
                  style={[styles.careButton, { backgroundColor: colors.success }]}
                  onPress={handleWhatsApp}
                >
                  <MessageCircle size={16} color="#FFFFFF" />
                  <Text style={styles.careButtonText}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.careButton, { backgroundColor: colors.primary }]}
                  onPress={handleCall}
                >
                  <Phone size={16} color="#FFFFFF" />
                  <Text style={styles.careButtonText}>Call Us</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Card>

          {/* Payment Status */}
          <Card style={styles.paymentCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Payment Status
            </Text>
            <View style={styles.paymentStatus}>
              <View style={[
                styles.paymentStatusBadge,
                { backgroundColor: isPaid ? colors.success + '20' : colors.warning + '20' }
              ]}>
                <Text style={[
                  styles.paymentStatusText,
                  { color: isPaid ? colors.success : colors.warning }
                ]}>
                  {isPaid ? 'PAID' : 'PENDING'}
                </Text>
              </View>
              <Text style={[styles.paymentMethod, { color: colors.textSecondary }]}>
                {orderDetails.paymentMethod === 'mpesa' ? 'M-Pesa' : 
                 orderDetails.paymentMethod === 'card' ? 'Card Payment' : 'Cash on Pickup'}
              </Text>
            </View>
            
            {!isPaid && (
              <Text style={[styles.paymentNote, { color: colors.textSecondary }]}>
                You'll receive a receipt when you pay during pickup
              </Text>
            )}
          </Card>

          {/* Receipt Button */}
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={() => setShowReceiptModal(true)}
          >
            <Ionicons name="receipt" size={20} color={colors.primary} />
            <Text style={[styles.receiptButtonText, { color: colors.primary }]}>
              View Receipt
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actionButtons, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.doneButton]}
            onPress={onClose}
          >
        {/* Receipt Modal */}
        <EnhancedReceiptModal
          visible={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          order={orderForReceipt}
          customerName="Customer Name" // Get from your state
        />
          </TouchableOpacity>
        </View>

        {/* Receipt Modal */}
        <EnhancedReceiptModal
          visible={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          order={orderForReceipt}
          customerName="Customer Name" // Get from your state
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    gap: 8,
  },
  orderIdLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  orderIdValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  successIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.6,
    zIndex: -1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderCard: {
    marginBottom: 16,
    padding: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  orderIdBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderInfo: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 80,
  },
  infoValue: {
    fontSize: 16,
    flex: 1,
  },
  itemsCard: {
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 16,
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    marginHorizontal: 12,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  timelineCard: {
    marginBottom: 16,
    padding: 20,
  },
  timeline: {
    gap: 20,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  careCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  careGradient: {
    padding: 20,
  },
  careHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  careIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  careDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  careActions: {
    flexDirection: 'row',
    gap: 12,
  },
  careButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  careButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentCard: {
    marginBottom: 16,
    padding: 20,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentNote: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  doneButton: {
    borderRadius: 16,
  },
  doneButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  receiptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export { OrderConfirmationModal }
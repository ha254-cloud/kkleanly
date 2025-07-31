import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, CircleCheck as CheckCircle, Package, Clock, MapPin, Phone, Star, Share2, MessageCircle, Truck, Sparkles, Gift, Receipt, Calendar } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface OrderSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    service: string;
    items: string[];
    total: number;
    area: string;
    phone: string;
    pickupTime: string;
    paymentMethod: string;
    isPaid: boolean;
  };
  onViewReceipt: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  visible,
  onClose,
  orderData,
  onViewReceipt,
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const handleShare = async () => {
    try {
      const message = `  Just booked laundry with Kleanly!\n\nOrder: ${orderData.orderId}\nService: ${orderData.service}\nTotal: KSH ${orderData.total.toLocaleString()}\n\nTry Kleanly for premium laundry services!`;
      
      await Share.share({
        message,
        title: 'My Kleanly Order',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleWhatsApp = () => {
    Alert.alert(
      'WhatsApp Support',
      'Opening WhatsApp to chat with our support team...',
      [{ text: 'OK' }]
    );
  };

  const handleReferral = () => {
    Alert.alert(
      '🎁 Referral Program',
      'Invite friends and earn KSH 200 credit for each successful referral!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Share Now', onPress: handleShare }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Success Header */}
        <LinearGradient
          colors={[colors.success, colors.success + 'E6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.successIconContainer}>
              <CheckCircle size={64} color="#FFFFFF" />
              <View style={styles.successGlow} />
            </View>
            <Text style={styles.headerTitle}>  Order Confirmed!</Text>
            <Text style={styles.headerSubtitle}>
              {orderData.isPaid ? '✅ Payment Successful' : '  Pay on Pickup'}
            </Text>
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdLabel}>Order ID:</Text>
              <Text style={styles.orderIdValue}>#{orderData.orderId}</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.success + '20' }]}
              onPress={handleWhatsApp}
            >
              <MessageCircle size={20} color={colors.success} />
              <Text style={[styles.quickActionText, { color: colors.success }]}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.primary + '20' }]}
              onPress={handleShare}
            >
              <Share2 size={20} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.primary }]}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.warning + '20' }]}
              onPress={onViewReceipt}
            >
              <Receipt size={20} color={colors.warning} />
              <Text style={[styles.quickActionText, { color: colors.warning }]}>Receipt</Text>
            </TouchableOpacity>
          </View>

          {/* Order Details */}
          <Card style={styles.orderCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Order Details
            </Text>
            
            <View style={styles.orderInfo}>
              <View style={styles.infoRow}>
                <Package size={20} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>Service:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {orderData.service}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Clock size={20} color={colors.warning} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>Pickup:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {orderData.pickupTime}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <MapPin size={20} color={colors.success} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>Area:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {orderData.area}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Phone size={20} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>Phone:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {orderData.phone}
                </Text>
              </View>
            </View>

            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>
                KSH {orderData.total.toLocaleString()}
              </Text>
            </View>
          </Card>

          {/* What's Next Timeline */}
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
                    We'll collect your items at {orderData.pickupTime}
                  </Text>
                </View>
              </View>
              
              <View style={styles.timelineStep}>
                <View style={[styles.timelineIcon, { backgroundColor: colors.warning }]}>
                  <Sparkles size={16} color="#FFFFFF" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: colors.text }]}>
                    ✨ Professional Cleaning
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
                    Clean items delivered back within 24-48 hours
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Referral Bonus */}
          <Card style={styles.bonusCard}>
            <LinearGradient
              colors={[colors.warning + '15', colors.warning + '08']}
              style={styles.bonusGradient}
            >
              <View style={styles.bonusContent}>
                <View style={[styles.bonusIcon, { backgroundColor: colors.warning + '20' }]}>
                  <Gift size={32} color={colors.warning} />
                </View>
                <Text style={[styles.bonusTitle, { color: colors.text }]}>
                  🎁 Earn KSH 200!
                </Text>
                <Text style={[styles.bonusDescription, { color: colors.textSecondary }]}>
                  Refer a friend and both get KSH 200 credit!
                </Text>
                <TouchableOpacity 
                  style={[styles.bonusButton, { backgroundColor: colors.warning }]}
                  onPress={handleReferral}
                >
                  <Share2 size={16} color="#FFFFFF" />
                  <Text style={styles.bonusButtonText}>Share & Earn</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Card>

          {/* Payment Status */}
          <Card style={styles.paymentCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              💳 Payment Status
            </Text>
            <View style={styles.paymentStatus}>
              <View style={[
                styles.paymentStatusBadge,
                { backgroundColor: orderData.isPaid ? colors.success + '20' : colors.warning + '20' }
              ]}>
                <Text style={[
                  styles.paymentStatusText,
                  { color: orderData.isPaid ? colors.success : colors.warning }
                ]}>
                  {orderData.isPaid ? 'PAID' : 'PENDING'}
                </Text>
              </View>
              <Text style={[styles.paymentMethod, { color: colors.textSecondary }]}>
                {orderData.paymentMethod === 'mpesa' ? 'M-Pesa Payment' : 
                 orderData.paymentMethod === 'card' ? 'Card Payment' : 'Cash on Pickup'}
              </Text>
            </View>
            
            {!orderData.isPaid && (
              <Text style={[styles.paymentNote, { color: colors.textSecondary }]}>
                  You'll receive a receipt when you pay during pickup
              </Text>
            )}
          </Card>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actionButtons, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.receiptButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            onPress={onViewReceipt}
          >
            <Receipt size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>View Receipt</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.doneButton]}
            onPress={onClose}
          >
            <LinearGradient
              colors={[colors.success, colors.success + 'E6']}
              style={styles.doneButtonGradient}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.doneButtonText}>Perfect!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

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
  successIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  successGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    top: -18,
    left: -18,
    zIndex: -1,
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
    marginBottom: 16,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  orderInfo: {
    gap: 16,
    marginBottom: 16,
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
  bonusCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  bonusGradient: {
    padding: 20,
  },
  bonusContent: {
    alignItems: 'center',
  },
  bonusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bonusTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  bonusDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  bonusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
  },
  bonusButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
  receiptButton: {
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
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
});
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { X, Banknote, CheckCircle, AlertTriangle, Receipt } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import SimpleDeliveryReceipt from './SimpleDeliveryReceipt';
import { formatCurrency } from '../utils/formatters';
import { Order } from '../services/orderService';

const { width } = Dimensions.get('window');

interface CashPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  orderTotal: number;
  orderId: string;
  customerInfo: {
    address: string;
    phone?: string;
  };
  onPaymentConfirmed: (amountReceived: number) => void;
}

export const CashPaymentModal: React.FC<CashPaymentModalProps> = ({
  visible,
  onClose,
  orderTotal,
  orderId,
  customerInfo,
  onPaymentConfirmed,
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showDriverReceipt, setShowDriverReceipt] = useState(false);

  const handleConfirmPayment = () => {
    Alert.alert(
      '💰 Confirm Cash Payment',
      `Have you received the full payment of ${formatCurrency(orderTotal)} from the customer?`,
      [
        {
          text: 'Not Yet',
          style: 'cancel',
        },
        {
          text: 'Yes, Received',
          onPress: () => {
            setPaymentConfirmed(true);
            setTimeout(() => {
              onPaymentConfirmed(orderTotal);
              setShowDriverReceipt(true);
            }, 1500);
          },
        },
      ]
    );
  };

  const handleClose = () => {
    setPaymentConfirmed(false);
    setShowDriverReceipt(false);
    onClose();
  };

  const formatOrderId = (id: string) => {
    return `#${id.slice(-6).toUpperCase()}`;
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <LinearGradient
            colors={[colors.success, colors.success + 'E6']}
            style={styles.header}
          >
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cash Payment</Text>
            <View style={styles.headerIcon}>
              <Banknote size={24} color="#FFFFFF" />
            </View>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {!paymentConfirmed ? (
              <>
                {/* Order Information */}
                <Card style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={[styles.orderTitle, { color: colors.text }]}>
                      Order Details
                    </Text>
                    <Text style={[styles.orderId, { color: colors.primary }]}>
                      {formatOrderId(orderId)}
                    </Text>
                  </View>
                  
                  <View style={styles.orderInfo}>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        Delivery Address:
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {customerInfo.address}
                      </Text>
                    </View>
                    
                    {customerInfo.phone && (
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                          Customer Phone:
                        </Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                          {customerInfo.phone}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>

                {/* Payment Amount */}
                <Card style={styles.paymentCard}>
                  <LinearGradient
                    colors={[colors.success + '15', colors.success + '08']}
                    style={styles.paymentGradient}
                  >
                    <View style={styles.paymentHeader}>
                      <View style={[styles.paymentIcon, { backgroundColor: colors.success + '20' }]}>
                        <Banknote size={32} color={colors.success} />
                      </View>
                      <Text style={[styles.paymentTitle, { color: colors.text }]}>
                        Amount to Collect
                      </Text>
                    </View>
                    
                    <Text style={[styles.paymentAmount, { color: colors.success }]}>
                      {formatCurrency(orderTotal)}
                    </Text>
                    
                    <Text style={[styles.paymentNote, { color: colors.textSecondary }]}>
                      Collect exact amount from customer
                    </Text>
                  </LinearGradient>
                </Card>

                {/* Instructions */}
                <Card style={styles.instructionsCard}>
                  <Text style={[styles.instructionsTitle, { color: colors.text }]}>
                    Payment Instructions
                  </Text>
                  
                  <View style={styles.instructionsList}>
                    <View style={styles.instructionItem}>
                      <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
                        <Text style={styles.instructionNumberText}>1</Text>
                      </View>
                      <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                        Deliver the cleaned items to the customer
                      </Text>
                    </View>
                    
                    <View style={styles.instructionItem}>
                      <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
                        <Text style={styles.instructionNumberText}>2</Text>
                      </View>
                      <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                        Collect {formatCurrency(orderTotal)} in cash
                      </Text>
                    </View>
                    
                    <View style={styles.instructionItem}>
                      <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
                        <Text style={styles.instructionNumberText}>3</Text>
                      </View>
                      <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                        Confirm payment received below
                      </Text>
                    </View>
                    
                    <View style={styles.instructionItem}>
                      <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
                        <Text style={styles.instructionNumberText}>4</Text>
                      </View>
                      <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                        Provide receipt to customer
                      </Text>
                    </View>
                  </View>
                </Card>

                {/* Warning Notice */}
                <View style={[styles.warningCard, { backgroundColor: colors.warning + '20' }]}>
                  <AlertTriangle size={20} color={colors.warning} />
                  <Text style={[styles.warningText, { color: colors.warning }]}>
                    Only confirm payment after you have received the full amount from the customer
                  </Text>
                </View>
              </>
            ) : (
              /* Payment Confirmed State */
              <View style={styles.confirmedContainer}>
                <View style={[styles.confirmedIcon, { backgroundColor: colors.success }]}>
                  <CheckCircle size={64} color="#FFFFFF" />
                </View>
                
                <Text style={[styles.confirmedTitle, { color: colors.text }]}>
                  Payment Confirmed!
                </Text>
                
                <Text style={[styles.confirmedSubtitle, { color: colors.textSecondary }]}>
                  Cash payment of {formatCurrency(orderTotal)} has been recorded
                </Text>
                
                <View style={[styles.confirmedDetails, { backgroundColor: colors.success + '10' }]}>
                  <Receipt size={20} color={colors.success} />
                  <Text style={[styles.confirmedDetailsText, { color: colors.success }]}>
                    Driver receipt is being generated...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Button */}
          {!paymentConfirmed && (
            <View style={styles.actionContainer}>
              <LinearGradient
                colors={[colors.success, colors.success + 'E6']}
                style={styles.actionButtonGradient}
              >
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleConfirmPayment}
                  activeOpacity={0.8}
                >
                  <Banknote size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    Confirm Payment Received
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </View>
      </Modal>

      {/* Simple Delivery Receipt */}
      {showDriverReceipt && (
        <View style={styles.receiptContainer}>
          <SimpleDeliveryReceipt
            order={{
              id: orderId,
              userID: 'customer_id',
              customerName: 'Customer',
              category: 'laundry',
              items: ['Laundry Service'],
              total: orderTotal,
              paymentMethod: 'cash',
              address: customerInfo.address,
              deliveryAddress: customerInfo.address,
              date: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              status: 'completed',
              recipient: {
                name: 'Customer',
                address: customerInfo.address,
                phone: customerInfo.phone || ''
              }
            } as unknown as Order} visible={false} onClose={function (): void {
              throw new Error('Function not implemented.');
            } }          />
        </View>
      )}
    </>
  );
};

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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Order Information
  orderCard: {
    marginBottom: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
  },
  orderInfo: {
    gap: 12,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Payment Amount
  paymentCard: {
    marginBottom: 20,
    overflow: 'hidden',
  },
  paymentGradient: {
    padding: 24,
    alignItems: 'center',
  },
  paymentHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  paymentAmount: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  paymentNote: {
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Instructions
  instructionsCard: {
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  instructionNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  
  // Warning
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  
  // Confirmed State
  confirmedContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  confirmedIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  confirmedTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmedSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmedDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  confirmedDetailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Action Button
  actionContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  actionButtonGradient: {
    borderRadius: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  receiptContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
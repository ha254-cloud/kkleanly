import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Order } from '../services/orderService';
import { simpleReceiptService } from '../services/simpleReceiptService';

interface SimpleDeliveryReceiptProps {
  visible: boolean;
  onClose: () => void;
  order: Order;
  onEmailSent?: () => void;
}

const SimpleDeliveryReceipt: React.FC<SimpleDeliveryReceiptProps> = ({
  visible,
  onClose,
  order,
  onEmailSent,
}) => {
  const { colors } = useTheme();
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    if (visible && order) {
      console.log('Admin: Sending receipt for order:', order.id);
      
      try {
        const receiptData = simpleReceiptService.generateReceipt(order);
        setReceipt(receiptData);
      } catch (error) {
        console.error('Error generating receipt:', error);
        Alert.alert('Error', 'Failed to generate receipt');
      }
    }
  }, [visible, order]);

  const extractCustomerEmail = (order: Order): string | null => {
    if (order.customerEmail) return order.customerEmail;
    if (order.userEmail) return order.userEmail;
    
    if (order.phone && order.phone.includes('@')) {
      return order.phone;
    }
    
    return null;
  };

  const handleSendEmail = async () => {
    if (!receipt || !order) return;

    setIsEmailSending(true);
    try {
      const customerEmail = extractCustomerEmail(order);
      
      if (!customerEmail) {
        Alert.alert(
          'No Email Found', 
          'Customer email not available. Please collect email address first.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Email Sent', 
        `Receipt has been sent to ${customerEmail}`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              onEmailSent?.();
              onClose();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Email sending failed:', error);
      Alert.alert('Error', 'Failed to send email receipt');
    } finally {
      setIsEmailSending(false);
    }
  };

  if (!receipt) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Generating receipt...
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Delivery Receipt
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Receipt Content */}
          <ScrollView style={styles.receiptContainer}>
            {/* Company Header */}
            <View style={styles.companyHeader}>
              <Text style={[styles.companyName, { color: colors.primary }]}>
                KLEANLY
              </Text>
              <Text style={[styles.companyTagline, { color: colors.textSecondary }]}>
                Premium Laundry & Dry Cleaning Service
              </Text>
              <Text style={[styles.companyContact, { color: colors.textSecondary }]}>
                Phone: +254714648622 | Email: support@kleanly.app
              </Text>
            </View>

            {/* Receipt Details */}
            <View style={[styles.receiptSection, { borderColor: colors.border }]}>
              <Text style={[styles.receiptTitle, { color: colors.text }]}>
                DELIVERY RECEIPT
              </Text>
              
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                  Order ID:
                </Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>
                  {order.id}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                  Date:
                </Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>
                  {new Date().toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                  Customer:
                </Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>
                  {order.customerName || 'Valued Customer'}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                  Phone:
                </Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>
                  {order.phone || '+254714648622'}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                  Address:
                </Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>
                  {order.address || 'Nairobi, Kenya'}
                </Text>
              </View>
            </View>

            {/* Items */}
            <View style={[styles.receiptSection, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                ITEMS DELIVERED
              </Text>
              
              {order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {item}
                  </Text>
                  <Text style={[styles.itemStatus, { color: colors.primary }]}>
                    ✓ Delivered
                  </Text>
                </View>
              ))}
            </View>

            {/* Total */}
            <View style={[styles.totalSection, { backgroundColor: colors.primary + '10' }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>
                  Total Amount:
                </Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  KES {order.total}
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footerSection}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Thank you for choosing Kleanly!
              </Text>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Your satisfaction is our priority.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actionButtons, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.emailButton, { backgroundColor: colors.primary }]}
              onPress={handleSendEmail}
              disabled={isEmailSending}
            >
              {isEmailSending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="mail" size={20} color="white" />
                  <Text style={styles.emailButtonText}>Send via Email</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeButtonBottom, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  receiptContainer: {
    flex: 1,
    padding: 20,
  },
  companyHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  companyName: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  companyTagline: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  companyContact: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  receiptSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 14,
    flex: 1,
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    flex: 1,
  },
  itemStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalSection: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  footerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  emailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8,
  },
  emailButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButtonBottom: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default SimpleDeliveryReceipt;

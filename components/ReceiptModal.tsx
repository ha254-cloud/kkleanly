import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { X, Printer, Share, Download, Mail, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { emailService } from '../services/emailService';

interface ReceiptModalProps {
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
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  onClose,
  orderData,
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handlePrint = () => {
    Alert.alert('Print Receipt', 'Receipt sent to printer. Please collect from front desk.');
  };

  const handleShare = async () => {
    try {
      setIsProcessing(true);
      // Convert orderData to Order format for email service
      const orderForEmail = {
        id: orderData.orderId,
        category: orderData.service,
        items: orderData.items,
        total: orderData.total,
        address: orderData.area,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        status: 'completed' as const,
        userID: 'current-user',
        pickupTime: orderData.pickupTime,
      };
      
      await emailService.shareReceipt(orderForEmail, 'payment_receipt', {
        paymentInfo: {
          method: orderData.paymentMethod,
          amount: orderData.total,
          paidAt: new Date().toISOString(),
        }
      });
      Alert.alert('Success', 'Receipt shared successfully!');
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsProcessing(true);
      const orderForEmail = {
        id: orderData.orderId,
        category: orderData.service,
        items: orderData.items,
        total: orderData.total,
        address: orderData.area,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        status: 'completed' as const,
        userID: 'current-user',
        pickupTime: orderData.pickupTime,
      };
      
      const filePath = await emailService.downloadReceipt(orderForEmail, 'payment_receipt', {
        paymentInfo: {
          method: orderData.paymentMethod,
          amount: orderData.total,
          paidAt: new Date().toISOString(),
        }
      });
      Alert.alert('Success', `Receipt downloaded successfully!`);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download receipt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailRequest = () => {
    setShowEmailDialog(true);
    setEmailSent(false);
  };

  const handleSendEmail = async () => {
    if (!customerEmail.trim()) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    try {
      setIsProcessing(true);
      
      const orderForEmail = {
        id: orderData.orderId,
        category: orderData.service,
        items: orderData.items,
        total: orderData.total,
        address: orderData.area,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        status: 'completed' as const,
        userID: 'current-user',
        pickupTime: orderData.pickupTime,
      };

      const emailData = {
        orderId: orderData.orderId,
        orderDetails: orderForEmail,
        customerEmail: customerEmail.trim(),
        receiptType: 'payment_receipt' as const,
        paymentInfo: {
          method: orderData.paymentMethod,
          amount: orderData.total,
          transactionId: `TXN${Date.now()}`,
          paidAt: new Date().toISOString(),
        }
      };

      const success = await emailService.sendReceiptEmail(emailData);
      
      if (success) {
        setEmailSent(true);
        Alert.alert(
          'Success', 
          `Receipt sent successfully to ${customerEmail}!`,
          [{ text: 'OK', onPress: () => setShowEmailDialog(false) }]
        );
      } else {
        Alert.alert('Info', 'Email app opened. Please send the email manually.');
        setShowEmailDialog(false);
      }
    } catch (error) {
      console.error('Email error:', error);
      Alert.alert('Error', 'Failed to send email. Please try again or check your email settings.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'mpesa':
        return 'M-Pesa Mobile Money';
      case 'card':
        return 'Card Payment';
      case 'cash':
        return 'Cash Payment';
      default:
        return method;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date().toLocaleDateString('en-KE', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEmailDialog = () => (
    <Modal
      visible={showEmailDialog}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowEmailDialog(false)}
    >
      <View style={[styles.emailContainer, { backgroundColor: colors.background }]}>
        <View style={styles.emailHeader}>
          <Text style={[styles.emailTitle, { color: colors.text }]}>Send Receipt via Email</Text>
          <TouchableOpacity 
            onPress={() => setShowEmailDialog(false)} 
            style={styles.emailCloseButton}
          >
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.emailContent}>
          <Card style={styles.emailCard}>
            <Text style={[styles.emailLabel, { color: colors.text }]}>
              Customer Email Address
            </Text>
            <TextInput
              style={[styles.emailInput, { 
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={customerEmail}
              onChangeText={setCustomerEmail}
              placeholder="customer@example.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isProcessing}
            />
            
            <Text style={[styles.emailNote, { color: colors.textSecondary }]}>
              The receipt will be sent as an HTML attachment that can be viewed in any email client and browser.
            </Text>

            {emailSent && (
              <View style={[styles.successMessage, { backgroundColor: colors.success + '20' }]}>
                <Check size={20} color={colors.success} />
                <Text style={[styles.successText, { color: colors.success }]}>
                  Email sent successfully!
                </Text>
              </View>
            )}
          </Card>

          <View style={styles.emailActions}>
            <Button
              title="Cancel"
              onPress={() => setShowEmailDialog(false)}
              variant="outline"
              style={styles.emailActionButton}
              disabled={isProcessing}
            />
            <Button
              title={isProcessing ? "Sending..." : "Send Email"}
              onPress={handleSendEmail}
              style={styles.emailActionButton}
              disabled={isProcessing}
              icon={isProcessing ? 
                <ActivityIndicator size={16} color="#FFFFFF" /> : 
                <Mail size={16} color="#FFFFFF" />
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {orderData.isPaid ? 'Payment Receipt' : 'Payment Pending'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Payment Status Check */}
            {!orderData.isPaid ? (
              <Card style={styles.pendingCard}>
                <View style={styles.pendingContent}>
                  <Text style={[styles.pendingTitle, { color: colors.warning }]}>
                    Receipt Not Available
                  </Text>
                  <Text style={[styles.pendingMessage, { color: colors.textSecondary }]}>
                    Your receipt will be available after payment confirmation.
                  </Text>
                  <Text style={[styles.pendingDetails, { color: colors.textSecondary }]}>
                    Order ID: {orderData.orderId}{'\n'}
                    Payment Method: {getPaymentMethodDisplay(orderData.paymentMethod)}{'\n'}
                    Status: PENDING PAYMENT
                  </Text>
                  <Text style={[styles.pendingNote, { color: colors.warning }]}>
                    {orderData.paymentMethod === 'cash' 
                      ? 'You will receive your receipt when you pay during pickup.'
                      : 'Please complete your M-Pesa payment to generate your receipt.'
                    }
                  </Text>
                </View>
              </Card>
            ) : (
              /* Receipt Content - Only show when paid */
            <Card style={styles.receiptCard}>
              <View style={styles.receiptHeader}>
                <Text style={[styles.businessName, { color: colors.text }]}>
                  KLEANLY LAUNDRY SERVICES
                </Text>
                <Text style={[styles.businessInfo, { color: colors.textSecondary }]}>
                  Premium Laundry & Dry Cleaning
                </Text>
                <Text style={[styles.businessInfo, { color: colors.textSecondary }]}>
                  Nairobi Business District, Kenya
                </Text>
                <Text style={[styles.businessInfo, { color: colors.textSecondary }]}>
                  Phone: +254 700 000 000
                </Text>
                <Text style={[styles.businessInfo, { color: colors.textSecondary }]}>
                  Email: kleanlyspt@gmail.com
                </Text>
                <Text style={[styles.businessInfo, { color: colors.textSecondary }]}>
                  Website: www.kleanly.co.ke
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Receipt Details */}
              <View style={styles.receiptSection}>
                <Text style={[styles.receiptTitle, { color: colors.text }]}>
                  PAYMENT RECEIPT
                </Text>
                <Text style={[styles.receiptDate, { color: colors.textSecondary }]}>
                  {formatDateTime(new Date().toISOString())}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Order Information */}
              <View style={styles.receiptSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  ORDER DETAILS
                </Text>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Order ID:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    #{orderData.orderId}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Order Date:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {new Date().toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Pickup Time:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {orderData.pickupTime}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Customer Phone:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {orderData.phone}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Delivery Area:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {orderData.area}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Items & Services */}
              <View style={styles.receiptSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  ITEMS & SERVICES
                </Text>
                <Text style={[styles.serviceType, { color: colors.primary }]}>
                  {(orderData.service || 'service').toUpperCase()} SERVICE
                </Text>
                {orderData.items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={[styles.itemName, { color: colors.text }]}>
                      • {item}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Payment Information */}
              <View style={styles.receiptSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  PAYMENT DETAILS
                </Text>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Payment Method:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {getPaymentMethodDisplay(orderData.paymentMethod)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Payment Status:
                  </Text>
                  <Text style={[styles.infoValue, { color: orderData.isPaid ? colors.success : colors.warning }]}>
                    {orderData.isPaid ? 'PAID' : 'PENDING'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Payment Date:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {new Date().toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Amount Breakdown */}
              <View style={styles.receiptSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  AMOUNT BREAKDOWN
                </Text>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Service Charges:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    KSH {(orderData.total || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Delivery Fee:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.success }]}>
                    FREE
                  </Text>
                </View>
                <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>
                    TOTAL AMOUNT:
                  </Text>
                  <Text style={[styles.totalAmount, { color: colors.primary }]}>
                    KSH {(orderData.total || 0).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.receiptFooter}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  Thank you for choosing Kleanly!
                </Text>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  Your satisfaction is our priority
                </Text>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  Rate us at: www.kleanly.co.ke/reviews
                </Text>
                <View style={styles.footerDivider}>
                  <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                    Receipt #{orderData.orderId}-{new Date().getTime().toString().slice(-4)}
                  </Text>
                </View>
              </View>
            </Card>
            )}

            {/* Action Buttons - Only show for paid receipts */}
            {orderData.isPaid && (
              <View style={styles.actionButtons}>
                <Button
                  title="Print"
                  onPress={handlePrint}
                  variant="outline"
                  style={styles.actionButton}
                  icon={<Printer size={16} color={colors.primary} />}
                  disabled={isProcessing}
                />
                <Button
                  title="Share"
                  onPress={handleShare}
                  variant="outline"
                  style={styles.actionButton}
                  icon={isProcessing ? 
                    <ActivityIndicator size={16} color={colors.primary} /> : 
                    <Share size={16} color={colors.primary} />
                  }
                  disabled={isProcessing}
                />
                <Button
                  title="Download"
                  onPress={handleDownload}
                  variant="outline"
                  style={styles.actionButton}
                  icon={isProcessing ? 
                    <ActivityIndicator size={16} color={colors.primary} /> : 
                    <Download size={16} color={colors.primary} />
                  }
                  disabled={isProcessing}
                />
                <Button
                  title="Email"
                  onPress={handleEmailRequest}
                  style={styles.actionButton}
                  icon={<Mail size={16} color="#FFFFFF" />}
                  disabled={isProcessing}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {renderEmailDialog()}
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  receiptCard: {
    marginBottom: 24,
    padding: 24,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  businessInfo: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  receiptSection: {
    marginBottom: 8,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  serviceType: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  itemRow: {
    marginBottom: 4,
  },
  itemName: {
    fontSize: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    textAlign: 'center',
  },
  footerDivider: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
  },
  actionButton: {
    flex: 1,
  },
  
  // Email Dialog Styles
  emailContainer: {
    flex: 1,
  },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  emailTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emailCloseButton: {
    padding: 8,
  },
  emailContent: {
    flex: 1,
    padding: 20,
  },
  emailCard: {
    padding: 20,
    marginBottom: 20,
  },
  emailLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emailInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  emailNote: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  emailActionButton: {
    flex: 1,
  },
  // Pending payment styles
  pendingCard: {
    padding: 24,
    marginVertical: 20,
    alignItems: 'center',
  },
  pendingContent: {
    alignItems: 'center',
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  pendingMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  pendingDetails: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  pendingNote: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

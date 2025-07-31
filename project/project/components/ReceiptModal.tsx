import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Printer, Share, Download } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

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

  const handlePrint = () => {
    Alert.alert('Print Receipt', 'Receipt sent to printer. Please collect from front desk.');
  };

  const handleShare = () => {
    Alert.alert('Share Receipt', 'Receipt shared successfully!');
  };

  const handleDownload = () => {
    Alert.alert('Download Receipt', 'Receipt downloaded to your device.');
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Payment Receipt</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Receipt */}
          <Card style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <Text style={[styles.businessName, { color: colors.text }]}>
                KLEANLY LAUNDRY SERVICES
              </Text>
              <Text style={[styles.businessInfo, { color: colors.textSecondary }]}>
                Premium Laundry & Dry Cleaning
              </Text>
              <Text style={[styles.businessInfo, { color: colors.textSecondary }]}>
                📞 +254 700 000 000
              </Text>
              <Text style={[styles.businessInfo, { color: colors.textSecondary }]}>
                📧 support@kleanly.co.ke
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
                {orderData.service.toUpperCase()} SERVICE
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
                  KSH {orderData.total.toLocaleString()}
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
                  KSH {orderData.total.toLocaleString()}
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
                Rate us: ⭐⭐⭐⭐⭐
              </Text>
              <View style={styles.footerDivider}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  Receipt #{orderData.orderId}-{new Date().getTime().toString().slice(-4)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Print Receipt"
              onPress={handlePrint}
              variant="outline"
              style={styles.actionButton}
              icon={<Printer size={16} color={colors.primary} />}
            />
            <Button
              title="Share"
              onPress={handleShare}
              variant="outline"
              style={styles.actionButton}
              icon={<Share size={16} color={colors.primary} />}
            />
            <Button
              title="Download"
              onPress={handleDownload}
              style={styles.actionButton}
              icon={<Download size={16} color="#FFFFFF" />}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
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
});
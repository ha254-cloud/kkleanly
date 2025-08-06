import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { X, Printer, Share, Download, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const { width } = Dimensions.get('window');

interface DriverReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    customerName: string;
    address: string;
    items: string[];
    total: number;
    paymentMethod: string;
    amountReceived: number;
    driverName?: string;
  };
  paymentDate: string;
}

export const DriverReceiptModal: React.FC<DriverReceiptModalProps> = ({
  visible,
  onClose,
  orderData,
  paymentDate,
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const formatOrderId = (id: string) => {
    return `#${id.slice(-6).toUpperCase()}`;
  };

  const handlePrint = () => {
    Alert.alert('Print Receipt', 'Receipt sent to printer. Please collect from front desk.');
  };

  const handleShare = () => {
    Alert.alert('Share Receipt', 'Receipt shared successfully!');
  };

  const handleDownload = () => {
    Alert.alert('Download Receipt', 'Receipt downloaded to your device.');
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
          colors={[colors.success, colors.success + 'E6']}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Driver Receipt</Text>
          <View style={styles.headerIcon}>
            <CheckCircle size={24} color="#FFFFFF" />
          </View>
        </LinearGradient>

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
                DRIVER RECEIPT
              </Text>
              <Text style={[styles.receiptDate, { color: colors.textSecondary }]}>
                {formatDateTime(paymentDate)}
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
                  {formatOrderId(orderData.orderId)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Payment Date:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {new Date(paymentDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Customer:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {orderData.customerName}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Delivery Address:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {orderData.address}
                </Text>
              </View>
              {orderData.driverName && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Driver:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {orderData.driverName}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Items & Services */}
            <View style={styles.receiptSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                ITEMS & SERVICES
              </Text>
              <Text style={[styles.serviceType, { color: colors.primary }]}>
                LAUNDRY SERVICE
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
                  Cash Payment
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Payment Status:
                </Text>
                <Text style={[styles.infoValue, { color: colors.success }]}>
                  PAID
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Amount Received:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {formatCurrency(orderData.amountReceived)}
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
                  {formatCurrency(orderData.total)}
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
                  TOTAL PAID:
                </Text>
                <Text style={[styles.totalAmount, { color: colors.primary }]}>
                  {formatCurrency(orderData.amountReceived)}
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
                  Driver Receipt #{formatOrderId(orderData.orderId)}-{new Date().getTime().toString().slice(-4)}
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
              variant="outline"
              style={styles.actionButton}
              icon={<Download size={16} color={colors.primary} />}
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
  receiptCard: {
    marginBottom: 20,
    padding: 0,
    overflow: 'hidden',
  },
  receiptHeader: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  businessInfo: {
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  receiptSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  serviceType: {
    fontSize: 12,
    fontWeight: '700',
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
    padding: 20,
    paddingTop: 16,
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
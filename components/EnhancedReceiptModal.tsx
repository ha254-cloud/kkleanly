// components/EnhancedReceiptModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Order } from '../services/orderService';
import { PDFReceiptService } from '../services/pdfReceiptService';

interface EnhancedReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  order: Order;
  customerName?: string;
}

export const EnhancedReceiptModal: React.FC<EnhancedReceiptModalProps> = ({
  visible,
  onClose,
  order,
  customerName = 'Valued Customer'
}) => {
  const { colors } = useTheme();
  
  // Provide fallback colors in case they don't exist on the Colors type
  const themeColors = {
    background: (colors as any).background || '#FFFFFF',
    primary: (colors as any).primary || '#007AFF',
    surface: (colors as any).surface || '#F8F9FA',
    text: (colors as any).text || '#000000',
    textSecondary: (colors as any).textSecondary || '#666666',
    border: (colors as any).border || '#E0E0E0',
    accent: (colors as any).accent || '#FF9500',
    success: (colors as any).success || '#34C759',
    info: (colors as any).info || '#5AC8FA'
  };
  const [loading, setLoading] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  const generatePDF = async () => {
    try {
      setLoading(true);
      const pdfUriResult = await PDFReceiptService.generatePDFReceipt({
        order,
        customerInfo: { name: customerName, phone: order.customerPhone || '', email: order.customerEmail },
        paymentInfo: { method: 'Cash', paidAt: order.createdAt, transactionId: order.id }
      });
      
      // Store the URI string result
      setPdfUri(typeof pdfUriResult === 'string' ? pdfUriResult : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF receipt');
      console.error('PDF generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sharePDF = async () => {
    if (!pdfUri) {
      await generatePDF();
      return;
    }

    try {
      // Use the sharing functionality from PDFReceiptService
      await PDFReceiptService.sharePDF(pdfUri, `Kleanly_Receipt_${order.id?.slice(-6).toUpperCase()}.pdf`);
    } catch (error) {
      Alert.alert('Error', 'Failed to share PDF receipt');
      console.error('PDF sharing error:', error);
    }
  };

  const downloadPDF = async () => {
    if (!pdfUri) {
      await generatePDF();
      return;
    }

    try {
      // In React Native/Expo, download is same as share since we can't directly save to filesystem
      await PDFReceiptService.downloadPDF(pdfUri, `Kleanly_Receipt_${order.id?.slice(-6).toUpperCase()}.pdf`);
      Alert.alert('Success', 'PDF ready to save or share');
    } catch (error) {
      Alert.alert('Error', 'Failed to download PDF receipt');
      console.error('PDF download error:', error);
    }
  };

  const emailPDF = async () => {
    if (!order.customerEmail) {
      Alert.alert('No Email', 'Customer email not available for this order');
      return;
    }

    if (!pdfUri) {
      await generatePDF();
      return;
    }

    try {
      // Since we can't directly send emails from React Native without a backend service,
      // we'll share the PDF and let the user choose an email app
      await PDFReceiptService.sharePDF(pdfUri, `Kleanly_Receipt_${order.id?.slice(-6).toUpperCase()}.pdf`);
      Alert.alert('Success', 'Please select your email app to send the receipt');
    } catch (error) {
      Alert.alert('Error', 'Failed to prepare email receipt');
      console.error('PDF email error:', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={[themeColors.primary, themeColors.primary + 'CC']}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipt</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <ScrollView style={styles.content}>
          {/* Order Summary */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Order Summary</Text>
            <View style={styles.orderInfo}>
              <Text style={[styles.orderId, { color: themeColors.primary }]}>
                Order #{order.id?.slice(-8).toUpperCase()}
              </Text>
              <Text style={[styles.orderDate, { color: themeColors.textSecondary }]}>
                {new Date(order.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Customer Information */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Customer Information</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Name:</Text>
              <Text style={[styles.value, { color: themeColors.text }]}>{customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Phone:</Text>
              <Text style={[styles.value, { color: themeColors.text }]}>{order.customerPhone || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Status:</Text>
              <Text style={[styles.value, { color: themeColors.primary }]}>
                {order.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Cost Breakdown */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Payment Details</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Subtotal:</Text>
              <Text style={[styles.value, { color: themeColors.text }]}>
                KSh {Math.round(order.total / 1.16).toLocaleString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>VAT (16%):</Text>
              <Text style={[styles.value, { color: themeColors.text }]}>
                KSh {Math.round(order.total - (order.total / 1.16)).toLocaleString()}
              </Text>
            </View>
            <View style={[styles.totalRow, { borderTopColor: themeColors.border }]}>
              <Text style={[styles.totalLabel, { color: themeColors.text }]}>Total:</Text>
              <Text style={[styles.totalValue, { color: themeColors.primary }]}>
                KSh {order.total.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* PDF Actions */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Receipt Options</Text>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
              onPress={generatePDF}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="document-text" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.actionButtonText}>Generate PDF Receipt</Text>
            </TouchableOpacity>

            {pdfUri && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: themeColors.accent }]}
                  onPress={sharePDF}
                >
                  <Ionicons name="share" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Share PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: themeColors.success }]}
                  onPress={downloadPDF}
                >
                  <Ionicons name="download" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Download PDF</Text>
                </TouchableOpacity>

                {order.customerEmail && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: themeColors.info }]}
                    onPress={emailPDF}
                  >
                    <Ionicons name="mail" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Email PDF</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  orderInfo: {
    alignItems: 'center',
  },
  orderId: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    marginTop: 15,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});
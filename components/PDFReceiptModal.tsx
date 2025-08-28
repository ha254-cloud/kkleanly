import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Order } from '../services/orderService';
import { PDFReceiptService } from '../services/pdfReceiptService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface PDFReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  order: Order;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  paymentInfo: {
    method: string;
    transactionId?: string;
    paidAt: string;
  };
}

export const PDFReceiptModal: React.FC<PDFReceiptModalProps> = ({
  visible,
  onClose,
  order,
  customerInfo,
  paymentInfo
}) => {
  const theme = useTheme();
  const colors: Record<string, string> = theme.colors || theme;
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  useEffect(() => {
    if (visible && !pdfBlob) {
      generatePDF();
    }
  }, [visible]);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await PDFReceiptService.generatePDFReceipt({
        order,
        customerInfo,
        paymentInfo
      });
      setPdfBlob(blob);

      // For mobile, save to file system
      if (Platform.OS !== 'web') {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const filename = `kleanly-receipt-${order.id?.slice(-8)}.pdf`;
          const fileUri = `${FileSystem.documentDirectory}${filename}`;
          
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setPdfUri(fileUri);
        };
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF receipt. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfBlob) return;
    
    try {
      const filename = `kleanly-receipt-${order.id?.slice(-8)}.pdf`;
      
      if (Platform.OS === 'web') {
        await PDFReceiptService.downloadPDF(pdfBlob, filename);
      } else if (pdfUri) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Kleanly Receipt'
        });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to download receipt. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!pdfBlob) return;
    
    try {
      const filename = `kleanly-receipt-${order.id?.slice(-8)}.pdf`;
      
      if (Platform.OS === 'web') {
        await PDFReceiptService.sharePDF(pdfBlob, filename);
      } else if (pdfUri) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Kleanly Receipt'
        });
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    }
  };

  const handleEmail = async () => {
    try {
      const subject = `Kleanly Receipt - Order #${order.id?.slice(-8)}`;
      const body = `Dear ${customerInfo.name},\n\nThank you for choosing Kleanly! Please find your receipt attached.\n\nOrder Details:\n- Service: ${order.category.replace('-', ' ')}\n- Total: KSh ${order.total}\n- Date: ${new Date(paymentInfo.paidAt).toLocaleDateString()}\n\nBest regards,\nKleanly Team`;
      
      const mailtoUrl = `mailto:${customerInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      if (Platform.OS === 'web') {
        window.open(mailtoUrl);
      } else {
        Alert.alert('Email Receipt', 'Email functionality will be available in the next update. For now, please share or download the receipt.');
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert('Error', 'Failed to open email. Please try sharing the receipt instead.');
    }
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
          colors={[colors.primary, colors.primary + 'CC']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textOnDark} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textOnDark }]}>
              PDF Receipt
            </Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.content}>
          {/* Receipt Preview */}
          <View style={[styles.previewSection, { backgroundColor: colors.surface }]}>
            <View style={styles.previewHeader}>
              <Ionicons name="document-text" size={32} color={colors.primary} />
              <Text style={[styles.previewTitle, { color: colors.text }]}>
                Receipt Ready
              </Text>
              <Text style={[styles.previewSubtitle, { color: colors.textSecondary }]}>
                Order #{order.id?.slice(-8).toUpperCase()}
              </Text>
            </View>

            {isGenerating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Generating PDF Receipt...
                </Text>
              </View>
            ) : (
              <View style={styles.receiptDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Customer:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {customerInfo.name}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Service:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {order.category.replace('-', ' ')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Total Amount:
                  </Text>
                  <Text style={[styles.detailValue, styles.totalAmount, { color: colors.primary }]}>
                    KSh {order.total.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Payment Method:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {paymentInfo.method}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Date:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(paymentInfo.paidAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          {!isGenerating && pdfBlob && (
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleDownload}
              >
                <Ionicons name="download" size={20} color={colors.textOnDark} />
                <Text style={[styles.actionButtonText, { color: colors.textOnDark }]}>
                  Download PDF
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.primary }]}
                onPress={handleShare}
              >
                <Ionicons name="share" size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  Share Receipt
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.primary }]}
                onPress={handleEmail}
              >
                <Ionicons name="mail" size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  Email Receipt
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Features */}
          <View style={[styles.featuresSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>
              PDF Receipt Features
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  Professional design with Kleanly branding
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  Complete order and payment details
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  Ready for printing or digital storage
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  Secure and tamper-proof format
                </Text>
              </View>
            </View>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  previewSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  previewSubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  receiptDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsSection: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {},
  secondaryButton: {
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    borderRadius: 12,
    padding: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
});
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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { Order } from '../services/orderService';
import { ReceiptService } from '../services/receiptService';

interface PDFReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  order: Order;
  customerName?: string;
}

export const PDFReceiptModal: React.FC<PDFReceiptModalProps> = ({
  visible,
  onClose,
  order,
  customerName = 'Valued Customer'
}) => {
  const { colors } = useTheme();
  
  const themeColors = {
    background: (colors as any).background || '#FFFFFF',
    primary: (colors as any).primary || '#007AFF',
    surface: (colors as any).surface || '#F8F9FA',
    text: (colors as any).text || '#000000',
    textSecondary: (colors as any).textSecondary || '#666666',
    border: (colors as any).border || '#E0E0E0',
    success: (colors as any).success || '#34C759',
  };

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
      const pdfData = await ReceiptService.generateReceiptText({
        order,
        customerName
      });
      
      // Convert string to Blob if needed
      const blob = typeof pdfData === 'string' ? new Blob([pdfData], { type: 'application/pdf' }) : pdfData;
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
        // Create download link for web
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
        // Use Web Share API if available, otherwise fallback to download
        if (navigator.share) {
          const file = new File([pdfBlob], filename, { type: 'application/pdf' });
          await navigator.share({
            files: [file],
            title: 'Kleanly Receipt'
          });
        } else {
          // Fallback to download
          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
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
      const body = `Dear ${customerName},\n\nThank you for choosing Kleanly! Please find your receipt attached.\n\nOrder Details:\n- Service: ${order.category.replace('-', ' ')}\n- Total: KSh ${order.total}\n- Date: ${new Date(order.createdAt).toLocaleDateString()}\n\nBest regards,\nKleanly Team`;
      
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

  const shareReceipt = async () => {
    try {
      await ReceiptService.shareReceipt({
        order,
        customerName,
        customerPhone: order.phone || 'N/A'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt via WhatsApp');
      console.error('Receipt sharing error:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={[themeColors.primary, themeColors.primary + 'CC']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              Receipt
            </Text>
            <View style={styles.placeholder} />
          </View>
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
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Address:</Text>
              <Text style={[styles.value, { color: themeColors.text }]}>{order.address || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Status:</Text>
              <Text style={[styles.value, { color: themeColors.primary }]}>
                {order.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Service Details */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Service Details</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Service:</Text>
              <Text style={[styles.value, { color: themeColors.text }]}>
                {(order.category || '').replace('-', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Items:</Text>
              <Text style={[styles.value, { color: themeColors.text }]}>
                {order.items?.join(', ') || 'N/A'}
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

          {/* WhatsApp Share */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Share Receipt</Text>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: themeColors.success }]}
              onPress={shareReceipt}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Share via WhatsApp</Text>
            </TouchableOpacity>
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
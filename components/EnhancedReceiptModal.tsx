// components/EnhancedReceiptModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Order } from '../services/orderService';

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
  
  const themeColors = {
    background: (colors as any).background || '#FFFFFF',
    primary: (colors as any).primary || '#007AFF',
    surface: (colors as any).surface || '#F8F9FA',
    text: (colors as any).text || '#000000',
    textSecondary: (colors as any).textSecondary || '#666666',
    border: (colors as any).border || '#E0E0E0',
    success: (colors as any).success || '#34C759',
  };

  const shareOnWhatsApp = () => {
    const receipt = `
🧾 *KLEANLY RECEIPT*

📋 Order #${order.id?.slice(-8).toUpperCase()}
📅 Date: ${new Date(order.createdAt).toLocaleDateString()}

👤 *Customer Information*
Name: ${customerName}
Address: ${order.address || 'N/A'}

🧺 *Service Details*
Service: ${(order.category || '').replace('-', ' ').toUpperCase()}
Items: ${order.items?.join(', ') || 'N/A'}
Status: ${(order.status || '').toUpperCase()}

💰 *Payment Details*
Subtotal: KSh ${Math.round(order.total / 1.16).toLocaleString()}
VAT (16%): KSh ${Math.round(order.total - (order.total / 1.16)).toLocaleString()}
*Total: KSh ${order.total.toLocaleString()}*

✨ Thank you for choosing Kleanly!
📞 Support: +254 714 648 622
📧 Email: kleanlyspt@gmail.com
    `.trim();

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(receipt)}`;
    Linking.openURL(whatsappUrl);
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
              onPress={shareOnWhatsApp}
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
import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
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
import { X, CreditCard, Smartphone, Banknote, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const { width } = Dimensions.get('window');

interface PaymentSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  total: number;
  onPaymentSelected: (method: string, details?: any) => void;
}

export const PaymentSelectionModal: React.FC<PaymentSelectionModalProps> = ({
  visible,
  onClose,
  total,
  onPaymentSelected,
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [processing, setProcessing] = useState(false);

  const paymentMethods = [
    {
      id: 'cash',
      title: 'Cash on Pickup',
      subtitle: 'Pay when we deliver your clean items',
      icon: <Banknote size={24} color={colors.success} />,
      color: colors.success,
      recommended: true,
    },
    {
      id: 'mpesa',
      title: 'M-Pesa',
      subtitle: 'Pay now with mobile money',
      icon: <Smartphone size={24} color="#00C851" />,
      color: '#00C851',
      recommended: false,
    },
    {
      id: 'card',
      title: 'Card Payment',
      subtitle: 'Visa, Mastercard (Coming Soon)',
      icon: <CreditCard size={24} color={colors.textSecondary} />,
      color: colors.textSecondary,
      recommended: false,
      disabled: true,
    },
  ];

  const handleContinue = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (selectedMethod === 'mpesa' && !mpesaNumber) {
      Alert.alert('Error', 'Please enter your M-Pesa number');
      return;
    }

    if (selectedMethod === 'card') {
      Alert.alert('Coming Soon', 'Card payment will be available soon. Please use M-Pesa or Cash on Pickup.');
      return;
    }

    setProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      setProcessing(false);
      
      if (selectedMethod === 'mpesa') {
        Alert.alert(
          '📱 M-Pesa Payment Request',
          `Payment request for KSH ${(total || 0).toLocaleString()} sent to ${mpesaNumber}.\n\n✅ Check your phone\n⏰ Complete within 5 minutes`,
          [
            {
              text: '✅ Payment Done',
              onPress: () => {
                onPaymentSelected(selectedMethod, { 
                  mpesaNumber, 
                  status: 'paid', 
                  transactionId: `MP${Date.now()}` 
                });
                resetForm();
              },
            },
            {
              text: '❌ Cancel',
              style: 'cancel',
              onPress: () => setProcessing(false),
            },
          ]
        );
      } else {
        // Cash on pickup
        Alert.alert(
          '  Order Confirmed!',
          '✅ Your order is confirmed!\n  We\'ll collect your items\n  Pay when delivered\n  SMS updates coming',
          [
            {
              text: '  Great!',
              onPress: () => {
                onPaymentSelected(selectedMethod, { 
                  status: 'pending', 
                  orderConfirmed: true 
                });
                resetForm();
              },
            },
          ]
        );
      }
    }, 1000);
  };

  const resetForm = () => {
    setSelectedMethod('');
    setMpesaNumber('');
    setProcessing(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Choose Payment</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Total Amount */}
          <Card style={styles.totalCard}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Order Total
            </Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              KSH {(total || 0).toLocaleString()}
            </Text>
          </Card>

          {/* Payment Methods */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Select Payment Method
          </Text>

          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                {
                  backgroundColor: colors.surface,
                  borderColor: selectedMethod === method.id ? method.color : colors.border,
                  borderWidth: selectedMethod === method.id ? 2 : 1,
                  opacity: method.disabled ? 0.5 : 1,
                },
              ]}
              onPress={() => !method.disabled && setSelectedMethod(method.id)}
              disabled={method.disabled}
            >
              <View style={styles.methodContent}>
                <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                  {method.icon}
                </View>
                <View style={styles.methodInfo}>
                  <View style={styles.methodHeader}>
                    <Text style={[styles.methodTitle, { color: colors.text }]}>
                      {method.title}
                    </Text>
                    {method.recommended && (
                      <View style={[styles.recommendedBadge, { backgroundColor: colors.success }]}>
                        <Text style={styles.recommendedText}>RECOMMENDED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.methodSubtitle, { color: colors.textSecondary }]}>
                    {method.subtitle}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    {
                      borderColor: selectedMethod === method.id ? method.color : colors.border,
                      backgroundColor: selectedMethod === method.id ? method.color : 'transparent',
                    },
                  ]}
                >
                  {selectedMethod === method.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* M-Pesa Number Input */}
          {selectedMethod === 'mpesa' && (
            <Card style={styles.mpesaCard}>
              <Input
                label="M-Pesa Number"
                value={mpesaNumber}
                onChangeText={setMpesaNumber}
                placeholder="+254 700 000 000"
                keyboardType="phone-pad"
              />
              <Text style={[styles.mpesaNote, { color: colors.textSecondary }]}>
                You'll receive a payment prompt on your phone
              </Text>
            </Card>
          )}

          {/* Payment Info */}
          {selectedMethod === 'cash' && (
            <Card style={styles.infoCard}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                  Cash on Pickup Details
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • Pay when we pickup your items{'\n'}
                • Receipt will be provided upon payment{'\n'}
                • Exact change appreciated{'\n'}
                • Mobile payment also accepted at pickup
              </Text>
            </Card>
          )}

          {/* Continue Button */}
          <LinearGradient
            colors={selectedMethod && !processing ? [colors.primary, colors.primary + 'E6'] : [colors.border, colors.border]}
            style={[styles.continueButtonGradient, { opacity: (!selectedMethod || processing) ? 0.5 : 1 }]}
          >
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              disabled={!selectedMethod || processing}
              activeOpacity={0.9}
            >
              <ArrowRight size={20} color="#FFFFFF" />
              <Text style={styles.continueButtonText}>
                {processing
                  ? 'Processing...'
                  : selectedMethod === 'cash'
                  ? 'Confirm Order'
                  : selectedMethod === 'mpesa'
                  ? `Pay KSH ${(total || 0).toLocaleString()}`
                  : 'Continue'
                }
              </Text>
            </TouchableOpacity>
          </LinearGradient>
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  totalCard: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  paymentMethod: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  recommendedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  methodSubtitle: {
    fontSize: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  mpesaCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  mpesaNote: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  infoCard: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  continueButtonGradient: {
    borderRadius: 16,
    marginTop: 'auto',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
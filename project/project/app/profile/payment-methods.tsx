import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, Smartphone, Plus, CreditCard as Edit, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';

interface PaymentMethod {
  id: string;
  type: 'card' | 'mpesa';
  label: string;
  details: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const colors = Colors.light;
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'mpesa',
      label: 'M-Pesa',
      details: '+254 700 *** 000',
      isDefault: true,
    },
    {
      id: '2',
      type: 'card',
      label: 'Visa Card',
      details: '**** **** **** 1234',
      isDefault: false,
    },
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mpesa':
        return <Smartphone size={20} color={colors.success} />;
      case 'card':
        return <CreditCard size={20} color={colors.primary} />;
      default:
        return <CreditCard size={20} color={colors.textSecondary} />;
    }
  };

  const handleAddPaymentMethod = () => {
    Alert.alert('Add Payment Method', 'Payment method management functionality coming soon!');
  };

  const handleEditPaymentMethod = (id: string) => {
    Alert.alert('Edit Payment Method', `Edit payment method ${id} functionality coming soon!`);
  };

  const handleDeletePaymentMethod = (id: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(paymentMethods.filter(method => method.id !== id));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primary + 'E6']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={handleAddPaymentMethod} style={styles.addButton}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage your cards and M-Pesa for seamless checkout
        </Text>

        {paymentMethods.map((method) => (
          <Card key={method.id} style={styles.paymentCard}>
            <View style={styles.paymentContent}>
              <View style={styles.paymentLeft}>
                <View style={[styles.typeIcon, { backgroundColor: colors.primary + '20' }]}>
                  {getTypeIcon(method.type)}
                </View>
                <View style={styles.paymentInfo}>
                  <View style={styles.paymentHeader}>
                    <Text style={[styles.paymentLabel, { color: colors.text }]}>
                      {method.label}
                    </Text>
                    {method.isDefault && (
                      <View style={[styles.defaultBadge, { backgroundColor: colors.success }]}>
                        <Text style={styles.defaultText}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.paymentDetails, { color: colors.textSecondary }]}>
                    {method.details}
                  </Text>
                </View>
              </View>
              <View style={styles.paymentActions}>
                <TouchableOpacity
                  onPress={() => handleEditPaymentMethod(method.id)}
                  style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                >
                  <Edit size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePaymentMethod(method.id)}
                  style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                >
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}

        <LinearGradient
          colors={[colors.primary, colors.primary + 'E6']}
          style={styles.addButtonGradient}
        >
          <TouchableOpacity style={styles.addNewButton} onPress={handleAddPaymentMethod}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addNewButtonText}>Add Payment Method</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Card style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            💳 Secure Payment Processing
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • All payment information is encrypted{'\n'}
            • We never store your card details{'\n'}
            • M-Pesa payments are processed securely{'\n'}
            • You can change your default method anytime
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  backButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  paymentCard: {
    marginBottom: 16,
    padding: 20,
  },
  paymentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  paymentDetails: {
    fontSize: 14,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonGradient: {
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  addNewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
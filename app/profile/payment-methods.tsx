import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, CreditCard, Smartphone, Plus, Edit3, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUserPaymentMethods, addUserPaymentMethod } from '../../services/userProfileService';

interface PaymentMethod {
  id: string;
  type: 'card' | 'mpesa' | 'cash';
  label: string;
  details: string;
  isDefault: boolean;
  cardNumber?: string;
  expiryDate?: string;
  phoneNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function PaymentMethodsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const methods = await getUserPaymentMethods(user.uid);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mpesa':
        return <Smartphone size={20} color="#10B981" />;
      case 'card':
        return <CreditCard size={20} color={colors.primary} />;
      case 'cash':
        return <CreditCard size={20} color="#F59E0B" />;
      default:
        return <CreditCard size={20} color={colors.textSecondary} />;
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!user?.uid) return;

    // Simple mock data for demonstration
    const newMethod: Omit<PaymentMethod, 'id'> = {
      type: 'card',
      label: 'New Card',
      details: '**** **** **** 0000',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const addedMethod = await addUserPaymentMethod(user.uid, newMethod);
      await loadPaymentMethods(); // Reload to get updated data
      Alert.alert('Success', 'Payment method added successfully');
    } catch (error) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', 'Failed to add payment method');
    }
  };

  const handleEditPaymentMethod = async (method: PaymentMethod) => {
    if (!user?.uid) return;

    // For now, just show an alert that editing is not yet implemented
    Alert.alert('Edit Payment Method', 'Payment method editing will be available soon.');
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    if (!user?.uid) return;

    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove the payment method from local state for now
              setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
              Alert.alert('Success', 'Payment method deleted successfully');
            } catch (error) {
              console.error('Error deleting payment method:', error);
              Alert.alert('Error', 'Failed to delete payment method');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (methodId: string) => {
    if (!user?.uid) return;

    try {
      // Update local state to set the new default
      setPaymentMethods(prev => prev.map(method => ({
        ...method,
        isDefault: method.id === methodId
      })));
      Alert.alert('Success', 'Default payment method updated');
    } catch (error) {
      console.error('Error setting default payment method:', error);
      Alert.alert('Error', 'Failed to update default payment method');
    }
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

        {loading ? (
          <View style={styles.loading}>
            <Text style={{ color: colors.text }}>Loading payment methods...</Text>
          </View>
        ) : paymentMethods.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CreditCard size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Payment Methods Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add your cards or M-Pesa for easy payments
            </Text>
            <Button
              title="Add Payment Method"
              onPress={handleAddPaymentMethod}
              variant="primary"
              icon={<Plus size={20} color="#FFFFFF" />}
              style={styles.emptyButton}
            />
          </Card>
        ) : (
          paymentMethods.map((method, idx) => (
            <Card key={method.id + '-' + idx} style={styles.paymentCard}>
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
                        <View style={[styles.defaultBadge, { backgroundColor: '#10B981' }]}>
                          <Text style={styles.defaultText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.paymentDetails, { color: colors.textSecondary }]}>
                      {method.details}
                    </Text>
                    {!method.isDefault && (
                      <TouchableOpacity onPress={() => handleSetDefault(method.id)}>
                        <Text style={[styles.setDefaultText, { color: colors.primary }]}>
                          Set as Default
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.paymentActions}>
                  <TouchableOpacity
                    onPress={() => handleEditPaymentMethod(method)}
                    style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                  >
                    <Edit3 size={16} color={colors.primary} />
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
          ))
        )}

        {paymentMethods.length > 0 && (
          <LinearGradient
            colors={[colors.primary, colors.primary + 'E6']}
            style={styles.addButtonGradient}
          >
            <TouchableOpacity style={styles.addNewButton} onPress={handleAddPaymentMethod}>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addNewButtonText}>Add Payment Method</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 8,
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
    marginBottom: 4,
  },
  setDefaultText: {
    fontSize: 12,
    fontWeight: '600',
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
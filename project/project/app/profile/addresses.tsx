import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Plus, Chrome as Home, Briefcase, CreditCard as Edit, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Address {
  id: string;
  label: string;
  address: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
}

export default function AddressesScreen() {
  const colors = Colors.light;
  
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      label: 'Home',
      address: 'Westlands, Nairobi',
      type: 'home',
      isDefault: true,
    },
    {
      id: '2',
      label: 'Office',
      address: 'CBD, Nairobi',
      type: 'work',
      isDefault: false,
    },
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home size={20} color={colors.primary} />;
      case 'work':
        return <Briefcase size={20} color={colors.success} />;
      default:
        return <MapPin size={20} color={colors.warning} />;
    }
  };

  const handleAddAddress = () => {
    Alert.alert('Add Address', 'Address management functionality coming soon!');
  };

  const handleEditAddress = (id: string) => {
    Alert.alert('Edit Address', `Edit address ${id} functionality coming soon!`);
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAddresses(addresses.filter(addr => addr.id !== id));
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
        <Text style={styles.headerTitle}>Delivery Addresses</Text>
        <TouchableOpacity onPress={handleAddAddress} style={styles.addButton}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage your saved delivery addresses
          </Text>

          {addresses.map((address) => (
            <Card key={address.id} style={styles.addressCard}>
              <View style={styles.addressContent}>
                <View style={styles.addressLeft}>
                  <View style={[styles.typeIcon, { backgroundColor: colors.primary + '20' }]}>
                    {getTypeIcon(address.type)}
                  </View>
                  <View style={styles.addressInfo}>
                    <View style={styles.addressHeader}>
                      <Text style={[styles.addressLabel, { color: colors.text }]}>
                        {address.label}
                      </Text>
                      {address.isDefault && (
                        <View style={[styles.defaultBadge, { backgroundColor: colors.success }]}>
                          <Text style={styles.defaultText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                      {address.address}
                    </Text>
                  </View>
                </View>
                <View style={styles.addressActions}>
                  <TouchableOpacity
                    onPress={() => handleEditAddress(address.id)}
                    style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                  >
                    <Edit size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteAddress(address.id)}
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
            <TouchableOpacity style={styles.addNewButton} onPress={handleAddAddress}>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addNewButtonText}>Add New Address</Text>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
  addressCard: {
    marginBottom: 16,
    padding: 20,
  },
  addressContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressLeft: {
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
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
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
  addressText: {
    fontSize: 14,
  },
  addressActions: {
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
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, MapPin, Home, Briefcase, Edit3, Trash2 } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import userProfileService, { SavedAddress } from '../../services/userProfileService';

export default function AddressesScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    address: '',
    city: '',
    postalCode: '',
    instructions: '',
    type: 'home' as 'home' | 'work' | 'other',
    isDefault: false,
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const userAddresses = await userProfileService.getSavedAddresses(user.uid);
      setAddresses(userAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!user?.uid || !formData.label || !formData.address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingAddress) {
        await userProfileService.updateSavedAddress(user.uid, editingAddress.id, formData);
      } else {
        await userProfileService.addSavedAddress(user.uid, formData);
      }
      
      setShowAddModal(false);
      setEditingAddress(null);
      resetForm();
      loadAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user?.uid) return;

    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await userProfileService.deleteSavedAddress(user.uid, addressId);
              loadAddresses();
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };
  const openEditModal = (address: SavedAddress) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address: address.address,
      city: address.city,
      postalCode: address.postalCode,
      instructions: address.instructions || '',
      type: address.type,
      isDefault: address.isDefault,
    });
    setShowAddModal(true);
  };
  const resetForm = () => {
    setFormData({
      label: '',
      address: '',
      city: '',
      postalCode: '',
      instructions: '',
      type: 'home',
      isDefault: false,
    });
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'work':
        return <Briefcase size={20} color={colors.primary} />;
      case 'home':
        return <Home size={20} color={colors.primary} />;
      default:
        return <MapPin size={20} color={colors.primary} />;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    addButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    emptyCard: {
      padding: 40,
      alignItems: 'center',
      marginTop: 40,
    },
    emptyTitle: {
      fontSize: 20,
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
      paddingHorizontal: 32,
    },
    addressCard: {
      padding: 20,
      marginBottom: 16,
    },
    addressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    addressInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    addressLabel: {
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 8,
    },
    addressActions: {
      flexDirection: 'row',
    },
    actionButton: {
      padding: 8,
      marginLeft: 8,
    },
    addressText: {
      fontSize: 16,
      lineHeight: 22,
      marginBottom: 4,
    },
    cityText: {
      fontSize: 14,
      marginBottom: 8,
    },
    instructionsText: {
      fontSize: 13,
      fontStyle: 'italic',
    },
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    cancelButton: {
      fontSize: 16,
      fontWeight: '500',
    },
    saveButton: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalContent: {
      flex: 1,
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
    },
    textArea: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      textAlignVertical: 'top',
    },
    row: {
      flexDirection: 'row',
    },
    typeButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    typeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    typeButtonText: {
      marginLeft: 6,
      fontSize: 14,
      fontWeight: '500',
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Delivery Addresses</Text>
        <TouchableOpacity 
          onPress={() => {
            resetForm();
            setEditingAddress(null);
            setShowAddModal(true);
          }}
          style={styles.addButton}
        >
          <Plus size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loading}>
            <Text style={{ color: colors.text }}>Loading addresses...</Text>
          </View>
        ) : addresses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <MapPin size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Addresses Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add your delivery addresses for faster checkout
            </Text>
            <Button
              title="Add Address"
              onPress={() => {
                resetForm();
                setShowAddModal(true);
              }}
              variant="primary"
              icon={<Plus size={20} color="#FFFFFF" />}
              style={styles.emptyButton}
            />
          </Card>
        ) : (
          addresses.map((address) => (
            <Card key={address.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.addressInfo}>
                  {getAddressIcon(address.type)}
                  <Text style={[styles.addressLabel, { color: colors.text }]}>
                    {address.label}
                  </Text>
                </View>
                <View style={styles.addressActions}>
                  <TouchableOpacity
                    onPress={() => openEditModal(address)}
                    style={styles.actionButton}
                  >
                    <Edit3 size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteAddress(address.id)}
                    style={styles.actionButton}
                  >
                    <Trash2 size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.addressText, { color: colors.text }]}>
                {address.address}
              </Text>
              <Text style={[styles.cityText, { color: colors.textSecondary }]}>
                {address.city}, {address.postalCode}
              </Text>
              {address.instructions && (
                <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
                  {address.instructions}
                </Text>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setEditingAddress(null);
                resetForm();
              }}
            >
              <Text style={[styles.cancelButton, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingAddress ? 'Edit Address' : 'Add Address'}
            </Text>
            <TouchableOpacity onPress={handleSaveAddress}>
              <Text style={[styles.saveButton, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Label</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={formData.label}
                onChangeText={(text) => setFormData({ ...formData, label: text })}
                placeholder="e.g., Home, Work"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Type</Text>
              <View style={styles.typeButtons}>
                {(['home', 'work', 'other'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setFormData({ ...formData, type })}
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: formData.type === type ? colors.primary : colors.card,
                        borderColor: formData.type === type ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {getAddressIcon(type)}
                    <Text
                      style={[
                        styles.typeButtonText,
                        {
                          color: formData.type === type ? '#FFFFFF' : colors.text,
                        },
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Street address"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.label, { color: colors.text }]}>City</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Postal Code</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={formData.postalCode}
                  onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
                  placeholder="Postal code"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Delivery Instructions</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                    height: 80,
                  },
                ]}
                value={formData.instructions}
                onChangeText={(text) => setFormData({ ...formData, instructions: text })}
                placeholder="Special delivery instructions (optional)"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
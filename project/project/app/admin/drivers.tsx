import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, User, Phone, Car, MapPin, Edit, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { driverService, Driver } from '../../services/driverService';

export default function DriversManagementScreen() {
  const { user } = useAuth();
  const colors = Colors.light;
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'motorcycle' as Driver['vehicleType'],
    vehicleNumber: '',
  });

  // Check if user is admin
  const isAdmin = user?.email === 'admin@kleanly.co.ke';

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'This section is only available to administrators.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }
    
    loadDrivers();
  }, [isAdmin]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const driversData = await driverService.getAllDrivers();
      setDrivers(driversData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async () => {
    if (!newDriver.name || !newDriver.phone || !newDriver.vehicleNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await driverService.createDriver({
        ...newDriver,
        status: 'available',
        rating: 5.0,
        totalDeliveries: 0,
      });
      
      setShowAddModal(false);
      setNewDriver({
        name: '',
        phone: '',
        email: '',
        vehicleType: 'motorcycle',
        vehicleNumber: '',
      });
      
      loadDrivers();
      Alert.alert('Success', 'Driver added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add driver');
    }
  };

  const handleUpdateDriverStatus = async (driverId: string, status: Driver['status']) => {
    try {
      await driverService.updateDriverStatus(driverId, status);
      loadDrivers();
    } catch (error) {
      Alert.alert('Error', 'Failed to update driver status');
    }
  };

  const getStatusColor = (status: Driver['status']) => {
    switch (status) {
      case 'available':
        return colors.success;
      case 'busy':
        return colors.warning;
      case 'offline':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getVehicleIcon = (vehicleType: Driver['vehicleType']) => {
    switch (vehicleType) {
      case 'motorcycle':
        return '🏍️';
      case 'car':
        return '🚗';
      case 'van':
        return '🚐';
      default:
        return '🚗';
    }
  };

  if (!isAdmin) {
    return null;
  }

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
        <Text style={styles.headerTitle}>Drivers Management</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage delivery drivers and their status
        </Text>

        {/* Drivers List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading drivers...
            </Text>
          </View>
        ) : drivers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <User size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Drivers Yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Add your first driver to start managing deliveries
            </Text>
          </Card>
        ) : (
          drivers.map((driver) => (
            <Card key={driver.id} style={styles.driverCard}>
              <View style={styles.driverHeader}>
                <View style={[styles.driverAvatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.driverInitial, { color: colors.primary }]}>
                    {driver.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.driverInfo}>
                  <Text style={[styles.driverName, { color: colors.text }]}>
                    {driver.name}
                  </Text>
                  <Text style={[styles.driverPhone, { color: colors.textSecondary }]}>
                    📞 {driver.phone}
                  </Text>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleEmoji}>
                      {getVehicleIcon(driver.vehicleType)}
                    </Text>
                    <Text style={[styles.vehicleText, { color: colors.textSecondary }]}>
                      {driver.vehicleType.charAt(0).toUpperCase() + driver.vehicleType.slice(1)} • {driver.vehicleNumber}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(driver.status) + '20' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(driver.status) }
                  ]}>
                    {driver.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.driverStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    ⭐ {driver.rating.toFixed(1)}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Rating
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {driver.totalDeliveries}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Deliveries
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {driver.currentLocation ? '📍 Live' : '📍 Offline'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Location
                  </Text>
                </View>
              </View>

              <View style={styles.driverActions}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    { backgroundColor: colors.success + '20' }
                  ]}
                  onPress={() => handleUpdateDriverStatus(driver.id!, 'available')}
                  disabled={driver.status === 'available'}
                >
                  <Text style={[styles.statusButtonText, { color: colors.success }]}>
                    Available
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    { backgroundColor: colors.error + '20' }
                  ]}
                  onPress={() => handleUpdateDriverStatus(driver.id!, 'offline')}
                  disabled={driver.status === 'offline'}
                >
                  <Text style={[styles.statusButtonText, { color: colors.error }]}>
                    Offline
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add Driver Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add New Driver
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={[styles.modalCloseText, { color: colors.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Input
              label="Driver Name"
              value={newDriver.name}
              onChangeText={(text) => setNewDriver({ ...newDriver, name: text })}
              placeholder="Enter driver name"
            />

            <Input
              label="Phone Number"
              value={newDriver.phone}
              onChangeText={(text) => setNewDriver({ ...newDriver, phone: text })}
              placeholder="+254 700 000 000"
              keyboardType="phone-pad"
            />

            <Input
              label="Email (Optional)"
              value={newDriver.email}
              onChangeText={(text) => setNewDriver({ ...newDriver, email: text })}
              placeholder="driver@example.com"
              keyboardType="email-address"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Vehicle Type
            </Text>
            <View style={styles.vehicleTypeContainer}>
              {(['motorcycle', 'car', 'van'] as Driver['vehicleType'][]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.vehicleTypeButton,
                    {
                      backgroundColor: newDriver.vehicleType === type ? colors.primary + '20' : colors.surface,
                      borderColor: newDriver.vehicleType === type ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => setNewDriver({ ...newDriver, vehicleType: type })}
                >
                  <Text style={styles.vehicleTypeEmoji}>
                    {getVehicleIcon(type)}
                  </Text>
                  <Text style={[
                    styles.vehicleTypeText,
                    { color: newDriver.vehicleType === type ? colors.primary : colors.text }
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Vehicle Number"
              value={newDriver.vehicleNumber}
              onChangeText={(text) => setNewDriver({ ...newDriver, vehicleNumber: text })}
              placeholder="KAA 123A"
            />

            <LinearGradient
              colors={[colors.primary, colors.primary + 'E6']}
              style={styles.addDriverButtonGradient}
            >
              <TouchableOpacity
                style={styles.addDriverButton}
                onPress={handleAddDriver}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addDriverButtonText}>Add Driver</Text>
              </TouchableOpacity>
            </LinearGradient>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  driverCard: {
    marginBottom: 16,
    padding: 20,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  driverInitial: {
    fontSize: 20,
    fontWeight: '700',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    marginBottom: 4,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleEmoji: {
    fontSize: 16,
  },
  vehicleText: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  driverStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  vehicleTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  vehicleTypeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  vehicleTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addDriverButtonGradient: {
    borderRadius: 16,
    marginTop: 20,
  },
  addDriverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  addDriverButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
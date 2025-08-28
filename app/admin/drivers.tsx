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
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, User, Phone, Car, MapPin, Edit, Trash2, TrendingUp, Clock, Star, DollarSign } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { driverService, Driver } from '../../services/driverService';
import { driverAccountService } from '../../services/driverAccountService';
import { isCurrentUserAdmin, isCurrentUserAdminAsync, ADMIN_EMAIL } from '../../utils/adminAuth';
import { createTestDrivers } from '../../utils/createTestDrivers';
import { cleanupDuplicateDrivers, reportDriverStatistics } from '../../utils/cleanupDuplicateDrivers';

export default function DriversManagementScreen() {
  const { user } = useAuth();
  const colors = Colors.light;
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showDriverDetails, setShowDriverDetails] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'motorcycle' as Driver['vehicleType'],
    vehicleNumber: '',
  });

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalDrivers: 0,
    onlineDrivers: 0,
    availableDrivers: 0,
    busyDrivers: 0,
    totalDeliveries: 0,
    averageRating: 0,
    totalEarnings: 0,
    topPerformer: null as Driver | null,
    dailyEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    activeToday: 0,
    completionRate: 0,
  });

  // Filter states
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'busy' | 'offline'>('all');
  const [filterVehicle, setFilterVehicle] = useState<'all' | 'motorcycle' | 'car' | 'van'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'deliveries' | 'earnings'>('name');

  // Check if user is admin using centralized utility
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        console.log('🔄 Checking admin status...');
        const adminStatus = await isCurrentUserAdminAsync();
        setIsAdminVerified(adminStatus);
        setAdminCheckComplete(true);
        
        if (!adminStatus) {
          Alert.alert(
            'Access Denied', 
            `This section is only available to administrators.\n\nRequired: ${ADMIN_EMAIL}\nCurrent: ${user?.email || 'Not logged in'}`, 
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return;
        }
        
        console.log('✅ Admin access granted for drivers management:', user?.email);
        loadDrivers();
      } catch (error) {
        console.error('❌ Error checking admin status:', error);
        setAdminCheckComplete(true);
        setIsAdminVerified(false);
      }
    };
    
    checkAdminStatus();
  }, [user?.email]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading drivers for admin:', user?.email);
      console.log('🔍 Current user details:', {
        email: user?.email,
        uid: user?.uid,
        emailVerified: user?.emailVerified,
        isAdminVerified: isAdminVerified
      });
      
      const driversData = await driverService.getAllDrivers();
      console.log('📊 Drivers loaded successfully:', {
        count: driversData.length,
        drivers: driversData.map(d => ({ id: d.id, name: d.name, email: d.email }))
      });
      
      setDrivers(driversData);
      calculateAnalytics(driversData);
    } catch (error) {
      console.error('❌ Error loading drivers:', error);
      console.error('❌ Current auth state:', {
        user: user?.email,
        uid: user?.uid,
        isAdminVerified: isAdminVerified
      });
      Alert.alert(
        'Error Loading Drivers', 
        `Failed to load drivers: ${error.message}\n\nCurrent user: ${user?.email}\nAdmin status: ${isAdminVerified}\n\nPlease check:\n- Your internet connection\n- Firebase permissions\n- Admin access rights`
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (driversData: Driver[]) => {
    const totalDrivers = driversData.length;
    const onlineDrivers = driversData.filter(d => d.isOnline).length;
    const availableDrivers = driversData.filter(d => d.status === 'available').length;
    const busyDrivers = driversData.filter(d => d.status === 'busy').length;
    const totalDeliveries = driversData.reduce((sum, d) => sum + (d.totalDeliveries || 0), 0);
    const averageRating = totalDrivers > 0 
      ? driversData.reduce((sum, d) => sum + (d.rating || 0), 0) / totalDrivers 
      : 0;
    const totalEarnings = driversData.reduce((sum, d) => sum + (d.totalEarnings || 0), 0);
    const topPerformer = driversData.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] || null;

    // Enhanced analytics
    const dailyEarnings = driversData.reduce((sum, d) => sum + (d.performance?.todayEarnings || 0), 0);
    const weeklyEarnings = driversData.reduce((sum, d) => sum + (d.performance?.weeklyEarnings || 0), 0);
    const monthlyEarnings = driversData.reduce((sum, d) => sum + (d.performance?.monthlyEarnings || 0), 0);
    const activeToday = driversData.filter(d => {
      const lastActive = new Date(d.lastActiveAt);
      const today = new Date();
      return lastActive.toDateString() === today.toDateString();
    }).length;
    const completionRate = totalDrivers > 0 
      ? driversData.reduce((sum, d) => sum + (d.completionRate || 0), 0) / totalDrivers 
      : 0;

    setAnalytics({
      totalDrivers,
      onlineDrivers,
      availableDrivers,
      busyDrivers,
      totalDeliveries,
      averageRating,
      totalEarnings,
      topPerformer,
      dailyEarnings,
      weeklyEarnings,
      monthlyEarnings,
      activeToday,
      completionRate,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDrivers();
    setRefreshing(false);
  };

  // Filter and sort drivers
  const getFilteredDrivers = () => {
    let filtered = drivers.filter(driver => {
      const matchesStatus = filterStatus === 'all' || driver.status === filterStatus;
      const matchesVehicle = filterVehicle === 'all' || driver.vehicleType === filterVehicle;
      const matchesSearch = searchQuery === '' || 
        driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.phone.includes(searchQuery) ||
        driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesVehicle && matchesSearch;
    });

    // Sort drivers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'deliveries':
          return (b.totalDeliveries || 0) - (a.totalDeliveries || 0);
        case 'earnings':
          return (b.totalEarnings || 0) - (a.totalEarnings || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const handleAddDriver = async () => {
    if (!newDriver.name || !newDriver.phone || !newDriver.vehicleNumber) {
      Alert.alert('Error', 'Please fill in all required fields (name, phone, vehicle number)');
      return;
    }

    try {
      // Option 1: Create driver profile only (without Firebase auth account)
      if (!newDriver.email) {
        const driverId = await driverService.createDriver({
          name: newDriver.name,
          phone: newDriver.phone,
          email: newDriver.email || `driver.${Date.now()}@kleanly.temp`, // Temporary email
          vehicleType: newDriver.vehicleType,
          vehicleNumber: newDriver.vehicleNumber,
          status: 'offline',
          rating: 5.0,
          totalDeliveries: 0,
          totalEarnings: 0,
          averageDeliveryTime: 0,
          completionRate: 100,
          customerRatings: [],
          isOnline: false,
          lastActiveAt: new Date().toISOString(),
          shift: {
            startTime: '',
            endTime: '',
            totalHours: 0,
            earnings: 0
          },
          performance: {
            todayDeliveries: 0,
            weeklyDeliveries: 0,
            monthlyDeliveries: 0,
            todayEarnings: 0,
            weeklyEarnings: 0,
            monthlyEarnings: 0
          },
          preferences: {
            maxRadius: 10,
            preferredAreas: [],
            notifications: {
              orders: true,
              payments: true,
              promotions: false
            }
          }
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
        
        Alert.alert(
          'Driver Added Successfully!',
          `Driver: ${newDriver.name}\nPhone: ${newDriver.phone}\nVehicle: ${newDriver.vehicleNumber}\n\nThe driver profile has been created. To enable app login, add an email address.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Option 2: Create complete driver account with authentication (if email provided)
      const result = await driverAccountService.createDriverWithAccount({
        name: newDriver.name,
        email: newDriver.email,
        phone: newDriver.phone,
        vehicleType: newDriver.vehicleType,
        vehicleNumber: newDriver.vehicleNumber,
      });
      
      if (result.success) {
        setShowAddModal(false);
        setNewDriver({
          name: '',
          phone: '',
          email: '',
          vehicleType: 'motorcycle',
          vehicleNumber: '',
        });
        
        loadDrivers();
        
        // Determine the type of account created
        const isFullAccount = result.temporaryPassword !== 'No auth account created';
        
        if (isFullAccount) {
          // Full account with Firebase auth
          Alert.alert(
            'Driver Account Created!',
            `Driver: ${newDriver.name}\n\nEmail: ${newDriver.email}\nTemporary Password: ${result.temporaryPassword}\n\nShare these credentials with the driver so they can login and access their dashboard at /driver`,
            [
              {
                text: 'Copy Login Info',
                onPress: () => {
                  console.log('Login info copied:', result.loginInstructions);
                }
              },
              { text: 'OK' }
            ]
          );
        } else {
          // Profile-only account (auth creation failed)
          Alert.alert(
            'Driver Profile Created!',
            `Driver: ${newDriver.name}\n\nProfile created successfully but login account is pending due to permissions.\n\nThe driver can start receiving order assignments. Full login access will be set up separately.`,
            [
              {
                text: 'View Instructions',
                onPress: () => {
                  Alert.alert('Setup Instructions', result.loginInstructions);
                }
              },
              { text: 'OK' }
            ]
          );
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to create driver account');
      }
    } catch (error: any) {
      console.error('Error adding driver:', error);
      Alert.alert('Error', `Failed to add driver: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUpdateDriverStatus = async (driverId: string, status: Driver['status']) => {
    try {
      console.log(`🔄 Updating driver ${driverId} status to ${status}`);
      
      // Optimistic update
      setDrivers(prevDrivers => 
        prevDrivers.map(driver => 
          driver.id === driverId 
            ? { ...driver, status } 
            : driver
        )
      );
      
      await driverService.updateDriverStatus(driverId, status);
      
      // Refresh to get latest data
      await loadDrivers();
      
      console.log(`✅ Driver status updated successfully to ${status}`);
      Alert.alert('Success', `Driver status updated to ${status}`);
    } catch (error) {
      console.error('❌ Error updating driver status:', error);
      
      // Revert optimistic update on error
      await loadDrivers();
      
      Alert.alert(
        'Error', 
        `Failed to update driver status. Please check your internet connection and try again.`
      );
    }
  };

  const handleViewDriverDetails = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDriverDetails(true);
  };

  const handleDeleteDriver = async (driverId: string, driverName: string) => {
    Alert.alert(
      'Delete Driver',
      `Are you sure you want to delete ${driverName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await driverService.deleteDriver(driverId);
              loadDrivers();
              Alert.alert('Success', 'Driver deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete driver');
            }
          }
        }
      ]
    );
  };

  const handleCleanupDuplicates = async () => {
    Alert.alert(
      'Cleanup Duplicate Drivers',
      'This will remove duplicate driver records based on email addresses. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cleanup',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await cleanupDuplicateDrivers();
              if (result.success) {
                Alert.alert(
                  '✅ Cleanup Complete',
                  `Removed ${result.duplicatesRemoved} duplicate drivers.\nFinal count: ${result.finalCount} drivers remaining.`
                );
                loadDrivers(); // Refresh the list
              } else {
                Alert.alert('Error', 'Failed to cleanup duplicates');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cleanup duplicates');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCreateTestDrivers = async () => {
    Alert.alert(
      'Create Test Drivers',
      'This will create 3 test drivers with login accounts. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              const results = await createTestDrivers();
              loadDrivers();
              
              if (results && results.length > 0) {
                const credentialsList = results.map(driver => 
                  `👤 ${driver.name}\n📧 ${driver.email}\n🔑 ${driver.password}\n`
                ).join('\n');
                
                Alert.alert(
                  '✅ Test Drivers Created!', 
                  `Here are the login credentials:\n\n${credentialsList}Share these with your test drivers so they can login and access /driver`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('✅ Success', 'Test drivers were created (some may have already existed)');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to create test drivers');
            }
          }
        }
      ]
    );
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

  const closeDriverDetails = () => {
    setShowDriverDetails(false);
    setSelectedDriver(null);
  };

  if (!adminCheckComplete || !isAdminVerified) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {!adminCheckComplete ? 'Verifying admin access...' : 'Access denied. Admin privileges required.'}
          </Text>
        </View>
      </SafeAreaView>
    );
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

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage delivery drivers and their status
        </Text>

        {/* Analytics Dashboard */}
        <Card style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <Text style={[styles.analyticsTitle, { color: colors.text }]}>
              Fleet Analytics
            </Text>
            <TouchableOpacity 
              style={[styles.analyticsButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
              onPress={() => setShowAnalytics(true)}
            >
              <TrendingUp size={16} color={colors.primary} />
              <Text style={[styles.analyticsButtonText, { color: colors.primary }]}>
                View Details
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.analyticsGrid}>
            <View style={[styles.analyticsItem, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.analyticsNumber, { color: colors.primary }]}>
                {analytics.totalDrivers}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
                Total Drivers
              </Text>
            </View>
            <View style={[styles.analyticsItem, { backgroundColor: colors.success + '10' }]}>
              <Text style={[styles.analyticsNumber, { color: colors.success }]}>
                {analytics.onlineDrivers}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
                Online Now
              </Text>
            </View>
            <View style={[styles.analyticsItem, { backgroundColor: colors.warning + '10' }]}>
              <Text style={[styles.analyticsNumber, { color: colors.warning }]}>
                {analytics.busyDrivers}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
                Busy Drivers
              </Text>
            </View>
            <View style={[styles.analyticsItem, { backgroundColor: colors.text + '05' }]}>
              <Text style={[styles.analyticsNumber, { color: colors.text }]}>
                {analytics.averageRating.toFixed(1)}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
                Avg Rating
              </Text>
            </View>
          </View>
          
          {/* Additional Analytics Row */}
          <View style={styles.analyticsGrid}>
            <View style={[styles.analyticsItem, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.analyticsNumber, { color: colors.primary }]}>
                KSh {analytics.dailyEarnings.toLocaleString()}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
                Today's Earnings
              </Text>
            </View>
            <View style={[styles.analyticsItem, { backgroundColor: colors.success + '10' }]}>
              <Text style={[styles.analyticsNumber, { color: colors.success }]}>
                {analytics.activeToday}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
                Active Today
              </Text>
            </View>
            <View style={[styles.analyticsItem, { backgroundColor: colors.warning + '10' }]}>
              <Text style={[styles.analyticsNumber, { color: colors.warning }]}>
                {analytics.totalDeliveries}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
                Total Orders
              </Text>
            </View>
            <View style={[styles.analyticsItem, { backgroundColor: colors.text + '05' }]}>
              <Text style={[styles.analyticsNumber, { color: colors.text }]}>
                {analytics.completionRate.toFixed(1)}%
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
                Completion Rate
              </Text>
            </View>
          </View>
        </Card>

        {/* Filters and Search */}
        {drivers.length > 0 && (
          <Card style={styles.filtersCard}>
            <Text style={[styles.filtersTitle, { color: colors.text }]}>
              Filters & Search
            </Text>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Input
                placeholder="Search drivers by name, phone, email, or vehicle..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.primary + '30' }]}
              />
            </View>

            {/* Filter Pills */}
            <View style={styles.filtersRow}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Status:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPills}>
                {['all', 'available', 'busy', 'offline'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterPill,
                      filterStatus === status && styles.filterPillActive,
                      { backgroundColor: filterStatus === status ? colors.primary : colors.background }
                    ]}
                    onPress={() => setFilterStatus(status as any)}
                  >
                    <Text style={[
                      styles.filterPillText,
                      { color: filterStatus === status ? '#FFFFFF' : colors.textSecondary }
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filtersRow}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Vehicle:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPills}>
                {['all', 'motorcycle', 'car', 'van'].map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle}
                    style={[
                      styles.filterPill,
                      filterVehicle === vehicle && styles.filterPillActive,
                      { backgroundColor: filterVehicle === vehicle ? colors.primary : colors.background }
                    ]}
                    onPress={() => setFilterVehicle(vehicle as any)}
                  >
                    <Text style={[
                      styles.filterPillText,
                      { color: filterVehicle === vehicle ? '#FFFFFF' : colors.textSecondary }
                    ]}>
                      {vehicle.charAt(0).toUpperCase() + vehicle.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filtersRow}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Sort by:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPills}>
                {[
                  { key: 'name', label: 'Name' },
                  { key: 'rating', label: 'Rating' },
                  { key: 'deliveries', label: 'Deliveries' },
                  { key: 'earnings', label: 'Earnings' }
                ].map((sort) => (
                  <TouchableOpacity
                    key={sort.key}
                    style={[
                      styles.filterPill,
                      sortBy === sort.key && styles.filterPillActive,
                      { backgroundColor: sortBy === sort.key ? colors.primary : colors.background }
                    ]}
                    onPress={() => setSortBy(sort.key as any)}
                  >
                    <Text style={[
                      styles.filterPillText,
                      { color: sortBy === sort.key ? '#FFFFFF' : colors.textSecondary }
                    ]}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Results Count */}
            <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
              Showing {getFilteredDrivers().length} of {drivers.length} drivers
            </Text>
          </Card>
        )}

        {/* Development Tools */}
        {drivers.length === 0 && (
          <Card style={styles.devCard}>
            <Text style={[styles.devTitle, { color: colors.warning }]}>
              Development Tools
            </Text>
            <Text style={[styles.devText, { color: colors.textSecondary }]}>
              Quick setup for testing driver functionality
            </Text>
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}
              onPress={handleCreateTestDrivers}
            >
              <Plus size={16} color={colors.warning} />
              <Text style={[styles.testButtonText, { color: colors.warning }]}>
                Create Test Drivers
              </Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Drivers List */}
        {loading || !adminCheckComplete ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {!adminCheckComplete ? 'Verifying admin access...' : 'Loading drivers...'}
            </Text>
          </View>
        ) : !isAdminVerified ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Access denied. Admin privileges required.
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
          getFilteredDrivers().map((driver) => (
            <Card key={driver.id} style={styles.driverCard}>
              <View style={styles.driverHeader}>
                <View style={[styles.driverAvatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.driverInitial, { color: colors.primary }]}>
                    {driver.name?.charAt(0)?.toUpperCase() || 'D'}
                  </Text>
                  <View style={[
                    styles.onlineIndicator,
                    { backgroundColor: driver.isOnline ? colors.success : colors.error }
                  ]} />
                </View>
                <View style={styles.driverInfo}>
                  <Text style={[styles.driverName, { color: colors.text }]}>
                    {driver.name || 'Unknown Driver'}
                  </Text>
                  <Text style={[styles.driverPhone, { color: colors.textSecondary }]}>
                    Phone: {driver.phone || 'No phone'}
                  </Text>
                  <Text style={[styles.driverEmail, { color: colors.textSecondary }]}>
                    Email: {driver.email || 'No email'}
                  </Text>
                  <View style={styles.vehicleInfo}>
                    <Car size={16} color={colors.primary} />
                    <Text style={[styles.vehicleText, { color: colors.textSecondary }]}>
                      {driver.vehicleType ? (driver.vehicleType.charAt(0)?.toUpperCase() + driver.vehicleType.slice(1)) : 'Unknown'} • {driver.vehicleNumber || 'No plate'}
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
                    {(driver.status || 'offline').toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Enhanced Stats Grid */}
              <View style={styles.driverStats}>
                <View style={styles.statItem}>
                  <Star size={16} color={colors.warning} />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {driver.rating.toFixed(1)}
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
                  <DollarSign size={16} color={colors.success} />
                  <Text style={[styles.statValue, { color: colors.success }]}>
                    {(driver.totalEarnings || 0).toLocaleString()}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Earnings
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {driver.completionRate ? `${driver.completionRate.toFixed(1)}%` : 'N/A'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Success Rate
                  </Text>
                </View>
              </View>

              {/* Performance Metrics */}
              <View style={styles.performanceSection}>
                <Text style={[styles.performanceTitle, { color: colors.text }]}>
                  � Performance
                </Text>
                <View style={styles.performanceGrid}>
                  <View style={styles.performanceItem}>
                    <Text style={[styles.performanceValue, { color: colors.primary }]}>
                      {driver.performance?.todayDeliveries || 0}
                    </Text>
                    <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>
                      Today
                    </Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Text style={[styles.performanceValue, { color: colors.primary }]}>
                      {driver.performance?.weeklyDeliveries || 0}
                    </Text>
                    <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>
                      This Week
                    </Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Text style={[styles.performanceValue, { color: colors.success }]}>
                      KSh {(driver.performance?.todayEarnings || 0).toLocaleString()}
                    </Text>
                    <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>
                      Today's Earnings
                    </Text>
                  </View>
                </View>
              </View>

              {/* Enhanced Action Buttons */}
              <View style={styles.driverActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { 
                      backgroundColor: colors.primary + '15',
                      borderColor: colors.primary,
                      opacity: 1
                    }
                  ]}
                  onPress={() => {
                    setSelectedDriver(driver);
                    setShowDriverDetails(true);
                  }}
                  activeOpacity={0.7}
                >
                  <User size={14} color={colors.primary} />
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                    Details
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { 
                      backgroundColor: driver.status === 'available' ? colors.success + '30' : colors.success + '15',
                      borderColor: colors.success,
                      opacity: driver.status === 'available' ? 0.6 : 1
                    }
                  ]}
                  onPress={() => handleUpdateDriverStatus(driver.id!, 'available')}
                  disabled={driver.status === 'available'}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.actionButtonText, 
                    { color: driver.status === 'available' ? colors.success + '80' : colors.success }
                  ]}>
                    Available
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { 
                      backgroundColor: driver.status === 'busy' ? colors.warning + '30' : colors.warning + '15',
                      borderColor: colors.warning,
                      opacity: driver.status === 'busy' ? 0.6 : 1
                    }
                  ]}
                  onPress={() => handleUpdateDriverStatus(driver.id!, 'busy')}
                  disabled={driver.status === 'busy'}
                  activeOpacity={0.7}
                >
                  <Clock size={14} color={driver.status === 'busy' ? colors.warning + '80' : colors.warning} />
                  <Text style={[
                    styles.actionButtonText, 
                    { color: driver.status === 'busy' ? colors.warning + '80' : colors.warning }
                  ]}>
                    Busy
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { 
                      backgroundColor: driver.status === 'offline' ? colors.error + '30' : colors.error + '15',
                      borderColor: colors.error,
                      opacity: driver.status === 'offline' ? 0.6 : 1
                    }
                  ]}
                  onPress={() => handleUpdateDriverStatus(driver.id!, 'offline')}
                  disabled={driver.status === 'offline'}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.actionButtonText, 
                    { color: driver.status === 'offline' ? colors.error + '80' : colors.error }
                  ]}>
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
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Add a new driver to your delivery team. Email is optional - without email, the driver won't be able to login to the app but can still be assigned orders manually.
            </Text>

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
              label="Email (Optional - for app login)"
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
                    {type ? (type.charAt(0)?.toUpperCase() + type.slice(1)) : 'Unknown'}
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

      {/* Driver Details Modal */}
      <Modal
        visible={showDriverDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDriverDetails}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Driver Details
            </Text>
            <TouchableOpacity onPress={closeDriverDetails} style={styles.modalCloseButton}>
              <Text style={[styles.modalCloseText, { color: colors.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {selectedDriver && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Driver Profile Header */}
              <View style={styles.profileHeader}>
                <View style={[styles.profileAvatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.profileInitial, { color: colors.primary }]}>
                    {selectedDriver.name?.charAt(0)?.toUpperCase() || 'D'}
                  </Text>
                  <View style={[
                    styles.onlineIndicator,
                    { backgroundColor: selectedDriver.isOnline ? colors.success : colors.error }
                  ]} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.text }]}>
                    {selectedDriver.name}
                  </Text>
                  <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                    {selectedDriver.email}
                  </Text>
                  <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>
                    {selectedDriver.phone}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(selectedDriver.status) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(selectedDriver.status) }
                    ]}>
                      {selectedDriver.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Vehicle Information */}
              <Card style={styles.detailCard}>
                <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                  Vehicle Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {getVehicleIcon(selectedDriver.vehicleType)} {selectedDriver.vehicleType.charAt(0).toUpperCase() + selectedDriver.vehicleType.slice(1)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>License Plate:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedDriver.vehicleNumber}
                  </Text>
                </View>
              </Card>

              {/* Performance Metrics */}
              <Card style={styles.detailCard}>
                <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                  Performance Metrics
                </Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricNumber, { color: colors.primary }]}>
                      ⭐ {selectedDriver.rating.toFixed(1)}
                    </Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      Rating
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricNumber, { color: colors.success }]}>
                      {selectedDriver.totalDeliveries}
                    </Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      Total Orders
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricNumber, { color: colors.success }]}>
                      KSh {selectedDriver.totalEarnings.toLocaleString()}
                    </Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      Total Earnings
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricNumber, { color: colors.warning }]}>
                      {selectedDriver.completionRate.toFixed(1)}%
                    </Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      Success Rate
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Current Period Performance */}
              <Card style={styles.detailCard}>
                <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                  Current Period
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Today's Orders:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedDriver.performance?.todayDeliveries || 0}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Today's Earnings:</Text>
                  <Text style={[styles.detailValue, { color: colors.success }]}>
                    KSh {(selectedDriver.performance?.todayEarnings || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>This Week:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedDriver.performance?.weeklyDeliveries || 0} orders • KSh {(selectedDriver.performance?.weeklyEarnings || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>This Month:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedDriver.performance?.monthlyDeliveries || 0} orders • KSh {(selectedDriver.performance?.monthlyEarnings || 0).toLocaleString()}
                  </Text>
                </View>
              </Card>

              {/* Quick Actions */}
              <Card style={styles.detailCard}>
                <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                  Quick Actions
                </Text>
                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={[styles.quickActionButton, { backgroundColor: colors.success + '20' }]}
                    onPress={() => {
                      handleUpdateDriverStatus(selectedDriver.id!, 'available');
                      closeDriverDetails();
                    }}
                  >
                    <Text style={[styles.quickActionText, { color: colors.success }]}>
                      Set Available
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickActionButton, { backgroundColor: colors.warning + '20' }]}
                    onPress={() => {
                      handleUpdateDriverStatus(selectedDriver.id!, 'busy');
                      closeDriverDetails();
                    }}
                  >
                    <Text style={[styles.quickActionText, { color: colors.warning }]}>
                      Set Busy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickActionButton, { backgroundColor: colors.error + '20' }]}
                    onPress={() => {
                      handleUpdateDriverStatus(selectedDriver.id!, 'offline');
                      closeDriverDetails();
                    }}
                  >
                    <Text style={[styles.quickActionText, { color: colors.error }]}>
                      Set Offline
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        visible={showAnalytics}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAnalytics(false)}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Fleet Analytics
            </Text>
            <TouchableOpacity onPress={() => setShowAnalytics(false)} style={styles.modalCloseButton}>
              <Text style={[styles.modalCloseText, { color: colors.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Summary Cards */}
            <View style={styles.analyticsModalGrid}>
              <View style={[styles.analyticsModalCard, { backgroundColor: colors.primary + '10' }]}>
                <View style={styles.analyticsModalCardHeader}>
                  <User size={24} color={colors.primary} />
                  <Text style={[styles.analyticsModalCardTitle, { color: colors.primary }]}>
                    Fleet Size
                  </Text>
                </View>
                <Text style={[styles.analyticsModalCardValue, { color: colors.text }]}>
                  {analytics.totalDrivers}
                </Text>
                <Text style={[styles.analyticsModalCardSubtitle, { color: colors.textSecondary }]}>
                  Total Drivers
                </Text>
              </View>

              <View style={[styles.analyticsModalCard, { backgroundColor: colors.success + '10' }]}>
                <View style={styles.analyticsModalCardHeader}>
                  <TrendingUp size={24} color={colors.success} />
                  <Text style={[styles.analyticsModalCardTitle, { color: colors.success }]}>
                    Performance
                  </Text>
                </View>
                <Text style={[styles.analyticsModalCardValue, { color: colors.text }]}>
                  {analytics.completionRate.toFixed(1)}%
                </Text>
                <Text style={[styles.analyticsModalCardSubtitle, { color: colors.textSecondary }]}>
                  Completion Rate
                </Text>
              </View>

              <View style={[styles.analyticsModalCard, { backgroundColor: colors.warning + '10' }]}>
                <View style={styles.analyticsModalCardHeader}>
                  <DollarSign size={24} color={colors.warning} />
                  <Text style={[styles.analyticsModalCardTitle, { color: colors.warning }]}>
                    Earnings
                  </Text>
                </View>
                <Text style={[styles.analyticsModalCardValue, { color: colors.text }]}>
                  KSh {analytics.totalEarnings.toLocaleString()}
                </Text>
                <Text style={[styles.analyticsModalCardSubtitle, { color: colors.textSecondary }]}>
                  Total Earnings
                </Text>
              </View>

              <View style={[styles.analyticsModalCard, { backgroundColor: colors.error + '10' }]}>
                <View style={styles.analyticsModalCardHeader}>
                  <Star size={24} color={colors.error} />
                  <Text style={[styles.analyticsModalCardTitle, { color: colors.error }]}>
                    Rating
                  </Text>
                </View>
                <Text style={[styles.analyticsModalCardValue, { color: colors.text }]}>
                  {analytics.averageRating.toFixed(1)}
                </Text>
                <Text style={[styles.analyticsModalCardSubtitle, { color: colors.textSecondary }]}>
                  Average Rating
                </Text>
              </View>
            </View>

            {/* Status Breakdown */}
            <Card style={styles.detailCard}>
              <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                Driver Status
              </Text>
              <View style={styles.statusBreakdown}>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Online</Text>
                  <Text style={[styles.statusValue, { color: colors.text }]}>{analytics.onlineDrivers}</Text>
                </View>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Busy</Text>
                  <Text style={[styles.statusValue, { color: colors.text }]}>{analytics.busyDrivers}</Text>
                </View>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, { backgroundColor: colors.error }]} />
                  <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Offline</Text>
                  <Text style={[styles.statusValue, { color: colors.text }]}>{analytics.totalDrivers - analytics.onlineDrivers}</Text>
                </View>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Available</Text>
                  <Text style={[styles.statusValue, { color: colors.text }]}>{analytics.availableDrivers}</Text>
                </View>
              </View>
            </Card>

            {/* Top Performer */}
            {analytics.topPerformer && (
              <Card style={styles.detailCard}>
                <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                  Top Performer
                </Text>
                <View style={styles.topPerformerCard}>
                  <View style={[styles.topPerformerAvatar, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.topPerformerInitial, { color: colors.primary }]}>
                      {analytics.topPerformer.name?.charAt(0)?.toUpperCase() || 'T'}
                    </Text>
                  </View>
                  <View style={styles.topPerformerInfo}>
                    <Text style={[styles.topPerformerName, { color: colors.text }]}>
                      {analytics.topPerformer.name}
                    </Text>
                    <Text style={[styles.topPerformerStats, { color: colors.textSecondary }]}>
                      {analytics.topPerformer.rating.toFixed(1)} rating • {analytics.topPerformer.totalDeliveries} deliveries
                    </Text>
                    <Text style={[styles.topPerformerEarnings, { color: colors.success }]}>
                      KSh {analytics.topPerformer.totalEarnings.toLocaleString()} earned
                    </Text>
                  </View>
                </View>
              </Card>
            )}
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
    gap: 4,
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
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
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
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
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
  // Development tools styles
  devCard: {
    marginBottom: 20,
    borderWidth: 1,
    backgroundColor: '#FFF3CD',
    borderColor: '#FFE69C',
  },
  devTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  devText: {
    fontSize: 14,
    marginBottom: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Analytics styles
  analyticsCard: {
    marginBottom: 20,
    padding: 20,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  analyticsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  analyticsItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  analyticsNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Filter styles
  filtersCard: {
    marginBottom: 20,
    padding: 20,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 70,
    marginRight: 12,
  },
  filterPills: {
    flex: 1,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  filterPillActive: {
    borderColor: 'transparent',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultsText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  // Enhanced driver card styles
  onlineIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  driverEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  performanceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  performanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  performanceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Driver details modal styles
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    marginBottom: 8,
  },
  detailCard: {
    marginBottom: 16,
    padding: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 16,
    borderRadius: 12,
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  quickActions: {
    gap: 12,
  },
  quickActionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Analytics modal styles
  analyticsModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  analyticsModalCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  analyticsModalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  analyticsModalCardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  analyticsModalCardValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  analyticsModalCardSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  statusBreakdown: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  topPerformerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  topPerformerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  topPerformerInitial: {
    fontSize: 24,
    fontWeight: '700',
  },
  topPerformerInfo: {
    flex: 1,
  },
  topPerformerName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  topPerformerStats: {
    fontSize: 14,
    marginBottom: 4,
  },
  topPerformerEarnings: {
    fontSize: 16,
    fontWeight: '600',
  },
});
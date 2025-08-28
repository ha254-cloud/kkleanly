import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { driverService } from '../services/driverService';

interface QuickDriverFixProps {
  onDriversUpdated?: () => void;
}

export const QuickDriverFix: React.FC<QuickDriverFixProps> = ({ onDriversUpdated }) => {
  const [driverCount, setDriverCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const checkDrivers = async () => {
    try {
      const allDrivers = await driverService.getAllDrivers();
      const availableDrivers = await driverService.getAvailableDrivers();
      
      setDriverCount(allDrivers.length);
      setAvailableCount(availableDrivers.length);
    } catch (error) {
      console.error('Error checking drivers:', error);
    }
  };

  useEffect(() => {
    checkDrivers();
  }, []);

  const createEmergencyDriver = async () => {
    setLoading(true);
    
    try {
      const testDriverData = {
        email: 'emergency.driver@kleanly.co.ke',
        name: 'Emergency Driver',
        phone: '+254700000001',
        vehicleType: 'motorcycle' as const,
        vehicleNumber: 'EMRG-001',
        status: 'available' as const,
        rating: 5.0,
        totalDeliveries: 0,
        totalEarnings: 0,
        averageDeliveryTime: 0,
        completionRate: 100,
        customerRatings: [],
        isOnline: true,
        lastActiveAt: new Date().toISOString(),
        currentLocation: {
          latitude: -1.2921,
          longitude: 36.8219,
          timestamp: new Date().toISOString(),
          address: 'Nairobi, Kenya'
        },
        shift: {
          startTime: new Date().toISOString(),
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
          maxRadius: 15,
          preferredAreas: ['Nairobi CBD'],
          notifications: {
            orders: true,
            payments: true,
            promotions: false
          }
        }
      };

      await driverService.createDriver(testDriverData);
      
      Alert.alert('Success', 'Emergency driver created successfully!');
      await checkDrivers();
      onDriversUpdated?.();
      
    } catch (error: any) {
      Alert.alert('Error', `Failed to create driver: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const makeAllAvailable = async () => {
    setLoading(true);
    
    try {
      const allDrivers = await driverService.getAllDrivers();
      
      for (const driver of allDrivers) {
        if (driver.status !== 'available') {
          await driverService.updateDriverStatus(driver.id!, 'available');
        }
      }
      
      Alert.alert('Success', `Updated ${allDrivers.length} drivers to available status`);
      await checkDrivers();
      onDriversUpdated?.();
      
    } catch (error: any) {
      Alert.alert('Error', `Failed to update drivers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Quick Fix</Text>
      
      <Text style={styles.statusText}>
        Total Drivers: {driverCount} | Available: {availableCount}
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.createButton, loading && styles.disabledButton]} 
          onPress={createEmergencyDriver}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            Create Emergency Driver
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.fixButton, loading && styles.disabledButton]} 
          onPress={makeAllAvailable}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            Make All Available
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff3cd',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#856404',
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    color: '#856404',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#28a745',
  },
  fixButton: {
    backgroundColor: '#ffc107',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

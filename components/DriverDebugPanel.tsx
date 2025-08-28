import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { driverService, generateVehicleNumber } from '../services/driverService';

interface DriverDebugPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const DriverDebugPanel: React.FC<DriverDebugPanelProps> = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string>('');

  if (!visible) return null;

  const runDiagnostic = async () => {
    setLoading(true);
    setResults('🔧 Starting Driver Diagnostic...\n\n');
    
    try {
      // Step 1: Check all drivers
      setResults(prev => prev + '1️⃣ Checking all drivers...\n');
      const allDrivers = await driverService.getAllDrivers();
      setResults(prev => prev + `✅ Total drivers: ${allDrivers.length}\n`);
      
      if (allDrivers.length > 0) {
        setResults(prev => prev + '📋 Driver list:\n');
        allDrivers.forEach((driver, index) => {
          setResults(prev => prev + `  ${index + 1}. ${driver.name} - Status: ${driver.status} - Email: ${driver.email}\n`);
        });
      }
      
      // Step 2: Check available drivers
      setResults(prev => prev + '\n2️⃣ Checking available drivers...\n');
      const availableDrivers = await driverService.getAvailableDrivers();
      setResults(prev => prev + `✅ Available drivers: ${availableDrivers.length}\n`);
      
      // Step 3: If no drivers exist, create test ones
      if (allDrivers.length === 0) {
        setResults(prev => prev + '\n3️⃣ No drivers found, creating test drivers...\n');
        await createTestDrivers();
        
        // Recheck after creation
        const newAllDrivers = await driverService.getAllDrivers();
        const newAvailableDrivers = await driverService.getAvailableDrivers();
        setResults(prev => prev + `✅ After creation - Total: ${newAllDrivers.length}, Available: ${newAvailableDrivers.length}\n`);
      }
      
      // Step 4: If drivers exist but none available, fix statuses
      if (allDrivers.length > 0 && availableDrivers.length === 0) {
        setResults(prev => prev + '\n4️⃣ Fixing driver statuses...\n');
        for (const driver of allDrivers) {
          if (driver.status !== 'available') {
            await driverService.updateDriverStatus(driver.id!, 'available');
            setResults(prev => prev + `✅ Updated ${driver.name} to available\n`);
          }
        }
        
        // Recheck after status update
        const fixedAvailableDrivers = await driverService.getAvailableDrivers();
        setResults(prev => prev + `✅ Available drivers after fix: ${fixedAvailableDrivers.length}\n`);
      }
      
      setResults(prev => prev + '\n✅ Diagnostic completed!\n');
      
    } catch (error) {
      setResults(prev => prev + `\n❌ Error: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const createTestDrivers = async () => {
    const testDrivers = [
      {
        name: 'John Kiprotich',
        phone: '+254712345678',
        email: 'john.driver@kleanly.co.ke',
        vehicleType: 'motorcycle' as const,
        vehicleNumber: generateVehicleNumber('motorcycle'),
        status: 'available' as const,
        rating: 4.8,
        totalDeliveries: 245,
        totalEarnings: 25000,
        averageDeliveryTime: 22,
        completionRate: 98,
        customerRatings: [],
        pendingPayouts: 0,
        activeDeliveries: 0,
        location: null,
        isOnline: true,
        lastActiveAt: new Date().toISOString(),
        performance: {
          todayDeliveries: 5,
          weeklyDeliveries: 28,
          monthlyDeliveries: 120,
          todayEarnings: 2500,
          weeklyEarnings: 12000,
          monthlyEarnings: 48000
        },
        preferences: {
          maxRadius: 25,
          preferredAreas: ['Nairobi CBD', 'Westlands', 'Karen'],
          notifications: {
            orders: true,
            payments: true,
            promotions: false
          }
        }
      },
      {
        name: 'Mary Wanjiku',
        phone: '+254723456789',
        email: 'mary.driver@kleanly.co.ke',
        vehicleType: 'car' as const,
        vehicleNumber: generateVehicleNumber('car'),
        status: 'available' as const,
        rating: 4.6,
        totalDeliveries: 189,
        totalEarnings: 19500,
        averageDeliveryTime: 25,
        completionRate: 96,
        customerRatings: [],
        pendingPayouts: 0,
        activeDeliveries: 0,
        location: null,
        isOnline: true,
        lastActiveAt: new Date().toISOString(),
        performance: {
          todayDeliveries: 3,
          weeklyDeliveries: 22,
          monthlyDeliveries: 95,
          todayEarnings: 1800,
          weeklyEarnings: 9500,
          monthlyEarnings: 38000
        },
        preferences: {
          maxRadius: 30,
          preferredAreas: ['Kileleshwa', 'Lavington', 'Kilimani'],
          notifications: {
            orders: true,
            payments: true,
            promotions: true
          }
        }
      }
    ];

    for (const driver of testDrivers) {
      try {
        await driverService.createDriver(driver);
        setResults(prev => prev + `✅ Created driver: ${driver.name}\n`);
      } catch (error) {
        setResults(prev => prev + `❌ Failed to create ${driver.name}: ${error.message}\n`);
      }
    }
  };

  const clearResults = () => {
    setResults('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Debug Panel</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttons}>
        <TouchableOpacity 
          onPress={runDiagnostic} 
          disabled={loading}
          style={[styles.button, styles.runButton]}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Running...' : 'Run Diagnostic'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={clearResults} 
          style={[styles.button, styles.clearButton]}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsText}>{results}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
  },
  closeText: {
    color: '#007AFF',
    fontSize: 16,
  },
  buttons: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  runButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsText: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});

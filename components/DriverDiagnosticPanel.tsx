import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { driverService } from '../services/driverService';
import { createAllDefaultDrivers } from '../utils/createDriverAccount';
import { runDriverVisibilityDiagnostic, fixDriverVisibility } from '../utils/driverVisibilityDiagnostic';

export const DriverDiagnosticPanel = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const runDiagnostic = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      addResult('🔍 Starting driver diagnostic...');
      
      // Get current drivers count
      const allDrivers = await driverService.getAllDrivers();
      const availableDrivers = await driverService.getAvailableDrivers();
      
      addResult(`Found ${allDrivers.length} total drivers`);
      addResult(`Found ${availableDrivers.length} available drivers`);
      
      if (allDrivers.length === 0) {
        addResult('❌ No drivers exist in database');
      } else {
        addResult('✅ Drivers exist in database');
        
        // Show driver details
        allDrivers.forEach(driver => {
          addResult(`  📄 ${driver.name}: ${driver.status} (${driver.email})`);
        });
      }
      
      if (availableDrivers.length === 0 && allDrivers.length > 0) {
        addResult('⚠️ Drivers exist but none are "available"');
      }
      
      addResult('✅ Diagnostic completed');
      
    } catch (error: any) {
      addResult(`❌ Diagnostic failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const createTestDrivers = async () => {
    setTesting(true);
    
    try {
      addResult('🚚 Creating test drivers...');
      
      const results = await createAllDefaultDrivers();
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      addResult(`✅ Created ${successful} drivers successfully`);
      if (failed > 0) {
        addResult(`❌ Failed to create ${failed} drivers`);
      }
      
      // Refresh diagnostic
      await runDiagnostic();
      
    } catch (error: any) {
      addResult(`❌ Driver creation failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const fixDriverStatuses = async () => {
    setTesting(true);
    
    try {
      addResult('🔧 Fixing driver statuses...');
      
      const allDrivers = await driverService.getAllDrivers();
      let updated = 0;
      
      for (const driver of allDrivers) {
        if (driver.status !== 'available') {
          await driverService.updateDriverStatus(driver.id!, 'available');
          addResult(`✅ Updated ${driver.name} to available`);
          updated++;
        }
      }
      
      if (updated === 0) {
        addResult('ℹ️ All drivers already have correct status');
      } else {
        addResult(`✅ Updated ${updated} driver statuses`);
      }
      
      // Refresh diagnostic
      await runDiagnostic();
      
    } catch (error: any) {
      addResult(`❌ Status fix failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Diagnostic Panel</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={runDiagnostic}
          disabled={testing}
        >
          <Text style={styles.buttonText}>
            🔍 Run Diagnostic
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.successButton]} 
          onPress={createTestDrivers}
          disabled={testing}
        >
          <Text style={styles.buttonText}>
            🚚 Create Drivers
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.warningButton]} 
          onPress={fixDriverStatuses}
          disabled={testing}
        >
          <Text style={styles.buttonText}>
            🔧 Fix Statuses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>
            🗑️ Clear
          </Text>
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results:</Text>
          {results.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#495057',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  successButton: {
    backgroundColor: '#28a745',
  },
  warningButton: {
    backgroundColor: '#ffc107',
  },
  clearButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    maxHeight: 200,
    marginTop: 10,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#495057',
  },
  resultText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
    marginBottom: 2,
    color: '#212529',
  },
});

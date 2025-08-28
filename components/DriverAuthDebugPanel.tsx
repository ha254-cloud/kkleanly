import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { setupAndTestDriver, testAllDrivers, fixMainDriver } from '../utils/debugDriverAuth';
import { cleanupDuplicateDrivers, reportDriverStatistics } from '../utils/cleanupDuplicateDrivers';
import { fullDriverTest } from '../utils/testDriverSimple';

interface DriverAuthDebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const DriverAuthDebugPanel: React.FC<DriverAuthDebugPanelProps> = ({ isVisible, onClose }) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('driver@kleanly.co.ke');
  const [testPassword, setTestPassword] = useState('SwiftDelivery543');
  const [testName, setTestName] = useState('Main Driver');
  const [results, setResults] = useState<string>('');

  const log = (message: string) => {
    console.log(message);
    setResults(prev => prev + message + '\n');
  };

  const handleCleanupDuplicates = async () => {
    if (loading) return;
    
    Alert.alert(
      'Cleanup Duplicate Drivers',
      'This will remove duplicate driver records from the database. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clean Up',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            log('🧹 Starting cleanup process...');
            
            try {
              const result = await cleanupDuplicateDrivers();
              if (result.success) {
                log(`✅ Cleanup successful! Removed ${result.duplicatesRemoved} duplicates`);
                log(`📊 Final driver count: ${result.finalCount}`);
              } else {
                log(`❌ Cleanup failed: ${result.error}`);
              }
            } catch (error) {
              log(`❌ Cleanup error: ${error}`);
            }
            
            setLoading(false);
          }
        }
      ]
    );
  };

  const handleReportStats = async () => {
    if (loading) return;
    
    setLoading(true);
    log('📊 Generating driver statistics...');
    
    try {
      const stats = await reportDriverStatistics();
      if (stats.error) {
        log(`❌ Stats error: ${stats.error}`);
      }
    } catch (error) {
      log(`❌ Stats error: ${error}`);
    }
    
    setLoading(false);
  };

  const clearResults = () => {
    setResults('');
  };

  const handleSimpleTest = async () => {
    if (loading) return;
    setLoading(true);
    log('🚀 Running simple driver test...');
    
    try {
      const result = await fullDriverTest();
      if (result.success) {
        log('✅ Simple test completed successfully!');
        if (result.driverRecord) {
          log(`📋 Driver record found: ${result.driverRecord.name}`);
        }
        if (result.driverId) {
          log(`📝 Created driver with ID: ${result.driverId}`);
        }
      } else {
        log(`❌ Simple test failed: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      log(`❌ Simple test error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const handleCreateMainDriver = async () => {
    if (loading) return;
    setLoading(true);
    log('🔧 Creating main driver account...');
    
    try {
      // Import the creation functions
      const { createDriverAccount } = await import('../utils/createDriverAccount');
      const result = await createDriverAccount({
        email: 'driver@kleanly.co.ke',
        password: 'SwiftDelivery543',
        name: 'Main Driver',
        phone: '+254712345678'
      });
      
      if (result.success) {
        log('✅ Main driver account created successfully!');
        log(`   Auth UID: ${result.uid}`);
        log(`   Email: ${result.email}`);
        log('🎉 Now try logging in with driver@kleanly.co.ke');
      } else {
        if (result.error === 'EMAIL_EXISTS') {
          log('⚠️ Account already exists, try logging in');
        } else {
          log(`❌ Failed to create account: ${result.message}`);
        }
      }
    } catch (error: any) {
      log(`❌ Creation error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const handleTestSingleDriver = async () => {
    setLoading(true);
    clearResults();
    
    try {
      log(`🔧 Testing driver: ${testEmail}`);
      
      // Override console.log temporarily to capture output
      const originalLog = console.log;
      console.log = log;
      
      const result = await setupAndTestDriver(testEmail, testPassword, testName);
      
      // Restore console.log
      console.log = originalLog;
      
      if (result.canLogin) {
        Alert.alert('✅ Success!', `Driver ${testEmail} can now log in successfully!`);
      } else {
        Alert.alert('❌ Issues Found', `Driver ${testEmail} has authentication issues. Check the logs below.`);
      }
      
    } catch (error: any) {
      log(`❌ Error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAllDrivers = async () => {
    setLoading(true);
    clearResults();
    
    try {
      log('🚗 Testing all driver accounts...');
      
      // Override console.log temporarily to capture output
      const originalLog = console.log;
      console.log = log;
      
      const results = await testAllDrivers();
      
      // Restore console.log
      console.log = originalLog;
      
      const workingCount = results.filter(r => r.canLogin).length;
      Alert.alert(
        'Test Complete', 
        `${workingCount}/${results.length} drivers can log in successfully. Check logs for details.`
      );
      
    } catch (error: any) {
      log(`❌ Error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFixMainDriver = async () => {
    setLoading(true);
    clearResults();
    
    try {
      log('🔧 Fixing main driver account...');
      
      // Override console.log temporarily to capture output
      const originalLog = console.log;
      console.log = log;
      
      const result = await fixMainDriver();
      
      // Restore console.log
      console.log = originalLog;
      
      if (result.canLogin) {
        Alert.alert(
          '✅ Fixed!', 
          'The main driver account (driver@kleanly.co.ke) is now working! You can log in with password: SwiftDelivery543'
        );
      } else {
        Alert.alert('❌ Issues Remain', 'Could not fully fix the main driver account. Check logs for details.');
      }
      
    } catch (error: any) {
      log(`❌ Error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header with Close Button */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            🚗 Driver Authentication Debug
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
          {/* EMERGENCY FIX BUTTON */}
          <Card style={styles.emergencyCard}>
            <Text style={[styles.sectionTitle, { color: 'white', textAlign: 'center' }]}>
              🚨 EMERGENCY FIX
            </Text>
            <Text style={[styles.description, { color: 'white', textAlign: 'center' }]}>
              Click this to create driver@kleanly.co.ke account
            </Text>
            <Button
              title="🔧 CREATE DRIVER ACCOUNT NOW"
              onPress={handleCreateMainDriver}
              disabled={loading}
              style={styles.emergencyButton}
            />
          </Card>

          <Card style={styles.headerCard}>
            <Text style={[styles.title, { color: colors.text }]}>
              Debug Panel
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Use this panel to diagnose and fix driver login issues
            </Text>
          </Card>

      {/* Quick Fix Section */}
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🔧 Quick Fix
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Fix the main driver account from the screenshot - auth/invalid-credential error
        </Text>
        <View style={styles.buttonRow}>
          <Button
            title="Create Account"
            onPress={handleCreateMainDriver}
            disabled={loading}
            style={styles.halfButton}
          />
          <Button
            title="Simple Test"
            onPress={handleSimpleTest}
            disabled={loading}
            style={styles.halfButton}
            variant="outline"
          />
        </View>
        <Button
          title="Fix Main Driver"
          onPress={handleFixMainDriver}
          disabled={loading}
          style={styles.button}
          variant="outline"
        />
      </Card>

      {/* Test Single Driver */}
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🧪 Test Single Driver
        </Text>
        <Input
          label="Email"
          value={testEmail}
          onChangeText={setTestEmail}
          placeholder="driver@kleanly.co.ke"
          style={styles.input}
        />
        <Input
          label="Password"
          value={testPassword}
          onChangeText={setTestPassword}
          placeholder="SwiftDelivery543"
          secureTextEntry
          style={styles.input}
        />
        <Input
          label="Name"
          value={testName}
          onChangeText={setTestName}
          placeholder="Main Driver"
          style={styles.input}
        />
        <Button
          title="Test & Fix Driver"
          onPress={handleTestSingleDriver}
          disabled={loading}
          style={styles.button}
        />
      </Card>

      {/* Test All Drivers */}
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🔍 Test All Drivers
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Test all predefined driver accounts and create missing ones
        </Text>
        <Button
          title="Test All Driver Accounts"
          onPress={handleTestAllDrivers}
          disabled={loading}
          style={styles.button}
        />
      </Card>

      {/* Database Cleanup */}
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🧹 Database Cleanup
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Clean up duplicate driver records and optimize database
        </Text>
        <View style={styles.buttonRow}>
          <Button
            title="Report Statistics"
            onPress={handleReportStats}
            disabled={loading}
            style={styles.halfButton}
            variant="outline"
          />
          <Button
            title="Cleanup Duplicates"
            onPress={handleCleanupDuplicates}
            disabled={loading}
            style={styles.halfButton}
          />
        </View>
      </Card>

      {/* Results */}
      {results && (
        <Card style={styles.card}>
          <View style={styles.resultsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📊 Results
            </Text>
            <TouchableOpacity onPress={clearResults}>
              <Text style={[styles.clearButton, { color: colors.primary }]}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.resultsContainer} nestedScrollEnabled>
            <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
              {results}
            </Text>
          </ScrollView>
        </Card>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Processing...
          </Text>
        </View>
      )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
  emergencyCard: {
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#FF6B6B',
  },
  emergencyButton: {
    marginTop: 8,
    backgroundColor: 'white',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    maxHeight: 300,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  resultsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});

/**
 * Simple Driver Authentication Debug Panel
 * Simplified version to avoid circular import issues
 */

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
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { driverService } from '../services/driverService';

interface SimpleDriverDebugProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SimpleDriverDebug: React.FC<SimpleDriverDebugProps> = ({ isVisible, onClose }) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('driver@kleanly.co.ke');
  const [testPassword, setTestPassword] = useState('SwiftDelivery543');
  const [results, setResults] = useState<string>('');

  const log = (message: string) => {
    console.log(message);
    setResults(prev => prev + message + '\n');
  };

  const clearResults = () => {
    setResults('');
  };

  const testSingleDriver = async () => {
    if (loading) return;
    
    setLoading(true);
    clearResults();
    
    try {
      log(`🔐 Testing authentication for: ${testEmail}`);
      
      // Test login first
      try {
        const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        log(`✅ Authentication successful!`);
        log(`   - UID: ${userCredential.user.uid}`);
        log(`   - Email: ${userCredential.user.email}`);
        
        // Check Firestore
        const drivers = await driverService.getAllDrivers();
        const driverExists = drivers.some(d => d.email === testEmail);
        log(`   - In Firestore: ${driverExists ? 'Yes' : 'No'}`);
        
      } catch (authError: any) {
        log(`❌ Authentication failed: ${authError.code}`);
        
        if (authError.code === 'auth/user-not-found') {
          log(`🔧 Creating Firebase Auth account...`);
          try {
            const newUser = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
            log(`✅ Created Auth account: ${newUser.user.uid}`);
            
            // Check if driver exists in Firestore
            const drivers = await driverService.getAllDrivers();
            const driverExists = drivers.some(d => d.email === testEmail);
            
            if (!driverExists) {
              log(`🔧 Creating Firestore driver record...`);
              await driverService.createDriver({
                name: 'Main Driver',
                email: testEmail,
                phone: '+254714648622',
                vehicleType: 'motorcycle',
                vehicleNumber: 'KA 123 ABC',
                status: 'available',
                rating: 5,
                totalDeliveries: 0
              });
              log(`✅ Created Firestore driver record`);
            }
            
          } catch (createError: any) {
            log(`❌ Failed to create account: ${createError.message}`);
          }
        }
      }
      
    } catch (error: any) {
      log(`❌ Error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const quickFixMainDriver = async () => {
    if (loading) return;
    
    setLoading(true);
    clearResults();
    
    log(`🔧 Quick fixing driver@kleanly.co.ke...`);
    
    try {
      // Try to sign in first
      try {
        await signInWithEmailAndPassword(auth, 'driver@kleanly.co.ke', 'SwiftDelivery543');
        log(`✅ Account already exists and working!`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          log(`🔧 Creating missing Auth account...`);
          await createUserWithEmailAndPassword(auth, 'driver@kleanly.co.ke', 'SwiftDelivery543');
          log(`✅ Created Auth account`);
        }
      }
      
      // Check Firestore
      const drivers = await driverService.getAllDrivers();
      const driverExists = drivers.some(d => d.email === 'driver@kleanly.co.ke');
      
      if (!driverExists) {
        log(`🔧 Creating Firestore record...`);
        await driverService.createDriver({
          name: 'Main Driver',
          email: 'driver@kleanly.co.ke',
          phone: '+254714648622',
          vehicleType: 'motorcycle',
          vehicleNumber: 'KA 123 ABC',
          status: 'available',
          rating: 5,
          totalDeliveries: 0
        });
        log(`✅ Created Firestore record`);
      } else {
        log(`✅ Firestore record already exists`);
      }
      
      log(`🎉 Quick fix complete! Try logging in now.`);
      
    } catch (error: any) {
      log(`❌ Quick fix failed: ${error.message}`);
    }
    
    setLoading(false);
  };

  const cleanupDuplicates = async () => {
    if (loading) return;
    
    setLoading(true);
    clearResults();
    
    log(`🧹 Starting duplicate cleanup...`);
    
    try {
      const drivers = await driverService.getAllDrivers();
      log(`📊 Found ${drivers.length} total driver records`);
      
      // Group by email
      const emailGroups = new Map<string, any[]>();
      drivers.forEach(driver => {
        if (!emailGroups.has(driver.email)) {
          emailGroups.set(driver.email, []);
        }
        emailGroups.get(driver.email)!.push(driver);
      });
      
      log(`📊 Found ${emailGroups.size} unique emails`);
      
      let duplicatesRemoved = 0;
      for (const [email, driverGroup] of emailGroups.entries()) {
        if (driverGroup.length > 1) {
          log(`⚠️ Found ${driverGroup.length} duplicates for ${email}`);
          
          // Keep first, remove rest
          const [keep, ...remove] = driverGroup;
          log(`   ✅ Keeping ID: ${keep.id}`);
          
          for (const duplicate of remove) {
            try {
              await driverService.deleteDriver(duplicate.id);
              log(`   🗑️ Removed ID: ${duplicate.id}`);
              duplicatesRemoved++;
            } catch (error) {
              log(`   ❌ Failed to remove ID: ${duplicate.id}`);
            }
          }
        }
      }
      
      log(`✅ Cleanup complete! Removed ${duplicatesRemoved} duplicates`);
      
    } catch (error: any) {
      log(`❌ Cleanup failed: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            🚗 Driver Debug Panel
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Quick Fix */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🔧 Quick Fix
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Fix the main driver account from the screenshot
            </Text>
            <Button
              title="Fix driver@kleanly.co.ke"
              onPress={quickFixMainDriver}
              disabled={loading}
              style={styles.button}
            />
          </Card>

          {/* Test Single Driver */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🧪 Test Driver
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
            <Button
              title="Test & Fix Driver"
              onPress={testSingleDriver}
              disabled={loading}
              style={styles.button}
            />
          </Card>

          {/* Cleanup */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🧹 Database Cleanup
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Remove duplicate driver records
            </Text>
            <Button
              title="Cleanup Duplicates"
              onPress={cleanupDuplicates}
              disabled={loading}
              style={styles.button}
            />
          </Card>

          {/* Results */}
          {results ? (
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
          ) : null}

          {/* Loading */}
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
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
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
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
  },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { ensureAdminAccountExists, testAdminPermissions } from '../utils/ensureAdminAccount';
import { useAuth } from '../context/AuthContext';

export const AdminPermissionsDiagnostic = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { user } = useAuth();

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runFullDiagnostic = async () => {
    setTesting(true);
    setResults([]);
    
    addResult('🔧 Starting admin diagnostic...');
    
    try {
      // Step 1: Check current user
      addResult(`Current user: ${user?.email || 'Not logged in'}`);
      
      // Step 2: Ensure admin account exists
      addResult('Checking admin account...');
      const adminResult = await ensureAdminAccountExists();
      addResult(`Admin account: ${adminResult.message}`);
      
      if (!adminResult.success) {
        addResult('❌ Cannot proceed - admin account issues');
        return;
      }
      
      // Step 3: Test admin permissions
      addResult('Testing admin permissions...');
      const permissionsResult = await testAdminPermissions();
      addResult(`Permissions: ${permissionsResult.message}`);
      
      if (permissionsResult.success) {
        addResult('✅ All tests passed - admin setup is working!');
        Alert.alert('Success', 'Admin setup is working correctly!');
      } else {
        addResult('❌ Permission tests failed');
        Alert.alert('Error', 'Admin permissions are not working correctly');
      }
      
    } catch (error: any) {
      addResult(`❌ Diagnostic failed: ${error.message}`);
      Alert.alert('Error', `Diagnostic failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Permissions Diagnostic</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, testing && styles.buttonDisabled]} 
          onPress={runFullDiagnostic}
          disabled={testing}
        >
          <Text style={styles.buttonText}>
            {testing ? 'Running Tests...' : 'Run Full Diagnostic'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Diagnostic Results:</Text>
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
    padding: 20,
    backgroundColor: '#f8f9fa',
    margin: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#212529',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  button: {
    flex: 1,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  clearButton: {
    backgroundColor: '#6f42c1',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    maxHeight: 300,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#495057',
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
    marginBottom: 4,
    color: '#212529',
  },
});

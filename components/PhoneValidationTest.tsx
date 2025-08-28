/**
 * Phone Validation Test Component
 * Quick test to verify phone number validation is working
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { validatePhoneNumber, formatPhoneForDisplay, formatKenyanPhoneNumber } from '../utils/phoneValidation';

export const PhoneValidationTest: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationResult, setValidationResult] = useState<string>('');

  const testPhoneNumber = () => {
    const result = validatePhoneNumber(phoneNumber);
    const formatResult = formatKenyanPhoneNumber(phoneNumber);
    
    let message = `Input: ${phoneNumber}\n`;
    message += `Valid: ${result.isValid ? 'YES' : 'NO'}\n`;
    
    if (result.message) {
      message += `Error: ${result.message}\n`;
    }
    
    if (formatResult.isValid) {
      message += `Formatted: ${formatResult.formatted}\n`;
      message += `Display: ${formatPhoneForDisplay(phoneNumber)}\n`;
    }
    
    setValidationResult(message);
    Alert.alert('Phone Validation Result', message);
  };

  const testCases = [
    '0712345678',
    '0112345678', // Numbers starting with 01
    '712345678',
    '254712345678',
    '+254712345678',
    '0123456789', // Invalid
    '25471234567', // Too short
    'invalid', // Non-numeric
  ];

  const runAllTests = () => {
    const results = testCases.map(testCase => {
      const result = validatePhoneNumber(testCase);
      const formatResult = formatKenyanPhoneNumber(testCase);
      return `${testCase}: ${result.isValid ? 'VALID' : 'INVALID'} -> ${formatResult.formatted}`;
    }).join('\n');
    
    Alert.alert('All Test Results', results);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phone Validation Test</Text>
      
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="Enter phone number to test"
        keyboardType="phone-pad"
      />
      
      <TouchableOpacity style={styles.button} onPress={testPhoneNumber}>
        <Text style={styles.buttonText}>Test Phone Number</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={runAllTests}>
        <Text style={styles.buttonText}>Run All Test Cases</Text>
      </TouchableOpacity>
      
      {validationResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={styles.resultText}>{validationResult}</Text>
        </View>
      ) : null}
      
      <View style={styles.testCasesContainer}>
        <Text style={styles.testCasesTitle}>Test Cases:</Text>
        {testCases.map((testCase, index) => (
          <TouchableOpacity
            key={index}
            style={styles.testCaseItem}
            onPress={() => setPhoneNumber(testCase)}
          >
            <Text style={styles.testCaseText}>{testCase}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#6C757D',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#666',
    lineHeight: 20,
  },
  testCasesContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
  },
  testCasesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  testCaseItem: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  testCaseText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#495057',
  },
});

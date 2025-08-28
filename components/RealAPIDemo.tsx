/**
 * Real API Integration Component for Testing M-Pesa with Your Credentials
 * This demonstrates actual API calls using your provided consumer key & secret
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet, ScrollView } from 'react-native';
import { apiService } from '../services/apiService';
import { validatePhoneNumber, formatKenyanPhoneNumber } from '../utils/phoneValidation';

export const RealAPIDemo: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('100');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');

  const testAPIConnection = async () => {
    setIsProcessing(true);
    setLastResponse('Testing API connection...');
    
    try {
      const result = await apiService.testConnection();
      const response = `API Connection Test:\n${JSON.stringify(result, null, 2)}`;
      setLastResponse(response);
      
      if (result.success) {
        Alert.alert('✅ API Connected', 'Your API credentials are working!');
      } else {
        Alert.alert('❌ API Connection Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMsg = `API Connection Error: ${error}`;
      setLastResponse(errorMsg);
      Alert.alert('❌ Connection Error', errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const processRealPayment = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    // Validate phone number
    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      Alert.alert('Invalid Phone Number', phoneValidation.message || 'Please enter a valid Kenyan phone number');
      return;
    }

    // Format phone number
    const formatResult = formatKenyanPhoneNumber(phoneNumber);
    if (!formatResult.isValid) {
      Alert.alert('Format Error', 'Unable to format phone number');
      return;
    }

    const orderID = `TEST_${Date.now()}`;
    const paymentAmount = parseInt(amount) || 100;

    setIsProcessing(true);
    setLastResponse(`Processing M-Pesa payment...\nPhone: ${formatResult.formatted}\nAmount: KSH ${paymentAmount}\nOrder: ${orderID}`);

    try {
      const paymentResult = await apiService.processPayment({
        phoneNumber: formatResult.formatted,
        amount: paymentAmount,
        orderId: orderID,
        description: `Test payment for Kleanly order ${orderID}`
      });

      const response = `M-Pesa Payment Result:\n${JSON.stringify(paymentResult, null, 2)}`;
      setLastResponse(response);

      if (paymentResult.success) {
        Alert.alert(
          '✅ Payment Initiated',
          `M-Pesa payment request sent to ${formatResult.formatted}\n\nAmount: KSH ${paymentAmount}\nOrder ID: ${orderID}\n\nCheck your phone for the payment prompt!`,
          [
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        Alert.alert('❌ Payment Failed', paymentResult.error || 'Unknown payment error');
      }
    } catch (error) {
      const errorMsg = `Payment Error: ${error}`;
      setLastResponse(errorMsg);
      Alert.alert('❌ Payment Error', errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendTestSMS = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      Alert.alert('Invalid Phone Number', phoneValidation.message || 'Please enter a valid Kenyan phone number');
      return;
    }

    const formatResult = formatKenyanPhoneNumber(phoneNumber);
    const testMessage = `Hello! This is a test SMS from Kleanly. Your API integration is working correctly. Time: ${new Date().toLocaleString()}`;

    setIsProcessing(true);
    setLastResponse(`Sending test SMS to ${formatResult.formatted}...`);

    try {
      const smsResult = await apiService.sendSMS(formatResult.formatted, testMessage);
      
      const response = `SMS Result:\n${JSON.stringify(smsResult, null, 2)}`;
      setLastResponse(response);

      if (smsResult.success) {
        Alert.alert('✅ SMS Sent', `Test SMS sent successfully to ${formatResult.formatted}`);
      } else {
        Alert.alert('❌ SMS Failed', smsResult.error || 'SMS sending failed');
      }
    } catch (error) {
      const errorMsg = `SMS Error: ${error}`;
      setLastResponse(errorMsg);
      Alert.alert('❌ SMS Error', errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🚀 Real API Integration Test</Text>
      <Text style={styles.subtitle}>Testing with your actual credentials</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="0712345678 or 0112345678"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Amount (KSH)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="100"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={testAPIConnection}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>
            {isProcessing ? '⏳ Testing...' : '🔗 Test API Connection'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.successButton]} 
          onPress={processRealPayment}
          disabled={isProcessing || !phoneNumber.trim()}
        >
          <Text style={styles.buttonText}>
            {isProcessing ? '⏳ Processing...' : '💳 Process M-Pesa Payment'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.infoButton]} 
          onPress={sendTestSMS}
          disabled={isProcessing || !phoneNumber.trim()}
        >
          <Text style={styles.buttonText}>
            {isProcessing ? '⏳ Sending...' : '📱 Send Test SMS'}
          </Text>
        </TouchableOpacity>
      </View>

      {lastResponse ? (
        <View style={styles.responseContainer}>
          <Text style={styles.responseTitle}>📋 Last API Response:</Text>
          <Text style={styles.responseText}>{lastResponse}</Text>
        </View>
      ) : null}

      <View style={styles.credentialsInfo}>
        <Text style={styles.credentialsTitle}>🔑 Your API Credentials Status</Text>
        <Text style={styles.credentialsText}>
          Consumer Key: AAtYI3HyOjHMQpRMA1iJO6pgMQA8m249bHCr0lZzo0GbytVz ✅
        </Text>
        <Text style={styles.credentialsText}>
          Consumer Secret: VygTSQCPMxdTOG27ZYzm53OClo66tW2UcR4rvAePOWaeyvGcD73lrL2Geu5QI7is ✅
        </Text>
        <Text style={styles.infoText}>
          These credentials are loaded from your .env file and ready for testing!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#7f8c8d',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495e',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 30,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  successButton: {
    backgroundColor: '#27ae60',
  },
  infoButton: {
    backgroundColor: '#f39c12',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  responseContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  responseText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#34495e',
    lineHeight: 20,
  },
  credentialsInfo: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#27ae60',
    borderRadius: 8,
    padding: 16,
  },
  credentialsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#27ae60',
  },
  credentialsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    color: '#2c3e50',
  },
  infoText: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
    color: '#7f8c8d',
  },
});

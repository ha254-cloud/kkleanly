import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { ADMIN_EMAIL } from '../utils/adminAuth';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

const ADMIN_PASSWORD = 'KleanlyAdmin2025!';

export const AdminSetupComponent = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isTestingLogin, setIsTestingLogin] = useState(false);

  const createAdminAccount = async () => {
    setIsCreating(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      Alert.alert(
        '✅ Success!',
        `Admin account created successfully!\n\nEmail: ${ADMIN_EMAIL}\nPassword: ${ADMIN_PASSWORD}\n\nYou can now log in with these credentials.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert(
          'ℹ️ Account Exists',
          `Admin account already exists.\n\nEmail: ${ADMIN_EMAIL}\nPassword: ${ADMIN_PASSWORD}\n\nTry logging in with these credentials.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('❌ Error', `Failed to create admin account: ${error.message}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const testAdminLogin = async () => {
    setIsTestingLogin(true);
    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      Alert.alert(
        '✅ Login Success!',
        'Admin login test successful! You are now logged in as admin.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        '❌ Login Failed',
        `Could not log in with admin credentials.\n\nError: ${error.message}\n\nPlease check if the admin account exists or try creating it first.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingLogin(false);
    }
  };

  const copyCredentials = () => {
    Alert.alert(
      '🔐 Admin Credentials',
      `Email: ${ADMIN_EMAIL}\nPassword: ${ADMIN_PASSWORD}`,
      [
        { text: 'Copy Email', onPress: () => console.log('Copy email functionality would go here') },
        { text: 'Copy Password', onPress: () => console.log('Copy password functionality would go here') },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>🔧 Admin Account Setup</Text>
      <Text style={styles.subtitle}>Set up or test the admin account</Text>
      
      <View style={styles.credentialsContainer}>
        <Text style={styles.credentialsTitle}>Admin Credentials:</Text>
        <Text style={styles.credential}>📧 {ADMIN_EMAIL}</Text>
        <Text style={styles.credential}>🔑 {ADMIN_PASSWORD}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={isCreating ? 'Creating...' : 'Create Admin Account'}
          onPress={createAdminAccount}
          disabled={isCreating}
          style={styles.button}
        />
        
        <Button
          title={isTestingLogin ? 'Testing...' : 'Test Admin Login'}
          onPress={testAdminLogin}
          disabled={isTestingLogin}
          style={StyleSheet.flatten([styles.button, styles.secondaryButton])}
        />
        
        <TouchableOpacity onPress={copyCredentials} style={styles.copyButton}>
          <Text style={styles.copyButtonText}>📋 View Credentials</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instruction}>1. Click "Create Admin Account" to set up the admin</Text>
        <Text style={styles.instruction}>2. Use the credentials above to log in</Text>
        <Text style={styles.instruction}>3. Admin features will be available after login</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  credentialsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  credentialsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  credential: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 4,
    color: '#444',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    padding: 12,
  },
  secondaryButton: {
    backgroundColor: '#6B7280',
  },
  copyButton: {
    padding: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  instructionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  instruction: {
    fontSize: 12,
    marginBottom: 4,
    color: '#666',
  },
});

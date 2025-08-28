import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance } from '../services/firebase';

const ADMIN_EMAIL = 'kleanlyspt@gmail.com';
const ADMIN_PASSWORD = 'KleanlyAdmin2025!';

export const AdminDiagnosticComponent = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');

  const testAdminSetup = async () => {
    setTesting(true);
    setResult('Testing admin setup...');
    
    try {
      const auth = getAuthInstance();
      
      // First try to create the account
      try {
        setResult('Attempting to create admin account...');
        const createResult = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        setResult(`✅ Admin account created successfully!\nEmail: ${createResult.user.email}\nUID: ${createResult.user.uid}`);
        Alert.alert('Success', 'Admin account created successfully!');
      } catch (createError: any) {
        if (createError.code === 'auth/email-already-in-use') {
          setResult('Account exists, testing login...');
          
          // Try to login
          try {
            const loginResult = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
            setResult(`✅ Admin login successful!\nEmail: ${loginResult.user.email}\nUID: ${loginResult.user.uid}`);
            Alert.alert('Success', 'Admin login successful! The credentials are working correctly.');
          } catch (loginError: any) {
            let errorMsg = `❌ Login failed: ${loginError.message}`;
            
            if (loginError.code === 'auth/wrong-password') {
              errorMsg += '\n\n💡 The account exists but with a different password.\nPlease check Firebase Console or reset the password.';
            } else if (loginError.code === 'auth/user-not-found') {
              errorMsg += '\n\n💡 User not found. Try creating the account first.';
            } else if (loginError.code === 'auth/network-request-failed') {
              errorMsg += '\n\n💡 Network error. Check your internet connection.';
            }
            
            setResult(errorMsg);
            Alert.alert('Error', errorMsg);
          }
        } else {
          const errorMsg = `❌ Create failed: ${createError.message}`;
          setResult(errorMsg);
          Alert.alert('Error', errorMsg);
        }
      }
    } catch (error: any) {
      const errorMsg = `❌ Setup failed: ${error.message}`;
      setResult(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Account Diagnostic</Text>
      
      <View style={styles.credentialsBox}>
        <Text style={styles.label}>Admin Credentials:</Text>
        <Text style={styles.credential}>📧 Email: {ADMIN_EMAIL}</Text>
        <Text style={styles.credential}>🔑 Password: {ADMIN_PASSWORD}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, testing && styles.buttonDisabled]} 
        onPress={testAdminSetup}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test Admin Setup'}
        </Text>
      </TouchableOpacity>

      {result ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  credentialsBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  credential: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#2196f3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});

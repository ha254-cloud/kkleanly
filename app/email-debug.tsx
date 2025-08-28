import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { 
  emailDebugger, 
  debugEmailConflict, 
  testEmailRegistration, 
  analyzeConflict 
} from '../utils/emailDuplicateDebugger';
import { 
  checkEmailConflicts, 
  testAccountCreation, 
  debugAuthState,
  registerWithConflictDetection,
  getAuthErrorDetails
} from '../utils/firebaseUserConflictHandler';

export default function EmailDebugScreen() {
  const [email1, setEmail1] = useState('harrymaina02@gmail.com');
  const [email2, setEmail2] = useState('mainaharry554@gmail.com');
  const [debugResults, setDebugResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const handleAdvancedConflictCheck = async (email: string) => {
    setIsLoading(true);
    try {
      const conflicts = await checkEmailConflicts(email);
      const authState = await debugAuthState();
      
      Alert.alert(
        'Advanced Conflict Check',
        `Email: ${email}\n` +
        `Has Account: ${conflicts.hasAccount}\n` +
        `Conflict Level: ${conflicts.conflictLevel}\n` +
        `Sign-in Methods: ${conflicts.signInMethods.join(', ')}\n` +
        `Current User: ${authState.userEmail || 'None'}\n` +
        `Suggestions: ${conflicts.suggestions.join(', ')}`
      );
    } catch (error) {
      Alert.alert('Error', `Advanced check failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestRegistration = async (email: string) => {
    setIsLoading(true);
    try {
      const test = await testAccountCreation(email, 'testpassword123');
      
      Alert.alert(
        'Registration Test',
        `Email: ${email}\n` +
        `Can Create: ${test.canCreate}\n` +
        `Error: ${test.error || 'None'}\n` +
        `Error Code: ${test.errorCode || 'None'}`
      );
    } catch (error) {
      Alert.alert('Error', `Registration test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugSingleEmail = async (email: string) => {
    setIsLoading(true);
    try {
      const result = await debugEmailConflict(email);
      Alert.alert(
        'Email Debug Results',
        `Email: ${result.email}\n` +
        `Normalized: ${result.normalizedEmail}\n` +
        `Exists in Auth: ${result.existsInAuth}\n` +
        `Sign-in Methods: ${result.signInMethods.join(', ')}\n` +
        `Similar Emails: ${result.possibleDuplicates.length}\n` +
        `${result.possibleDuplicates.join('\n')}`
      );
    } catch (error) {
      Alert.alert('Error', `Debug failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestRegistrationOld = async (email: string) => {
    setIsLoading(true);
    try {
      const result = await testEmailRegistration(email);
      Alert.alert(
        'Registration Test Results',
        result.success 
          ? `✅ Registration would succeed for: ${email}`
          : `❌ Registration failed for: ${email}\n` +
            `Error Code: ${result.errorCode}\n` +
            `Error: ${result.errorMessage}`
      );
    } catch (error) {
      Alert.alert('Error', `Test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeConflict = async () => {
    if (!email1 || !email2) {
      Alert.alert('Error', 'Please enter both emails');
      return;
    }

    setIsLoading(true);
    try {
      const result = await analyzeConflict(email1, email2);
      setDebugResults(result);
      
      Alert.alert(
        'Email Conflict Analysis',
        `Emails: ${email1} vs ${email2}\n` +
        `Are Similar: ${result.areSimilar ? 'YES' : 'NO'}\n` +
        `Similarity Score: ${(result.similarityScore * 100).toFixed(1)}%\n` +
        `Normalized 1: ${result.normalizedEmail1}\n` +
        `Normalized 2: ${result.normalizedEmail2}\n` +
        `Conflict Reasons:\n${result.conflictReasons.join('\n')}`
      );
    } catch (error) {
      Alert.alert('Error', `Analysis failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>
          Email Duplicate Debugger
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Debug why Firebase thinks different emails are the same user
        </Text>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Single Email Debug
          </Text>
          
          <Input
            placeholder="Enter email to debug"
            value={email1}
            onChangeText={setEmail1}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => handleDebugSingleEmail(email1)}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Debug Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.success }]}
              onPress={() => handleTestRegistration(email1)}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Test Registration</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#FF6B6B' }]}
              onPress={() => handleAdvancedConflictCheck(email1)}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Advanced Check</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Email Conflict Analysis
          </Text>
          
          <Input
            placeholder="First email (e.g., harrymaina02@gmail.com)"
            value={email1}
            onChangeText={setEmail1}
            keyboardType="email-address"
            autoCapitalize="none"
            label="Email 1"
          />
          
          <Input
            placeholder="Second email (e.g., mainaharry554@gmail.com)"
            value={email2}
            onChangeText={setEmail2}
            keyboardType="email-address"
            autoCapitalize="none"
            label="Email 2"
          />
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleAnalyzeConflict}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Analyzing...' : 'Analyze Conflict'}
            </Text>
          </TouchableOpacity>
        </Card>

        {debugResults && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Analysis Results
            </Text>
            
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                Are Similar:
              </Text>
              <Text style={[styles.resultValue, { 
                color: debugResults.areSimilar ? colors.error : colors.success 
              }]}>
                {debugResults.areSimilar ? 'YES' : 'NO'}
              </Text>
            </View>
            
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                Similarity Score:
              </Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>
                {(debugResults.similarityScore * 100).toFixed(1)}%
              </Text>
            </View>
            
            <View style={styles.resultColumn}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                Conflict Reasons:
              </Text>
              {debugResults.conflictReasons.map((reason: string, index: number) => (
                <Text key={index} style={[styles.reasonText, { color: colors.error }]}>
                  • {reason}
                </Text>
              ))}
            </View>
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Quick Tests
          </Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.warning }]}
            onPress={() => handleDebugSingleEmail('harrymaina02@gmail.com')}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Debug: harrymaina02@gmail.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.warning }]}
            onPress={() => handleDebugSingleEmail('mainaharry554@gmail.com')}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Debug: mainaharry554@gmail.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.info }]}
            onPress={() => handleTestRegistration('mainaharry554@gmail.com')}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test: mainaharry554@gmail.com Registration</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    marginBottom: 20,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultColumn: {
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  reasonText: {
    fontSize: 14,
    marginLeft: 8,
    marginTop: 4,
  },
});

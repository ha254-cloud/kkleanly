import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { 
  testEmailRegistration, 
  testSpecificCase, 
  compareEmailRegistration,
  analyzeEmailPatterns,
  EmailTestResult 
} from '../utils/emailConflictTester';
import {
  checkEmailExistence,
  fixHarryEmailConflict,
  generateManualCleanupInstructions
} from '../utils/emailConflictResolver';

export default function EmailConflictTester() {
  const [testEmail, setTestEmail] = useState('mainaharry554@gmail.com');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string>('');
  
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const handleTestSingleEmail = async () => {
    if (!testEmail) {
      Alert.alert('Error', 'Please enter an email to test');
      return;
    }

    setIsLoading(true);
    setResults('Testing...\n');
    
    try {
      const result = await testEmailRegistration(testEmail);
      
      let resultText = `📧 EMAIL TEST RESULTS for ${testEmail}\n`;
      resultText += `==========================================\n`;
      resultText += `Can Register: ${result.canRegister ? '✅ YES' : '❌ NO'}\n`;
      
      if (!result.canRegister) {
        resultText += `Error Code: ${result.errorCode}\n`;
        resultText += `Error Message: ${result.errorMessage}\n`;
      }
      
      if (result.existingMethods.length > 0) {
        resultText += `Existing Methods: ${result.existingMethods.join(', ')}\n`;
      }
      
      setResults(resultText);
      
    } catch (error) {
      setResults(`❌ Test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSpecificCase = async () => {
    setIsLoading(true);
    setResults('Testing specific case...\n');
    
    try {
      // Capture console output
      const originalLog = console.log;
      let capturedLogs = '';
      
      console.log = (...args) => {
        capturedLogs += args.join(' ') + '\n';
        originalLog(...args);
      };
      
      await testSpecificCase();
      
      // Restore console.log
      console.log = originalLog;
      
      setResults(capturedLogs);
      
    } catch (error) {
      setResults(`❌ Test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzePatterns = () => {
    const email1 = 'harrymaina02@gmail.com';
    const email2 = 'mainaharry554@gmail.com';
    
    const analysis = analyzeEmailPatterns(email1, email2);
    
    let resultText = `🔍 EMAIL PATTERN ANALYSIS\n`;
    resultText += `==========================================\n`;
    resultText += `Email 1: ${email1}\n`;
    resultText += `Email 2: ${email2}\n\n`;
    resultText += `Normalized Same: ${analysis.normalizedSame ? 'YES' : 'NO'}\n`;
    resultText += `Username Similarity: ${(analysis.usernameSimilarity * 100).toFixed(1)}%\n\n`;
    resultText += `Possible Conflict Reasons:\n`;
    
    if (analysis.possibleConflictReasons.length === 0) {
      resultText += `✅ No obvious conflicts detected\n`;
    } else {
      analysis.possibleConflictReasons.forEach(reason => {
        resultText += `• ${reason}\n`;
      });
    }
    
    setResults(resultText);
  };

  const handleCheckEmailExistence = async () => {
    setIsLoading(true);
    setResults('Checking email existence...\n');
    
    try {
      const existence = await checkEmailExistence('harrymaina02@gmail.com');
      
      let resultText = `🔍 EMAIL EXISTENCE CHECK for harrymaina02@gmail.com\n`;
      resultText += `==========================================\n`;
      resultText += `In Firebase Auth: ${existence.inAuth ? '✅ YES' : '❌ NO'}\n`;
      resultText += `In Drivers Collection: ${existence.inDrivers ? '✅ YES' : '❌ NO'}\n`;
      resultText += `In User Profiles: ${existence.inUserProfiles ? '✅ YES' : '❌ NO'}\n`;
      resultText += `In Admin Auth List: ${existence.inAdminAuth ? '✅ YES' : '❌ NO'}\n\n`;
      
      if (existence.details.authMethods.length > 0) {
        resultText += `Auth Methods: ${existence.details.authMethods.join(', ')}\n`;
      }
      
      if (existence.details.driverRecord) {
        resultText += `Driver Record: ${JSON.stringify(existence.details.driverRecord, null, 2)}\n`;
      }
      
      if (existence.details.userProfile) {
        resultText += `User Profile: ${JSON.stringify(existence.details.userProfile, null, 2)}\n`;
      }
      
      setResults(resultText);
      
    } catch (error) {
      setResults(`❌ Check failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixConflict = async () => {
    setIsLoading(true);
    setResults('Attempting to fix email conflict...\n');
    
    try {
      const result = await fixHarryEmailConflict();
      
      let resultText = `🔧 EMAIL CONFLICT FIX RESULTS\n`;
      resultText += `==========================================\n`;
      resultText += `Success: ${result.success ? '✅ YES' : '❌ NO'}\n`;
      resultText += `Message: ${result.message}\n\n`;
      
      if (result.details) {
        resultText += `Details: ${JSON.stringify(result.details, null, 2)}\n\n`;
      }
      
      // Add manual instructions
      resultText += generateManualCleanupInstructions('harrymaina02@gmail.com');
      
      setResults(resultText);
      
    } catch (error) {
      setResults(`❌ Fix failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompareEmails = async () => {
    setIsLoading(true);
    setResults('Comparing emails...\n');
    
    const emails = [
      'harrymaina02@gmail.com',
      'mainaharry554@gmail.com',
      'test@example.com' // Control email
    ];
    
    try {
      const originalLog = console.log;
      let capturedLogs = '';
      
      console.log = (...args) => {
        capturedLogs += args.join(' ') + '\n';
        originalLog(...args);
      };
      
      await compareEmailRegistration(emails);
      
      console.log = originalLog;
      
      setResults(capturedLogs);
      
    } catch (error) {
      setResults(`❌ Comparison failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>
          Email Conflict Tester
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Test why Firebase thinks different emails are duplicates
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Test Single Email
          </Text>
          
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border, 
              backgroundColor: colors.background,
              color: colors.text 
            }]}
            placeholder="Enter email to test"
            placeholderTextColor={colors.textSecondary}
            value={testEmail}
            onChangeText={setTestEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleTestSingleEmail}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Testing...' : 'Test Email Registration'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Quick Tests
          </Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.warning }]}
            onPress={handleAnalyzePatterns}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Analyze Email Patterns</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.success }]}
            onPress={handleTestSpecificCase}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Specific Case</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.info }]}
            onPress={handleCompareEmails}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Compare Multiple Emails</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.error }]}
            onPress={handleCheckEmailExistence}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Check harrymaina02@gmail.com Existence</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#FF6B35' }]}
            onPress={handleFixConflict}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🔧 Fix Harry Email Conflict</Text>
          </TouchableOpacity>
        </View>

        {results ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Test Results
            </Text>
            
            <ScrollView style={styles.resultsContainer} horizontal={false}>
              <Text style={[styles.resultsText, { color: colors.text }]}>
                {results}
              </Text>
            </ScrollView>
          </View>
        ) : null}
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
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  resultsContainer: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  resultsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});

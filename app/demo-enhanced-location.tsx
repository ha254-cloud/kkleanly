import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LocationPicker } from '../components/LocationPicker';

export default function DemoEnhancedLocation() {
  const [address, setAddress] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3b82f6', '#1e40af', '#1d4ed8']}
        style={styles.header}
      >
        <Ionicons name="location" size={32} color="#fff" />
        <Text style={styles.headerTitle}>Enhanced Location Picker</Text>
        <Text style={styles.headerSubtitle}>
          Ultra-detailed location detection with beautiful UI
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.demoSection}>
          <LinearGradient
            colors={['#f8fafc', '#f1f5f9']}
            style={styles.demoCard}
          >
            <Text style={styles.demoTitle}>Features Demo</Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>Building-level accuracy detection</Text>
              <Text style={styles.featureItem}>Categorized nearby places</Text>
              <Text style={styles.featureItem}>Road and street identification</Text>
              <Text style={styles.featureItem}>Business ratings and status</Text>
              <Text style={styles.featureItem}>Beautiful gradient animations</Text>
              <Text style={styles.featureItem}>Interactive map integration</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.pickerSection}>
          <LocationPicker
            value={address}
            onChangeText={setAddress}
            label="Enhanced Location Detection"
            placeholder="Tap 'Detect' to experience ultra-detailed location detection..."
            showDetectButton={true}
            showMap={true}
            style={styles.locationPicker}
          />
        </View>

        {address ? (
          <LinearGradient
            colors={['#dcfce7', '#bbf7d0']}
            style={styles.resultCard}
          >
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.resultTitle}>Detected Location Details</Text>
            <Text style={styles.resultText}>{address}</Text>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={['#fef3c7', '#fde68a']}
            style={styles.instructionCard}
          >
            <Ionicons name="information-circle" size={24} color="#d97706" />
            <Text style={styles.instructionTitle}>💡 How to Test</Text>
            <Text style={styles.instructionText}>
              1. Tap the "Detect" button above{'\n'}
              2. Allow location permissions{'\n'}
              3. Watch the magic happen! 🪄{'\n'}
              4. Explore the interactive map{'\n'}
              5. See ultra-detailed nearby places
            </Text>
          </LinearGradient>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2fe',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  demoSection: {
    marginTop: 20,
  },
  demoCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 20,
  },
  pickerSection: {
    marginTop: 24,
  },
  locationPicker: {
    marginBottom: 0,
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  resultText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
    textAlign: 'center',
  },
  instructionCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#a16207',
    lineHeight: 20,
    textAlign: 'center',
  },
  spacer: {
    height: 40,
  },
});

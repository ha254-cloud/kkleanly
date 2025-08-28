import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { LocationPicker, MapLocationPicker } from '../components/LocationPicker';
import { useLocation } from '../hooks/useLocation';
import { Colors } from '../constants/Colors';

export default function LocationDemo() {
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const { currentAddress, loading, error } = useLocation();

  const handleLocationSelected = (location: { latitude: number; longitude: number; address: string }) => {
    Alert.alert(
      'Location Selected',
      `Address: ${location.address}\nLat: ${location.latitude}\nLng: ${location.longitude}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>📍 Location Service Demo</Text>
          <Text style={styles.subtitle}>
            Test GPS location detection and address autocomplete
          </Text>
        </View>

        {/* Basic Location Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Location Picker</Text>
          <LocationPicker
            value={address1}
            onChangeText={setAddress1}
            placeholder="Enter your pickup address"
            label="Pickup Address"
            showDetectButton={true}
          />
        </View>

        {/* Enhanced Location Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enhanced with Map Option</Text>
          <LocationPicker
            value={address2}
            onChangeText={setAddress2}
            placeholder="Enter delivery address"
            label="Delivery Address"
            showMap={true}
          />
        </View>

        {/* Status Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Service Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Current Address:</Text>
              <Text style={styles.statusValue}>
                {currentAddress || 'Not detected'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Loading:</Text>
              <Text style={[styles.statusValue, loading ? styles.loading : styles.ready]}>
                {loading ? 'Yes' : 'No'}
              </Text>
            </View>
            {error && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Error:</Text>
                <Text style={[styles.statusValue, styles.error]}>
                  {error}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Use</Text>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionStep}>
              1. 🎯 Tap "Detect" to use GPS location
            </Text>
            <Text style={styles.instructionStep}>
              2. ✏️ Or type address manually
            </Text>
            <Text style={styles.instructionStep}>
              3. 🗺️ Use "Show Map" for precise location
            </Text>
            <Text style={styles.instructionStep}>
              4. 💾 Save frequently used addresses
            </Text>
          </View>
        </View>

        {/* API Setup Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Setup Required</Text>
          <View style={styles.setupCard}>
            <Text style={styles.setupText}>
              To fully enable location features:
            </Text>
            <Text style={styles.setupStep}>
              1. Get Google Maps API key from Google Cloud Console
            </Text>
            <Text style={styles.setupStep}>
              2. Enable Geocoding API and Places API
            </Text>
            <Text style={styles.setupStep}>
              3. Add API key to .env file:
            </Text>
            <Text style={styles.codeText}>
              EXPO_PUBLIC_GOOGLE_API_KEY=your_api_key_here
            </Text>
            <Text style={styles.setupStep}>
              4. Restart the app to apply changes
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  loading: {
    color: '#f59e0b',
  },
  ready: {
    color: '#10b981',
  },
  error: {
    color: '#ef4444',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionStep: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 24,
  },
  setupCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  setupText: {
    fontSize: 16,
    color: '#92400e',
    marginBottom: 12,
    fontWeight: '500',
  },
  setupStep: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 8,
    lineHeight: 20,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
});

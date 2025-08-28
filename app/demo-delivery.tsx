import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationDetails } from '../hooks/useLocationDetails';
import { LocationPicker } from '../components/LocationPicker';

export default function DeliveryScreen() {
  const [selectedAddress, setSelectedAddress] = useState('');
  const [enhancedAddress, setEnhancedAddress] = useState('');
  
  const {
    location,
    locationDetails,
    building,
    address,
    loading,
    error,
    getCurrentLocationWithDetails,
    clearError,
  } = useLocationDetails();

  // Auto-enhance address when location details are available
  useEffect(() => {
    if (locationDetails.formatted_address && location) {
      let enhanced = locationDetails.formatted_address;
      
      // Add building information if available
      if (building.name && building.name !== 'N/A') {
        enhanced = `🏢 ${building.name}\n${enhanced}`;
      }
      
      // Add coordinate information
      enhanced += `\n\n📍 GPS: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
      
      // Add area details
      if (locationDetails.area) {
        enhanced += `\n🏘️ Area: ${locationDetails.area}`;
      }
      
      if (locationDetails.city && locationDetails.county) {
        enhanced += `\n🌍 ${locationDetails.city}, ${locationDetails.county}`;
      }
      
      setEnhancedAddress(enhanced);
      setSelectedAddress(enhanced);
    }
  }, [locationDetails, building, location]);

  const handleDetectLocation = async () => {
    clearError();
    await getCurrentLocationWithDetails();
  };

  const showLocationSummary = () => {
    if (!location || !locationDetails.formatted_address) {
      Alert.alert('No Location', 'Please detect your location first');
      return;
    }

    const summary = `
🏢 Building: ${building.name || 'Not detected'}
📍 Address: ${locationDetails.formatted_address}
🏘️ Area: ${locationDetails.area || 'Not available'}
🌍 City: ${locationDetails.city || 'Not available'}
🗺️ County: ${locationDetails.county || 'Not available'}
📱 Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
`;

    Alert.alert('📍 Location Details', summary.trim());
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🚚 Kleanly Delivery</Text>
          <Text style={styles.subtitle}>
            Enhanced building-level location detection
          </Text>
        </View>

        {/* Enhanced Location Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Delivery Address</Text>
          <LocationPicker
            value={selectedAddress}
            onChangeText={setSelectedAddress}
            placeholder="Enter your delivery address"
            label="Where should we deliver your clean clothes?"
            showDetectButton={true}
            showMap={true}
          />
        </View>

        {/* Quick Location Detection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Quick Location Detection</Text>
          <TouchableOpacity 
            style={[styles.detectButton, loading && styles.detectButtonDisabled]}
            onPress={handleDetectLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="location" size={20} color="#fff" />
            )}
            <Text style={styles.detectButtonText}>
              {loading ? 'Detecting Location...' : 'Detect My Location'}
            </Text>
          </TouchableOpacity>
          
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Location Results */}
        {location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Location Results</Text>
            
            {/* Building Information */}
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="business" size={20} color="#3b82f6" />
                <Text style={styles.resultTitle}>Building Information</Text>
              </View>
              <Text style={styles.resultText}>
                <Text style={styles.resultLabel}>Name: </Text>
                {building.name || 'Not detected'}
              </Text>
              <Text style={styles.resultText}>
                <Text style={styles.resultLabel}>Type: </Text>
                {building.type || 'Unknown'}
              </Text>
            </View>

            {/* GPS Coordinates */}
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="navigate" size={20} color="#10b981" />
                <Text style={styles.resultTitle}>GPS Coordinates</Text>
              </View>
              <Text style={styles.resultText}>
                <Text style={styles.resultLabel}>Latitude: </Text>
                {location.latitude.toFixed(6)}
              </Text>
              <Text style={styles.resultText}>
                <Text style={styles.resultLabel}>Longitude: </Text>
                {location.longitude.toFixed(6)}
              </Text>
            </View>

            {/* Address Details */}
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="map" size={20} color="#f59e0b" />
                <Text style={styles.resultTitle}>Address Details</Text>
              </View>
              <Text style={styles.resultText}>
                <Text style={styles.resultLabel}>Full Address: </Text>
                {locationDetails.formatted_address}
              </Text>
              {locationDetails.area && (
                <Text style={styles.resultText}>
                  <Text style={styles.resultLabel}>Area: </Text>
                  {locationDetails.area}
                </Text>
              )}
              {locationDetails.city && (
                <Text style={styles.resultText}>
                  <Text style={styles.resultLabel}>City: </Text>
                  {locationDetails.city}
                </Text>
              )}
              {locationDetails.county && (
                <Text style={styles.resultText}>
                  <Text style={styles.resultLabel}>County: </Text>
                  {locationDetails.county}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.summaryButton}
                onPress={showLocationSummary}
              >
                <Ionicons name="information-circle" size={18} color="#3b82f6" />
                <Text style={styles.summaryButtonText}>View Summary</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Setup Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ API Setup</Text>
          <View style={styles.setupCard}>
            <Text style={styles.setupText}>
              This demo uses Google Geocoding API for building-level detection:
            </Text>
            <Text style={styles.setupStep}>
              ✅ Google Maps API Key: Configured
            </Text>
            <Text style={styles.setupStep}>
              ✅ Geocoding API: Enabled
            </Text>
            <Text style={styles.setupStep}>
              ✅ Places API: Enabled
            </Text>
            <Text style={styles.setupStep}>
              ✅ Building Detection: Active
            </Text>
          </View>
        </View>

        {/* Features List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Detection Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.featureText}>GPS coordinates with 6-decimal precision</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.featureText}>Building name detection (premise, POI)</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.featureText}>Street number and route identification</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.featureText}>Area, city, and county extraction</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.featureText}>Formatted address with landmarks</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.featureText}>Establishment and point-of-interest detection</Text>
            </View>
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
  detectButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  detectButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  detectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    flex: 1,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  resultText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 20,
  },
  resultLabel: {
    fontWeight: '600',
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  summaryButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  setupCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  setupText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 12,
    fontWeight: '500',
  },
  setupStep: {
    fontSize: 12,
    color: '#1e40af',
    marginBottom: 4,
  },
  featuresList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
});

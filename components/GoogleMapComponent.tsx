import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Dimensions } from 'react-native';
import { MapPin, Navigation, Truck, Home } from 'lucide-react-native';
import { LocationCoords } from '../services/mapsService';

interface GoogleMapComponentProps {
  driverLocation?: LocationCoords;
  customerLocation: LocationCoords;
  pickupLocation?: LocationCoords;
  showRoute?: boolean;
  onMapReady?: () => void;
  mapHeight?: number;
  zoom?: number;
}

const { width } = Dimensions.get('window');

export default function GoogleMapComponent({
  driverLocation,
  customerLocation,
  pickupLocation,
  showRoute = true,
  onMapReady,
  mapHeight = 400,
  zoom = 13,
}: GoogleMapComponentProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setLoading(false);
      onMapReady?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onMapReady]);

  const formatCoordinate = (coord: number) => coord.toFixed(4);

  if (loading) {
    return (
      <View style={[styles.container, { height: mapHeight }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: mapHeight }]}>
      {/* Simple Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapTitle}>Live Tracking Map</Text>
        
        {/* Customer Location */}
        <View style={styles.locationItem}>
          <Home size={20} color="#10B981" />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Customer Location</Text>
            <Text style={styles.locationCoords}>
              {formatCoordinate(customerLocation.latitude)}, {formatCoordinate(customerLocation.longitude)}
            </Text>
          </View>
        </View>

        {/* Pickup Location */}
        {pickupLocation && (
          <View style={styles.locationItem}>
            <MapPin size={20} color="#F59E42" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup Location</Text>
              <Text style={styles.locationCoords}>
                {formatCoordinate(pickupLocation.latitude)}, {formatCoordinate(pickupLocation.longitude)}
              </Text>
            </View>
          </View>
        )}

        {/* Driver Location */}
        {driverLocation && (
          <View style={styles.locationItem}>
            <Truck size={20} color="#3B82F6" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Driver Location</Text>
              <Text style={styles.locationCoords}>
                {formatCoordinate(driverLocation.latitude)}, {formatCoordinate(driverLocation.longitude)}
              </Text>
            </View>
          </View>
        )}

        {/* Route Info */}
        {showRoute && driverLocation && (
          <View style={styles.routeInfo}>
            <Navigation size={16} color="#6366F1" />
            <Text style={styles.routeText}>Route tracking active</Text>
          </View>
        )}

        <Text style={styles.mapNote}>
          📱 Interactive map view coming soon{'\n'}
          Location coordinates are displayed above
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    width: '100%',
    justifyContent: 'center',
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#222',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  routeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  mapNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
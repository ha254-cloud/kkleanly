import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Modal,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || 'REPLACE_WITH_ENV_GOOGLE_KEY';

const screen = Dimensions.get('window');

interface AddressComponents {
  building?: string;
  estate?: string;
  road?: string;
  area?: string;
  city?: string;
  county?: string;
  country?: string;
  fullAddress?: string;
  plusCode?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  details?: AddressComponents;
}

interface LocationPickerProps {
  visible: boolean;
  onLocationSelect: (location: LocationData) => void;
  onClose: () => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

export default function EnhancedLocationPicker({ 
  visible, 
  onLocationSelect, 
  onClose, 
  initialLocation 
}: LocationPickerProps) {
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<AddressComponents | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const mapRef = useRef(null);
  const placesRef = useRef(null);

  // Get initial user location
  useEffect(() => {
    if (!visible) return;
    
    (async () => {
      setLoading(true);
      
      if (initialLocation) {
        const newRegion = {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };
        setRegion(newRegion);
        fetchAddressFromCoords(initialLocation.latitude, initialLocation.longitude);
        setLoading(false);
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied');
        // Set default to Nairobi if permission denied
        const defaultRegion = {
          latitude: -1.286389,
          longitude: 36.817223,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };
        setRegion(defaultRegion);
        fetchAddressFromCoords(defaultRegion.latitude, defaultRegion.longitude);
        setLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = location.coords;
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };
        setRegion(newRegion);
        fetchAddressFromCoords(latitude, longitude);
      } catch (error) {
        console.warn('Failed to get current location:', error);
        // Fallback to default location
        const defaultRegion = {
          latitude: -1.286389,
          longitude: 36.817223,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };
        setRegion(defaultRegion);
        fetchAddressFromCoords(defaultRegion.latitude, defaultRegion.longitude);
      }
      setLoading(false);
    })();
  }, [visible, initialLocation]);

  // Helper function to validate if a name is a legitimate estate name
  const isValidEstateName = (name: string): boolean => {
    if (!name || typeof name !== 'string') return false;
    
    const trimmed = name.trim();
    
    // Filter out Plus Codes, coordinates, and very short names
    if (/^[A-Z0-9]{4}\+[A-Z0-9]{2,3}$/i.test(trimmed) || 
        /^-?\d+\.?\d*,?\s*-?\d+\.?\d*$/.test(trimmed) ||
        /^\d+$/.test(trimmed) ||
        trimmed.length < 4) {
      return false;
    }
    
    // Filter out major city names in Kenya
    const majorLocations = [
      'nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'malindi',
      'kitale', 'garissa', 'kakamega', 'machakos', 'meru', 'nyeri', 'kericho',
      'kenya', 'county', 'district'
    ];
    
    const lowerName = trimmed.toLowerCase();
    return !majorLocations.some(location => lowerName.includes(location));
  };

  // Helper function to check if a name is specifically an estate
  const isSpecificEstate = (name: string): boolean => {
    if (!name || typeof name !== 'string') return false;
    
    const lowerName = name.toLowerCase();
    
    // Estate indicators
    const estateIndicators = [
      'estate', 'gardens', 'heights', 'ridge', 'view', 'park',
      'court', 'place', 'residence', 'villa', 'manor', 'close',
      'phase', 'block', 'section', 'scheme', 'apartments',
      'flats', 'towers', 'square', 'plaza'
    ];
    
    if (estateIndicators.some(indicator => lowerName.includes(indicator))) {
      return true;
    }
    
    // Known Kenyan estates
    const knownEstates = [
      'munyaka', 'kahawa', 'kasarani', 'githurai', 'zimmerman', 'thome',
      'roysambu', 'pipeline', 'fedha', 'umoja', 'embakasi', 'donholm',
      'buruburu', 'eastleigh', 'parklands', 'westlands', 'kilimani',
      'lavington', 'kileleshwa', 'karen', 'langata', 'runda', 'muthaiga'
    ];
    
    return knownEstates.some(estate => lowerName.includes(estate));
  };

  // Reverse Geocode with enhanced parsing
  const fetchAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        setAddress({ fullAddress: 'Location not found' });
        return;
      }

      const result = data.results[0];
      const components = result.address_components || [];

      // Helper to find component by type
      const getComponent = (types: string[]) => {
        const component = components.find((c) => 
          types.some(type => c.types.includes(type))
        );
        return component?.long_name || '';
      };

      // Extract estate with validation
      let estate = '';
      
      // Try establishment first
      const establishment = getComponent(['establishment']);
      if (establishment && isSpecificEstate(establishment)) {
        estate = establishment;
      }
      
      // Try sublocality if no estate found
      if (!estate) {
        const sublocality = getComponent(['sublocality_level_1', 'sublocality_level_2', 'neighborhood']);
        if (sublocality && isSpecificEstate(sublocality)) {
          estate = sublocality;
        }
      }

      // Extract Plus Code
      let plusCode = '';
      const plusCodeResult = data.results.find(r => r.plus_code?.global_code);
      if (plusCodeResult?.plus_code?.global_code) {
        plusCode = plusCodeResult.plus_code.global_code;
      }

      const formatted: AddressComponents = {
        building: getComponent(['premise']),
        estate: estate || undefined,
        road: getComponent(['route']),
        area: getComponent(['locality', 'sublocality_level_3']),
        city: getComponent(['administrative_area_level_2', 'administrative_area_level_1']) || 'Nairobi',
        county: getComponent(['administrative_area_level_1']),
        country: getComponent(['country']) || 'Kenya',
        plusCode: plusCode || undefined,
        fullAddress: result.formatted_address,
      };

      setAddress(formatted);
    } catch (error) {
      console.warn('Failed to fetch address:', error);
      setAddress({ fullAddress: 'Failed to load address' });
    }
  };

  // Handle search place selection
  const handlePlaceSelect = (data: any, details: any) => {
    if (details?.geometry?.location) {
      const { lat, lng } = details.geometry.location;
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
      
      setRegion(newRegion);
      fetchAddressFromCoords(lat, lng);
      setShowSearch(false);
      
      // Animate map to new location
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  };

  // On region change complete (when user drags map)
  const onRegionChangeComplete = (newRegion: any) => {
    setRegion(newRegion);
    fetchAddressFromCoords(newRegion.latitude, newRegion.longitude);
  };

  // Handle location confirmation
  const handleConfirmLocation = () => {
    if (region && address) {
      const locationData: LocationData = {
        latitude: region.latitude,
        longitude: region.longitude,
        address: address.fullAddress || 'Selected Location',
        details: address,
      };
      onLocationSelect(locationData);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Location</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {loading || !region ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#14b8a6" />
            <Text style={styles.loadingText}>Loading your location…</Text>
          </View>
        ) : (
          <>
            {/* Search Bar */}
            {showSearch ? (
              <View style={styles.searchContainer}>
                <GooglePlacesAutocomplete
                  ref={placesRef}
                  placeholder="Search for a location..."
                  onPress={handlePlaceSelect}
                  query={{
                    key: GOOGLE_API_KEY,
                    language: 'en',
                    components: 'country:ke',
                  }}
                  styles={{
                    container: styles.autocompleteContainer,
                    textInputContainer: styles.textInputContainer,
                    textInput: styles.textInput,
                    listView: styles.listView,
                    row: styles.row,
                  }}
                  fetchDetails={true}
                  enablePoweredByContainer={false}
                  autoFocus={true}
                />
                <TouchableOpacity
                  style={styles.closeSearchButton}
                  onPress={() => setShowSearch(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => setShowSearch(true)}
              >
                <Ionicons name="search" size={20} color="#666" />
                <Text style={styles.searchButtonText}>Search for a location...</Text>
              </TouchableOpacity>
            )}

            {/* Map */}
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={region}
              onRegionChangeComplete={onRegionChangeComplete}
              showsUserLocation
              showsMyLocationButton
              followsUserLocation={false}
              provider="google"
            />
            
            {/* Fixed Center Marker */}
            <View style={styles.markerFixed}>
              <Text style={styles.marker}>📍</Text>
            </View>

            {/* Address Box */}
            <View style={styles.addressBox}>
              <Text style={styles.title}>Selected Location</Text>
              
              {address?.building && (
                <Text style={styles.line}>🏠 {address.building}</Text>
              )}
              
              {address?.estate && (
                <Text style={styles.line}>🏘️ {address.estate}</Text>
              )}
              
              {address?.road && (
                <Text style={styles.line}>🛣️ {address.road}</Text>
              )}
              
              {address?.area && (
                <Text style={styles.line}>📍 {address.area}</Text>
              )}
              
              <Text style={styles.line}>🌆 {address?.city || 'Nairobi'}</Text>
              
              {address?.plusCode && (
                <Text style={styles.line}>📍 Plus Code: {address.plusCode}</Text>
              )}
              
              <Text style={styles.lineSmall}>{address?.fullAddress}</Text>
              
              {/* Confirm Button */}
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleConfirmLocation}
              >
                <Text style={styles.confirmButtonText}>Use this location</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  map: {
    flex: 1,
  },
  markerFixed: {
    left: '50%',
    marginLeft: -12,
    marginTop: -48,
    position: 'absolute',
    top: '50%',
  },
  marker: {
    fontSize: 30,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  searchButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  searchButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  closeSearchButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    marginLeft: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  autocompleteContainer: {
    flex: 1,
  },
  textInputContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  listView: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  row: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addressBox: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 18,
    color: '#333',
  },
  line: {
    fontSize: 15,
    marginBottom: 4,
    color: '#555',
  },
  lineSmall: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  confirmButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

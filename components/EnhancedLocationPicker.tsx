import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  Keyboard,
  ViewStyle,
  TextStyle
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const screen = Dimensions.get('window');
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || 'REPLACE_WITH_ENV_GOOGLE_KEY';

// Default to Nairobi CBD for better UX
const DEFAULT_REGION = {
  latitude: -1.286389,
  longitude: 36.817223,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015
};

interface LocationDetail {
  plusCode?: string;
  estate?: string;
  route?: string;
  locality?: string;
  city?: string;
  country?: string;
  building?: string;
  placeId?: string;
  formattedAddress?: string;
  addressComponents?: any[];
  types?: string[];
  name?: string;
  vicinity?: string;
}

interface LocationData {
  coords: { latitude: number; longitude: number };
  address: string;
  details?: LocationDetail;
}

interface LocationPickerProps {
  onConfirm: (data: LocationData) => void;
  onCancel: () => void;
  initialCoords?: { latitude: number; longitude: number };
}

const EnhancedLocationPicker: React.FC<LocationPickerProps> = ({
  onConfirm,
  onCancel,
  initialCoords
}) => {
  // Refs for managing state and operations
  const mapRef = useRef<MapView | null>(null);
  const debounceRef = useRef<any>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const isUserInteractionRef = useRef<boolean>(true);
  const placesRef = useRef<any>(null);
  const isAnimatingRef = useRef<boolean>(false);
  const lastRegionRef = useRef<Region | null>(null);

  // Component state
  const [region, setRegion] = useState<Region>(() => ({
    ...DEFAULT_REGION,
    ...(initialCoords && {
      latitude: initialCoords.latitude,
      longitude: initialCoords.longitude
    })
  }));
  
  const [currentCoords, setCurrentCoords] = useState(() => ({
    latitude: initialCoords?.latitude || DEFAULT_REGION.latitude,
    longitude: initialCoords?.longitude || DEFAULT_REGION.longitude
  }));
  
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [isMovingToLocation, setIsMovingToLocation] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [locationDetails, setLocationDetails] = useState<LocationDetail>({
    plusCode: '',
    estate: '',
    route: '',
    locality: '',
    city: '',
    country: 'Kenya'
  });

  // Simplified and reliable reverse geocoding
  const reverseGeocode = useCallback(async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    // Cancel any existing request
    if (geocodeAbortRef.current) {
      geocodeAbortRef.current.abort();
    }

    const controller = new AbortController();
    geocodeAbortRef.current = controller;
    
    setIsGeocoding(true);
    setError('');

    try {
      if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'REPLACE_WITH_ENV_GOOGLE_KEY') {
        throw new Error('Google API key not configured');
      }

      // Create timeout promise - reduced to 5 seconds to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });

      // Enhanced geocoding URL with parameters optimized for estate detection
      const params = new URLSearchParams({
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_API_KEY,
        language: 'en',
        region: 'ke',
        result_type: 'street_address|premise|subpremise|establishment|neighborhood|sublocality|sublocality_level_1|sublocality_level_2'
      });

      const url = `https://maps.googleapis.com/maps/api/geocode/json?${params}`;
      
      const fetchPromise = fetch(url, { 
        signal: controller.signal
      });

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
        console.log("FULL GEOCODE RESULTS >>", JSON.stringify(data.results, null, 2));
        
        const result = data.results[0];
        const components = result.address_components;

        console.log("FULL ADDRESS COMPONENTS >>", JSON.stringify(components, null, 2));

        // Simple component finder
        const getComponent = (type) =>
          components.find((c) => c.types.includes(type))?.long_name;

        // Try to get building/establishment name from multiple result types
        let building = '';
        
        // Check all results for establishments, points of interest, etc.
        for (const res of data.results) {
          if (res.types.includes('establishment') || 
              res.types.includes('point_of_interest') ||
              res.types.includes('premise')) {
            // Get the first part of formatted address (usually the building name)
            const firstPart = res.formatted_address.split(',')[0]?.trim();
            if (firstPart && !firstPart.match(/^\d+\s/) && firstPart.length > 2) {
              building = firstPart;
              console.log("FOUND BUILDING:", building);
              break;
            }
          }
        }

        // If no building found, try premise component
        if (!building) {
          building = getComponent('premise') || '';
        }

        const formatted = {
          building: building,
          estate: getComponent('sublocality_level_1') || getComponent('neighborhood') || '',
          road: getComponent('route') || '',
          area: getComponent('locality') || getComponent('administrative_area_level_2') || '',
          county: getComponent('administrative_area_level_1') || '',
          fullAddress: result.formatted_address,
        };

        console.log("FORMATTED RESULT >>", JSON.stringify(formatted, null, 2));

        // Build the address parts for display
        const addressParts = [];
        if (formatted.building) addressParts.push(formatted.building);
        if (formatted.estate) addressParts.push(formatted.estate);
        if (formatted.area) addressParts.push(formatted.area);
        if (formatted.county) addressParts.push(formatted.county);
        
        const fullAddress = addressParts.join(', ') || result.formatted_address;
        
        setLocationDetails({
          plusCode: data.plus_code?.global_code || '',
          estate: formatted.estate,
          route: formatted.road,
          locality: formatted.area,
          city: formatted.area || 'Nairobi',
          country: getComponent('country') || 'Kenya',
          building: formatted.building
        });
        
        setAddress(fullAddress);
        
      } else if (data.status === 'ZERO_RESULTS') {
        // Handle no results gracefully
        setLocationDetails({
          plusCode: '',
          estate: 'Selected Area',
          route: '',
          locality: 'Area',
          city: 'Nairobi',
          country: 'Kenya'
        });
        setAddress('Selected location');
        
      } else {
        throw new Error(data.error_message || `Geocoding failed: ${data.status}`);
      }
      
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.log('[LocationPicker] Geocoding request aborted');
        return; // Silently handle aborted requests
      }
      
      console.warn('[LocationPicker] Geocoding failed:', err.message);
      
      // Provide fallback data instead of showing error
      setLocationDetails({
        plusCode: '',
        estate: 'Selected Area',
        route: '',
        locality: 'Area',
        city: 'Nairobi',
        country: 'Kenya'
      });
      setAddress('Selected location');
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Get user's current location with better error handling
  const getUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to use this feature.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000
      });

      const { latitude, longitude } = location.coords;
      
      // Flag that we're programmatically moving the map
      isUserInteractionRef.current = false;
      isAnimatingRef.current = true;
      setIsMovingToLocation(true);

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      };

      lastRegionRef.current = newRegion;
      setCurrentCoords({ latitude, longitude });
      
      // UPDATE region state to force map movement to user location
      setRegion(newRegion);
      
      // GUARANTEED map movement to user location
      console.log('[LocationPicker] Moving map to user location:', newRegion);
      
      // Ensure map movement with multiple approaches
      if (mapRef.current) {
        // Method 1: Direct animation
        mapRef.current.animateToRegion(newRegion, 1000);
        
        // Method 2: Fallback - force region update after delay
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 600);
          }
        }, 100);
      }
      
      // Get address for current location
      await reverseGeocode({ latitude, longitude });
      
      // Re-enable user interaction after animation completes
      setTimeout(() => {
        isUserInteractionRef.current = true;
        isAnimatingRef.current = false;
        console.log('[LocationPicker] User location complete, interaction re-enabled');
      }, 1200);
      
      // Reset moving state after animation
      setTimeout(() => {
        setIsMovingToLocation(false);
      }, 1300);

    } catch (error) {
      console.error('[LocationPicker] Get user location error:', error);
      Alert.alert(
        'Location Error',
        'Could not get your current location. Please select manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [reverseGeocode]);

  // Handle map region changes with debouncing
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    // ONLY process if this is a genuine user interaction
    if (!isUserInteractionRef.current || isAnimatingRef.current) {
      return;
    }

    // Ignore invalid regions
    if (!newRegion || 
        typeof newRegion.latitude !== 'number' || 
        typeof newRegion.longitude !== 'number') {
      return;
    }

    // Check for meaningful movement to prevent tiny drifts
    if (lastRegionRef.current) {
      const latDiff = Math.abs(newRegion.latitude - lastRegionRef.current.latitude);
      const lngDiff = Math.abs(newRegion.longitude - lastRegionRef.current.longitude);
      
      // Only process significant movements (not map drift)
      if (latDiff < 0.0005 && lngDiff < 0.0005) {
        return;
      }
    }

    lastRegionRef.current = newRegion;
    
    // Update coordinates for geocoding and pin position
    setCurrentCoords({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude
    });
    
    // DON'T update region state during user dragging to prevent conflicts
    // Region state is only updated during programmatic searches
    
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce geocoding to avoid excessive API calls
    debounceRef.current = setTimeout(() => {
      reverseGeocode({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude
      });
    }, 500);
  }, [reverseGeocode]);

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback((data: any, details: any) => {
    try {
      // Extra validation to prevent crashes from malformed place details
      if (!details || 
          typeof details !== 'object' || 
          !details.geometry || 
          typeof details.geometry !== 'object' ||
          !details.geometry.location ||
          typeof details.geometry.location !== 'object') {
        console.warn('[LocationPicker] Invalid place details received:', details);
        Alert.alert('Invalid Location', 'This location data is not valid. Please try another place.');
        return;
      }

      const { lat, lng } = details.geometry.location;
      
      if (typeof lat !== 'number' || 
          typeof lng !== 'number' || 
          isNaN(lat) || 
          isNaN(lng) ||
          Math.abs(lat) > 90 ||
          Math.abs(lng) > 180) {
        console.warn('[LocationPicker] Invalid coordinates from place details:', { lat, lng });
        Alert.alert('Invalid Coordinates', 'This location has invalid coordinates. Please try another place.');
        return;
      }

      // Disable user interaction during programmatic changes
      isUserInteractionRef.current = false;
      isAnimatingRef.current = true;
      setIsMovingToLocation(true);

      // Use viewport if available for better zoom level, otherwise use geometry bounds
      let latitudeDelta = 0.008;
      let longitudeDelta = 0.008;
      
      if (details.geometry.viewport) {
        const { northeast, southwest } = details.geometry.viewport;
        latitudeDelta = Math.abs(northeast.lat - southwest.lat) * 1.5;
        longitudeDelta = Math.abs(northeast.lng - southwest.lng) * 1.5;
        
        // Ensure reasonable zoom limits for better visibility
        latitudeDelta = Math.max(0.003, Math.min(latitudeDelta, 0.02));
        longitudeDelta = Math.max(0.003, Math.min(longitudeDelta, 0.02));
      }

      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta,
        longitudeDelta
      };

      lastRegionRef.current = newRegion;
      setCurrentCoords({ latitude: lat, longitude: lng });
      
      // UPDATE region state to force map movement when searching
      setRegion(newRegion);
      
      // Store additional place details for better context
      if (details.formatted_address) {
        setAddress(details.formatted_address);
      }
      
      if (details.address_components) {
        setLocationDetails({
          placeId: details.place_id || '',
          formattedAddress: details.formatted_address || '',
          addressComponents: details.address_components,
          types: details.types || [],
          name: details.name || data.description || '',
          vicinity: details.vicinity || ''
        });
      }
      
      // GUARANTEED map movement - Force map to move to searched location
      console.log('[LocationPicker] Moving map to searched location:', newRegion);
      
      // Try multiple approaches to ensure map moves
      if (mapRef.current) {
        // Method 1: Direct animation
        mapRef.current.animateToRegion(newRegion, 1200);
        
        // Method 2: Fallback - force region update after delay
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 800);
          }
        }, 100);
      }
      
      // Clear search input for better UX
      if (placesRef.current) {
        setTimeout(() => {
          placesRef.current?.blur();
        }, 100);
      }
      
      // Re-enable user interaction after animation
      setTimeout(() => {
        isUserInteractionRef.current = true;
        isAnimatingRef.current = false;
        console.log('[LocationPicker] Search complete, interaction re-enabled');
      }, 1400);
      
      // Reset moving state after animation
      setTimeout(() => {
        setIsMovingToLocation(false);
      }, 1500);
      
      // Clear the search input
      placesRef.current?.setAddressText?.('');
      
      // Dismiss keyboard
      Keyboard.dismiss();

      // Re-enable user interaction
      setTimeout(() => {
        isUserInteractionRef.current = true;
        isAnimatingRef.current = false;
      }, 1200);

    } catch (err) {
      console.error('[LocationPicker] Place selection error:', err);
      Alert.alert('Error', 'Failed to select this location. Please try again.');
    }
  }, [reverseGeocode]);

  // Handle manual search fallback
  const handleManualSearch = useCallback(async (searchText: string) => {
    if (!searchText.trim()) return;

    try {
      setIsGeocoding(true);
      
      // Enhanced search with bias towards Kenya estates and better parameters
      const params = new URLSearchParams({
        address: searchText.trim(),
        key: GOOGLE_API_KEY,
        components: 'country:KE',
        region: 'ke',
        language: 'en',
        bounds: '-4.6796,33.9098|-1.6879,41.8991' // Kenya bounds for better results
      });
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params}`
      );
      
      const data = await response.json();
      
      // Defensive checks for manual search response
      if (!data || 
          typeof data !== 'object' ||
          !Array.isArray(data.results) ||
          data.results.length === 0) {
        Alert.alert(
          'Location Not Found', 
          `Could not find "${searchText}". Try:\n• Full address (e.g., "Westlands, Nairobi")\n• Building name\n• Area or estate name\n• Street name`,
          [{ text: 'Try Again', style: 'default' }]
        );
        return;
      }
      
      const firstResult = data.results[0];
      if (!firstResult || 
          !firstResult.geometry || 
          !firstResult.geometry.location) {
        Alert.alert('Invalid Result', 'The search result does not contain valid location data.');
        return;
      }
      
      const location = firstResult.geometry.location;
      
      if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
        isUserInteractionRef.current = false;
        isAnimatingRef.current = true;
        setIsMovingToLocation(true);
        
        // Use bounds if available for better zoom
        let latitudeDelta = 0.008;
        let longitudeDelta = 0.008;
        
        if (firstResult.geometry.bounds) {
          const { northeast, southwest } = firstResult.geometry.bounds;
          latitudeDelta = Math.abs(northeast.lat - southwest.lat) * 1.5;
          longitudeDelta = Math.abs(northeast.lng - southwest.lng) * 1.5;
          
          // Keep reasonable zoom limits for better visibility
          latitudeDelta = Math.max(0.003, Math.min(latitudeDelta, 0.02));
          longitudeDelta = Math.max(0.003, Math.min(longitudeDelta, 0.02));
        }
        
        const newRegion = {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta,
          longitudeDelta
        };
        
        lastRegionRef.current = newRegion;
        setCurrentCoords({ latitude: location.lat, longitude: location.lng });
        
        // UPDATE region state to force map movement when searching
        setRegion(newRegion);
        
        // Set the address from search result
        if (firstResult.formatted_address) {
          setAddress(firstResult.formatted_address);
        }
        
        // GUARANTEED map movement - Force map to move to searched location
        console.log('[LocationPicker] Moving map to manual search result:', newRegion);
        
        // Ensure map movement with multiple approaches
        if (mapRef.current) {
          // Method 1: Direct animation
          mapRef.current.animateToRegion(newRegion, 1200);
          
          // Method 2: Fallback - force region update after delay
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.animateToRegion(newRegion, 800);
            }
          }, 100);
        }
        
        // Re-enable interaction after animation
        setTimeout(() => {
          isUserInteractionRef.current = true;
          isAnimatingRef.current = false;
          console.log('[LocationPicker] Manual search complete, interaction re-enabled');
        }, 1400);
        
        // Reset moving state after animation
        setTimeout(() => {
          setIsMovingToLocation(false);
        }, 1500);
        
        setTimeout(() => {
          isUserInteractionRef.current = true;
          isAnimatingRef.current = false;
        }, 1200);
      } else {
        Alert.alert('Not Found', 'Could not find that location. Please try a different search term.');
      }
    } catch (err) {
      console.error('[LocationPicker] Manual search error:', err);
      Alert.alert('Search Error', 'Failed to search for that location. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  }, [reverseGeocode]);

  // Handle confirm with validation
  const handleConfirm = useCallback(() => {
    const coords = {
      latitude: currentCoords.latitude,
      longitude: currentCoords.longitude
    };

    if (!coords.latitude || !coords.longitude) {
      Alert.alert('Invalid Location', 'Please select a valid location before confirming.');
      return;
    }

    onConfirm({
      coords,
      address: address || 'Selected Location',
      details: locationDetails
    });
  }, [currentCoords, address, locationDetails, onConfirm]);

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      console.log('[LocationPicker] Initializing component...');
      
      if (initialCoords) {
        console.log('[LocationPicker] Using initial coords:', initialCoords);
        reverseGeocode(initialCoords);
        setIsLoading(false);
      } else {
        console.log('[LocationPicker] Getting user location...');
        // Set fallback immediately to prevent stuck state
        setCurrentCoords({
          latitude: DEFAULT_REGION.latitude,
          longitude: DEFAULT_REGION.longitude
        });
        setRegion(DEFAULT_REGION);
        setAddress('Nairobi, Kenya');
        setLocationDetails({
          estate: '',
          route: '',
          locality: 'Nairobi CBD',
          city: 'Nairobi',
          country: 'Kenya'
        });
        
        // Try to get user location in background
        try {
          await getUserLocation();
        } catch (error) {
          console.warn('[LocationPicker] Failed to get user location, using fallback');
          setIsLoading(false);
        }
      }
    };

    // Add a safety timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('[LocationPicker] Loading timeout reached, forcing ready state');
      setIsLoading(false);
      setIsGeocoding(false);
    }, 5000); // Reduced to 5 seconds

    initializeComponent();

    // Cleanup on unmount
    return () => {
      clearTimeout(loadingTimeout);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (geocodeAbortRef.current) {
        geocodeAbortRef.current.abort();
      }
    };
  }, [initialCoords, getUserLocation, reverseGeocode]);

  const isApiKeyValid = GOOGLE_API_KEY && GOOGLE_API_KEY !== 'REPLACE_WITH_ENV_GOOGLE_KEY';
  const showLoading = isLoading || isGeocoding;

  // Add some debug logging
  console.log('[LocationPicker] Render state:', { 
    isLoading, 
    isGeocoding, 
    showLoading, 
    region, 
    currentCoords,
    address 
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Instruction Banner */}
      <View style={styles.instructionBanner}>
        <Text style={styles.instructionText}>
          Drag pin to a blue estate marker and select it.
        </Text>
      </View>

      {/* Clean Search Bar - Based on provided UI */}
      <View style={styles.searchBarContainer}>
        {isApiKeyValid ? (
          <GooglePlacesAutocomplete
            ref={placesRef}
            placeholder="Search..."
            fetchDetails
            enablePoweredByContainer={false}
            predefinedPlaces={[]}
            textInputProps={{
              autoCorrect: false,
              autoCapitalize: 'words',
              returnKeyType: 'search',
              clearButtonMode: 'while-editing',
              autoFocus: false,
              placeholderTextColor: '#999'
            }}
            onPress={handlePlaceSelect}
            onFail={(error) => console.warn('[LocationPicker] Places API error:', error)}
            onNotFound={() => console.warn('[LocationPicker] Places not found')}
            query={{
              key: GOOGLE_API_KEY,
              language: 'en',
              components: 'country:ke',
              types: 'establishment|geocode|premise|subpremise|street_address|route|neighborhood|sublocality|sublocality_level_1',
              radius: 50000,
              strictbounds: false
            }}
            styles={{
              container: styles.cleanSearchContainer,
              textInputContainer: styles.cleanSearchInputContainer,
              textInput: styles.cleanSearchInput,
              listView: styles.cleanSearchResultsList,
              row: styles.cleanSearchResultRow,
              description: styles.cleanSearchResultText,
              separator: styles.cleanSearchResultSeparator,
              poweredContainer: { display: 'none' },
              powered: { display: 'none' }
            }}
            debounce={300}
            minLength={2}
            nearbyPlacesAPI="GooglePlacesSearch"
            currentLocation={true}
            currentLocationLabel="📍 Use current location"
            filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
            GooglePlacesSearchQuery={{
              rankby: 'distance'
            }}
            GoogleReverseGeocodingQuery={{
              region: 'ke'
            }}
            renderRightButton={() => (
              <View style={styles.cleanSearchIconContainer}>
                <Ionicons name="search" size={20} color="#666" />
              </View>
            )}
          />
        ) : (
          <View style={styles.cleanFallbackSearchContainer}>
            <TextInput
              style={styles.cleanFallbackSearchInput}
              placeholder="Search..."
              placeholderTextColor="#999"
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="words"
              clearButtonMode="while-editing"
              onSubmitEditing={(e) => handleManualSearch(e.nativeEvent.text)}
            />
            <View style={styles.cleanSearchIconContainer}>
              <Ionicons name="search" size={20} color="#666" />
            </View>
          </View>
        )}
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {showLoading && (
          <View style={styles.mapLoadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.mapLoadingText}>Loading map...</Text>
          </View>
        )}
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChangeComplete}
          onMapReady={() => {
            console.log('[LocationPicker] Map is ready');
            setIsLoading(false);
          }}
          onMapLoaded={() => {
            console.log('[LocationPicker] Map loaded successfully');
          }}
          onTouchStart={() => {
            // Only enable user interaction on actual touch, not programmatic changes
            if (!isAnimatingRef.current) {
              isUserInteractionRef.current = true;
            }
          }}
          onTouchEnd={() => {
            // Ensure we're in user interaction mode after touch ends
            if (!isAnimatingRef.current) {
              isUserInteractionRef.current = true;
            }
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          loadingEnabled={true}
          moveOnMarkerPress={false}
        />
        {/* Location indicator removed as requested */}

        {/* Center Pin - Fixed position, doesn't move with map */}
        <View style={styles.centerPin} pointerEvents="none">
          <View style={styles.pinContainer}>
            <View style={styles.pinDot} />
            <View style={styles.pinStem} />
          </View>
        </View>

        {/* My Location Button */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={getUserLocation}
          disabled={isLoading}
        >
          <Ionicons name="locate" size={24} color="#007AFF" />
        </TouchableOpacity>

        {/* Center Map Button */}
        <TouchableOpacity
          style={styles.centerMapButton}
          onPress={() => {
            if (mapRef.current && region) {
              isUserInteractionRef.current = false;
              isAnimatingRef.current = true;
              
              mapRef.current.animateToRegion(region, 1000);
              
              setTimeout(() => {
                isUserInteractionRef.current = true;
                isAnimatingRef.current = false;
              }, 1200);
            }
          }}
        >
          <Ionicons name="map" size={20} color="white" />
          <Text style={styles.centerMapText}>Center Map</Text>
        </TouchableOpacity>
      </View>

      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
        <Ionicons name="close" size={24} color="#333" />
      </TouchableOpacity>

      {/* Address Display */}
      <View style={styles.addressContainer}>
        {/* Handle bar */}
        <View style={styles.handleBar} />
        
        <View style={styles.addressHeader}>
          <Text style={styles.selectedLocationTitle}>Selected Location</Text>
          {address && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Text style={styles.editButtonText}>
                {showDetails ? 'Hide' : 'Edit'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {showLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>
              {isLoading ? 'Getting your location...' : 'Loading address...'}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={16} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Main Address */}
            <View style={styles.mainAddressContainer}>
              {locationDetails.estate && (
                <View style={styles.estateTag}>
                  <Text style={styles.estateTagText}>{locationDetails.estate}</Text>
                </View>
              )}
              <Text style={styles.mainAddressText} numberOfLines={2}>
                {address || 'Move the map to select a location'}
              </Text>
            </View>

            {/* Plus Code */}
            {locationDetails.plusCode && (
              <Text style={styles.plusCodeText}>
                Plus Code: {locationDetails.plusCode}
              </Text>
            )}

            {/* Expandable Details */}
            {showDetails && address && (
              <View style={styles.detailsContainer}>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>BUILDING</Text>
                    <Text style={styles.detailValue}>
                      {locationDetails.building || 'Not found'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>ESTATE</Text>
                    <Text style={styles.detailValue}>
                      {locationDetails.estate || 'Not found'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>ROAD</Text>
                    <Text style={styles.detailValue}>
                      {locationDetails.route || 'Not found'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>AREA</Text>
                    <Text style={styles.detailValue}>
                      {locationDetails.locality || locationDetails.city || 'Not found'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>COUNTY</Text>
                    <Text style={styles.detailValue}>
                      {locationDetails.city || 'Nairobi County'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>FULL ADDRESS</Text>
                    <Text style={styles.detailValue}>
                      {address || 'Not available'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* Confirm Button */}
      <View style={styles.confirmContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.confirmButton, (!address || showLoading) && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!address || showLoading}
        >
          <Text style={styles.confirmButtonText}>
            Use this point
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create<{
  container: ViewStyle;
  instructionBanner: ViewStyle;
  instructionText: TextStyle;
  searchBarContainer: ViewStyle;
  cleanSearchContainer: ViewStyle;
  cleanSearchInputContainer: ViewStyle;
  cleanSearchInput: TextStyle;
  cleanSearchIconContainer: ViewStyle;
  cleanSearchResultsList: ViewStyle;
  cleanSearchResultRow: ViewStyle;
  cleanSearchResultText: TextStyle;
  cleanSearchResultSeparator: ViewStyle;
  cleanFallbackSearchContainer: ViewStyle;
  cleanFallbackSearchInput: TextStyle;
  movingIndicator: ViewStyle;
  movingText: TextStyle;
  mapContainer: ViewStyle;
  map: ViewStyle;
  mapLoadingOverlay: ViewStyle;
  mapLoadingText: TextStyle;
  centerPin: ViewStyle;
  pinContainer: ViewStyle;
  pinDot: ViewStyle;
  pinStem: ViewStyle;
  closeButton: ViewStyle;
  myLocationButton: ViewStyle;
  centerMapButton: ViewStyle;
  centerMapText: TextStyle;
  addressContainer: ViewStyle;
  handleBar: ViewStyle;
  addressHeader: ViewStyle;
  selectedLocationTitle: TextStyle;
  editButton: ViewStyle;
  editButtonText: TextStyle;
  mainAddressContainer: ViewStyle;
  estateTag: ViewStyle;
  estateTagText: TextStyle;
  mainAddressText: TextStyle;
  plusCodeText: TextStyle;
  detailsContainer: ViewStyle;
  detailsGrid: ViewStyle;
  detailCard: ViewStyle;
  detailLabel: TextStyle;
  detailValue: TextStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  confirmContainer: ViewStyle;
  cancelButton: ViewStyle;
  cancelButtonText: TextStyle;
  confirmButton: ViewStyle;
  confirmButtonDisabled: ViewStyle;
  confirmButtonText: TextStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },

  // Instruction Banner
  instructionBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    zIndex: 999,
    alignItems: 'center'
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  },

  // Search Styles - Clean Implementation
  searchBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 60,
    left: 20,
    right: 20,
    zIndex: 1000
  },
  cleanSearchContainer: {
    flex: 1
  },
  cleanSearchInputContainer: {
    backgroundColor: 'white',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingRight: 50,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cleanSearchInput: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
    height: 46,
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0
  },
  cleanSearchIconContainer: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cleanSearchResultsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4
  },
  cleanSearchResultRow: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  cleanSearchResultText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '400',
    lineHeight: 20,
    flex: 1
  },
  cleanSearchResultSeparator: {
    backgroundColor: '#f0f0f0',
    height: 1,
    marginLeft: 16
  },
  cleanFallbackSearchContainer: {
    backgroundColor: 'white',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingRight: 50,
    height: 50,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cleanFallbackSearchInput: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
    height: 46,
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0
  },

  // Moving indicator styles
  movingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000
  },
  movingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500'
  },

  // Map Styles
  mapContainer: {
    flex: 1
  },
  map: {
    width: screen.width,
    height: screen.height
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  mapLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500'
  },

  // Pin Styles - Fixed position in screen center
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -32 }],
    zIndex: 10
  },
  pinContainer: {
    alignItems: 'center'
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  pinStem: {
    width: 2,
    height: 16,
    backgroundColor: '#FF3B30',
    marginTop: -1
  },

  // Button Styles
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 60,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1001
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 240,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  centerMapButton: {
    position: 'absolute',
    bottom: 180,
    left: '50%',
    marginLeft: -60,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  centerMapText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8
  },

  // Address Display Styles
  addressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: '60%'
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  selectedLocationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000'
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  editButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  mainAddressContainer: {
    marginBottom: 8
  },
  estateTag: {
    backgroundColor: '#00C851',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8
  },
  estateTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  mainAddressText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    lineHeight: 22
  },
  plusCodeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  detailCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666'
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF3B30',
    flex: 1
  },

  // Confirm Button Styles
  confirmContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    flexDirection: 'row',
    gap: 12
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#00C851',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc'
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

// Helper function to determine if a name is likely to be an estate (intermediate validation)
const isLikelyEstate = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  
  const lowerName = name.toLowerCase().trim();
  
  // If it's too short, it's probably not an estate name
  if (lowerName.length < 5) return false;
  
  // Common words that suggest estate-like properties
  const estateIndicators = [
    'estate', 'gardens', 'heights', 'ridge', 'view', 'park',
    'court', 'place', 'residence', 'villa', 'manor', 'close',
    'phase', 'block', 'section', 'scheme', 'apartments',
    'flats', 'towers', 'square', 'plaza', 'center', 'centre',
    // Additional terms that might indicate an estate in Kenya
    'green', 'valley', 'hill', 'hills', 'springs', 'plains', 
    'homes', 'city', 'town', 'village', 'quarters', 'complex'
  ];
  
  // If it contains any estate indicator, it's more likely to be an estate
  if (estateIndicators.some(indicator => lowerName.includes(indicator))) {
    return true;
  }
  
  // Common patterns for estates in Kenya
  const estatePatterns = [
    /^[a-z\s]+ area$/i,            // "Something Area"
    /^[a-z\s]+ zone$/i,            // "Something Zone"
    /^[a-z\s]+ (east|west|north|south)$/i, // "Something East/West/North/South"
    /^(east|west|north|south) [a-z\s]+$/i, // "East/West/North/South Something"
    /^[a-z\s]+ \d+$/i,             // "Something 1/2/3"
    /^[a-z\s]+ [a-z]$/i,           // "Something A/B/C"
  ];
  
  if (estatePatterns.some(pattern => pattern.test(lowerName))) {
    return true;
  }
  
  // Known estate areas in Kenya - a more extensive list
  const likelyEstateNames = [
    'munyaka', 'kahawa', 'kasarani', 'githurai', 'zimmerman', 'thome',
    'roysambu', 'clay city', 'pipeline', 'fedha', 'umoja', 'embakasi',
    'donholm', 'buruburu', 'eastleigh', 'parklands', 'westlands',
    'kilimani', 'lavington', 'kileleshwa', 'karen', 'langata',
    'runda', 'muthaiga', 'gigiri', 'spring valley', 'riverside',
    'hurlingham', 'milimani', 'ngong', 'ongata rongai',
    'south b', 'south c', 'madaraka', 'nairobi west', 'nyayo', 'tassia',
    'kitengela', 'syokimau', 'athi river', 'mlolongo', 'utawala'
  ];
  
  if (likelyEstateNames.some(estate => lowerName.includes(estate))) {
    return true;
  }
  
  // If it has at least 2 words and first word is capitalized, might be a proper name
  const words = name.trim().split(/\s+/);
  if (words.length >= 2 && 
      words[0].length > 1 && 
      words[0][0] === words[0][0].toUpperCase()) {
    return true;
  }
  
  return false;
};

export default EnhancedLocationPicker;


import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  TextInput,
  StatusBar,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/Colors';

// Make sure to use the correct environment variable
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_MAPS_API_KEY || 'REPLACE_WITH_ENV_GOOGLE_KEY';

// Debug logging for API key
console.log('Google API Key loaded:', GOOGLE_API_KEY ? 'Yes' : 'No');
console.log('API Key starts with:', GOOGLE_API_KEY ? GOOGLE_API_KEY.substring(0, 10) + '...' : 'Not found');

const screen = Dimensions.get('window');

interface AddressComponents {
  building?: string;
  estate?: string;
  road?: string;
  area?: string;
  county?: string;
  fullAddress?: string;
  placeType?: 'house' | 'apartment' | 'office' | 'other';
  buildingName?: string;
  floorNumber?: string;
  doorNumber?: string;
  additionalInfo?: string;
  label?: 'home' | 'work' | 'other';
}

interface LocationPickerProps {
  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
    address: AddressComponents;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  theme?: 'light' | 'dark';
  onClose?: () => void;
}

export default function ModernLocationPicker({ 
  onLocationSelect, 
  initialLocation, 
  theme = 'light',
  onClose
}: LocationPickerProps) {
  // State variables
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<AddressComponents | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showPlaceTypeSelector, setShowPlaceTypeSelector] = useState(false);
  const [showAddressDetails, setShowAddressDetails] = useState(false);
  const [selectedPlaceType, setSelectedPlaceType] = useState<'house' | 'apartment' | 'office' | 'other' | null>(null);
  const [buildingName, setBuildingName] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [doorNumber, setDoorNumber] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<'home' | 'work' | 'other' | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs
  const mapRef = useRef(null);
  
  // Theme and colors
  const colorScheme = theme === 'dark' ? Colors.dark : Colors.light;
  const PRIMARY_COLOR = colorScheme.primary;
  const SECONDARY_COLOR = colorScheme.secondary;
  const TEXT_COLOR = colorScheme.text;
  const BACKGROUND_COLOR = colorScheme.background;
  const SURFACE_COLOR = colorScheme.surface;

  // Get initial user location
  useEffect(() => {
    (async () => {
      // Test Google API key
      const testApiKey = async () => {
        try {
          const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Nairobi,Kenya&key=${GOOGLE_API_KEY}`;
          const response = await fetch(testUrl);
          const data = await response.json();
          console.log('API Key test result:', data.status);
          if (data.status !== 'OK') {
            console.error('Google API Key issue:', data.status, data.error_message);
          }
        } catch (error) {
          console.error('API Key test failed:', error);
        }
      };
      
      // Test the API key first
      testApiKey();
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied');
        // Set default to Nairobi if permission denied
        const defaultRegion = {
          latitude: -1.286389,
          longitude: 36.817223,
          latitudeDelta: 0.0075,
          longitudeDelta: 0.0075,
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
          latitudeDelta: 0.0075,
          longitudeDelta: 0.0075,
        };
        setRegion(newRegion);
        fetchAddressFromCoords(latitude, longitude);
      } catch (error) {
        console.warn('Failed to get current location:', error);
        // Fallback to default location
        const defaultRegion = {
          latitude: -1.286389,
          longitude: 36.817223,
          latitudeDelta: 0.0075,
          longitudeDelta: 0.0075,
        };
        setRegion(defaultRegion);
        fetchAddressFromCoords(defaultRegion.latitude, defaultRegion.longitude);
      }
      setLoading(false);
    })();
  }, []);



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

  // Reverse Geocode to get address details
  const fetchAddressFromCoords = async (latitude, longitude) => {
    try {
      console.log(`Fetching address for coordinates: ${latitude}, ${longitude}`);
      
      // Enhanced geocoding URL with more specific result types for better building and estate detection
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}&result_type=street_address|establishment|point_of_interest|premise|subpremise|route|sublocality|neighborhood|locality|administrative_area_level_1|administrative_area_level_2|country`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        setAddress(null);
        return;
      }

      // Get all results for comprehensive data extraction
      const allResults = data.results;
      const primaryResult = allResults[0];
      const components = primaryResult.address_components;

      // Helper to find component by type across all results
      const getComponent = (type) => {
        // First try primary result
        let component = components.find((c) => c.types.includes(type))?.long_name;
        
        // If not found, search in other results
        if (!component) {
          for (const result of allResults) {
            component = result.address_components?.find((c) => c.types.includes(type))?.long_name;
            if (component) break;
          }
        }
        
        return component;
      };

      // Building name detection
      const getBuildingName = () => {
        // Check if first result is a specific establishment or POI
        if (primaryResult.types.includes('establishment') || 
            primaryResult.types.includes('point_of_interest')) {
          // First component is typically the name for POIs
          const name = components[0]?.long_name;
          if (name && name.length > 3) return name;
        }
        
        // Check for premise or subpremise components
        const premise = getComponent('premise');
        const subpremise = getComponent('subpremise');
        
        if (premise && premise.length > 3) return premise;
        if (subpremise && subpremise.length > 3) return subpremise;
        
        // Check other results for establishment names
        for (let i = 1; i < Math.min(allResults.length, 3); i++) {
          const result = allResults[i];
          if (result.types.includes('establishment') || 
              result.types.includes('point_of_interest')) {
            const name = result.address_components[0]?.long_name;
            if (name && name.length > 3) return name;
          }
        }
        
        return null;
      };

      // Estate name detection
      const getEstateName = () => {
        const sublocality = getComponent('sublocality');
        const sublocalityL1 = getComponent('sublocality_level_1');
        const sublocalityL2 = getComponent('sublocality_level_2');
        const sublocalityL3 = getComponent('sublocality_level_3');
        const neighborhood = getComponent('neighborhood');
        
        // Check each component against estate indicators
        const checkAgainstEstateIndicators = (component) => {
          if (!component) return null;
          
          // Check if component contains estate indicators
          if (isSpecificEstate(component)) {
            return component;
          }
          
          return null;
        };
        
        // Check known estates
        const checkAgainstKnownEstates = (component) => {
          if (!component) return null;
          
          // Check if component is a known estate name
          const knownEstates = [
            'munyaka', 'kahawa', 'kasarani', 'githurai', 'zimmerman', 'thome',
            'roysambu', 'pipeline', 'fedha', 'umoja', 'embakasi', 'donholm',
            'buruburu', 'eastleigh', 'parklands', 'westlands', 'kilimani',
            'lavington', 'kileleshwa', 'karen', 'langata', 'runda', 'muthaiga'
          ];
          
          // Check for exact matches
          if (knownEstates.includes(component.toLowerCase())) {
            return component;
          }
          
          // Check for partial matches
          for (const estate of knownEstates) {
            if (component.toLowerCase().includes(estate.toLowerCase())) {
              return component;
            }
          }
          
          return component;
        };
        
        // Check each component against known estates
        const checkedSublocality1 = checkAgainstEstateIndicators(sublocalityL1) || 
                                    checkAgainstKnownEstates(sublocalityL1);
        const checkedNeighborhood = checkAgainstEstateIndicators(neighborhood) || 
                                    checkAgainstKnownEstates(neighborhood);
        const checkedSublocality2 = checkAgainstEstateIndicators(sublocalityL2) || 
                                    checkAgainstKnownEstates(sublocalityL2);
        const checkedSublocality = checkAgainstEstateIndicators(sublocality) || 
                                   checkAgainstKnownEstates(sublocality);
        
        // Return the first one found, prioritizing level 1
        return checkedSublocality1 || checkedNeighborhood || 
               checkedSublocality2 || checkedSublocality || sublocalityL3;
      };

      // Area detection
      const getAreaName = () => {
        const locality = getComponent('locality');
        const adminLevel2 = getComponent('administrative_area_level_2');
        const adminLevel3 = getComponent('administrative_area_level_3');
        
        return locality || adminLevel3 || adminLevel2;
      };

      const formatted = {
        building: getBuildingName(),
        estate: getEstateName(),
        road: getComponent('route'),
        area: getAreaName(),
        county: getComponent('administrative_area_level_1'),
        fullAddress: primaryResult.formatted_address,
      };

      setAddress(formatted);
      
      // Don't call the callback immediately - let user confirm first
      // if (onLocationSelect) {
      //   onLocationSelect({
      //     latitude,
      //     longitude,
      //     address: formatted,
      //   });
      // }
    } catch (e) {
      console.warn('Failed to fetch address', e);
      setAddress(null);
    }
  };

  // Handle map region change
  const onRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    fetchAddressFromCoords(newRegion.latitude, newRegion.longitude);
  };

  // Fallback search function using Google Places API directly
  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for:', searchQuery);
      
      // Use Places API autocomplete endpoint
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}&components=country:ke&types=establishment|geocode`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Search API response:', data);
      
      if (data.status === 'OK' && data.predictions && Array.isArray(data.predictions)) {
        setSearchResults(data.predictions);
      } else {
        console.error('Search API error:', data.status, data.error_message);
        setSearchResults([]);
        
        // Show user-friendly error message
        if (data.status === 'REQUEST_DENIED') {
          console.error('API Key issue - check Google Cloud Console');
        } else if (data.status === 'OVER_QUERY_LIMIT') {
          console.error('API quota exceeded');
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle manual search result selection
  const handleManualSearchSelect = async (prediction: any) => {
    console.log('Manual search selection:', prediction);
    
    try {
      // Get place details using place_id
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${GOOGLE_API_KEY}&fields=geometry,formatted_address`;
      
      const response = await fetch(detailsUrl);
      const data = await response.json();
      
      console.log('Place details response:', data);
      
      if (data.status === 'OK' && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        const newRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.0075,
          longitudeDelta: 0.0075,
        };
        
        console.log('Setting region from manual search:', newRegion);
        setRegion(newRegion);
        fetchAddressFromCoords(lat, lng);
        setShowSearch(false);
        setSearchText('');
        setSearchResults([]);
        
        // Animate map to new location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to get place details:', error);
    }
  };

  // Handle search text change
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    searchPlaces(text);
  };

  // Handle place type selection
  const handlePlaceTypeSelection = (type: 'house' | 'apartment' | 'office' | 'other') => {
    console.log('Place type selected:', type);
    setSelectedPlaceType(type);
    setShowPlaceTypeSelector(false);
    setShowAddressDetails(true);
  };

  // Handle back button from address details
  const handleBackToMap = () => {
    setShowAddressDetails(false);
  };

  // Handle save address
  const handleSaveAddress = () => {
    console.log('=== handleSaveAddress called ===');
    console.log('address:', address);
    console.log('floorNumber:', floorNumber);
    console.log('doorNumber:', doorNumber);
    
    if (!address) {
      console.log('No address found, returning early');
      return;
    }
    
    // Validate required fields
    if (!floorNumber.trim()) {
      console.log('Floor number is empty, showing alert');
      alert('Floor number is required');
      return;
    }
    
    if (!doorNumber.trim()) {
      console.log('Door number is empty, showing alert');
      alert('Door number is required');
      return;
    }
    
    const fullAddress: AddressComponents = {
      ...address,
      placeType: selectedPlaceType,
      buildingName: buildingName || address.building,
      floorNumber: floorNumber.trim(),
      doorNumber: doorNumber.trim(),
      additionalInfo: additionalInfo.trim(),
      label: selectedLabel,
    };
    
    console.log('Full address to save:', fullAddress);
    console.log('onLocationSelect exists:', !!onLocationSelect);
    console.log('onClose exists:', !!onClose);
    
    if (onLocationSelect) {
      console.log('Calling onLocationSelect...');
      onLocationSelect({
        latitude: region.latitude,
        longitude: region.longitude,
        address: fullAddress,
      });
    }
    
    // Close the picker or navigate back
    if (onClose) {
      console.log('Calling onClose...');
      onClose();
    }
    
    console.log('=== handleSaveAddress completed ===');
  };

  // Place type selector UI
  const renderPlaceTypeSelector = () => (
    <View style={styles.placeTypeSelectorContainer}>
      {/* Map Background */}
      <View style={styles.mapContainer}>
        {region && (
          <MapView
            style={styles.map}
            initialRegion={region}
            showsUserLocation={true}
            showsMyLocationButton={false}
            scrollEnabled={false}
            zoomEnabled={false}
            provider={PROVIDER_GOOGLE}
            mapType="standard"
          />
        )}
        
        {/* Fixed Center Marker */}
        <View style={styles.markerFixed}>
          <View style={styles.markerPin}>
            <FontAwesome5 name="map-marker-alt" size={32} color="#14b8a6" />
          </View>
        </View>
      </View>

      {/* Header */}
      <View style={styles.placeTypeSelectorHeader}>
        <TouchableOpacity onPress={() => setShowPlaceTypeSelector(false)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Map overlay with question */}
      <View style={styles.mapOverlay}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>What kind of place is this?</Text>
        </View>
        
        <View style={styles.placeTypeGrid}>
          <TouchableOpacity
            style={styles.placeTypeCard}
            onPress={() => handlePlaceTypeSelection('house')}
          >
            <FontAwesome5 name="home" size={24} color="#fff" />
            <Text style={styles.placeTypeCardText}>House</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.placeTypeCard}
            onPress={() => handlePlaceTypeSelection('apartment')}
          >
            <FontAwesome5 name="building" size={24} color="#fff" />
            <Text style={styles.placeTypeCardText}>Apartment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.placeTypeCard}
            onPress={() => handlePlaceTypeSelection('office')}
          >
            <MaterialIcons name="computer" size={24} color="#fff" />
            <Text style={styles.placeTypeCardText}>Office</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.placeTypeCard}
            onPress={() => handlePlaceTypeSelection('other')}
          >
            <MaterialIcons name="more-horiz" size={24} color="#fff" />
            <Text style={styles.placeTypeCardText}>Other</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  
  // Address details UI
  const renderAddressDetails = () => (
    <View style={styles.addressDetailsContainer}>
      {/* Header */}
      <View style={styles.addressDetailsHeader}>
        <TouchableOpacity onPress={handleBackToMap} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.addressDetailsTitle}>Address details</Text>
      </View>
      
      <View style={styles.addressDetailsContent}>
        {/* Main address info */}
        <View style={styles.addressMainInfo}>
          <View style={styles.addressIconContainer}>
            <FontAwesome5 name={
              selectedPlaceType === 'house' ? 'home' :
              selectedPlaceType === 'apartment' ? 'building' :
              selectedPlaceType === 'office' ? 'briefcase' : 'map-marker-alt'
            } size={24} color="#fff" />
          </View>
          <View style={styles.addressTextContainer}>
            <Text style={styles.addressRoad}>{address?.road || 'Road'}</Text>
            <Text style={styles.addressArea}>{address?.area || 'Area'}, {address?.county || 'County'}</Text>
          </View>
        </View>
        
        {/* Form inputs */}
        <View style={styles.formContainer}>
          <TextInput
            style={styles.addressInput}
            placeholder="Building name"
            placeholderTextColor="#666"
            value={buildingName}
            onChangeText={setBuildingName}
          />
          
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.addressInput,
                  !floorNumber.trim() && styles.requiredInput
                ]}
                placeholder="Floor number*"
                placeholderTextColor="#666"
                value={floorNumber}
                onChangeText={setFloorNumber}
              />
              <Text style={styles.requiredText}>Required</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.addressInput,
                  !doorNumber.trim() && styles.requiredInput
                ]}
                placeholder="Door number*"
                placeholderTextColor="#666"
                value={doorNumber}
                onChangeText={setDoorNumber}
              />
              <Text style={styles.requiredText}>Required</Text>
            </View>
          </View>
          
          <TextInput
            style={[styles.addressInput, styles.textArea]}
            placeholder="Additional information"
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
            value={additionalInfo}
            onChangeText={setAdditionalInfo}
          />
        </View>
        
        {/* Add a label section */}
        <View style={styles.labelSection}>
          <Text style={styles.sectionTitle}>Add a label</Text>
          <Text style={styles.sectionSubtitle}>Identify this address more easily next time</Text>
          
          <View style={styles.labelOptions}>
            <TouchableOpacity 
              style={[
                styles.labelOption, 
                selectedLabel === 'home' && styles.selectedLabelOption
              ]}
              onPress={() => setSelectedLabel('home')}
            >
              <Text style={[
                styles.labelText,
                selectedLabel === 'home' && styles.selectedLabelText
              ]}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.labelOption, 
                selectedLabel === 'work' && styles.selectedLabelOption
              ]}
              onPress={() => setSelectedLabel('work')}
            >
              <Text style={[
                styles.labelText,
                selectedLabel === 'work' && styles.selectedLabelText
              ]}>Flat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.labelOption, 
                selectedLabel === 'other' && styles.selectedLabelOption
              ]}
              onPress={() => setSelectedLabel('other')}
            >
              <Text style={[
                styles.labelText,
                selectedLabel === 'other' && styles.selectedLabelText
              ]}>Custom</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Save button */}
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!floorNumber.trim() || !doorNumber.trim()) && styles.saveButtonDisabled
          ]} 
          onPress={handleSaveAddress}
          activeOpacity={0.8}
          disabled={!floorNumber.trim() || !doorNumber.trim()}
        >
          <Text style={[
            styles.saveButtonText,
            (!floorNumber.trim() || !doorNumber.trim()) && styles.saveButtonTextDisabled
          ]}>Save address</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading state
  if (loading || !region) {
    return (
      <View style={[styles.container, {backgroundColor: BACKGROUND_COLOR}]}>
        <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, {color: TEXT_COLOR}]}>Finding your location...</Text>
        </View>
      </View>
    );
  }
  
  // Place type selector
  if (showPlaceTypeSelector) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {renderPlaceTypeSelector()}
      </View>
    );
  }
  
  // Address details form
  if (showAddressDetails) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {renderAddressDetails()}
      </View>
    );
  }

  // Main map view
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={onClose}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
      </View>
      
      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation={true}
          showsMyLocationButton={false}
          followsUserLocation={false}
          provider={PROVIDER_GOOGLE}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={true}
          mapType="standard"
          loadingEnabled={true}
          loadingIndicatorColor={PRIMARY_COLOR}
        />
        
        {/* Fixed Center Marker */}
        <View style={styles.markerFixed}>
          <View style={styles.markerPin}>
            <FontAwesome5 name="map-marker-alt" size={32} color={PRIMARY_COLOR} />
          </View>
          <View style={styles.markerShadow} />
        </View>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        {showSearch ? (
          <View style={styles.activeSearchContainer}>
            <View style={styles.searchBarContainer}>
              {/* Primary search input */}
              <View style={styles.manualSearchContainer}>
                <TextInput
                  style={styles.manualSearchInput}
                  placeholder="Search for a location..."
                  placeholderTextColor="#666"
                  value={searchText}
                  onChangeText={handleSearchTextChange}
                  autoFocus={true}
                />
                {isSearching && (
                  <ActivityIndicator size="small" color="#14b8a6" style={styles.searchLoader} />
                )}
              </View>
              
              {/* Search results */}
              {searchText.length >= 2 && (
                <View style={styles.searchResultsList}>
                  {isSearching ? (
                    <View style={styles.searchResultItem}>
                      <ActivityIndicator size="small" color="#14b8a6" />
                      <Text style={[styles.searchResultTitle, { marginLeft: 10 }]}>Searching...</Text>
                    </View>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((result: any, index: number) => (
                      <TouchableOpacity
                        key={result.place_id || index}
                        style={styles.searchResultItem}
                        onPress={() => handleManualSearchSelect(result)}
                      >
                        <Ionicons name="location-outline" size={20} color="#14b8a6" />
                        <View style={styles.searchResultText}>
                          <Text style={styles.searchResultTitle}>{result.structured_formatting?.main_text || result.description}</Text>
                          <Text style={styles.searchResultSubtitle}>{result.structured_formatting?.secondary_text || ''}</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.searchResultItem}>
                      <Ionicons name="search-outline" size={20} color="#666" />
                      <Text style={[styles.searchResultTitle, { marginLeft: 10, color: '#666' }]}>No places found. Try a different search.</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeSearchButton}
              onPress={() => {
                setShowSearch(false);
                setSearchText('');
                setSearchResults([]);
              }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearch(true)}
            activeOpacity={0.7}
          >
            <View style={styles.searchButtonContent}>
              <Ionicons name="search" size={20} color="#666" />
              <Text style={styles.searchButtonText}>Search for a location...</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Map Tools */}
      <View style={styles.mapTools}>
        <TouchableOpacity 
          style={styles.mapToolButton}
          onPress={() => {
            // Re-center map on current location
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                ...region,
                latitude: region.latitude,
                longitude: region.longitude
              }, 500);
            }
          }}
        >
          <Ionicons name="locate" size={22} color={PRIMARY_COLOR} />
        </TouchableOpacity>
      </View>

      {/* Address Box */}
      {address && (
        <View style={styles.addressBox}>
          {/* Map location info overlay */}
          <View style={styles.mapLocationOverlay}>
            <View style={styles.mapLocationPin}>
              <FontAwesome5 name="map-marker-alt" size={20} color="#14b8a6" />
            </View>
            <View style={styles.mapLocationInfo}>
              <Text style={styles.mapLocationTitle}>{address?.road || 'Malaba Road'}</Text>
              <Text style={styles.mapLocationSubtitle}>We'll deliver here</Text>
            </View>
          </View>
          
          <View style={styles.addressBoxContent}>
            {address?.building && (
              <View style={styles.addressLine}>
                <FontAwesome5 name="building" size={16} color={PRIMARY_COLOR} style={styles.addressLineIcon} />
                <Text style={styles.addressLineText}>{address.building}</Text>
              </View>
            )}
            
            {address?.estate && (
              <View style={styles.addressLine}>
                <MaterialIcons name="location-city" size={16} color={PRIMARY_COLOR} style={styles.addressLineIcon} />
                <Text style={styles.addressLineText}>{address.estate}</Text>
              </View>
            )}
            
            {address?.road && (
              <View style={styles.addressLine}>
                <MaterialIcons name="directions" size={16} color={PRIMARY_COLOR} style={styles.addressLineIcon} />
                <Text style={styles.addressLineText}>{address.road}</Text>
              </View>
            )}
            
            {address?.area && (
              <View style={styles.addressLine}>
                <Ionicons name="location" size={16} color={PRIMARY_COLOR} style={styles.addressLineIcon} />
                <Text style={styles.addressLineText}>{address.area}</Text>
              </View>
            )}
            
            {address?.county && (
              <View style={styles.addressLine}>
                <FontAwesome5 name="map-marked-alt" size={16} color={PRIMARY_COLOR} style={styles.addressLineIcon} />
                <Text style={styles.addressLineText}>{address.county}</Text>
              </View>
            )}
            
            <Text style={styles.fullAddress}>{address?.fullAddress}</Text>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={() => setShowPlaceTypeSelector(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
                style={styles.confirmButtonGradient}
              >
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: screen.width,
    height: screen.height,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 60,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: '#14b8a6',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -40,
    zIndex: 2,
  },
  markerPin: {
    zIndex: 3,
  },
  markerShadow: {
    position: 'absolute',
    bottom: -5,
    left: 15,
    width: 8,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    zIndex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 70,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  activeSearchContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 1001,
  },
  searchBarContainer: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  searchIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  searchButton: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
    overflow: 'hidden',
  },
  searchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  searchButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  closeSearchButton: {
    backgroundColor: '#666',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    ...Shadows.small,
  },
  mapTools: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 200 : 170,
    zIndex: 900,
  },
  mapToolButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    ...Shadows.medium,
  },
  addressBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  mapLocationOverlay: {
    position: 'absolute',
    top: -60,
    left: '50%',
    marginLeft: -75,
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 150,
    zIndex: 1000,
  },
  mapLocationPin: {
    marginRight: 8,
  },
  mapLocationInfo: {
    flex: 1,
  },
  mapLocationTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mapLocationSubtitle: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  addressBoxHeader: {
    padding: 15,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  addressBoxTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addressBoxContent: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 80,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  addressLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressLineIcon: {
    marginRight: 10,
    width: 24,
    textAlign: 'center',
    color: '#14b8a6',
  },
  addressLineText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  fullAddress: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'left',
  },
  confirmButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 20,
  },
  confirmButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeTypeSelectorContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  placeTypeSelectorHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 60,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  mapOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  questionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  questionText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  placeTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  placeTypeCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    minHeight: 100,
  },
  placeTypeCardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  addressDetailsContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  addressDetailsHeader: {
    height: Platform.OS === 'ios' ? 90 : 60,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  addressDetailsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  addressDetailsContent: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  addressMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  addressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#14b8a6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressRoad: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addressArea: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  formContainer: {
    marginBottom: 30,
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 15,
    marginHorizontal: -5,
  },
  addressInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  requiredInput: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  requiredText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  labelSection: {
    marginBottom: 30,
  },
  labelOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectedLabelOption: {
    backgroundColor: '#14b8a6',
    borderColor: '#14b8a6',
  },
  labelText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  selectedLabelText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonTextDisabled: {
    color: '#ccc',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  manualSearchInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  searchLoader: {
    marginRight: 15,
  },
  searchResultsList: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    marginTop: 5,
    maxHeight: 300,
    ...Shadows.medium,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultText: {
    flex: 1,
    marginLeft: 10,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

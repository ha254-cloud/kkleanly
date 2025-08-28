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
  Alert,
  StatusBar,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Colors } from '../constants/Colors';

// Make sure to use the correct environment variable
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_MAPS_API_KEY || 'REPLACE_WITH_ENV_GOOGLE_KEY';seEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const GOOGLE_A        {address?.building && (
          <Text style={styles.line}>🏢 Building: {address.building}</Text>
        )}
        
        {address?.estate && (
          <Text style={styles.line}>🏘️ Estate: {address.estate}</Text>
        )}
        
        {address?.road && (
          <Text style={styles.line}>🛣️ Road: {address.road}</Text>
        )}
        
        {address?.area && (
          <Text style={styles.line}>📍 Area: {address.area}</Text>
        )}
        
        {address?.county && (
          <Text style={styles.line}>🏛️ County: {address.county}</Text>
        )}v.EXPO_PUBLIC_GOOGLE_API_KEY || 'REPLACE_WITH_ENV_GOOGLE_KEY';

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
  label?: 'home' | 'work' | 'custom' | string;
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
}

export default function SimpleLocationPicker({ onLocationSelect, initialLocation, theme = 'light' }: LocationPickerProps) {
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
  const [selectedLabel, setSelectedLabel] = useState<'home' | 'work' | 'custom' | null>(null);
  
  const mapRef = useRef(null);
  const placesRef = useRef(null);
  
  const colorScheme = theme === 'dark' ? Colors.dark : Colors.light;
  const PRIMARY_COLOR = '#14b8a6'; // Kleanly theme color

  // Get initial user location
  useEffect(() => {
    (async () => {
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

  // Check for nearby places to improve building detection
  const getNearbyPlaces = async (latitude, longitude) => {
    try {
      console.log("=== LOOKING FOR NEARBY PLACES ===");
      // This would be a Places API call - simulated for now to avoid extra API costs
      // In a real implementation, you would uncomment this code
      
      /*
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=100&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Sort by distance
        const places = data.results.sort((a, b) => {
          // Calculate rough distance 
          const distA = Math.sqrt(
            Math.pow(a.geometry.location.lat - latitude, 2) + 
            Math.pow(a.geometry.location.lng - longitude, 2)
          );
          const distB = Math.sqrt(
            Math.pow(b.geometry.location.lat - latitude, 2) + 
            Math.pow(b.geometry.location.lng - longitude, 2)
          );
          return distA - distB;
        });
        
        // Return nearest building name
        if (places[0]) {
          console.log("Found nearby place:", places[0].name);
          return places[0].name;
        }
      }
      */
      
      console.log("No nearby places found");
      return null;
    } catch (error) {
      console.error("Error fetching nearby places:", error);
      return null;
    }
  };

  // Reverse Geocode with enhanced parsing and nearby places detection
  const fetchAddressFromCoords = async (latitude, longitude) => {
    try {
      console.log(`Fetching address for coordinates: ${latitude}, ${longitude}`);
      
      // Enhanced geocoding URL with more specific result types for better building and estate detection
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}&result_type=street_address|establishment|point_of_interest|premise|subpremise|route|sublocality|neighborhood|locality|administrative_area_level_1|administrative_area_level_2|country`;
      
      console.log(`Geocoding URL: ${url}`);
      const response = await fetch(url);
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        setAddress(null);
        return;
      }

      console.log("FULL GEOCODE RESULTS >>", JSON.stringify(data.results, null, 2));

      // Get all results for comprehensive data extraction
      const allResults = data.results;
      const primaryResult = allResults[0];
      const components = primaryResult.address_components;

      console.log("PRIMARY RESULT >>", JSON.stringify(primaryResult, null, 2));
      console.log("ADDRESS COMPONENTS >>", JSON.stringify(components, null, 2));

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

      const getBuildingName = () => {
        console.log("=== BUILDING NAME DETECTION ===");
        
        // Method 1: Look for establishment/POI in results
        for (let i = 0; i < allResults.length; i++) {
          const result = allResults[i];
          console.log(`Result ${i} types:`, result.types);
          console.log(`Result ${i} formatted_address:`, result.formatted_address);
          
          // First priority: Check if this is a landmark, establishment, or business
          if (result.types.includes('establishment') || 
              result.types.includes('point_of_interest') ||
              result.types.includes('store') ||
              result.types.includes('shopping_mall') ||
              result.types.includes('restaurant') ||
              result.types.includes('school') ||
              result.types.includes('hospital') ||
              result.types.includes('natural_feature') ||
              result.types.includes('tourist_attraction')) {
            
            // First try to get name from the first component which is usually the name
            let buildingName = '';
            if (result.address_components && result.address_components.length > 0) {
              buildingName = result.address_components[0].long_name;
            }
            
            // If that's empty or just a number, use the first part of formatted address
            if (!buildingName || buildingName.match(/^\d+$/) || buildingName.length < 3) {
              buildingName = result.formatted_address.split(',')[0]?.trim();
            }
            
            console.log(`Potential building from result ${i}:`, buildingName);
            
            // Check if it's not just a street number and is meaningful
            if (buildingName && !buildingName.match(/^\d+\s/) && buildingName.length > 3) {
              console.log("Selected building name:", buildingName);
              return buildingName;
            }
          }
        }
        
        // Method 2: Try premise or subpremise component
        const premise = getComponent('premise');
        const subpremise = getComponent('subpremise');
        
        if (premise) {
          console.log("Building from premise:", premise);
          return premise;
        }
        
        if (subpremise) {
          console.log("Building from subpremise:", subpremise);
          return subpremise;
        }
        
        // Method 3: Check nearby places (would be implemented in a full solution)
        // This would require a Places API call which we're simulating
        // We've added the getNearbyPlaces function to show how this would work
        console.log("No building name found from geocoding. Would check nearby places in full implementation.");
        return null;
      };

      // Enhanced estate name detection with better accuracy
      const getEstateName = () => {
        console.log("=== ESTATE NAME DETECTION ===");
        
        // Known estates in Nairobi - add more as needed
        const knownEstates = [
          'Kilimani', 'Kileleshwa', 'Lavington', 'Runda', 'Karen', 'Westlands', 
          'Parklands', 'Kitisuru', 'Loresho', 'Ridgeways', 'Garden Estate', 
          'Mountain View', 'Spring Valley', 'Nyari', 'Muthaiga', 'Gigiri', 
          'Brookside', 'Thigiri', 'Rosslyn', 'Kitengela', 'South B', 'South C',
          'Langata', 'Buruburu', 'Eastleigh', 'Donholm', 'Komarock', 'Umoja',
          'Pipeline', 'Embakasi', 'Ruaka', 'Rongai', 'Athi River', 'Syokimau',
          'Roysambu', 'Kasarani', 'Zimmerman', 'Kahawa', 'Ruiru', 'Juja',
          'Kikuyu', 'Ngong', 'Upperhill', 'Hurlingam', 'Nairobi West'
        ];
        
        // Try different sublocality levels and neighborhood
        const sublocalityL1 = getComponent('sublocality_level_1');
        const sublocalityL2 = getComponent('sublocality_level_2');
        const sublocalityL3 = getComponent('sublocality_level_3');
        const neighborhood = getComponent('neighborhood');
        const sublocality = getComponent('sublocality');
        
        console.log("sublocality_level_1:", sublocalityL1);
        console.log("sublocality_level_2:", sublocalityL2);
        console.log("sublocality_level_3:", sublocalityL3);
        console.log("neighborhood:", neighborhood);
        console.log("sublocality:", sublocality);
        
        // Check each component against known estates
        const checkAgainstKnownEstates = (component) => {
          if (!component) return null;
          
          // Check if component exactly matches a known estate
          const matchedEstate = knownEstates.find(estate => 
            estate.toLowerCase() === component.toLowerCase()
          );
          
          if (matchedEstate) {
            console.log(`Found exact estate match: ${component} matches ${matchedEstate}`);
            return component;
          }
          
          // Check if component contains a known estate
          for (const estate of knownEstates) {
            if (component.toLowerCase().includes(estate.toLowerCase())) {
              console.log(`Found partial estate match: ${component} contains ${estate}`);
              return estate;
            }
          }
          
          return component;
        };
        
        // Check each component against known estates
        const checkedSublocality1 = checkAgainstKnownEstates(sublocalityL1);
        const checkedSublocality2 = checkAgainstKnownEstates(sublocalityL2);
        const checkedNeighborhood = checkAgainstKnownEstates(neighborhood);
        const checkedSublocality = checkAgainstKnownEstates(sublocality);
        
        // Return the first one found, prioritizing level 1
        const estate = checkedSublocality1 || checkedNeighborhood || checkedSublocality2 || checkedSublocality || sublocalityL3;
        console.log("Selected estate:", estate);
        return estate;
      };

      // Enhanced area detection
      const getAreaName = () => {
        const locality = getComponent('locality');
        const adminLevel2 = getComponent('administrative_area_level_2');
        const adminLevel3 = getComponent('administrative_area_level_3');
        
        console.log("locality:", locality);
        console.log("administrative_area_level_2:", adminLevel2);
        console.log("administrative_area_level_3:", adminLevel3);
        
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

      console.log("=== FINAL FORMATTED ADDRESS ===");
      console.log(JSON.stringify(formatted, null, 2));
      setAddress(formatted);
      
      // Call the callback if provided
      if (onLocationSelect) {
        onLocationSelect({
          latitude,
          longitude,
          address: formatted,
        });
      }
    } catch (e) {
      console.warn('Failed to fetch address', e);
      setAddress(null);
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
    
    // Add a delay before fetching address to prevent too many API calls while dragging
    if (newRegion.latitude && newRegion.longitude) {
      fetchAddressFromCoords(newRegion.latitude, newRegion.longitude);
    }
  };

  if (loading || !region) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Loading your location…</Text>
      </View>
    );
  }

  // Handler for saving the complete address
  const handleSaveAddress = () => {
    if (selectedPlaceType && address) {
      const completeAddress = {
        ...address,
        placeType: selectedPlaceType,
        buildingName: buildingName,
        floorNumber: floorNumber,
        doorNumber: doorNumber,
        additionalInfo: additionalInfo,
        label: selectedLabel || 'custom'
      };
      
      if (onLocationSelect && region) {
        onLocationSelect({
          latitude: region.latitude,
          longitude: region.longitude,
          address: completeAddress
        });
      }
      
      // Reset UI state
      setShowAddressDetails(false);
      setShowPlaceTypeSelector(false);
    } else if (!selectedPlaceType) {
      Alert.alert('Please select a place type');
    }
  };

  // Function to proceed to address details after place type selection
  const handlePlaceTypeSelection = (type: 'house' | 'apartment' | 'office' | 'other') => {
    setSelectedPlaceType(type);
    setShowPlaceTypeSelector(false);
    setShowAddressDetails(true);
  };
  
  // Return to map view from address details
  const handleBackToMap = () => {
    setShowAddressDetails(false);
  };
  
  // UI for place type selection
  const renderPlaceTypeSelector = () => (
    <View style={styles.placeTypeContainer}>
      <View style={styles.placeTypeHeader}>
        <Text style={styles.placeTypeTitle}>What kind of place is this?</Text>
      </View>
      
      <View style={styles.placeTypeOptionsContainer}>
        <TouchableOpacity
          style={styles.placeTypeOption}
          onPress={() => handlePlaceTypeSelection('house')}
        >
          <FontAwesome5 name="home" size={24} color="#fff" style={styles.placeTypeIcon} />
          <Text style={styles.placeTypeText}>House</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.placeTypeOption}
          onPress={() => handlePlaceTypeSelection('apartment')}
        >
          <FontAwesome5 name="building" size={24} color="#fff" style={styles.placeTypeIcon} />
          <Text style={styles.placeTypeText}>Apartment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.placeTypeOption}
          onPress={() => handlePlaceTypeSelection('office')}
        >
          <MaterialIcons name="computer" size={24} color="#fff" style={styles.placeTypeIcon} />
          <Text style={styles.placeTypeText}>Office</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.placeTypeOption}
          onPress={() => handlePlaceTypeSelection('other')}
        >
          <FontAwesome5 name="couch" size={24} color="#fff" style={styles.placeTypeIcon} />
          <Text style={styles.placeTypeText}>Other</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // UI for address details
  const renderAddressDetails = () => (
    <View style={styles.addressDetailsContainer}>
      <View style={styles.addressDetailsHeader}>
        <TouchableOpacity onPress={handleBackToMap} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.addressDetailsTitle}>Address details</Text>
      </View>
      
      <View style={styles.addressDetailsContent}>
        <View style={styles.addressMainInfo}>
          <FontAwesome5 name="building" size={24} color="#666" style={styles.addressIcon} />
          <View style={styles.addressTextContainer}>
            <Text style={styles.addressRoad}>{address?.road || 'Road'}</Text>
            <Text style={styles.addressArea}>{address?.area || 'Area'}, {address?.county || 'County'}</Text>
          </View>
        </View>
        
        <TextInput
          style={styles.addressInput}
          placeholder="Building name"
          value={buildingName}
          onChangeText={setBuildingName}
        />
        
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.addressInput, styles.halfInput]}
            placeholder="Floor number"
            value={floorNumber}
            onChangeText={setFloorNumber}
          />
          <TextInput
            style={[styles.addressInput, styles.halfInput]}
            placeholder="Door number"
            value={doorNumber}
            onChangeText={setDoorNumber}
          />
        </View>
        
        <Text style={styles.requiredText}>Required</Text>
        
        <TextInput
          style={[styles.addressInput, styles.textArea]}
          placeholder="Additional information"
          multiline
          numberOfLines={3}
          value={additionalInfo}
          onChangeText={setAdditionalInfo}
        />
        
        <View style={styles.markEntrance}>
          <Text style={styles.markEntranceTitle}>Mark your entrance</Text>
          <Text style={styles.markEntranceSubtitle}>Help the courier reach you faster</Text>
          
          <View style={styles.entranceMap}>
            {/* Small map with pin */}
            <View style={styles.pinCircle}>
              <FontAwesome5 name="map-marker-alt" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.directionArrows}>
              <Ionicons name="arrow-back" size={24} color="#3498db" />
              <Ionicons name="arrow-forward" size={24} color="#3498db" />
            </View>
          </View>
        </View>
        
        <View style={styles.labelSection}>
          <Text style={styles.labelTitle}>Add a label</Text>
          <Text style={styles.labelSubtitle}>Identify this address more easily next time</Text>
          
          <View style={styles.labelOptions}>
            <TouchableOpacity 
              style={[styles.labelOption, selectedLabel === 'home' && styles.selectedLabelOption]}
              onPress={() => setSelectedLabel('home')}
            >
              <Text style={styles.labelText}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.labelOption, selectedLabel === 'work' && styles.selectedLabelOption]}
              onPress={() => setSelectedLabel('work')}
            >
              <Text style={styles.labelText}>Work</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.labelOption, selectedLabel === 'custom' && styles.selectedLabelOption]}
              onPress={() => setSelectedLabel('custom')}
            >
              <Text style={styles.labelText}>Custom</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
          <Text style={styles.saveButtonText}>Save address</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Main render method
  if (loading || !region) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading your location…</Text>
      </View>
    );
  }
  
  // Place type selector
  if (showPlaceTypeSelector) {
    return renderPlaceTypeSelector();
  }
  
  // Address details form
  if (showAddressDetails) {
    return renderAddressDetails();
  }

  // Main map view
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
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
            onFail={(error) => console.error("GooglePlacesAutocomplete error:", error)}
            minLength={2}
            debounce={300}
            renderLeftButton={() => (
              <View style={styles.searchIconContainer}>
                <Ionicons name="search" size={20} color="#666" />
              </View>
            )}
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
          activeOpacity={0.7}
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
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
      />
      
      {/* Fixed Center Marker */}
      <View style={styles.markerFixed}>
        <Text style={styles.marker}>📍</Text>
      </View>
      
      {/* Edit Button */}
      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => {
          // Re-center map on current coordinates
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              ...region,
              latitude: region.latitude,
              longitude: region.longitude
            }, 500);
          }
        }}
      >
        <Ionicons name="locate" size={22} color="white" />
      </TouchableOpacity>

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
        
        {address?.county && (
          <Text style={styles.line}>�️ {address.county}</Text>
        )}
        
        <Text style={styles.lineSmall}>{address?.fullAddress}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: screen.width,
    height: screen.height,
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
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  searchIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  searchButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  editButton: {
    position: 'absolute',
    bottom: 240,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#14b8a6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 999,
  },
  instructionBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    zIndex: 990,
  },
  instructionText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
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
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#14b8a6',
    color: '#333',
    height: 50,
  },
  listView: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  row: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addressBox: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 18,
    color: '#14b8a6',
    textAlign: 'center',
  },
  line: {
    fontSize: 15,
    marginBottom: 6,
    color: '#333',
  },
  lineSmall: {
    fontSize: 12,
    marginTop: 8,
    color: '#666',
    fontStyle: 'italic',
  },
});

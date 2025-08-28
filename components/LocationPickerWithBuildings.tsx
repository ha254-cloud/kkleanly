import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { 
  MapPin, 
  Building, 
  Navigation, 
  CheckCircle, 
  Search,
  X,
  RotateCcw,
  ArrowLeft
} from 'lucide-react-native';
import GoogleMapComponent from './GoogleMapComponent';
import { LocationCoords, mapsService } from '../services/mapsService';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import * as Location from 'expo-location';

interface NearbyPlace {
  id: string;
  name: string;
  coordinate: LocationCoords;
  address: string;
  type: string;
  distance: number;
}

interface LocationPickerWithBuildingsProps {
  onLocationSelected: (location: LocationCoords, place?: NearbyPlace) => void;
  title?: string;
  onClose?: () => void;
}

const { width, height } = Dimensions.get('window');

export const LocationPickerWithBuildings: React.FC<LocationPickerWithBuildingsProps> = ({
  onLocationSelected,
  title = "Choose delivery location",
  onClose,
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoords | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  // Map interaction states
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [popupLocation, setPopupLocation] = useState<LocationCoords | null>(null);
  const [popupAddress, setPopupAddress] = useState<string>('');
  
  // Search functionality
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Animations
  const slideAnim = useRef(new Animated.Value(height)).current;
  const popupScaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getCurrentLocation();
    
    // Animate slide up
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (showLocationPopup) {
      Animated.spring(popupScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(popupScaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showLocationPopup]);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need location access to help you');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: LocationCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);
      fetchNearbyPlaces(coords);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyPlaces = async (location: LocationCoords) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=800&type=establishment&key=${process.env.EXPO_PUBLIC_GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const places = data.results.slice(0, 20).map((place: any) => ({
          id: place.place_id,
          name: place.name,
          coordinate: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          address: place.vicinity || place.formatted_address || 'Address not available',
          type: place.types[0]?.replace(/_/g, ' ') || 'establishment',
          distance: calculateDistance(location, {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          }),
        }));

        const sortedPlaces = places.sort((a: NearbyPlace, b: NearbyPlace) => a.distance - b.distance);
        setNearbyPlaces(sortedPlaces);
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error);
    }
  };

  const calculateDistance = (coord1: LocationCoords, coord2: LocationCoords): number => {
    const R = 6371e3;
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleMapLocationSelect = async (location: LocationCoords, place?: any) => {
    // Immediately show popup with loading state
    setPopupLocation(location);
    setSelectedLocation(location);
    setSelectedPlace(place || null);
    setPopupAddress('Getting address...');
    setShowLocationPopup(true);
    
    // Get address for the location in background
    try {
      const addressResult = await Location.reverseGeocodeAsync(location);
      if (addressResult[0]) {
        const addr = addressResult[0];
        let fullAddress = '';
        
        // Build a more natural address format
        if (addr.name && addr.name !== addr.street) {
          fullAddress = addr.name;
        } else if (addr.street) {
          fullAddress = addr.street;
        }
        
        if (addr.city && fullAddress) {
          fullAddress += `, ${addr.city}`;
        } else if (addr.city) {
          fullAddress = addr.city;
        }
        
        if (addr.region && fullAddress) {
          fullAddress += `, ${addr.region}`;
        }
        
        setPopupAddress(fullAddress || 'Selected location');
      } else {
        setPopupAddress('Selected location');
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setPopupAddress('Selected location');
    }
  };

  const useSelectedLocation = () => {
    if (selectedLocation) {
      onLocationSelected(selectedLocation, selectedPlace || undefined);
    }
    setShowLocationPopup(false);
  };

  const selectPlace = (place: NearbyPlace) => {
    setSelectedPlace(place);
    setSelectedLocation(place.coordinate);
    onLocationSelected(place.coordinate, place);
  };

  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${process.env.EXPO_PUBLIC_GOOGLE_API_KEY}&location=${currentLocation?.latitude},${currentLocation?.longitude}&radius=50000`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        setSearchResults(data.predictions.slice(0, 8));
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = async (result: any) => {
    try {
      const placeId = result.place_id;
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${process.env.EXPO_PUBLIC_GOOGLE_API_KEY}`;
      
      const response = await fetch(detailsUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.result.geometry) {
        const location = {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
        };
        
        const place = {
          id: placeId,
          name: data.result.name || result.structured_formatting.main_text,
          coordinate: location,
          address: data.result.formatted_address || result.description,
          type: data.result.types?.[0] || 'place',
          distance: 0,
        };
        
        setCurrentLocation(location);
        setSelectedLocation(location);
        setSelectedPlace(place);
        setShowSearch(false);
        setSearchQuery('');
        
        // Update nearby places for new location
        fetchNearbyPlaces(location);
      }
    } catch (error) {
      console.error('Error selecting search result:', error);
    }
  };

  if (loading || !currentLocation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C853" />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Finding your location...
          </Text>
        </View>
      </View>
    );
  }

  const renderPlaceItem = ({ item }: { item: NearbyPlace }) => (
    <TouchableOpacity
      style={[styles.placeItem, { backgroundColor: colors.surface }]}
      onPress={() => selectPlace(item)}
      activeOpacity={0.7}
    >
      <View style={styles.placeIconContainer}>
        <Building size={20} color="#00C853" />
      </View>
      <View style={styles.placeInfo}>
        <Text style={[styles.placeName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.placeAddress, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.address}
        </Text>
        <Text style={[styles.placeDistance, { color: "#00C853" }]}>
          {item.distance < 1000 ? `${Math.round(item.distance)}m` : `${(item.distance/1000).toFixed(1)}km`} away
        </Text>
      </View>
      <CheckCircle size={24} color="#00C853" />
    </TouchableOpacity>
  );

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim
        }
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <TouchableOpacity 
          onPress={() => setShowSearch(true)} 
          style={styles.searchButton}
        >
          <Search size={24} color="#00C853" />
        </TouchableOpacity>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <GoogleMapComponent
          customerLocation={currentLocation}
          selectable={true}
          fullDetail={true}
          preferGoogleProvider={true}
          onLocationSelect={handleMapLocationSelect}
          mapHeight={height * 0.4}
          onMapReady={() => setMapReady(true)}
        />
        
        {/* Enhanced Map Instructions Overlay */}
        {mapReady && !showLocationPopup && (
          <View style={styles.mapInstructions}>
            <Animated.View 
              style={[
                styles.instructionCard, 
                { 
                  backgroundColor: '#1A1A1A',
                  opacity: fadeAnim
                }
              ]}
            >
              <View style={styles.instructionIcon}>
                <Text style={styles.instructionEmoji}>📍</Text>
              </View>
              <Text style={styles.instructionText}>
                Tap anywhere on the map to set delivery location
              </Text>
            </Animated.View>
          </View>
        )}

        {/* Location Popup - Enhanced Glovo Style */}
        {showLocationPopup && popupLocation && (
          <Animated.View 
            style={[
              styles.locationPopup,
              {
                transform: [{ scale: popupScaleAnim }]
              }
            ]}
          >
            {/* Popup Arrow */}
            <View style={styles.popupArrow} />
            
            {/* Main Popup Content */}
            <View style={[styles.popupCard, { backgroundColor: '#1A1A1A' }]}>
              <View style={styles.popupHeader}>
                <View style={styles.popupIconContainer}>
                  <View style={styles.laundryIcon}>
                    <Text style={styles.laundryIconText}>🧺</Text>
                  </View>
                </View>
                <View style={styles.popupTextContainer}>
                  <Text style={styles.popupTitle}>
                    {selectedPlace?.name || popupAddress.split(',')[0] || 'Selected Location'}
                  </Text>
                  <Text style={styles.popupSubtitle}>
                    Delivery location
                  </Text>
                </View>
              </View>
              
              {/* Address Details */}
              <Text style={styles.popupAddress} numberOfLines={2}>
                {popupAddress}
              </Text>
              
              {/* Use Location Button */}
              <TouchableOpacity 
                style={styles.useLocationButton}
                onPress={useSelectedLocation}
                activeOpacity={0.9}
              >
                <Text style={styles.useLocationText}>Use this point</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Nearby Places List */}
      <View style={styles.placesSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Nearby locations
        </Text>
        
        <FlatList
          data={nearbyPlaces}
          renderItem={renderPlaceItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.placesList}
        />
      </View>

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={[styles.searchModal, { backgroundColor: colors.background }]}>
          <View style={[styles.searchHeader, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              onPress={() => setShowSearch(false)}
              style={styles.searchCloseButton}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.searchTitle, { color: colors.text }]}>
              Search for a place
            </Text>
          </View>

          <View style={styles.searchInputContainer}>
            <View style={[styles.searchInputWrapper, { backgroundColor: colors.surface }]}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  searchPlaces(text);
                }}
                placeholder="Search street, city, district..."
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
              {searching && <ActivityIndicator size="small" color="#00C853" />}
            </View>
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.searchResultItem, { backgroundColor: colors.surface }]}
                onPress={() => selectSearchResult(item)}
              >
                <MapPin size={18} color={colors.textSecondary} />
                <View style={styles.searchResultText}>
                  <Text style={[styles.searchResultMain, { color: colors.text }]}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={[styles.searchResultSecondary, { color: colors.textSecondary }]}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.searchResults}
          />
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderBottomWidth: 0,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  mapContainer: {
    position: 'relative',
  },
  mapInstructions: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    marginHorizontal: 4,
  },
  instructionIcon: {
    marginRight: 12,
  },
  instructionEmoji: {
    fontSize: 20,
  },
  instructionText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  locationPopup: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 1000,
    alignItems: 'center',
  },
  popupArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1A1A1A',
    marginBottom: -1,
    zIndex: 1001,
  },
  popupCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    minWidth: width - 40,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  popupIconContainer: {
    marginRight: 16,
  },
  laundryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  laundryIconText: {
    fontSize: 24,
  },
  popupTextContainer: {
    flex: 1,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  popupSubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    fontWeight: '500',
  },
  popupAddress: {
    fontSize: 15,
    color: '#E0E0E0',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '400',
  },
  useLocationButton: {
    backgroundColor: '#00C853',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  useLocationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  placesSection: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  placesList: {
    gap: 12,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  placeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  placeInfo: {
    flex: 1,
    paddingRight: 12,
  },
  placeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  placeAddress: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 19,
    marginBottom: 6,
    fontWeight: '400',
  },
  placeDistance: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00C853',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  // Search Modal Styles
  searchModal: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  searchInputContainer: {
    padding: 20,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultMain: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  searchResultSecondary: {
    fontSize: 14,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocation } from '../hooks/useLocation';
import { useToast } from '../context/ToastContext';
import { useLocationDetails } from '../hooks/useLocationDetails';

const { width } = Dimensions.get('window');

// Custom map style for a modern look
const mapStyle = [
  {
    featureType: 'all',
    stylers: [
      { saturation: -20 }
    ]
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [
      { color: '#f0f0f0' },
      { lightness: 16 }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [
      { visibility: 'on' },
      { color: '#808080' },
      { lightness: 16 }
    ]
  }
];

interface NearbyPlace {
  name: string;
  type: string;
  distance?: string;
}

interface LocationDetails {
  city?: string;
  county?: string;
  country?: string;
  area?: string;
  formatted_address?: string;
  placeName?: string;
  district?: string;
}

interface LocationPickerProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  style?: any;
  editable?: boolean;
  showDetectButton?: boolean;
  showSavedAddresses?: boolean;
  showMap?: boolean;
  savedAddresses?: Array<{ id: string; address: string; label?: string }>;
  onSelectSavedAddress?: (address: string) => void;
  deliveryLat?: number;
  deliveryLng?: number;
}

export function LocationPicker({
  value,
  onChangeText,
  placeholder = 'Enter address',
  label,
  style,
  editable = true,
  showDetectButton = true,
  showSavedAddresses = false,
  showMap = false,
  savedAddresses = [],
  onSelectSavedAddress,
  deliveryLat = -1.2921,
  deliveryLng = 36.8219,
}: LocationPickerProps) {
  const { detectLocation, loading: legacyLoading, error: legacyError, clearError: legacyClearError, currentAddress, currentLocation } = useLocation();
  const { 
    location: detectedLocation, 
    locationDetails, 
    building, 
    address: enhancedAddress, 
    nearbyPlaces: enhancedNearbyPlaces,
    nearbyBuildings,
    nearbyShops,
    nearbyLandmarks,
    nearbyRestaurants,
    nearbyServices,
    nearbyRoads,
    loading: detectionLoading, 
    error: detectionError,
    getCurrentLocationWithDetails,
    clearError: clearDetectionError 
  } = useLocationDetails();
  const { showToast } = useToast();
  
  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [successAnim] = useState(new Animated.Value(0));
  
  const [showMapView, setShowMapView] = useState(showMap);
  const [legacyNearbyPlaces, setLegacyNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [fetchingPlaces, setFetchingPlaces] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  
  // Use enhanced nearby places or fallback to legacy
  const displayNearbyPlaces = enhancedNearbyPlaces.length > 0 ? enhancedNearbyPlaces : legacyNearbyPlaces;
  
  // Use enhanced location detection or fallback to legacy
  const activeLocation = detectedLocation || currentLocation;
  const activeLoading = detectionLoading || legacyLoading || isDetecting;
  const activeError = detectionError || legacyError;
  const mapLat = activeLocation?.latitude || deliveryLat;
  const mapLng = activeLocation?.longitude || deliveryLng;

  // Animate success state
  useEffect(() => {
    if (enhancedAddress || currentAddress) {
      setIsDetecting(false);
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [enhancedAddress, currentAddress]);

  // Animate map view appearance
  useEffect(() => {
    if (showMapView) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(-50);
    }
  }, [showMapView]);

  // Google Maps API key from environment
  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBfex94iisk3wDYRr8GyoIfxRUGzGPUhFc';

  // Use enhanced location detection hook for nearby places when needed
  useEffect(() => {
    if (!enhancedAddress && activeLocation?.latitude && activeLocation?.longitude) {
      // Only use legacy nearby places detection if enhanced detection isn't available
      getNearbyPlacesAndDetails(activeLocation.latitude, activeLocation.longitude);
      setShowMapView(true);
    } else if (enhancedAddress && detectedLocation) {
      // Enhanced detection is available, show map
      setShowMapView(true);
    }
  }, [activeLocation, enhancedAddress, detectedLocation]);

  // Update text input when location is detected
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [legacyLocationDetails, setLegacyLocationDetails] = useState<LocationDetails>({});
  
  // Function to get nearby places and detailed location info (legacy fallback)
  const getNearbyPlacesAndDetails = async (latitude: number, longitude: number) => {
    setLoadingPlaces(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        console.warn('Google API key not found');
        return;
      }

      // Get reverse geocoding details
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      const geocodeData = await geocodeResponse.json();
      
      if (geocodeData.results && geocodeData.results.length > 0) {
        const result = geocodeData.results[0];
        const details: any = {};
        
        result.address_components.forEach((component: any) => {
          if (component.types.includes('locality') || component.types.includes('sublocality')) {
            details.placeName = component.long_name;
          }
          if (component.types.includes('administrative_area_level_2')) {
            details.district = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            details.county = component.long_name;
          }
          if (component.types.includes('country')) {
            details.country = component.long_name;
          }
        });
        
        setLegacyLocationDetails(details);
      }

      // Get nearby places
      const placesResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1000&type=establishment&key=${apiKey}`
      );
      const placesData = await placesResponse.json();
      
      if (placesData.results) {
        const places = placesData.results.slice(0, 5).map((place: any) => ({
          name: place.name,
          type: place.types[0]?.replace(/_/g, ' ') || 'place'
        }));
        setLegacyNearbyPlaces(places);
      }
      
    } catch (error) {
      console.error('Error fetching location details:', error);
    } finally {
      setLoadingPlaces(false);
    }
  };

  // Function to confirm location and add enhanced building information
  const handleConfirmLocation = () => {
    let enhancedLocationText = value;
    
    // Use enhanced address if available
    if (enhancedAddress && building.name) {
      enhancedLocationText = `Building: ${building.name}\n${enhancedAddress}`;
      
      // Add building type if available
      if (building.type) {
        enhancedLocationText += `\nType: ${building.type}`;
      }
      
      // Add coordinates
      if (detectedLocation) {
        enhancedLocationText += `\nGPS: ${detectedLocation.latitude.toFixed(6)}, ${detectedLocation.longitude.toFixed(6)}`;
      }
    } else if (legacyLocationDetails.placeName || displayNearbyPlaces.length > 0) {
      // Fallback to legacy enhancement
      if (legacyLocationDetails.placeName) {
        enhancedLocationText = `${value}\n\nArea: ${legacyLocationDetails.placeName}`;
        if (legacyLocationDetails.district) {
          enhancedLocationText += `, ${legacyLocationDetails.district}`;
        }
        if (legacyLocationDetails.county) {
          enhancedLocationText += `, ${legacyLocationDetails.county}`;
        }
      }
      
      // Add nearby landmarks
      if (displayNearbyPlaces.length > 0) {
        enhancedLocationText += '\n\nNearby Landmarks:';
        displayNearbyPlaces.slice(0, 3).forEach(place => {
          enhancedLocationText += `\n• ${place.name} (${place.category || place.type}) - ${place.distanceText || place.distance}`;
        });
      }
    }
    
    onChangeText(enhancedLocationText);
    setShowMapView(false);
    showToast('Location confirmed with enhanced details!', 'success');
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    clearDetectionError();
    legacyClearError();
    
    // Reset animations
    successAnim.setValue(0);
    scaleAnim.setValue(0.9);
    
    try {
      // Use enhanced location detection first
      await getCurrentLocationWithDetails();
      showToast('Ultra-detailed location detected!', 'success');
    } catch (err) {
      console.error('Enhanced location detection failed, falling back to legacy:', err);
      // Fallback to legacy detection
      try {
        await detectLocation();
        showToast('Location detected successfully!', 'success');
      } catch (legacyErr) {
        console.error('Legacy location detection also failed:', legacyErr);
        setIsDetecting(false);
        showToast('Unable to detect location. Please check permissions.', 'error');
      }
    }
  };

  // Update text input when location is detected
  useEffect(() => {
    if (enhancedAddress && !detectionLoading && !detectionError) {
      // Update with basic location first
      let displayText = enhancedAddress;
      
      // Add GPS coordinates
      if (detectedLocation) {
        displayText += `\nGPS: ${detectedLocation.latitude.toFixed(6)}, ${detectedLocation.longitude.toFixed(6)}`;
      }
      
      onChangeText(displayText);
      showToast('Location detected!', 'success');
      setShowMapView(true);
      
      // Update with additional details when they become available
      if (building.name && building.name !== 'N/A') {
        displayText = `Building: ${building.name}`;
        if (building.category) {
          displayText += ` (${building.category})`;
        }
        displayText += `\n${enhancedAddress}`;
        onChangeText(displayText);
      }
      
      // Only add nearby places if they're available
      const updateWithNearbyPlaces = () => {
        if (nearbyBuildings.length > 0 || nearbyShops.length > 0 || nearbyLandmarks.length > 0) {
          displayText += '\n\nNearby Places:';
          if (nearbyBuildings.length > 0) {
            const nearest = nearbyBuildings[0];
            displayText += `\nBuilding: ${nearest.name} (${nearest.distanceText})`;
          }
          if (nearbyShops.length > 0) {
            const nearest = nearbyShops[0];
            displayText += `\nShop: ${nearest.name} (${nearest.distanceText})`;
          }
          if (nearbyLandmarks.length > 0) {
            const nearest = nearbyLandmarks[0];
            displayText += `\nLandmark: ${nearest.name} (${nearest.distanceText})`;
          }
          onChangeText(displayText);
          showToast('Location details updated!', 'success');
        }
      };
      
      // Add a slight delay to let the first update render
      setTimeout(updateWithNearbyPlaces, 100);
      
    } else if (currentAddress && !legacyLoading && !legacyError) {
      // Fallback to legacy address
      onChangeText(currentAddress);
      showToast('Location detected!', 'success');
      if (showMap && !showMapView) {
        setShowMapView(true);
      }
    }
  }, [enhancedAddress, building, nearbyBuildings, nearbyShops, nearbyLandmarks, detectedLocation, detectionLoading, detectionError, currentAddress, legacyLoading, legacyError, showMap, showMapView]);

  // Also fetch places when map coordinates change
  React.useEffect(() => {
    if (showMapView && mapLat && mapLng) {
      getNearbyPlacesAndDetails(mapLat, mapLng);
    }
  }, [showMapView, mapLat, mapLng]);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <LinearGradient
          colors={['#3b82f6', '#1e40af']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.labelGradient}
        >
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      )}
      
      <View style={styles.inputContainer}>
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          style={styles.inputWrapper}
        >
          <View style={styles.inputContent}>
            <Ionicons 
              name="location-outline" 
              size={22} 
              color="#6b7280" 
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInput, !editable && styles.disabledInput]}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              editable={editable && !activeLoading}
              multiline
              numberOfLines={2}
            />
            
            {showDetectButton && (
              <TouchableOpacity 
                style={[styles.detectButton, activeLoading && styles.detectButtonDisabled]}
                onPress={handleDetectLocation}
                disabled={activeLoading}
              >
                <LinearGradient
                  colors={activeLoading ? ['#9ca3af', '#6b7280'] : ['#3b82f6', '#1d4ed8']}
                  style={styles.detectButtonGradient}
                >
                  {activeLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="navigate" size={14} color="#fff" />
                      <Text style={styles.detectButtonText}>Detect</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Map Toggle Button */}
        {(showMap || showMapView) && (
          <TouchableOpacity 
            style={styles.mapToggleButton}
            onPress={() => setShowMapView(!showMapView)}
          >
            <LinearGradient
              colors={['#eff6ff', '#dbeafe']}
              style={styles.mapToggleGradient}
            >
              <Ionicons name="map" size={16} color="#3b82f6" />
              <Text style={styles.mapToggleText}>
                {showMapView ? 'Hide Map' : 'Show Map'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Enhanced Success Message */}
      {(enhancedAddress || currentAddress) && !activeError && (
        <Animated.View 
          style={[
            styles.successContainer,
            {
              opacity: successAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#dcfce7', '#bbf7d0']}
            style={styles.successGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.successText}>
              {enhancedAddress ? 'Ultra-detailed location detected!' : 'Location detected successfully!'}
            </Text>
            {building.name && building.name !== 'N/A' && (
              <Text style={styles.buildingSuccessText}>
                Found: {building.name}
              </Text>
            )}
          </LinearGradient>
        </Animated.View>
      )}
      
      {/* Enhanced Error Message */}
      {activeError && (
        <LinearGradient
          colors={['#fef2f2', '#fee2e2']}
          style={styles.errorContainer}
        >
          <Ionicons name="warning" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{activeError}</Text>
        </LinearGradient>
      )}

      {/* Enhanced Animated Map View */}
      {showMapView && (
        <Animated.View 
          style={[
            styles.mapContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.mapGradientContainer}
          >
            <View style={styles.mapHeader}>
              <LinearGradient
                colors={['#3b82f6', '#1e40af']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mapHeaderGradient}
              >
                <Ionicons name="map" size={20} color="#fff" />
                <Text style={styles.mapTitle}>Your Location</Text>
                <TouchableOpacity onPress={() => setShowMapView(false)}>
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
            
            <View style={styles.mapViewContainer}>
              <MapView
                style={styles.mapView}
                region={{
                  latitude: mapLat,
                  longitude: mapLng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                customMapStyle={mapStyle}
              >
                <Marker 
                  key={`location-marker-${mapLat}-${mapLng}`}
                  coordinate={{ latitude: mapLat, longitude: mapLng }}
                >
                  <View style={styles.customMarker}>
                    <LinearGradient
                      colors={['#3b82f6', '#1d4ed8']}
                      style={styles.markerGradient}
                    >
                      <Ionicons name="location" size={20} color="#fff" />
                    </LinearGradient>
                  </View>
                </Marker>
              </MapView>
            </View>
            
            <ScrollView style={styles.mapInfoContainer} showsVerticalScrollIndicator={false}>
              {/* Location Info Card */}
              <LinearGradient
                colors={['#f0f9ff', '#e0f2fe']}
                style={styles.customerLocationInfo}
              >
                <Ionicons 
                  name="home" 
                  size={20} 
                  color={currentLocation ? "#10b981" : "#94a3b8"} 
                />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationTitle}>
                    {currentLocation ? "Detected Location" : "Default Location"}
                  </Text>
                  <Text style={styles.locationCoordinates}>
                    {mapLat.toFixed(4)}, {mapLng.toFixed(4)}
                  </Text>
                  {currentLocation && (
                    <Text style={styles.detectedLocationLabel}>
                      �️ Live GPS location
                    </Text>
                  )}
                </View>
              </LinearGradient>

              {/* Enhanced Building Information */}
              {building.name && building.name !== 'N/A' && (
                <LinearGradient
                  colors={['#f0fdf4', '#dcfce7']}
                  style={styles.buildingDetailsContainer}
                >
                  <Ionicons name="business" size={18} color="#10b981" />
                  <View style={styles.locationDetailsText}>
                    <Text style={styles.buildingNameText}>
                      Building: {building.name}
                    </Text>
                    {building.type && (
                      <Text style={styles.buildingTypeText}>
                        Type: {building.type}
                      </Text>
                    )}
                  </View>
                </LinearGradient>
              )}

              {/* Enhanced Nearby Places - Categorized */}
              {(nearbyBuildings.length > 0 || nearbyShops.length > 0 || nearbyLandmarks.length > 0) && (
                <LinearGradient
                  colors={['#fefefe', '#f8fafc']}
                  style={styles.enhancedNearbyContainer}
                >
                  <Text style={styles.nearbyTitle}>Nearby Places</Text>
                  
                  {/* Immediate Vicinity */}
                  {(Array.isArray(nearbyBuildings) ? nearbyBuildings : []).filter(p => p.distance < 0.05).length > 0 && (
                    <View style={styles.categoryContainer}>
                      <Text style={styles.categoryTitle}>Within 50m</Text>
                      {(Array.isArray(nearbyBuildings) ? nearbyBuildings : []).filter(p => p.distance < 0.05).slice(0, 2).map((place, index) => (
                        <View key={`immediate-${place.placeId || index}`} style={styles.nearbyPlaceCard}>
                          <LinearGradient
                            colors={['#fef2f2', '#fee2e2']}
                            style={styles.placeCardGradient}
                          >
                            <Ionicons name="business" size={16} color="#dc2626" />
                            <View style={styles.placeInfo}>
                              <Text style={styles.placeName}>{place.name}</Text>
                              <Text style={styles.placeDetails}>
                                Location: {place.distanceText} • {place.category}
                                {place.rating && ` • Rating: ${place.rating}`}
                              </Text>
                            </View>
                          </LinearGradient>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Nearby Buildings */}
                  {nearbyBuildings.length > 0 && (
                    <View style={styles.categoryContainer}>
                      <Text style={styles.categoryTitle}>Buildings ({nearbyBuildings.length})</Text>
                      {nearbyBuildings.slice(0, 3).map((place, index) => (
                        <View key={`building-${place.placeId || index}`} style={styles.nearbyPlaceCard}>
                          <LinearGradient
                            colors={['#f0fdf4', '#dcfce7']}
                            style={styles.placeCardGradient}
                          >
                            <Ionicons name="business" size={14} color="#166534" />
                            <View style={styles.placeInfo}>
                              <Text style={styles.placeName}>{place.name}</Text>
                              <Text style={styles.placeDetails}>
                                {place.category} • {place.distanceText}
                                {place.rating && ` • Rating: ${place.rating}`}
                              </Text>
                            </View>
                          </LinearGradient>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Nearby Shops */}
                  {nearbyShops.length > 0 && (
                    <View style={styles.categoryContainer}>
                      <Text style={styles.categoryTitle}>Shops ({nearbyShops.length})</Text>
                      {nearbyShops.slice(0, 3).map((place, index) => (
                        <View key={`shop-${place.placeId || index}`} style={styles.nearbyPlaceCard}>
                          <LinearGradient
                            colors={['#fff7ed', '#fed7aa']}
                            style={styles.placeCardGradient}
                          >
                            <Ionicons name="storefront" size={14} color="#dc2626" />
                            <View style={styles.placeInfo}>
                              <Text style={styles.placeName}>{place.name}</Text>
                              <Text style={styles.placeDetails}>
                                {place.category} • {place.distanceText}
                                {place.rating && ` • Rating: ${place.rating}`}
                                {place.businessStatus === 'OPERATIONAL' && ' • Open'}
                              </Text>
                            </View>
                          </LinearGradient>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Nearby Landmarks */}
                  {nearbyLandmarks.length > 0 && (
                    <View style={styles.categoryContainer}>
                      <Text style={styles.categoryTitle}>Landmarks ({nearbyLandmarks.length})</Text>
                      {nearbyLandmarks.slice(0, 2).map((place, index) => (
                        <View key={`landmark-${place.placeId || index}`} style={styles.nearbyPlaceCard}>
                          <LinearGradient
                            colors={['#eff6ff', '#dbeafe']}
                            style={styles.placeCardGradient}
                          >
                            <Ionicons name="location" size={14} color="#2563eb" />
                            <View style={styles.placeInfo}>
                              <Text style={styles.placeName}>{place.name}</Text>
                              <Text style={styles.placeDetails}>
                                {place.category} • {place.distanceText}
                                {place.rating && ` • Rating: ${place.rating}`}
                              </Text>
                            </View>
                          </LinearGradient>
                        </View>
                      ))}
                    </View>
                  )}
                </LinearGradient>
              )}

              {/* Roads and Streets */}
              {nearbyRoads.length > 0 && (
                <LinearGradient
                  colors={['#faf5ff', '#f3e8ff']}
                  style={styles.roadsContainer}
                >
                  <Text style={styles.roadsTitle}>�️ Roads & Streets</Text>
                  {nearbyRoads.slice(0, 3).map((road, index) => (
                    <View key={`road-${index}`} style={styles.roadItem}>
                      <Ionicons name="car" size={14} color="#7c3aed" />
                      <Text style={styles.roadName}>{road.name}</Text>
                    </View>
                  ))}
                </LinearGradient>
              )}
            </ScrollView>
            
            {/* Enhanced Confirm Button */}
            <TouchableOpacity 
              style={styles.confirmLocationButton}
              onPress={handleConfirmLocation}
            >
              <LinearGradient
                colors={['#1e40af', '#1d4ed8']}
                style={styles.confirmButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.confirmLocationText}>Confirm This Location</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Enhanced Saved Addresses */}
      {showSavedAddresses && savedAddresses.length > 0 && (
        <LinearGradient
          colors={['#fefefe', '#f8fafc']}
          style={styles.savedAddressesContainer}
        >
          <Text style={styles.savedAddressesTitle}>Quick Select:</Text>
          <View style={styles.savedAddressesList}>
            {savedAddresses.slice(0, 3).map((addr, index) => (
              <TouchableOpacity
                key={`saved-addr-${Date.now()}-${index}-${addr.id || addr.address.substring(0, 10).replace(/\s+/g, '')}`}
                style={styles.savedAddressChip}
                onPress={() => {
                  onSelectSavedAddress?.(addr.address);
                  onChangeText(addr.address);
                }}
              >
                <LinearGradient
                  colors={['#eff6ff', '#dbeafe']}
                  style={styles.savedAddressGradient}
                >
                  <Ionicons name="bookmark" size={12} color="#3b82f6" />
                  <Text style={styles.savedAddressChipText} numberOfLines={1}>
                    {addr.label || addr.address.substring(0, 25) + '...'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  
  // Enhanced Label with Gradient
  labelGradient: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Input Container
  inputContainer: {
    position: 'relative',
  },
  inputWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 60,
  },
  inputIcon: {
    marginTop: 2,
    marginRight: 12,
    color: '#6b7280',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
    textAlignVertical: 'top',
    paddingRight: 100,
  },
  disabledInput: {
    color: '#6b7280',
  },
  
  // Enhanced Detect Button
  detectButton: {
    position: 'absolute',
    right: 8,
    top: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  detectButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
  },
  detectButtonDisabled: {
    shadowOpacity: 0.1,
  },
  detectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Enhanced Success Container
  successContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successGradient: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    gap: 4,
  },
  successText: {
    fontSize: 15,
    color: '#065f46',
    fontWeight: '600',
    textAlign: 'center',
  },
  buildingSuccessText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Enhanced Error Container
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
    flex: 1,
  },
  
  // Map Toggle Button
  mapToggleButton: {
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  mapToggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  mapToggleText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Enhanced Map Container
  mapContainer: {
    borderRadius: 16,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  mapGradientContainer: {
    minHeight: 400,
  },
  mapHeader: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  mapViewContainer: {
    height: 220,
    overflow: 'hidden',
  },
  mapView: {
    height: '100%',
    width: '100%',
  },
  
  // Custom Marker
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  
  // Map Info Container
  mapInfoContainer: {
    maxHeight: 300,
    padding: 16,
  },
  
  // Enhanced Location Info
  customerLocationInfo: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTextContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e40af',
  },
  locationCoordinates: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  detectedLocationLabel: {
    fontSize: 11,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '600',
  },
  
  // Enhanced Building Details
  buildingDetailsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationDetailsText: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  buildingNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065f46',
  },
  buildingTypeText: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
    fontWeight: '500',
  },
  
  // Enhanced Nearby Container
  enhancedNearbyContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nearbyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    padding: 16,
    paddingBottom: 8,
    textAlign: 'center',
  },
  categoryContainer: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  
  // Enhanced Place Cards
  nearbyPlaceCard: {
    marginBottom: 8,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  placeCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  placeDetails: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 16,
  },
  
  // Roads Container
  roadsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roadsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5b21b6',
    marginBottom: 8,
    textAlign: 'center',
    paddingTop: 12,
  },
  roadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  roadName: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500',
  },
  
  // Confirm Button
  confirmLocationButton: {
    borderRadius: 16,
    overflow: 'hidden',
    margin: 16,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  confirmLocationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Enhanced Saved Addresses
  savedAddressesContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  savedAddressesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    padding: 12,
    paddingBottom: 8,
  },
  savedAddressesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  savedAddressChip: {
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: '45%',
  },
  savedAddressGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  savedAddressChipText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
    flex: 1,
  },
  
  // Legacy styles for backward compatibility
  nearbyPlacesContainer: {
    backgroundColor: '#fefefe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  nearbyPlacesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  nearbyPlaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  nearbyPlaceText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  locationDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  placeNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  districtText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  enhancedPlaceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
    marginBottom: 4,
    gap: 8,
  },
  mapPlaceholder: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  mapPlaceholderText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  mapPlaceholderSubtext: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  mapFooterText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

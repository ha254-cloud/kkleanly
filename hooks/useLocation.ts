import { useState, useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { locationService, LocationResult, AddressResult } from '../services/locationService';

export interface UseLocationReturn {
  currentAddress: string;
  currentLocation: { latitude: number; longitude: number } | null;
  loading: boolean;
  error: string | null;
  detectLocation: () => Promise<void>;
  getAddressFromCoords: (lat: number, lng: number) => Promise<AddressResult | null>;
  getCoordsFromAddress: (address: string) => Promise<AddressResult | null>;
  clearError: () => void;
}

export function useLocation(): UseLocationReturn {
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      console.log('🔍 Requesting location permission...');
      
      // For Expo Go compatibility, check permission status first
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      console.log('📍 Current permission status:', existingStatus);
      
      if (existingStatus === 'granted') {
        console.log('✅ Location permission already granted');
        return true;
      }
      
      // Request permission if not granted
      console.log('🔄 Requesting foreground location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 Permission request result:', status);
      
      if (status === 'granted') {
        console.log('✅ Location permission granted');
        return true;
      }
      
      // Handle different permission statuses
      if (status === 'denied') {
        console.log('❌ Location permission denied');
        Alert.alert(
          'Location Permission Required',
          'Kleanly needs location access to detect your pickup address automatically. This helps us provide better service.\n\nPlease allow location access when prompted.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Try Again', 
              onPress: async () => {
                console.log('🔄 Retrying location permission request...');
                const { status: retryStatus } = await Location.requestForegroundPermissionsAsync();
                console.log('📍 Retry permission result:', retryStatus);
                if (retryStatus !== 'granted') {
                  showPermissionDeniedAlert();
                }
              }
            }
          ]
        );
        return false;
      }
      
      if (status === 'undetermined') {
        console.log('⚠️ Location permission undetermined, trying again...');
        // Try requesting again
        const { status: secondStatus } = await Location.requestForegroundPermissionsAsync();
        console.log('📍 Second permission request result:', secondStatus);
        return secondStatus === 'granted';
      }
      
      // Permission permanently denied
      console.log('🚫 Location permission permanently denied');
      showPermissionDeniedAlert();
      return false;
      
    } catch (error) {
      console.error('❌ Error requesting location permissions:', error);
      
      // Check if this is an Expo Go specific error
      if (error.message && error.message.includes('NSLocation')) {
        Alert.alert(
          'Expo Go Limitation',
          'Location permissions may not work properly in Expo Go. To fully test location features:\n\n1. Build a development build with `eas build`\n2. Or enter your address manually for now',
          [
            { text: 'Enter Manually', style: 'cancel' },
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        Alert.alert(
          'Permission Error',
          'There was an error requesting location permission. Please try again or enter your address manually.',
          [
            { text: 'Enter Manually', style: 'cancel' },
            { text: 'Try Again', onPress: () => requestLocationPermission() }
          ]
        );
      }
      return false;
    }
  };

  const showPermissionDeniedAlert = () => {
    // Check if we're likely in Expo Go (simple heuristic)
    const isLikelyExpoGo = __DEV__ && Platform.OS === 'ios';
    
    if (isLikelyExpoGo) {
      Alert.alert(
        'iOS Location Permission Issue',
        'There may be location permission limitations in the development environment. You can:\n\n1. Enter your address manually\n2. Try on Android device\n3. Or build a production app for full iOS location support',
        [
          { text: 'Enter Manually', style: 'cancel' },
          { text: 'OK', style: 'default' }
        ]
      );
    } else {
      Alert.alert(
        'Location Access Denied',
        'Location permission is required to detect your address automatically. You can either:\n\n1. Enter your address manually, or\n2. Enable location in Settings',
        [
          { text: 'Enter Manually', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => Linking.openSettings()
          }
        ]
      );
    }
  };

  const detectLocation = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Starting location detection...');
      
      // First, request permission with user-friendly prompts
      const hasPermission = await requestLocationPermission();
      
      if (!hasPermission) {
        console.log('❌ Location permission not granted');
        setError('Location permission is required to detect your address');
        setLoading(false);
        return;
      }

      // Check if location services are enabled
      console.log('🔍 Checking if location services are enabled...');
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        console.log('❌ Location services are disabled');
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to detect your address.',
          [
            { text: 'OK', style: 'default' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setError('Location services are disabled');
        setLoading(false);
        return;
      }

      console.log('✅ Location services are enabled, getting current location...');

      // Try with timeout and accuracy options
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      console.log('📍 Got location coordinates:', location.coords);

      // Store coordinates
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Try Expo's built-in reverse geocoding first (doesn't require API key)
      console.log('🔍 Trying Expo reverse geocoding...');
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (addresses && addresses.length > 0) {
          const address = addresses[0];
          const formattedAddress = [
            address.streetNumber,
            address.street,
            address.district,
            address.city,
            address.region,
            address.country
          ].filter(Boolean).join(', ');
          
          if (formattedAddress.trim()) {
            console.log('✅ Got address via Expo:', formattedAddress);
            setCurrentAddress(formattedAddress);
            setError(null);
            return; // Success with Expo's geocoding
          }
        }
        console.log('⚠️ Expo reverse geocoding returned empty result');
      } catch (expoError) {
        console.log('⚠️ Expo reverse geocoding failed:', expoError.message);
      }

      // Fallback to Google API
      console.log('🔍 Falling back to Google API for address...');
      const addressResult = await locationService.getAddressFromCoordinates(
        location.coords.latitude,
        location.coords.longitude
      );

      if (addressResult.success && addressResult.data) {
        console.log('✅ Got address via Google API:', addressResult.data.address);
        setCurrentAddress(addressResult.data.address);
        setError(null);
      } else {
        console.log('❌ Failed to get address from coordinates');
        
        // Check if it's likely an API key issue
        const isApiKeyIssue = addressResult.error?.includes('API key') || 
                             addressResult.error?.includes('invalid') ||
                             addressResult.error === 'Geocoding failed' ||
                             addressResult.error === 'Failed to get address';
        
        if (isApiKeyIssue) {
          console.log('💡 API key issue detected. Showing coordinates.');
          const coordsString = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
          setCurrentAddress(`📍 ${coordsString}`);
          setError('Address lookup requires Google API key configuration');
        } else {
          setError(addressResult.error || 'Failed to get address from location');
        }
      }

    } catch (err: any) {
      console.error('❌ Location detection error:', err);
      
      // Handle specific error types
      let errorMessage = 'Failed to detect location';
      
      if (err.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Location is currently unavailable. Please try again.';
      } else if (err.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (err.code === 'E_LOCATION_SERVICES_DISABLED') {
        errorMessage = 'Location services are disabled. Please enable them in Settings.';
      } else if (err.code === 'E_PERMISSION_MISSING') {
        errorMessage = 'Location permission is required. Please enable location access.';
      } else if (err.message && err.message.includes('NSLocation')) {
        errorMessage = 'Location permission setup issue. Please try entering your address manually.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Show user-friendly alert for iOS permission issues
      if (Platform.OS === 'ios' && err.message && err.message.includes('NSLocation')) {
        Alert.alert(
          'Location Setup Issue',
          'There seems to be a location permission setup issue. This often happens in development builds.\n\nPlease enter your address manually for now.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getAddressFromCoords = async (lat: number, lng: number): Promise<AddressResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await locationService.getAddressFromCoordinates(lat, lng);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to get address');
        return null;
      }
    } catch (err) {
      setError('Address lookup failed');
      console.error('Address lookup error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getCoordsFromAddress = async (address: string): Promise<AddressResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await locationService.getCoordinatesFromAddress(address);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to get coordinates');
        return null;
      }
    } catch (err) {
      setError('Coordinates lookup failed');
      console.error('Coordinates lookup error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    currentAddress,
    currentLocation,
    loading,
    error,
    detectLocation,
    getAddressFromCoords,
    getCoordsFromAddress,
    clearError,
  };
}

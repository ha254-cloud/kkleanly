import * as Location from 'expo-location';
import { LocationCoords } from './mapsService';

/**
 * Simple location service for handling location-related operations
 */
class LocationService {
  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Get the user's current location
   */
  async getCurrentLocation(): Promise<LocationCoords | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Get address from coordinates using Expo Location
   */
  async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const response = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (response[0]) {
        const address = response[0];
        let formattedAddress = '';
        
        if (address.name) formattedAddress += address.name;
        if (address.street) {
          if (formattedAddress) formattedAddress += ', ';
          formattedAddress += address.street;
        }
        if (address.city) {
          if (formattedAddress) formattedAddress += ', ';
          formattedAddress += address.city;
        }
        if (address.region) {
          if (formattedAddress) formattedAddress += ', ';
          formattedAddress += address.region;
        }
        
        return formattedAddress || 'Unknown location';
      }
      
      return null;
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(
    point1: LocationCoords,
    point2: LocationCoords
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * 
      Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    return distance * 1000; // Convert to meters
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationService = new LocationService();
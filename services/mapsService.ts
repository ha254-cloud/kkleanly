import { GoogleMap, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';

export interface RouteInfo {
  distance: string;
  duration: string;
  steps: any[];
  polyline: string;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

class MapsService {
  private directionsService: google.maps.DirectionsService | null = null;
  private distanceMatrixService: google.maps.DistanceMatrixService | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.google) {
      this.directionsService = new google.maps.DirectionsService();
      this.distanceMatrixService = new google.maps.DistanceMatrixService();
    }
  }

  async calculateRoute(
    origin: LocationCoords,
    destination: LocationCoords,
    waypoints?: LocationCoords[]
  ): Promise<RouteInfo | null> {
    try {
      // Simple route calculation for React Native
      // In production, you'd use a proper routing service
      
      const distance = this.calculateDistance(origin, destination);
      const duration = Math.round(distance * 2); // Rough estimate: 2 minutes per km
      
      return {
        distance: `${distance.toFixed(1)} km`,
        duration: `${duration} min`,
        steps: [],
        polyline: '' // Would contain encoded polyline in a real implementation
      };
    } catch (error) {
      console.error('Route calculation error:', error);
      return null;
    }
  }

  async calculateETA(
    origin: LocationCoords,
    destination: LocationCoords
  ): Promise<{ duration: string; distance: string } | null> {
    try {
      const distance = this.calculateDistance(origin, destination);
      const duration = Math.round(distance * 2); // Rough estimate: 2 minutes per km
      
      return {
        distance: `${distance.toFixed(1)} km`,
        duration: `${duration} min`
      };
    } catch (error) {
      console.error('ETA calculation error:', error);
      return null;
    }
  }

  private calculateDistance(coord1: LocationCoords, coord2: LocationCoords): number {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * 
      Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async geocodeAddress(address: string): Promise<LocationCoords | null> {
    try {
      // For React Native, we'll use a simplified geocoding approach
      // In a production app, you'd use a proper geocoding service
      
      // Simple address-to-coordinates mapping for common Kenyan locations
      const addressMapping: { [key: string]: LocationCoords } = {
        'nairobi': { latitude: -1.2921, longitude: 36.8219 },
        'nairobi, kenya': { latitude: -1.2921, longitude: 36.8219 },
        'mombasa': { latitude: -4.0435, longitude: 39.6682 },
        'nakuru': { latitude: -0.3031, longitude: 36.0800 },
        'eldoret': { latitude: 0.5143, longitude: 35.2698 },
        'kisumu': { latitude: -0.0917, longitude: 34.7680 },
        'thika': { latitude: -1.0332, longitude: 37.0692 },
        'machakos': { latitude: -1.5177, longitude: 37.2634 },
        'meru': { latitude: 0.0461, longitude: 37.6551 },
        'nyeri': { latitude: -0.4167, longitude: 36.9500 },
        'kitale': { latitude: 1.0167, longitude: 35.0000 }
      };
      
      // Normalize the address for lookup
      const normalizedAddress = address.toLowerCase().trim();
      
      // Check for exact matches first
      if (addressMapping[normalizedAddress]) {
        return addressMapping[normalizedAddress];
      }
      
      // Check for partial matches
      for (const [key, coords] of Object.entries(addressMapping)) {
        if (normalizedAddress.includes(key) || key.includes(normalizedAddress)) {
          return coords;
        }
      }
      
      // Default to Nairobi if no match found
      console.log(`Address "${address}" not found in mapping, using Nairobi as default`);
      return { latitude: -1.2921, longitude: 36.8219 };
      
    } catch (error) {
      console.error('Geocoding error:', error);
      // Return Nairobi as fallback
      return { latitude: -1.2921, longitude: 36.8219 };
    }
  }

  async reverseGeocode(coords: LocationCoords): Promise<string | null> {
    try {
      // Simple reverse geocoding for React Native
      // In production, you'd use a proper reverse geocoding service
      
      const { latitude, longitude } = coords;
      
      // Check if coordinates are close to known locations
      const locations = [
        { name: 'Nairobi, Kenya', lat: -1.2921, lng: 36.8219 },
        { name: 'Mombasa, Kenya', lat: -4.0435, lng: 39.6682 },
        { name: 'Nakuru, Kenya', lat: -0.3031, lng: 36.0800 },
        { name: 'Eldoret, Kenya', lat: 0.5143, lng: 35.2698 },
        { name: 'Kisumu, Kenya', lat: -0.0917, lng: 34.7680 }
      ];
      
      // Find the closest known location (within ~50km)
      let closestLocation = null;
      let minDistance = Infinity;
      
      for (const location of locations) {
        const distance = Math.sqrt(
          Math.pow(latitude - location.lat, 2) + 
          Math.pow(longitude - location.lng, 2)
        );
        
        if (distance < minDistance && distance < 0.5) { // ~50km threshold
          minDistance = distance;
          closestLocation = location.name;
        }
      }
      
      if (closestLocation) {
        return closestLocation;
      }
      
      // Generic location description
      return `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `Location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;
    }
  }
}

export const mapsService = new MapsService();
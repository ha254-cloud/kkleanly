import * as Location from 'expo-location';
import { LocationCoords } from './mapsService';

export interface LocationUpdate {
  coords: LocationCoords;
  timestamp: number;
  accuracy: number;
  speed?: number;
  heading?: number;
}

class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private backgroundTaskId: string | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.warn('Foreground location permission not granted');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted');
        // Still return true as foreground is sufficient for basic functionality
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationCoords | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // 10 seconds
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

  async startLocationTracking(
    callback: (location: LocationUpdate) => void,
    options: {
      accuracy?: Location.Accuracy;
      distanceInterval?: number;
      timeInterval?: number;
    } = {}
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      // Stop any existing tracking
      await this.stopLocationTracking();

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: options.accuracy || Location.Accuracy.High,
          timeInterval: options.timeInterval || 5000, // 5 seconds
          distanceInterval: options.distanceInterval || 10, // 10 meters
        },
        (location) => {
          callback({
            coords: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            timestamp: location.timestamp,
            accuracy: location.coords.accuracy || 0,
            speed: location.coords.speed || undefined,
            heading: location.coords.heading || undefined,
          });
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  async stopLocationTracking(): Promise<void> {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  async startBackgroundLocationTracking(
    driverId: string,
    callback: (location: LocationUpdate) => void
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      // Define background location task
      const BACKGROUND_LOCATION_TASK = 'background-location-task';

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 seconds
        distanceInterval: 20, // 20 meters
        foregroundService: {
          notificationTitle: 'Kleanly Driver Active',
          notificationBody: 'Tracking location for deliveries',
          notificationColor: '#3B82F6',
        },
      });

      // Handle background location updates
      Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).then((started) => {
        if (started) {
          console.log('Background location tracking started');
        }
      });

      return true;
    } catch (error) {
      console.error('Error starting background location tracking:', error);
      return false;
    }
  }

  async stopBackgroundLocationTracking(): Promise<void> {
    try {
      const BACKGROUND_LOCATION_TASK = 'background-location-task';
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('Background location tracking stopped');
      }
    } catch (error) {
      console.error('Error stopping background location tracking:', error);
    }
  }

  async calculateDistance(
    point1: LocationCoords,
    point2: LocationCoords
  ): Promise<number> {
    // Haversine formula to calculate distance between two points
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
    
    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationService = new LocationService();
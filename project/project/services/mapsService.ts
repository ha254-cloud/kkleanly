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
    if (!this.directionsService) return null;

    return new Promise((resolve, reject) => {
      const waypointObjects = waypoints?.map(point => ({
        location: new google.maps.LatLng(point.latitude, point.longitude),
        stopover: true
      }));

      this.directionsService!.route({
        origin: new google.maps.LatLng(origin.latitude, origin.longitude),
        destination: new google.maps.LatLng(destination.latitude, destination.longitude),
        waypoints: waypointObjects,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        avoidHighways: false,
        avoidTolls: false
      }, (result, status) => {
        if (status === 'OK' && result) {
          const route = result.routes[0];
          const leg = route.legs[0];
          
          resolve({
            distance: leg.distance?.text || '',
            duration: leg.duration?.text || '',
            steps: leg.steps || [],
            polyline: route.overview_polyline || ''
          });
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      });
    });
  }

  async calculateETA(
    origin: LocationCoords,
    destination: LocationCoords
  ): Promise<{ duration: string; distance: string } | null> {
    if (!this.distanceMatrixService) return null;

    return new Promise((resolve, reject) => {
      this.distanceMatrixService!.getDistanceMatrix({
        origins: [new google.maps.LatLng(origin.latitude, origin.longitude)],
        destinations: [new google.maps.LatLng(destination.latitude, destination.longitude)],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === 'OK' && response) {
          const element = response.rows[0].elements[0];
          if (element.status === 'OK') {
            resolve({
              duration: element.duration.text,
              distance: element.distance.text
            });
          } else {
            reject(new Error('No route found'));
          }
        } else {
          reject(new Error(`Distance Matrix request failed: ${status}`));
        }
      });
    });
  }

  async geocodeAddress(address: string): Promise<LocationCoords | null> {
    if (!window.google) return null;

    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            latitude: location.lat(),
            longitude: location.lng()
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  async reverseGeocode(coords: LocationCoords): Promise<string | null> {
    if (!window.google) return null;

    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({
        location: new google.maps.LatLng(coords.latitude, coords.longitude)
      }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }
}

export const mapsService = new MapsService();
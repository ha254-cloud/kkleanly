import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import { LocationCoords, mapsService, RouteInfo } from '../services/mapsService';

interface GoogleMapComponentProps {
  driverLocation?: LocationCoords;
  customerLocation: LocationCoords;
  pickupLocation?: LocationCoords;
  showRoute?: boolean;
  onMapReady?: () => void;
  mapHeight?: number;
  zoom?: number;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'your-api-key-here';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194, // San Francisco default
};

export default function GoogleMapComponent({
  driverLocation,
  customerLocation,
  pickupLocation,
  showRoute = true,
  onMapReady,
  mapHeight = 400,
  zoom = 13,
}: GoogleMapComponentProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setLoading(false);
    onMapReady?.();
  }, [onMapReady]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Calculate and display route
  useEffect(() => {
    if (!map || !showRoute || !driverLocation) return;

    const calculateRoute = async () => {
      try {
        const waypoints = pickupLocation ? [pickupLocation] : [];
        const route = await mapsService.calculateRoute(
          driverLocation,
          customerLocation,
          waypoints
        );

        if (route) {
          setRouteInfo(route);
          
          // Use Google Maps DirectionsService for rendering
          const directionsService = new google.maps.DirectionsService();
          const waypointObjects = waypoints.map(point => ({
            location: new google.maps.LatLng(point.latitude, point.longitude),
            stopover: true
          }));

          directionsService.route({
            origin: new google.maps.LatLng(driverLocation.latitude, driverLocation.longitude),
            destination: new google.maps.LatLng(customerLocation.latitude, customerLocation.longitude),
            waypoints: waypointObjects,
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: true,
          }, (result, status) => {
            if (status === 'OK' && result) {
              setDirectionsResponse(result);
            }
          });
        }
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    };

    calculateRoute();
  }, [map, driverLocation, customerLocation, pickupLocation, showRoute]);

  // Auto-fit bounds to show all markers
  useEffect(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();
    
    if (driverLocation) {
      bounds.extend(new google.maps.LatLng(driverLocation.latitude, driverLocation.longitude));
    }
    
    bounds.extend(new google.maps.LatLng(customerLocation.latitude, customerLocation.longitude));
    
    if (pickupLocation) {
      bounds.extend(new google.maps.LatLng(pickupLocation.latitude, pickupLocation.longitude));
    }

    map.fitBounds(bounds);
  }, [map, driverLocation, customerLocation, pickupLocation]);

  const mapCenter = driverLocation || customerLocation || defaultCenter;

  return (
    <View style={[styles.container, { height: mapHeight }]}>
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={{
            lat: mapCenter.latitude || mapCenter.lat,
            lng: mapCenter.longitude || mapCenter.lng,
          }}
          zoom={zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {/* Driver Marker */}
          {driverLocation && (
            <Marker
              position={{
                lat: driverLocation.latitude,
                lng: driverLocation.longitude,
              }}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(40, 40),
              }}
              title="Driver Location"
              onClick={() => setSelectedMarker('driver')}
            >
              {selectedMarker === 'driver' && (
                <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                  <div>
                    <h3>Driver Location</h3>
                    <p>Your driver is here</p>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          )}

          {/* Customer Marker */}
          <Marker
            position={{
              lat: customerLocation.latitude,
              lng: customerLocation.longitude,
            }}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(40, 40),
            }}
            title="Delivery Location"
            onClick={() => setSelectedMarker('customer')}
          >
            {selectedMarker === 'customer' && (
              <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                <div>
                  <h3>Delivery Location</h3>
                  <p>Your laundry will be delivered here</p>
                </div>
              </InfoWindow>
            )}
          </Marker>

          {/* Pickup Marker */}
          {pickupLocation && (
            <Marker
              position={{
                lat: pickupLocation.latitude,
                lng: pickupLocation.longitude,
              }}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                scaledSize: new google.maps.Size(40, 40),
              }}
              title="Pickup Location"
              onClick={() => setSelectedMarker('pickup')}
            >
              {selectedMarker === 'pickup' && (
                <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                  <div>
                    <h3>Pickup Location</h3>
                    <p>Laundry pickup point</p>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          )}

          {/* Route */}
          {directionsResponse && (
            <DirectionsRenderer
              directions={directionsResponse}
              options={{
                polylineOptions: {
                  strokeColor: '#3B82F6',
                  strokeWeight: 4,
                  strokeOpacity: 0.8,
                },
                suppressMarkers: true, // We're using custom markers
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Dimensions, Animated, Platform, useColorScheme, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LocationCoords } from '../services/mapsService';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { TouchableOpacity } from 'react-native';

interface GoogleMapComponentProps {
  driverLocation?: LocationCoords;
  customerLocation?: LocationCoords; // now optional; will auto-fetch if missing
  pickupLocation?: LocationCoords;
  onMapReady?: () => void;
  mapHeight?: number;
  zoom?: number;
  onLocationSelect?: (location: LocationCoords) => void;
  selectable?: boolean;
  showPlaceLabels?: boolean; // fetch & show nearby place names
  onPlaceSelected?: (place: { id?: string; name: string; latitude: number; longitude: number; address?: string; types?: string[] }) => void;
  nativeLabels?: boolean; // show native POI/road labels
  showTraffic?: boolean;
  showBuildings?: boolean;
  forceDarkMap?: boolean; // force dark map style
  showSearchPanel?: boolean; // show bottom search panel scaffold
  onBack?: () => void; // optional back button handler
  fullDetail?: boolean; // enable all native layers (roads, POIs, traffic, buildings)
  preferGoogleProvider?: boolean; // try to use Google provider for richer detail
}

const { width } = Dimensions.get('window');

export default function GoogleMapComponent({
  driverLocation,
  customerLocation,
  pickupLocation,
  onMapReady,
  mapHeight = 300,
  zoom = 14,
  onLocationSelect,
  selectable = false,
  showPlaceLabels = false,
  onPlaceSelected,
  nativeLabels = true,
  showTraffic = false,
  showBuildings = true,
  forceDarkMap = false,
  showSearchPanel = true,
  onBack,
  fullDetail = true,
  preferGoogleProvider = false,
}: GoogleMapComponentProps) {
  // Start optimistic: render map immediately; we'll show overlay only if we detect slowness
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoords | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [places, setPlaces] = useState<{ id: string; name: string; latitude: number; longitude: number; types?: string[]; address?: string }[]>([]);
  const [fetchingPlaces, setFetchingPlaces] = useState(false);
  const placesFetchRef = useRef<number | null>(null);
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState<null | { id?: string; name: string; latitude: number; longitude: number; address?: string; types?: string[] }>(null);
  const offlineFallbackRef = useRef(false);
  // Traffic toggle removed; rely directly on showTraffic prop
  const initialFallback = {
    latitude: customerLocation?.latitude ?? -1.286389, // Nairobi CBD fallback
    longitude: customerLocation?.longitude ?? 36.817223,
    latitudeDelta: 0.0122,
    longitudeDelta: 0.0061,
  };
  const [region, setRegion] = useState(initialFallback);
  const [internalLocation, setInternalLocation] = useState<LocationCoords | null>(customerLocation || null);
  const [acquiringLocation, setAcquiringLocation] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const [selectionAddress, setSelectionAddress] = useState<string | null>(null);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);
  // Reverse geocode control
  const addressCacheRef = useRef<Map<string,string>>(new Map());
  const lastGeocodeRef = useRef(0);
  const geocodeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rateLimitedRef = useRef(false);
  const GEOCODE_MIN_INTERVAL = 1500; // ms between requests
  const GEOCODE_DEBOUNCE = 400; // delay after selection

  // Basic Google dark style (subset) – trimmed for size
  // Enhanced dark style: preserves road hierarchy & building outlines for clarity
  const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#121416' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#d6d8db' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#121416' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2a2f35' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#181b1f' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#b5b8bb' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#15221a' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#7fae8b' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#292f36' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1c2024' }, { weight: 0.5 }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#aab0b5' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#343c44' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3d464f' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#262c32' }] },
    { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#45505a' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1d2328' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#c1c5c9' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1c2d' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6d90a7' }] },
    // Buildings
    { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#1a1f23' }] },
    { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#262b30' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#162025' }] }
  ];

  const isValidCoord = (c?: LocationCoords | null) => {
    if (!c) return false;
    return Math.abs(c.latitude) > 0.001 && Math.abs(c.longitude) > 0.001;
  };

  const acquireLocation = async () => {
    if (acquiringLocation) return;
    try {
      setAcquiringLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setMapError(prev => prev || 'Location permission denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords: LocationCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setInternalLocation(coords);
      setRegion(r => ({ ...r, latitude: coords.latitude, longitude: coords.longitude }));
    } catch (e) {
      console.warn('[GoogleMapComponent] acquireLocation error', e);
      setMapError(prev => prev || 'Unable to get current location');
    } finally {
      setAcquiringLocation(false);
    }
  };

  // Log initial props for debugging
  useEffect(() => {
    console.log('[GoogleMapComponent] mount props', { driverLocation, customerLocation, pickupLocation, selectable });
    if (!customerLocation || !isValidCoord(customerLocation)) {
      acquireLocation();
    }
  }, []);

  // Update region when internal or external location updates
  useEffect(() => {
    const base = internalLocation || customerLocation;
    if (!base) return;
    setRegion(prev => {
      if (
        Math.abs(prev.latitude - base.latitude) > 0.0005 ||
        Math.abs(prev.longitude - base.longitude) > 0.0005
      ) {
        return { ...prev, latitude: base.latitude, longitude: base.longitude };
      }
      return prev;
    });
  }, [internalLocation?.latitude, internalLocation?.longitude, customerLocation?.latitude, customerLocation?.longitude]);

  useEffect(() => {
    // slight delay after location acquisition to ensure map has layout
    const t = setTimeout(() => fitMapToMarkers(), 150);
    return () => clearTimeout(t);
  }, [driverLocation, customerLocation, internalLocation, pickupLocation, selectedLocation, mapReady]);

  // If map not ready in 3s, force hide loader (prevents perpetual spinner) & set a helpful error hint
  useEffect(() => {
    if (!mapReady) {
      const t = setTimeout(() => {
        if (!mapReady) {
          console.log('[GoogleMapComponent] Fallback timeout reached, forcing ready');
          setLoading(false);
          setMapError(prev => prev || 'Map tiles not loaded yet. If using Expo Go, build a dev client for Google Maps or remove provider.');
        }
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [mapReady]);

  // Trigger a brief loading overlay only if first paint is slow
  useEffect(() => {
    const t = setTimeout(() => {
      if (!mapReady) setLoading(true);
    }, 150); // small delay so fast mounts avoid spinner flicker
    return () => clearTimeout(t);
  }, []);

  const fitMapToMarkers = () => {
    if (!mapRef.current) return;

  const base = internalLocation || customerLocation;
  if (!base) return;
  const markers = [base];
    if (driverLocation) markers.push(driverLocation);
    if (pickupLocation) markers.push(pickupLocation);
    if (selectedLocation) markers.push(selectedLocation);

    mapRef.current.fitToCoordinates(markers, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  const handleMapReady = () => {
    console.log('[GoogleMapComponent] onMapReady fired');
    setMapReady(true);
    setLoading(false);
    fitMapToMarkers();
    onMapReady?.();
  };

  const handleMapPress = async (event: any) => {
    if (!selectable) return;

    const { coordinate } = event.nativeEvent;
    if (!coordinate) return;

    const newLocation: LocationCoords = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };

    setSelectedLocation(newLocation);
    onLocationSelect?.(newLocation);
    try { await Haptics.selectionAsync(); } catch {}
    startPulse();
  resolveAddress(newLocation);
  setShowInstruction(false);
  };

  const handleMapLongPress = async (event: any) => {
    if (!selectable) return;
    const { coordinate } = event.nativeEvent;
    if (!coordinate) return;
    const newLocation: LocationCoords = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };
    setSelectedLocation(newLocation);
    onLocationSelect?.(newLocation);
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    startPulse();
  resolveAddress(newLocation);
  setShowInstruction(false);
  };

  const startPulse = () => {
    pulseAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.delay(200)
      ]),
      { iterations: 3 }
    ).start();
  };

  // Fetch nearby places (Google Places Nearby Search) when region changes (debounced)
  const queueFetchPlaces = (center: { latitude: number; longitude: number }) => {
    if (!showPlaceLabels) return;
    if (!process.env.EXPO_PUBLIC_GOOGLE_API_KEY) return;
    if (placesFetchRef.current) clearTimeout(placesFetchRef.current);
    placesFetchRef.current = setTimeout(() => fetchPlaces(center), 600) as unknown as number;
  };

  const fetchPlaces = async (center: { latitude: number; longitude: number }) => {
    try {
      setFetchingPlaces(true);
      const radius = 400; // meters
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.latitude},${center.longitude}&radius=${radius}&key=${process.env.EXPO_PUBLIC_GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK') {
        const mapped = data.results.slice(0, 12).map((p: any) => ({
          id: p.place_id,
            name: p.name,
            latitude: p.geometry.location.lat,
            longitude: p.geometry.location.lng,
            types: p.types
        }));
        setPlaces(mapped);
        offlineFallbackRef.current = false;
      } else {
        console.warn('[GoogleMapComponent] Places API status', data.status);
        buildOfflineFallback(center);
      }
    } catch (e) {
      console.warn('[GoogleMapComponent] fetchPlaces error', e);
      buildOfflineFallback(center);
    } finally {
      setFetchingPlaces(false);
    }
  };

  const buildOfflineFallback = async (center: { latitude: number; longitude: number }) => {
    if (offlineFallbackRef.current) return;
    try {
      const res = await Location.reverseGeocodeAsync({ latitude: center.latitude, longitude: center.longitude });
      const addr = res[0];
      const labelParts = [addr?.name, addr?.street, addr?.city].filter(Boolean);
      const name = labelParts[0] || 'Selected Area';
      const address = labelParts.join(', ');
      setPlaces([{ id: 'fallback', name, latitude: center.latitude, longitude: center.longitude, types: ['fallback'], address }]);
      offlineFallbackRef.current = true;
    } catch {}
  };

  const handlePlaceMarkerPress = (p: { id?: string; name: string; latitude: number; longitude: number; address?: string; types?: string[] }) => {
    setSelectedPlaceInfo(p);
    onPlaceSelected?.(p);
  };

  const confirmSelectedPlace = () => {
    if (selectedPlaceInfo) {
      const loc = { latitude: selectedPlaceInfo.latitude, longitude: selectedPlaceInfo.longitude };
      onLocationSelect?.(loc);
      setSelectedLocation(loc);
      try { Haptics.selectionAsync(); } catch {}
      resolveAddress(loc);
      setShowInstruction(false);
    }
  };

  // Reverse geocode selection
  const resolveAddress = (loc: LocationCoords) => {
    // Clear pending debounce
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current as any);
    geocodeTimerRef.current = setTimeout(async () => {
      const key = `${loc.latitude.toFixed(5)},${loc.longitude.toFixed(5)}`;
      // Cache hit
      const cached = addressCacheRef.current.get(key);
      if (cached) {
        setSelectionAddress(cached);
        return;
      }
      // Rate limit cool down
      if (rateLimitedRef.current) return; // silently skip until cooldown ends
      const now = Date.now();
      if (now - lastGeocodeRef.current < GEOCODE_MIN_INTERVAL) return; // too soon
      lastGeocodeRef.current = now;
      try {
        setResolvingAddress(true);
        const res = await Location.reverseGeocodeAsync(loc as any);
        const addr = res[0];
        if (addr) {
          const parts = [addr.name, addr.street, addr.city, addr.region].filter(Boolean);
          const finalAddr = parts.join(', ');
          addressCacheRef.current.set(key, finalAddr);
          setSelectionAddress(finalAddr);
        } else {
          setSelectionAddress(null);
        }
      } catch (e: any) {
        const msg = String(e?.message || '').toLowerCase();
        if (msg.includes('rate limit') || msg.includes('too many')) {
          rateLimitedRef.current = true;
          // Cooldown reset after 60s
          setTimeout(() => { rateLimitedRef.current = false; }, 60000);
        }
        // Fallback: show coordinates if nothing else
        if (!selectionAddress) {
          setSelectionAddress(`${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`);
        }
      } finally {
        setResolvingAddress(false);
      }
    }, GEOCODE_DEBOUNCE) as any;
  };

  // Auto hide instructions after few seconds
  useEffect(() => {
    if (!showInstruction) return;
    const t = setTimeout(() => setShowInstruction(false), 5000);
    return () => clearTimeout(t);
  }, [showInstruction]);

  const effectiveLocation = internalLocation || customerLocation;

  return (
  <View style={[styles.container, { height: mapHeight }]}>       
      <MapView
        ref={mapRef}
        style={styles.map}
        // Using default provider (Apple on iOS, Google on Android) for Expo Go compatibility.
    initialRegion={region}
    // Passing key forces remount if starting coordinate drastically changes
    key={`${region.latitude.toFixed(3)}-${region.longitude.toFixed(3)}`}
        provider={preferGoogleProvider ? PROVIDER_GOOGLE : undefined}
        onMapReady={handleMapReady}
        onPress={handleMapPress}
  onLongPress={handleMapLongPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        zoomControlEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
    mapType="standard"
        loadingEnabled={true}
  showsPointsOfInterest={fullDetail ? true : nativeLabels}
  showsBuildings={fullDetail ? true : showBuildings}
  showsTraffic={fullDetail ? true : showTraffic}
  showsIndoorLevelPicker={false}
  showsIndoors={false}
  // Use native default styling for maximum visual accuracy; opt-in dark styling only when explicitly forced.
  customMapStyle={forceDarkMap ? darkMapStyle : undefined}
  // API key is supplied via app.json plugin configuration; prop not supported in this version
        onRegionChangeComplete={(r) => {
          if (!mapReady) {
            console.log('[GoogleMapComponent] onRegionChangeComplete fallback');
            setMapReady(true);
            setLoading(false);
          }
          queueFetchPlaces({ latitude: r.latitude, longitude: r.longitude });
        }}
  onLayout={() => {
          // Layout means view is on screen; if still not ready after short delay, hide spinner
          setTimeout(() => {
            if (!mapReady) {
              console.log('[GoogleMapComponent] onLayout fallback');
              setLoading(false);
            }
          }, 1000);
  }}
      >
        {/* User Base Location Marker (custom dot) */}
        {effectiveLocation && (
          <Marker coordinate={effectiveLocation} title="Current Location">
            <View style={styles.userMarkerOuter}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Pickup Location Marker */}
        {pickupLocation && (
          <Marker
            coordinate={pickupLocation}
            title="Pickup Location"
            pinColor="green"
          />
        )}

        {/* Driver Location Marker */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver Location"
            pinColor="yellow"
          />
        )}

        {/* Selected Location Marker (custom) */}
        {selectable && selectedLocation && (
          <Marker coordinate={selectedLocation} title="Selected Location">
            <View style={styles.selectedMarkerOuter}>
              <View style={styles.selectedMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Nearby Places Markers */}
        {showPlaceLabels && places.map(p => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={p.name}
            pinColor="#2563EB"
            onPress={() => handlePlaceMarkerPress(p)}
          >
            <View style={styles.placeLabelContainer}>
              <Text style={styles.placeLabelText} numberOfLines={1}>{p.name}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Interactive Map Indicator */}
      {selectable && showInstruction && (
        <View style={styles.mapOverlay}>
          <View style={styles.mapInstructions}>
            <Text style={styles.mapInstructionsText}>
              {selectedLocation ? 'Refine by tapping again' : 'Tap or long‑press to pick a point'}
            </Text>
          </View>
        </View>
      )}

      {selectable && selectedLocation && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseMarker,
            {
              opacity: pulseAnim.interpolate({ inputRange: [0,1], outputRange: [0.7,0] }),
              transform: [{ scale: pulseAnim.interpolate({ inputRange: [0,1], outputRange: [1,2.2] }) }]
            }
          ]}
        />
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}

      {acquiringLocation && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      )}

      {mapError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>Map Unavailable</Text>
          <Text style={styles.errorText}>{mapError}</Text>
          {Platform.OS === 'web' && (
            <Text style={styles.errorHint}>Web tiles may require a different setup or using the web build of Google Maps.</Text>
          )}
          {Platform.OS !== 'web' && (
            <Text style={styles.errorHint}>If using Expo Go, build a development client (EAS) for full Google Maps support or remove provider.</Text>
          )}
        </View>
      )}

      {showPlaceLabels && fetchingPlaces && !mapError && (
        <View style={styles.fetchingPlacesBanner}>
          <Text style={styles.fetchingPlacesText}>Loading nearby places…</Text>
        </View>
      )}

  {/* Traffic toggle removed per request */}

      {selectedPlaceInfo && (
        <View style={styles.placeDetailCard}>
          <Text style={styles.detailTitle}>{selectedPlaceInfo.name}</Text>
          {selectedPlaceInfo.address && (
            <Text style={styles.detailAddress} numberOfLines={2}>{selectedPlaceInfo.address}</Text>
          )}
          <View style={styles.detailActions}>
            <Text onPress={() => setSelectedPlaceInfo(null)} style={styles.detailActionSecondary}>Close</Text>
            <Text onPress={confirmSelectedPlace} style={styles.detailActionPrimary}>Use This</Text>
          </View>
        </View>
      )}

      {/* Selection Card */}
      {selectable && selectedLocation && (
        <View style={styles.selectionCard}>
          <View style={styles.selectionCardGrab} />
          <Text style={styles.selectionTitle}>Selected Point</Text>
          <Text style={styles.selectionAddress} numberOfLines={2}>
            {resolvingAddress ? 'Resolving address…' : selectionAddress || 'Unnamed location'}
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={() => { if (onBack) onBack(); }} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>{onBack ? 'Back' : 'Clear'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (selectedLocation) { onLocationSelect?.(selectedLocation); try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {} } }} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Use this point</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Search Panel Scaffold */}
      {showSearchPanel && !selectedLocation && (
        <View style={styles.searchPanel}>
          <View style={styles.searchInner}>
            <TextInput
              placeholder="Search places (coming soon)"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              editable={false}
            />
            <Text style={styles.searchHint}>Tap on the map to choose a point</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden'
  },
  map: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1f2937'
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#374151',
    marginBottom: 6,
  },
  errorHint: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6b7280'
  },
  pulseMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginLeft: -10,
    marginTop: -10,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.4)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
    borderRadius: 12,
  },
  mapOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    pointerEvents: 'none',
  },
  mapInstructions: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  mapInstructionsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  placeLabelContainer: {
    backgroundColor: 'rgba(37,99,235,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 120,
  },
  placeLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600'
  },
  fetchingPlacesBanner: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  fetchingPlacesText: {
    color: 'white',
    fontSize: 12,
  },
  // Removed fab styles
  userMarkerOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(59,130,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.6)'
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB'
  },
  selectedMarkerOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(16,185,129,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.7)'
  },
  selectedMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981'
  },
  placeDetailCard: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#111827'
  },
  detailAddress: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 10,
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
  },
  detailActionSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280'
  },
  detailActionPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB'
  },
  selectionCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#111827',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#1f2937'
  },
  selectionCardGrab: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#374151',
    alignSelf: 'center',
    marginBottom: 10,
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  selectionAddress: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  secondaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryBtnText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600'
  },
  primaryBtn: {
    flex: 2,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  searchPanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10
  },
  searchInner: {
    gap: 8,
  },
  searchInput: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#374151'
  },
  searchHint: {
    fontSize: 12,
    color: '#6B7280'
  }
});
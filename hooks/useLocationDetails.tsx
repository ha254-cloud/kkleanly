import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

interface DetailedLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

interface BuildingInfo {
  name: string;
  type: string;
  category: string;
  placeId?: string;
  rating?: number;
  businessStatus?: string;
  address?: string;
  phoneNumber?: string;
  website?: string;
  photos?: string[];
  openingHours?: string[];
  priceLevel?: number;
}

interface NearbyPlace {
  name: string;
  category: string;
  type: string;
  distance: number;
  distanceText: string;
  placeId: string;
  rating?: number;
  businessStatus?: string;
  vicinity?: string;
  priceLevel?: number;
  photos?: string[];
  openingHours?: any;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    }
  };
}

interface RoadInfo {
  name: string;
  type: string; // 'route', 'street_number', 'intersection'
  fullAddress: string;
}

interface LocationDetails {
  // Address components
  streetNumber?: string;
  route?: string;
  neighborhood?: string;
  locality?: string;
  sublocality?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  
  // Enhanced location info
  placeName?: string;
  district?: string;
  area?: string;
  formatted_address?: string;
  placeId?: string;
  
  // Precision details
  accuracy?: string;
  locationType?: string;
  viewport?: any;
}

export function useLocationDetails() {
  const [location, setLocation] = useState<DetailedLocation | null>(null);
  const [locationDetails, setLocationDetails] = useState<LocationDetails>({});
  const [building, setBuilding] = useState<BuildingInfo>({ name: 'N/A', type: 'N/A', category: 'N/A' });
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Categorized nearby places
  const [nearbyBuildings, setNearbyBuildings] = useState<NearbyPlace[]>([]);
  const [nearbyShops, setNearbyShops] = useState<NearbyPlace[]>([]);
  const [nearbyLandmarks, setNearbyLandmarks] = useState<NearbyPlace[]>([]);
  const [nearbyRoads, setNearbyRoads] = useState<RoadInfo[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<NearbyPlace[]>([]);
  const [nearbyServices, setNearbyServices] = useState<NearbyPlace[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);

  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBfex94iisk3wDYRr8GyoIfxRUGzGPUhFc';

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 0.1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else if (distanceKm < 1) {
      return `${Math.round(distanceKm * 100) / 100}km`;
    } else {
      return `${Math.round(distanceKm * 10) / 10}km`;
    }
  };

  // Enhanced reverse geocoding with detailed address components
  const fetchDetailedAddress = async (latitude: number, longitude: number): Promise<LocationDetails> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=street_address|route|neighborhood|subpremise|premise&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const details: LocationDetails = {
          formatted_address: result.formatted_address,
          placeId: result.place_id,
          locationType: result.geometry?.location_type,
          viewport: result.geometry?.viewport,
        };

        // Parse address components with enhanced detail
        result.address_components?.forEach((component: any) => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            details.streetNumber = component.long_name;
          }
          if (types.includes('route')) {
            details.route = component.long_name;
          }
          if (types.includes('neighborhood') || types.includes('sublocality_level_1')) {
            details.neighborhood = component.long_name;
            details.area = component.long_name;
          }
          if (types.includes('sublocality_level_2')) {
            details.sublocality = component.long_name;
          }
          if (types.includes('locality')) {
            details.locality = component.long_name;
            details.city = component.long_name;
            details.placeName = component.long_name;
          }
          if (types.includes('administrative_area_level_2')) {
            details.county = component.long_name;
            details.district = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            details.state = component.long_name;
          }
          if (types.includes('country')) {
            details.country = component.long_name;
          }
          if (types.includes('postal_code')) {
            details.postalCode = component.long_name;
          }
        });

        return details;
      }
      return {};
    } catch (error) {
      console.error('Error fetching detailed address:', error);
      return {};
    }
  };

  // Ultra-detailed nearby places search with multiple categories
  const fetchUltraDetailedNearbyPlaces = async (latitude: number, longitude: number) => {
    try {
      // Optimized search types - focus on essential categories
      const searches = [
        // Most important categories first
        { type: 'establishment', category: 'buildings' },
        { type: 'point_of_interest', category: 'landmarks' },
        { type: 'store|shopping_mall|supermarket', category: 'shops' },
      ];

      const allPlaces: NearbyPlace[] = [];
      const buildings: NearbyPlace[] = [];
      const shops: NearbyPlace[] = [];
      const landmarks: NearbyPlace[] = [];
      const restaurants: NearbyPlace[] = [];
      const services: NearbyPlace[] = [];

      // Single radius search with optimal coverage
      const radius = 300; // meters - optimal radius for nearby buildings
      
      // Execute searches in parallel for faster results
      const searchPromises = searches.map(async (search) => {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${search.type}&rankby=distance&key=${GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();

          if (data.status === 'OK' && data.results) {
            data.results.slice(0, 10).forEach((place: any) => { // Limit to top 10 results per category
              // Avoid duplicates
              if (allPlaces.find(p => p.placeId === place.place_id)) return;

              const distance = calculateDistance(
                latitude, longitude,
                place.geometry.location.lat,
                place.geometry.location.lng
              );

              const placeInfo: NearbyPlace = {
                name: place.name,
                category: search.category,
                type: place.types?.[0]?.replace(/_/g, ' ') || search.type,
                distance,
                distanceText: formatDistance(distance),
                placeId: place.place_id,
                rating: place.rating,
                businessStatus: place.business_status,
                vicinity: place.vicinity,
                priceLevel: place.price_level,
                photos: place.photos?.[0] ? [ // Only get the first photo for faster loading
                  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
                ] : undefined,
                geometry: place.geometry,
              };

              allPlaces.push(placeInfo);

              // Categorize places
              if (search.category === 'buildings' || place.types?.includes('establishment')) {
                buildings.push(placeInfo);
              } else if (search.category === 'shops') {
                shops.push(placeInfo);
              } else if (search.category === 'landmarks') {
                landmarks.push(placeInfo);
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching ${search.type} places:`, error);
        }
      });

      // Wait for all searches to complete
      await Promise.all(searchPromises);

      // Sort by distance and remove duplicates
      const sortByDistance = (places: NearbyPlace[]) => 
        places
          .filter((place, index, self) => 
            index === self.findIndex(p => p.placeId === place.placeId)
          )
          .sort((a, b) => a.distance - b.distance);

      setNearbyBuildings(sortByDistance(buildings));
      setNearbyShops(sortByDistance(shops));
      setNearbyLandmarks(sortByDistance(landmarks));
      setNearbyRestaurants(sortByDistance(restaurants));
      setNearbyServices(sortByDistance(services));
      setNearbyPlaces(sortByDistance(allPlaces));

      console.log(`🏢 Found ${buildings.length} buildings, ${shops.length} shops, ${landmarks.length} landmarks`);

    } catch (error) {
      console.error('Error fetching ultra-detailed nearby places:', error);
    }
  };

  // Enhanced building detection with Place Details API
  const fetchBuildingDetails = async (latitude: number, longitude: number): Promise<BuildingInfo> => {
    try {
      // First, try to find the exact building at these coordinates
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=10&type=establishment&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const place = data.results[0];
        
        // Get detailed information about this place
        const detailsResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,types,formatted_address,business_status,rating,price_level,opening_hours,formatted_phone_number,website,photos&key=${GOOGLE_MAPS_API_KEY}`
        );
        const detailsData = await detailsResponse.json();

        if (detailsData.status === 'OK') {
          const details = detailsData.result;
          return {
            name: details.name || place.name,
            type: place.types?.[0]?.replace(/_/g, ' ') || 'Building',
            category: place.types?.[0] || 'establishment',
            placeId: place.place_id,
            rating: details.rating,
            businessStatus: details.business_status,
            address: details.formatted_address,
            phoneNumber: details.formatted_phone_number,
            website: details.website,
            photos: details.photos?.map((photo: any) => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
            ),
            openingHours: details.opening_hours?.weekday_text,
            priceLevel: details.price_level,
          };
        }
      }

      return { name: 'N/A', type: 'N/A', category: 'N/A' };
    } catch (error) {
      console.error('Error fetching building details:', error);
      return { name: 'N/A', type: 'N/A', category: 'N/A' };
    }
  };

  // Enhanced road detection
  const fetchNearbyRoads = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=route|street_address&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const roads: RoadInfo[] = [];

        data.results.forEach((result: any) => {
          const routeComponent = result.address_components?.find((comp: any) => 
            comp.types.includes('route')
          );
          
          if (routeComponent) {
            roads.push({
              name: routeComponent.long_name,
              type: 'route',
              fullAddress: result.formatted_address,
            });
          }
        });

        setNearbyRoads(roads);
      }
    } catch (error) {
      console.error('Error fetching nearby roads:', error);
    }
  };

  const getCurrentLocationWithDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Request high-accuracy location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Get current position with high accuracy for initial location
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 2000, // Use location up to 2 seconds old for faster results
      });

      const { latitude, longitude } = locationResult.coords;

      const detailedLocation: DetailedLocation = {
        latitude,
        longitude,
        accuracy: locationResult.coords.accuracy || 0,
        altitude: locationResult.coords.altitude || undefined,
        heading: locationResult.coords.heading || undefined,
        speed: locationResult.coords.speed || undefined,
      };

      setLocation(detailedLocation);

      // Get the address details immediately
      const addressDetails = await fetchDetailedAddress(latitude, longitude);
      setLocationDetails(addressDetails);
      
      // Update UI with address as soon as we have it
      if (addressDetails.formatted_address) {
        setAddress(addressDetails.formatted_address);
      }
      
      // Update building info immediately with basic details
      if (addressDetails.placeName) {
        setBuilding({
          name: addressDetails.placeName,
          type: 'building',
          category: 'establishment'
        });
      }
      
      // Then fetch nearby places in the background
      fetchUltraDetailedNearbyPlaces(latitude, longitude).catch(console.error);
      
      // Fetch roads in parallel
      fetchNearbyRoads(latitude, longitude).catch(console.error);

      console.log('✅ Ultra-detailed location detection completed successfully!');
      
    } catch (error) {
      console.error('❌ Enhanced location detection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to get enhanced location');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    location,
    locationDetails,
    building,
    address,
    nearbyPlaces,
    nearbyBuildings,
    nearbyShops,
    nearbyLandmarks,
    nearbyRestaurants,
    nearbyServices,
    nearbyRoads,
    loading,
    error,
    getCurrentLocationWithDetails,
    clearError,
  };
}

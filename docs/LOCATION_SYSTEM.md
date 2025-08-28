# 📍 Kleanly Location System

A complete **GPS location detection and address management system** for the Kleanly laundry app. This system provides automatic location detection, Google Geocoding integration, and user-friendly address input components.

## ✨ Features

- 🎯 **GPS Location Detection** - Automatic current location detection
- 🗺️ **Google Geocoding API** - Convert coordinates to human-readable addresses
- 🔄 **Reverse Geocoding** - Get addresses from coordinates
- 📝 **Manual Address Input** - Users can type addresses manually
- 💾 **Address Management** - Integration with saved addresses
- 🎨 **Modern UI Components** - Beautiful, accessible location picker
- ⚡ **Real-time Updates** - Instant location detection and validation

## 🏗️ Architecture

### Core Components

```
services/
├── locationService.ts      # Core location detection & geocoding
└── mapsService.ts         # Google Maps integration (existing)

hooks/
└── useLocation.ts         # React hook for location state management

components/
├── LocationPicker.tsx     # Main location input component
└── GoogleMapComponent.tsx # Map integration (existing)
```

### Data Flow

```
User Taps "Detect Location"
    ↓
LocationPicker Component
    ↓
useLocation Hook
    ↓
locationService.getCurrentAddress()
    ↓
1. Request GPS Permission
2. Get Device Coordinates
3. Call Google Geocoding API
4. Parse Address Components
    ↓
Update UI with Address
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npx expo install expo-location
npm install axios
```

### 2. Setup Google API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable **Geocoding API** and **Places API**
4. Create an API Key
5. Add to your `.env` file:

```env
EXPO_PUBLIC_GOOGLE_API_KEY=your_google_api_key_here
```

### 3. Basic Usage

```tsx
import { LocationPicker } from '../components/LocationPicker';

function MyScreen() {
  const [address, setAddress] = useState('');

  return (
    <LocationPicker
      value={address}
      onChangeText={setAddress}
      placeholder="Enter your pickup address"
      label="Pickup Location"
      showDetectButton={true}
    />
  );
}
```

## 📱 Component API

### LocationPicker

```tsx
interface LocationPickerProps {
  value: string;                    // Current address value
  onChangeText: (text: string) => void;  // Address change handler
  placeholder?: string;             // Input placeholder
  label?: string;                   // Input label
  style?: any;                     // Custom styles
  editable?: boolean;              // Enable/disable editing
  showDetectButton?: boolean;      // Show GPS detect button
}
```

### useLocation Hook

```tsx
const {
  currentAddress,      // Current detected address
  loading,            // Loading state
  error,              // Error message
  detectLocation,     // Function to detect location
  getAddressFromCoords, // Convert coords to address
  getCoordsFromAddress, // Convert address to coords
  clearError,         // Clear error state
} = useLocation();
```

## 🔧 Advanced Usage

### Custom Location Detection

```tsx
import { locationService } from '../services/locationService';

const handleCustomLocation = async () => {
  const result = await locationService.getCurrentAddress();
  
  if (result.success && result.data) {
    console.log('Address:', result.data.address);
    console.log('Coordinates:', result.data.latitude, result.data.longitude);
    console.log('Components:', result.data.components);
  } else {
    console.error('Error:', result.error);
  }
};
```

### Address Validation

```tsx
import { locationService } from '../services/locationService';

const validateAddress = async (address: string) => {
  const result = await locationService.getCoordinatesFromAddress(address);
  return result.success;
};
```

### Map Integration

```tsx
import { MapLocationPicker } from '../components/LocationPicker';

<MapLocationPicker
  value={address}
  onChangeText={setAddress}
  showMap={true}
  onLocationSelected={(location) => {
    console.log('Selected:', location);
  }}
/>
```

## 🎨 UI Examples

### Basic Input
```tsx
<LocationPicker
  value={address}
  onChangeText={setAddress}
  placeholder="Enter address"
/>
```

### With Label and Custom Style
```tsx
<LocationPicker
  value={address}
  onChangeText={setAddress}
  label="Delivery Address"
  placeholder="Where should we deliver?"
  style={{ marginBottom: 20 }}
/>
```

### Read-only Display
```tsx
<LocationPicker
  value={savedAddress}
  onChangeText={() => {}}
  editable={false}
  showDetectButton={false}
/>
```

## 🔒 Permissions

The system automatically handles location permissions:

```typescript
// Automatic permission handling
const hasPermission = await locationService.requestPermissions();

if (hasPermission) {
  // Proceed with location detection
} else {
  // Show manual input only
}
```

### Permission Types
- **Foreground** - Required for basic location detection
- **Background** - Optional, for driver tracking features

## 🌍 Geocoding Features

### Address Components

The system parses addresses into structured components:

```typescript
interface AddressComponents {
  streetNumber?: string;    // "123"
  route?: string;          // "Main Street"
  locality?: string;       // "Nairobi"
  administrativeArea?: string; // "Nairobi County"
  postalCode?: string;     // "00100"
  country?: string;        // "Kenya"
}
```

### Error Handling

```typescript
try {
  const result = await locationService.getCurrentAddress();
  if (!result.success) {
    // Handle specific errors
    switch (result.error) {
      case 'Permission denied':
        // Guide user to enable location
        break;
      case 'Network error':
        // Retry or use cached data
        break;
      default:
        // Generic error handling
    }
  }
} catch (error) {
  // Handle unexpected errors
}
```

## 🧪 Testing

### Demo Screen

Visit `/demo-location` to test all location features:

- GPS detection
- Manual address input
- Address validation
- Error handling
- Permission management

### Unit Tests

```bash
# Run location service tests
npm test locationService

# Test with mock GPS data
npm test locationService -- --mock-gps
```

## 🚨 Troubleshooting

### Common Issues

1. **"Permission denied"**
   - Ensure location permissions are granted
   - Check device location services are enabled

2. **"API key invalid"**
   - Verify Google API key is correct
   - Ensure Geocoding API is enabled
   - Check API key restrictions

3. **"Network error"**
   - Check internet connection
   - Verify API endpoints are accessible

4. **"Address not found"**
   - Try nearby locations
   - Use less specific addresses
   - Check coordinate bounds

### Debug Mode

Enable debug logging:

```env
ENABLE_DEBUG_LOGGING=true
```

## 📊 Analytics & Monitoring

### Location Metrics

The system tracks:
- Location detection success rate
- API response times
- Permission grant rates
- Error frequencies

### Performance Optimization

- Debounced API calls
- Cached responses
- Optimized permission checks
- Background location updates for drivers

## 🔮 Future Enhancements

### Planned Features

- [ ] **Offline Maps** - Cache map tiles for offline use
- [ ] **Location History** - Remember frequently used addresses
- [ ] **Smart Suggestions** - AI-powered address completion
- [ ] **Voice Input** - "Take me to nearest Kleanly center"
- [ ] **QR Code Locations** - Scan codes for instant address input

### Integration Roadmap

- [ ] **Navigation Apps** - Direct integration with Google Maps/Waze
- [ ] **Delivery Optimization** - Route planning for drivers
- [ ] **Geofencing** - Automatic location updates
- [ ] **Location Sharing** - Share pickup locations via WhatsApp

## 📄 License

Part of the Kleanly mobile application ecosystem.

---

**Ready to use! 🎉** The location system is now fully integrated into your Kleanly app. Users can tap "Detect My Location" and the app will automatically fill in their address using GPS and Google's geocoding service.

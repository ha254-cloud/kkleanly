# Google Maps API Setup Guide

## Overview

The Kleanly app uses Google Maps API for address geocoding (converting coordinates to addresses and vice versa). While the app now includes fallback mechanisms using Expo's built-in geocoding, setting up the Google API provides more accurate and detailed address information.

## Current Status

✅ **Location Detection**: Working - app can get your GPS coordinates  
⚠️ **Address Lookup**: Limited - using Expo's built-in geocoding as fallback  
❌ **Google API**: Not configured - more accurate address lookup unavailable  

## Quick Setup (Optional but Recommended)

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Geocoding API"
4. Create credentials (API Key)
5. Restrict the API key to only "Geocoding API" for security

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy from .env.example and add your API key
EXPO_PUBLIC_GOOGLE_API_KEY=your_google_maps_api_key_here
```

### 3. Restart Development Server

```bash
npx expo start --clear
```

## What Works Without Google API

The app includes robust fallback mechanisms:

1. **Expo Reverse Geocoding**: Built-in address lookup
2. **Coordinate Display**: Shows lat/lng when address lookup fails
3. **Manual Address Entry**: Users can always enter addresses manually
4. **Error Handling**: Clear messages about what's working/not working

## Benefits of Google API Setup

- More accurate address formatting
- Better international address support
- Detailed address components (street, city, postal code)
- Higher geocoding success rate

## Troubleshooting

### "Address lookup requires Google API key configuration"
This is expected behavior. The app is working correctly but using fallback methods.

### "Failed to get address from coordinates"
1. Check if Expo's geocoding worked (should show coordinate fallback)
2. Verify internet connection
3. Consider setting up Google API for better results

### Location Permission Issues
The app includes enhanced iOS permission handling and clear error messages.

## Development Notes

The location system now includes:
- Multiple geocoding fallbacks
- Enhanced error handling
- iOS/Expo Go compatibility fixes
- Detailed logging for debugging

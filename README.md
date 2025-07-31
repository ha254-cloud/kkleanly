https://stackblitz.com/storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBCRVRVamdFPSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--b142d54d429a974857fa807ade8e602c518f1df7/-README.md

A modern laundry service app built with React Native and Expo.

## 🚚 Delivery Tracking Features

### Real-time Tracking System
- **Live GPS tracking** of drivers during pickup and delivery
- **Google Maps integration** with route optimization
- **Real-time ETA updates** for customers
- **Push notifications** for order status changes
- **Background location tracking** for drivers

### Driver Management
- **Driver dashboard** with order management
- **Online/offline status** toggle
- **Route navigation** with Google/Apple Maps integration
- **Order status updates** (pickup, delivery, completion)
- **Customer communication** (call/message)

### Admin Features
- **Driver assignment** and dispatch management
- **Real-time order tracking** and monitoring
- **Driver performance** and delivery analytics
- **Route optimization** and delivery scheduling

## Features

- 🧺 **Service Selection**: Choose from various laundry services
- 📅 **Scheduling**: Book pickup and delivery times
- 📱 **Order Tracking**: Real-time order status updates
- 💳 **Secure Payments**: Integrated payment processing
- 👤 **User Profiles**: Manage personal information and preferences
- 🚚 **Live Delivery Tracking**: Real-time driver location and ETA
- 📲 **Push Notifications**: Order updates and delivery alerts
- 🗺️ **Maps Integration**: Google Maps for navigation and tracking

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Styling**: Tailwind CSS (NativeWind)
- **Icons**: Expo Vector Icons
- **Navigation**: Expo Router
- **Maps**: Google Maps API, React Google Maps
- **Location**: Expo Location with background tracking
- **Notifications**: Expo Notifications
- **Database**: Firestore for real-time updates

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd laundry-app
   cd project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Add your API keys:
   - Google Maps API key
   - Firebase configuration
   - Supabase configuration (optional)

4. Start the development server:
   ```bash
   npm start
   ```

5. Use the Expo Go app to scan the QR code and run the app on your device.

## 🔧 Configuration

### Google Maps Setup
1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Directions API
   - Distance Matrix API
   - Geocoding API
3. Add the API key to your `.env` file

### Firebase Setup (for notifications)
1. Create a Firebase project
2. Enable Cloud Messaging
3. Add your Firebase configuration to `.env`

### Location Permissions
The app requires location permissions for:
- **Foreground location**: Customer order tracking
- **Background location**: Driver location updates
- **Precise location**: Accurate delivery tracking

## Project Structure

```
laundry-app/
├── components/          # Reusable UI components
│   ├── ServiceCard.tsx
│   ├── OrderCard.tsx
│   ├── LiveTrackingMap.tsx
│   └── GoogleMapComponent.tsx
├── services/           # Business logic and API calls
│   ├── driverService.ts
│   ├── mapsService.ts
│   ├── locationService.ts
│   └── notificationService.ts
│   └── ...
├── app/                # App screens (Expo Router)
│   ├── (tabs)/         # Tab navigation screens
│   │   ├── index.tsx   # Home screen
│   │   ├── orders.tsx
│   │   ├── track.tsx
│   │   └── profile.tsx
│   ├── admin/          # Admin dashboard
│   ├── driver/         # Driver app screens
│   └── ...
│   └── ...
└── assets/             # Images, fonts, and other assets
```

## Roadmap

- Add payment integration
- Implement push notifications
- Create admin dashboard
- Add user authentication
- Implement rating and review system
- ✅ Real-time delivery tracking
- ✅ Driver management system
- ✅ Google Maps integration
- ✅ Push notifications
- ✅ Background location tracking

## Contributing
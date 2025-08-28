// Web mock for react-native-maps
import React from 'react';
import { View, Text } from 'react-native';

// Mock MapView component
export const MapView = React.forwardRef((props, ref) => {
  return (
    <View 
      ref={ref}
      style={[
        { 
          backgroundColor: '#f0f0f0', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 200 
        }, 
        props.style
      ]}
    >
      <Text style={{ color: '#666', fontSize: 14 }}>
        Map View (Web Preview)
      </Text>
    </View>
  );
});

// Mock Marker component
export const Marker = React.forwardRef((props, ref) => {
  return (
    <View 
      ref={ref}
      style={{
        position: 'absolute',
        backgroundColor: '#ff0000',
        width: 10,
        height: 10,
        borderRadius: 5,
        left: '50%',
        top: '50%',
        transform: [{ translateX: -5 }, { translateY: -5 }]
      }}
    />
  );
});

// Mock Polyline component
export const Polyline = React.forwardRef((props, ref) => {
  return null; // Don't render polyline on web
});

// Mock other exports
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

export default MapView;

import React, { useRef, useState } from 'react';
import { TouchableOpacity, StyleSheet, Linking, Alert, Animated, PanResponder, Dimensions, Vibration } from 'react-native';
import { MessageCircle, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '+254700000000', // Default Kenyan number
  message = 'Hello! I need help with my laundry service.'
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  
  // Animation values for dragging
  const pan = useRef(new Animated.ValueXY({ x: width - 80, y: height - 200 })).current;
  const [isDragging, setIsDragging] = useState(false);

  // PanResponder for drag functionality
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only start dragging if the gesture is significant enough
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
        // Provide haptic feedback when starting to drag
        Vibration.vibrate(50);
        // Set offset for smooth dragging
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        pan.flattenOffset();

        // Snap to edges for better UX
        const newX = (pan.x as any)._value;
        const newY = (pan.y as any)._value;

        // Constrain to screen bounds with padding
        const padding = 20;
        const buttonSize = 56;
        
        let constrainedX = Math.max(padding, Math.min(width - buttonSize - padding, newX));
        let constrainedY = Math.max(padding + 50, Math.min(height - buttonSize - padding - 100, newY)); // Account for status bar and tab bar

        // Snap to left or right edge
        if (constrainedX < width / 2) {
          constrainedX = padding; // Snap to left
        } else {
          constrainedX = width - buttonSize - padding; // Snap to right
        }

        // Animate to final position
        Animated.spring(pan, {
          toValue: { x: constrainedX, y: constrainedY },
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      },
    })
  ).current;
  const openWhatsApp = async () => {
    // Don't open WhatsApp if user was dragging
    if (isDragging) return;
    
    try {
      // Format phone number (remove + and spaces)
      const formattedNumber = phoneNumber.replace(/[+\s-]/g, '');
      
      // Encode the message for URL
      const encodedMessage = encodeURIComponent(message);
      
      // WhatsApp URL scheme
      const whatsappUrl = `whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`;
      
      // Check if WhatsApp is installed
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        const webWhatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
        await Linking.openURL(webWhatsappUrl);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to open WhatsApp. Please make sure WhatsApp is installed on your device.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { shadowColor: colors.primary },
        {
          transform: pan.getTranslateTransform(),
        },
        isDragging && styles.dragging,
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={openWhatsApp}
        activeOpacity={0.8}
        disabled={isDragging}
      >
        <LinearGradient
          colors={['#1E88E5', '#1976D2']} // Beautiful blue gradient inspired by your image
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Send size={20} color="#FFFFFF" strokeWidth={2.5} style={{ transform: [{ rotate: '45deg' }] }} />
        </LinearGradient>
        
        {/* Modern pulse animation ring */}
        <LinearGradient
          colors={['#1E88E540', 'transparent']}
          style={styles.pulseRing}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    zIndex: 1000,
    shadowColor: '#1E88E5',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  dragging: {
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 14,
    transform: [{ scale: 1.08 }],
  },
  touchable: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  gradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
  },
  pulseRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 72,
    height: 72,
    borderRadius: 36,
    opacity: 0.2,
    zIndex: -1,
  },
});
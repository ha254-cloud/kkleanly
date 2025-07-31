import React from 'react';
import { TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '+254700000000', // Default Kenyan number
  message = 'Hello! I need help with my laundry service.'
}) => {
  const openWhatsApp = async () => {
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
    <TouchableOpacity
      style={styles.container}
      onPress={openWhatsApp}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#25D366', '#128C7E', '#075E54']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <MessageCircle size={28} color="#FFFFFF" />
      </LinearGradient>
      
      {/* Pulse animation ring */}
      <LinearGradient
        colors={['#25D366', 'transparent']}
        style={styles.pulseRing}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    zIndex: 1000,
    shadowColor: '#25D366',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  pulseRing: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
    zIndex: -1,
  },
});
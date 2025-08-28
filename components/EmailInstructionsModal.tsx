import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const EmailInstructionsModal = ({ visible, email, onClose }) => {
  const [slideAnim] = useState(new Animated.Value(-200));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Slide down and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 60,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 1 minute (60 seconds)
      const timer = setTimeout(() => {
        handleClose();
      }, 60000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: [{ translateY: slideAnim }],
        opacity: fadeAnim,
        paddingHorizontal: 16,
      }}
    >
      <LinearGradient
        colors={['#1e3a8a', '#0891b2', '#0d9488']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 24,
          marginHorizontal: 0,
          shadowColor: '#0891b2',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        {/* Header with close button */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderRadius: 16,
              padding: 10,
              marginRight: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}>
              <Text style={{ fontSize: 22 }}>📧</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#FFFFFF',
                marginBottom: 4,
                letterSpacing: 0.5
              }}>
                Email Tips
              </Text>
              <Text style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.85)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                Kleanly Support
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={handleClose}
            style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderRadius: 24,
              padding: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Main message */}
        <Text style={{
          fontSize: 16,
          color: '#FFFFFF',
          lineHeight: 24,
          marginBottom: 20,
          opacity: 0.95,
          fontWeight: '500',
          textAlign: 'center'
        }}>
          The email might take 1-2 minutes to arrive. Check your spam folder if you don't see it in your inbox!
        </Text>

        {/* Support contact with icon */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: 16,
          padding: 18,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.15)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        }}>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: 14,
            padding: 10,
            marginRight: 16
          }}>
            <Ionicons name="mail-outline" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.9)',
              marginBottom: 4,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Need Help? Contact Support
            </Text>
            <Text style={{
              fontSize: 17,
              color: '#FFFFFF',
              fontWeight: '700',
              letterSpacing: 0.3
            }}>
              kleanlyspt@gmail.com
            </Text>
          </View>
        </View>

        {/* Bottom indicator with pulse animation */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 8
        }}>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.4)',
            height: 4,
            width: 50,
            borderRadius: 2
          }} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default EmailInstructionsModal;

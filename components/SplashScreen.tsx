import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, ImageBackground, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number; // optional override
}

export default function SplashScreen({ onFinish, durationMs = 1500 }: SplashScreenProps) {
  useEffect(() => {
    const t = setTimeout(() => {
      onFinish && onFinish();
    }, durationMs);

    return () => clearTimeout(t);
  }, [onFinish, durationMs]);

  return (
    <ImageBackground
      source={require('../assets/images/space.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Kleanly — Loading</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

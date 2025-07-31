import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  showText = true 
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 70, height: 70 },
          image: { width: 70, height: 70 },
          text: { fontSize: 16, marginTop: 4 },
        };
      case 'medium':
        return {
          container: { width: 110, height: 110 },
          image: { width: 110, height: 110 },
          text: { fontSize: 20, marginTop: 8 },
        };
      case 'large':
        return {
          container: { width: 160, height: 160 },
          image: { width: 160, height: 160 },
          text: { fontSize: 24, marginTop: 12 },
        };
      default:
        return {
          container: { width: 110, height: 110 },
          image: { width: 110, height: 110 },
          text: { fontSize: 20, marginTop: 8 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={styles.logoContainer}>
      <View style={[styles.imageContainer, sizeStyles.container]}>
        <Image
          source={require('../../assets/images/image.png')}
          style={[styles.logoImage, sizeStyles.image]}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <Text style={[styles.logoText, { color: colors.text }, sizeStyles.text]}>
          Kleanly
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1A3D63',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoImage: {
    borderRadius: 16,
  },
  logoText: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
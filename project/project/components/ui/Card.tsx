import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'medium',
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 16,
      backgroundColor: colors.card,
    };

    const paddingStyles = {
      none: { padding: 0 },
      small: { padding: 12 },
      medium: { padding: 16 },
      large: { padding: 24 },
    };

    const variantStyles = {
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
      elevated: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
      },
      outlined: {
        borderWidth: 1,
        borderColor: colors.border,
        shadowOpacity: 0,
        elevation: 0,
      },
    };

    return {
      ...baseStyle,
      ...paddingStyles[padding],
      ...variantStyles[variant],
    };
  };

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};
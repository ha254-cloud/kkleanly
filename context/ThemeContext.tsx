import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export type Theme = 'light' | 'dark' | 'system';

interface Colors {
  // Background colors
  background: string;
  surface: string;
  surfaceElevated: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textOnDark: string;
  
  // Primary colors
  primary: string;
  primaryDark: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  
  // Border and divider
  border: string;
  divider: string;
  
  // Gradients
  gradient: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: Colors;
  setTheme: (theme: Theme) => void;
}

const lightColors: Colors = {
  background: '#F6FAFD',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#0A1931',
  textSecondary: '#4A7FA7',
  textOnDark: '#FFFFFF',
  primary: '#0A1931',
  primaryDark: '#1A3D63',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#B3CFE5',
  divider: '#E5E7EB',
  gradient: {
    primary: ['#0A1931', '#1A3D63'],
    secondary: ['#4A7FA7', '#B3CFE5'],
    accent: ['#F6FAFD', '#B3CFE5'],
  },
};

const darkColors: Colors = {
  background: '#0A1931',
  surface: '#1A3D63',
  surfaceElevated: '#2A4D73',
  text: '#F6FAFD',
  textSecondary: '#B3CFE5',
  textOnDark: '#FFFFFF',
  primary: '#4A7FA7',
  primaryDark: '#0A1931',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#4A7FA7',
  divider: '#374151',
  gradient: {
    primary: ['#4A7FA7', '#1A3D63'],
    secondary: ['#B3CFE5', '#4A7FA7'],
    accent: ['#1A3D63', '#0A1931'],
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('system');
  const systemTheme = useColorScheme();

  const isDark = theme === 'system' 
    ? systemTheme === 'dark' 
    : theme === 'dark';

  const colors = isDark ? darkColors : lightColors;

  const value: ThemeContextType = {
    theme,
    isDark,
    colors,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
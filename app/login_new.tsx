import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Sparkles, Shield, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Logo } from '../components/ui/Logo';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { login, register, loading } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const scrollY = new Animated.Value(0);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      let errorMessage = error.message;
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account already exists with this email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid login credentials. Please check your email and password.';
      } else {
        errorMessage = isLogin 
          ? 'Failed to login. Please try again.' 
          : 'Failed to create account. Please try again.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  if (loading) {
    return <LoadingSpinner text={isLogin ? 'Signing in...' : 'Creating account...'} />;
  }

  const logoScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const logoOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [300, 150],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={require('../assets/images/space.jpg')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.overlay} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            {/* Animated Header Section */}
            <Animated.View style={[styles.headerSection, { height: headerHeight }]}>
              <Animated.View 
                style={[
                  styles.logoContainer,
                  {
                    transform: [{ scale: logoScale }],
                    opacity: logoOpacity,
                  }
                ]}
              >
                <View style={styles.logoWrapper}>
                  <Logo size="large" showText={false} />
                  <View style={[styles.logoGlow, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
                  <View style={[styles.logoRing, { borderColor: 'rgba(255,255,255,0.2)' }]} />
                </View>
                
                <View style={styles.brandSection}>
                  <Text style={styles.brandName}>KLEANLY</Text>
                  <Text style={styles.tagline}>Premium Laundry & Dry Cleaning</Text>
                  
                  <View style={styles.featuresContainer}>
                    <View style={styles.featureItem}>
                      <Shield size={14} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.featureText}>Trusted</Text>
                    </View>
                    <View style={styles.featureDivider} />
                    <View style={styles.featureItem}>
                      <Sparkles size={14} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.featureText}>Premium</Text>
                    </View>
                    <View style={styles.featureDivider} />
                    <View style={styles.featureItem}>
                      <Shield size={14} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.featureText}>Secure</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            </Animated.View>

            {/* Login Form */}
            <View style={styles.formSection}>
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)', 'rgba(248,250,255,0.95)']}
                style={styles.formGradient}
              >
                <Card style={styles.formCard}>
                  <View style={styles.formHeader}>
                    <Text style={[styles.formTitle, { color: colors.text }]}>
                      {isLogin ? '  Welcome Back' : ' Join Kleanly'}
                    </Text>
                    <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
                      {isLogin 
                        ? 'Sign in to access your premium laundry services' 
                        : 'Create your account for premium laundry services'
                      }
                    </Text>
                  </View>

                  <View style={styles.inputsContainer}>
                    <Input
                      label="Email Address"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      leftIcon={<Mail size={20} color={colors.textSecondary} />}
                    />

                    <Input
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      leftIcon={<Lock size={20} color={colors.textSecondary} />}
                      rightIcon={
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          {showPassword ? (
                            <EyeOff size={20} color={colors.textSecondary} />
                          ) : (
                            <Eye size={20} color={colors.textSecondary} />
                          )}
                        </TouchableOpacity>
                      }
                    />

                    {!isLogin && (
                      <Input
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm your password"
                        secureTextEntry={!showConfirmPassword}
                        leftIcon={<Lock size={20} color={colors.textSecondary} />}
                        rightIcon={
                          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? (
                              <EyeOff size={20} color={colors.textSecondary} />
                            ) : (
                              <Eye size={20} color={colors.textSecondary} />
                            )}
                          </TouchableOpacity>
                        }
                      />
                    )}
                  </View>

                  <LinearGradient
                    colors={[colors.primary, colors.primary + 'F0', colors.primary + 'E6']}
                    style={styles.submitButtonGradient}
                  >
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleSubmit}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.submitButtonText}>
                        {isLogin ? '  Sign In' : ' Create Account'}
                      </Text>
                    </TouchableOpacity>
                  </LinearGradient>

                  {/* Admin Quick Login */}
                  {isLogin && (
                    <TouchableOpacity
                      style={[styles.adminQuickLogin, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '08' }]}
                      onPress={() => {
                        setEmail('kleanlyspt@gmail.com');
                        setPassword('KleanlyAdmin2025!');
                      }}
                      activeOpacity={0.7}
                    >
                      <Shield size={16} color={colors.primary} />
                      <Text style={[styles.adminQuickLoginText, { color: colors.primary }]}>
                        Quick Admin Login
                      </Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.switchMode}>
                    <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                      {isLogin ? "Don't have an account?" : 'Already have an account?'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setIsLogin(!isLogin)}
                      style={[styles.switchButton, { backgroundColor: colors.primary + '15' }]}
                    >
                      <Text style={[styles.switchButtonText, { color: colors.primary }]}>
                        {isLogin ? 'Sign Up' : 'Sign In'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              </LinearGradient>
            </View>

            {/* Features Section */}
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  
  // Header Section
  headerSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
    zIndex: -1,
  },
  logoRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    opacity: 0.3,
    zIndex: -1,
  },
  brandSection: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  featureDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  
  // Form Section
  formSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGradient: {
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  formCard: {
    padding: 32,
    borderRadius: 32,
    backgroundColor: 'transparent',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  inputsContainer: {
    marginBottom: 24,
  },
  submitButtonGradient: {
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#1A3D63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  adminQuickLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  adminQuickLoginText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchMode: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  switchText: {
    fontSize: 15,
    fontWeight: '500',
  },
  switchButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  switchButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

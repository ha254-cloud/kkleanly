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
  Modal,
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
import EmailInstructionsModal from '../components/EmailInstructionsModal';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showEmailInstructions, setShowEmailInstructions] = useState(false);
  const [sentEmailAddress, setSentEmailAddress] = useState('');
  
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
        router.replace('/(tabs)');
      } else {
        await register(email, password);
        router.replace('/(tabs)');
      }
    } catch (error) {
      let errorMessage = '';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const knownAuthErrors = [
          'auth/invalid-credential',
          'auth/user-not-found',
          'auth/wrong-password',
          'auth/email-already-in-use',
          'auth/weak-password',
          'auth/invalid-email',
          'auth/operation-not-allowed'
        ];
        
        if (!knownAuthErrors.includes(error.code)) {
          console.error('Unexpected auth error:', error);
        }
        
        switch (error.code) {
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please check your credentials.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/Password sign-in is not enabled. Please contact support.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please choose a stronger password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          default:
            errorMessage = isLogin 
              ? 'Failed to login. Please try again.' 
              : 'Failed to create account. Please try again.';
        }
      } else {
        console.error('Unexpected auth error:', error);
        errorMessage = isLogin 
          ? 'Failed to login. Please try again.' 
          : 'Failed to create account. Please try again.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!resetEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setResetLoading(true);
    
    try {
      // Use enhanced Firebase email service
      const enhancedEmailModule = await import('../services/enhancedFirebaseEmailService');
      const emailService = new enhancedEmailModule.EnhancedFirebaseEmailService();
      
      const result = await emailService.sendEnhancedPasswordResetEmail(resetEmail);
      
      if (result.success) {
        // Show the email instructions modal instead of a simple alert
        setSentEmailAddress(resetEmail);
        setShowEmailInstructions(true);
        setShowForgotPassword(false);
        setResetEmail('');
      } else {
        throw new Error(result.error || 'Email sending failed');
      }
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error?.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setResetLoading(false);
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

                  {/* Forgot Password Button - Only show in login mode */}
                  {isLogin && (
                    <TouchableOpacity
                      onPress={() => setShowForgotPassword(true)}
                      style={styles.forgotPasswordButton}
                    >
                      <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                        Forgot Password?
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

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Reset Password
            </Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
            
            <Input
              placeholder="Enter your email"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.modalInput}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowForgotPassword(false)}
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={resetLoading}
                style={[styles.modalButton, styles.resetButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.resetButtonText}>
                  {resetLoading ? 'Sending...' : 'Send Link'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Instructions Modal */}
      <EmailInstructionsModal
        visible={showEmailInstructions}
        email={sentEmailAddress}
        onClose={() => setShowEmailInstructions(false)}
      />

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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  switchButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalInput: {
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    // backgroundColor set dynamically
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
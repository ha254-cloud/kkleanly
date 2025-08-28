import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Save, User, Mail, Phone, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import userProfileService, { UserProfile } from '../../services/userProfileService';

export default function PersonalInfoScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const userProfile = await userProfileService.getUserProfile(user.uid);
      setProfile(userProfile);
      setFormData({
        firstName: userProfile?.firstName || '',
        lastName: userProfile?.lastName || '',
        phone: userProfile?.phone || '',
        dateOfBirth: userProfile?.dateOfBirth || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    
    try {
      setSaving(true);
      await userProfileService.updateUserProfile(user.uid, formData);
      
      // Update local profile state to reflect changes immediately
      if (profile) {
        setProfile({
          ...profile,
          ...formData,
          updatedAt: new Date(),
        });
      }
      
      Alert.alert(
        'Success', 
        'Profile updated successfully', 
        [
          {
            text: 'Stay Here',
            style: 'cancel'
          },
          {
            text: 'Go Back',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loading}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Modern Premium Header */}
      <LinearGradient
        colors={['#1A365D', '#2D3748', '#4A5568']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <View style={styles.backButtonContainer}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Personal Information</Text>
          <Text style={styles.headerSubtitle}>Keep your profile current and accurate</Text>
        </View>
        <View style={styles.placeholder} />
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <Card style={styles.formCard}>
            <LinearGradient
              colors={isDark ? ['#1F2937', '#374151'] : ['#FFFFFF', '#F8FAFC']}
              style={styles.formCardGradient}
            >
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <View style={styles.inputIconContainer}>
                    <User size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={formData.firstName}
                    onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                    placeholder="Enter your first name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <View style={styles.inputIconContainer}>
                    <User size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={formData.lastName}
                    onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                    placeholder="Enter your last name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
                <View style={[styles.inputContainer, styles.disabledInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <View style={styles.inputIconContainer}>
                    <Mail size={22} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.textSecondary }]}
                    value={user?.email || ''}
                    editable={false}
                    placeholder="Email address"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  Email address cannot be modified for security reasons
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <View style={styles.inputIconContainer}>
                    <Phone size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    placeholder="e.g., +254 700 000 000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Date of Birth</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <View style={styles.inputIconContainer}>
                    <Calendar size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={formData.dateOfBirth}
                    onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  Format: Year-Month-Day (e.g., 1990-12-25)
                </Text>
              </View>
            </LinearGradient>
          </Card>

          <View style={styles.buttonContainer}>
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveButtonGradient}
            >
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                activeOpacity={0.8}
              >
                <Save size={22} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {saving ? "Saving Changes..." : "Save Profile"}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  placeholder: {
    width: 40,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    padding: 0,
    marginBottom: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  formCardGradient: {
    padding: 28,
    borderRadius: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  disabledInput: {
    opacity: 0.6,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: 16,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginBottom: 40,
    paddingHorizontal: 4,
  },
  saveButtonGradient: {
    borderRadius: 20,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    gap: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
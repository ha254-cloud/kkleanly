import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, User, Mail, Phone, MapPin, Save } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function PersonalInfoScreen() {
  const { user } = useAuth();
  const colors = Colors.light;
  
  const [formData, setFormData] = useState({
    name: user?.displayName || user?.email?.split('@')[0] || '',
    email: user?.email || '',
    phone: '',
    address: '',
  });

  const handleSave = () => {
    Alert.alert(
      'Profile Updated',
      'Your personal information has been updated successfully.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primary + 'E6']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={{ width: 24 }} />
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
            <View style={styles.formHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <User size={24} color={colors.primary} />
              </View>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                Update Your Profile
              </Text>
              <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
                Keep your information up to date for better service
              </Text>
            </View>

            <Input
              label="Full Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter your full name"
              leftIcon={<User size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Email Address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter your email"
              keyboardType="email-address"
              leftIcon={<Mail size={20} color={colors.textSecondary} />}
              editable={false}
            />

            <Input
              label="Phone Number"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="+254 700 000 000"
              keyboardType="phone-pad"
              leftIcon={<Phone size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Default Address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Enter your default delivery address"
              leftIcon={<MapPin size={20} color={colors.textSecondary} />}
            />

            <LinearGradient
              colors={[colors.primary, colors.primary + 'E6']}
              style={styles.saveButtonGradient}
            >
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    padding: 24,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  saveButtonGradient: {
    borderRadius: 16,
    marginTop: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Linking } from 'react-native';
import { MessageCircle, Phone, Mail } from 'lucide-react-native';

interface DriverCredentialSharingProps {
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  temporaryPassword: string;
  onClose: () => void;
}

export const DriverCredentialSharing: React.FC<DriverCredentialSharingProps> = ({
  driverName,
  driverEmail,
  driverPhone,
  temporaryPassword,
  onClose
}) => {

  const loginMessage = `🚚 KLEANLY DRIVER ACCOUNT

Hello ${driverName}!

Your driver account is ready:

📧 Email: ${driverEmail}
🔑 Password: ${temporaryPassword}

📱 Get Started:
1. Open the Kleanly app
2. Login with your credentials
3. Go to Driver Dashboard (/driver)
4. Toggle to "Available" to receive orders

Change your password after first login.

Welcome to Kleanly! 🎉`;

  const showCredentials = () => {
    // Show the message for manual viewing/copying
    Alert.alert(
      '📋 Login Details', 
      loginMessage,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const sendWhatsApp = async () => {
    try {
      const phoneNumber = driverPhone.replace(/[^0-9]/g, ''); // Remove non-numeric characters
      const encodedMessage = encodeURIComponent(loginMessage);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('WhatsApp Not Available', 'WhatsApp is not installed on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  const sendSMS = async () => {
    try {
      const smsMessage = `KLEANLY DRIVER LOGIN\n\nHi ${driverName}!\n\nEmail: ${driverEmail}\nPassword: ${temporaryPassword}\n\nLogin at the app and go to /driver to start.\n\nWelcome to Kleanly!`;
      const smsUrl = `sms:${driverPhone}?body=${encodeURIComponent(smsMessage)}`;
      
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('SMS Not Available', 'SMS functionality is not available');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open SMS');
    }
  };

  const sendEmail = async () => {
    try {
      const subject = encodeURIComponent('Your Kleanly Driver Account Details');
      const body = encodeURIComponent(loginMessage);
      const emailUrl = `mailto:${driverEmail}?subject=${subject}&body=${body}`;
      
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert('Email Not Available', 'Email app is not available');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open email');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📧 Share Driver Credentials</Text>
      <Text style={styles.subtitle}>
        Send login details to {driverName}
      </Text>

      <View style={styles.credentialsCard}>
        <Text style={styles.credentialLabel}>📧 Email:</Text>
        <Text style={styles.credentialValue}>{driverEmail}</Text>
        
        <Text style={styles.credentialLabel}>🔑 Password:</Text>
        <Text style={styles.credentialValue}>{temporaryPassword}</Text>
        
        <Text style={styles.credentialLabel}>📱 Phone:</Text>
        <Text style={styles.credentialValue}>{driverPhone}</Text>
      </View>

      <Text style={styles.sectionTitle}>Choose sharing method:</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.shareButton, styles.whatsappButton]} onPress={sendWhatsApp}>
          <MessageCircle size={20} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.shareButton, styles.smsButton]} onPress={sendSMS}>
          <Phone size={20} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>SMS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.shareButton, styles.emailButton]} onPress={sendEmail}>
          <Mail size={20} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Email</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.shareButton, styles.viewButton]} onPress={showCredentials}>
          <Text style={styles.shareButtonText}>📋 View Details</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  credentialsCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  credentialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  credentialValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    minWidth: '45%',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  smsButton: {
    backgroundColor: '#007AFF',
  },
  emailButton: {
    backgroundColor: '#FF9500',
  },
  viewButton: {
    backgroundColor: '#6C757D',
  },
  closeButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

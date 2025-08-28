import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  CircleHelp as HelpCircle,
  ChevronRight,
  ExternalLink
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';

interface FAQ {
  question: string;
  answer: string;
}

export default function HelpSupportScreen() {
  const colors = Colors.light;

  const faqs: FAQ[] = [
    {
      question: 'How long does it take to clean my clothes?',
      answer: 'Standard wash & fold takes 24-48 hours. Dry cleaning takes 2-3 days. Express service available for urgent orders.',
    },
    {
      question: 'What areas do you deliver to?',
      answer: 'We currently serve Nairobi and surrounding areas including Westlands, Karen, Kilimani, and CBD. Check our coverage map for details.',
    },
    {
      question: 'How do I track my order?',
      answer: 'Use the Track Orders section in the app or enter your order ID. You\'ll receive SMS updates at each stage.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept M-Pesa, Visa/Mastercard, and cash on delivery. All payments are secure and encrypted.',
    },
    {
      question: 'What if I\'m not satisfied with the service?',
      answer: 'We offer a 100% satisfaction guarantee. Contact us within 24 hours and we\'ll re-clean your items for free.',
    },
  ];

  const contactMethods = [
    {
      icon: <MessageCircle size={24} color={colors.success} />,
      title: 'WhatsApp Chat',
      subtitle: 'Quick responses, 24/7 available',
      action: () => openWhatsApp(),
      color: colors.success,
    },
    {
      icon: <Phone size={24} color={colors.primary} />,
      title: 'Call Us',
      subtitle: '+254 700 000 000',
      action: () => makePhoneCall(),
      color: colors.primary,
    },
    {
      icon: <Mail size={24} color={colors.warning} />,
      title: 'Email Support',
      subtitle: 'kleanlyspt@gmail.com',
      action: () => sendEmail(),
      color: colors.warning,
    },
  ];

  const openWhatsApp = async () => {
    const phoneNumber = '+254714648622';
    const message = 'Hello Kleanly! I need help with my account.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open WhatsApp');
    }
  };

  const makePhoneCall = () => {
    Linking.openURL('tel:+254714648622');
  };

  const sendEmail = () => {
    Linking.openURL('mailto:kleanlyspt@gmail.com?subject=Support Request');
  };

  const handleFAQPress = (faq: FAQ) => {
    Alert.alert(faq.question, faq.answer, [{ text: 'Got it!' }]);
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Get help or contact our support team
        </Text>

        {/* Contact Methods */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Contact Us
        </Text>
        {contactMethods.map((method, index) => (
          <TouchableOpacity
            key={index}
            onPress={method.action}
            style={styles.contactMethodWrapper}
          >
            <Card style={styles.contactMethod}>
              <View style={styles.contactContent}>
                <View style={[styles.contactIcon, { backgroundColor: method.color + '20' }]}>
                  {method.icon}
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactTitle, { color: colors.text }]}>
                    {method.title}
                  </Text>
                  <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
                    {method.subtitle}
                  </Text>
                </View>
                <ExternalLink size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Business Hours */}
        <Card style={styles.hoursCard}>
          <View style={styles.hoursHeader}>
            <View style={[styles.clockIcon, { backgroundColor: colors.warning + '20' }]}>
              <Clock size={24} color={colors.warning} />
            </View>
            <Text style={[styles.hoursTitle, { color: colors.text }]}>
              Business Hours
            </Text>
          </View>
          <View style={styles.hoursList}>
            <View style={styles.hoursItem}>
              <Text style={[styles.hoursDay, { color: colors.text }]}>Monday - Friday</Text>
              <Text style={[styles.hoursTime, { color: colors.textSecondary }]}>8:00 AM - 8:00 PM</Text>
            </View>
            <View style={styles.hoursItem}>
              <Text style={[styles.hoursDay, { color: colors.text }]}>Saturday</Text>
              <Text style={[styles.hoursTime, { color: colors.textSecondary }]}>9:00 AM - 6:00 PM</Text>
            </View>
            <View style={styles.hoursItem}>
              <Text style={[styles.hoursDay, { color: colors.text }]}>Sunday</Text>
              <Text style={[styles.hoursTime, { color: colors.error }]}>Closed</Text>
            </View>
          </View>
        </Card>

        {/* FAQs */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Frequently Asked Questions
        </Text>
        {faqs.map((faq, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleFAQPress(faq)}
            style={styles.faqWrapper}
          >
            <Card style={styles.faqCard}>
              <View style={styles.faqContent}>
                <View style={[styles.faqIcon, { backgroundColor: colors.primary + '20' }]}>
                  <HelpCircle size={20} color={colors.primary} />
                </View>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>
                  {faq.question}
                </Text>
                <ChevronRight size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Emergency Contact */}
        <Card style={styles.emergencyCard}>
          <LinearGradient
            colors={[colors.error + '15', colors.error + '08']}
            style={styles.emergencyGradient}
          >
            <Text style={[styles.emergencyTitle, { color: colors.error }]}>
              🚨 Emergency Contact
            </Text>
            <Text style={[styles.emergencyText, { color: colors.textSecondary }]}>
              For urgent issues outside business hours, call our emergency line:
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('tel:+254700000001')}
              style={[styles.emergencyButton, { backgroundColor: colors.error }]}
            >
              <Phone size={16} color="#FFFFFF" />
              <Text style={styles.emergencyButtonText}>+254 700 000 001</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 8,
  },
  contactMethodWrapper: {
    marginBottom: 12,
  },
  contactMethod: {
    padding: 20,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
  },
  hoursCard: {
    padding: 20,
    marginBottom: 24,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  hoursTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  hoursList: {
    gap: 12,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursDay: {
    fontSize: 16,
    fontWeight: '600',
  },
  hoursTime: {
    fontSize: 16,
  },
  faqWrapper: {
    marginBottom: 12,
  },
  faqCard: {
    padding: 20,
  },
  faqContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  emergencyCard: {
    marginTop: 24,
    overflow: 'hidden',
  },
  emergencyGradient: {
    padding: 20,
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  emergencyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Heart, 
  Users, 
  Award, 
  Leaf, 
  Shield, 
  Clock,
  ExternalLink,
  MapPin
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Logo } from '../../components/ui/Logo';

export default function AboutScreen() {
  const colors = Colors.light;

  const values = [
    {
      icon: <Heart size={24} color={colors.error} />,
      title: 'Customer First',
      description: 'Your satisfaction is our top priority',
      color: colors.error,
    },
    {
      icon: <Award size={24} color={colors.warning} />,
      title: 'Quality Service',
      description: 'Premium care for all your garments',
      color: colors.warning,
    },
    {
      icon: <Leaf size={24} color={colors.success} />,
      title: 'Eco-Friendly',
      description: 'Sustainable cleaning practices',
      color: colors.success,
    },
    {
      icon: <Shield size={24} color={colors.primary} />,
      title: 'Trust & Security',
      description: 'Safe handling of your belongings',
      color: colors.primary,
    },
  ];

  const stats = [
    { number: '10,000+', label: 'Happy Customers' },
    { number: '50,000+', label: 'Orders Completed' },
    { number: '4.9★', label: 'Average Rating' },
    { number: '24/7', label: 'Customer Support' },
  ];

  const openWebsite = () => {
    Linking.openURL('https://kleanly.co.ke');
  };

  const openLocation = () => {
    Linking.openURL('https://maps.google.com/?q=Nairobi,Kenya');
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
        <Text style={styles.headerTitle}>About Kleanly</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Company Logo & Intro */}
        <Card style={styles.introCard}>
          <View style={styles.logoSection}>
            <Logo size="large" showText={true} />
          </View>
          <Text style={[styles.introTitle, { color: colors.text }]}>
            Premium Laundry & Dry Cleaning
          </Text>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            Kleanly is your trusted partner for convenient, reliable, and high-quality laundry services. 
            We are committed to making your life easier, one clean load at a time.
          </Text>
        </Card>

        {/* Our Story */}
        <Card style={styles.storyCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📖 Our Story
          </Text>
          <Text style={[styles.storyText, { color: colors.textSecondary }]}>
            Founded in 2024, Kleanly started with a simple mission: to provide busy professionals 
            and families in Nairobi with premium laundry services that save time without compromising quality.
            {'\n\n'}
            What began as a small local service has grown into the city's most trusted laundry partner, 
            serving thousands of satisfied customers across Nairobi and its environs.
          </Text>
        </Card>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <LinearGradient
              key={index}
              colors={[colors.primary + '15', colors.primary + '08']}
              style={styles.statCard}
            >
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {stat.number}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
            </LinearGradient>
          ))}
        </View>

        {/* Our Values */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Our Core Values
        </Text>
        <View style={styles.valuesContainer}>
          {values.map((value, index) => (
            <Card key={index} style={styles.valueCard}>
              <View style={[styles.valueIcon, { backgroundColor: value.color + '20' }]}>
                {value.icon}
              </View>
              <Text style={[styles.valueTitle, { color: colors.text }]}>
                {value.title}
              </Text>
              <Text style={[styles.valueDescription, { color: colors.textSecondary }]}>
                {value.description}
              </Text>
            </Card>
          ))}
        </View>

        {/* Services Overview */}
        <Card style={styles.servicesCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Our Premium Services
          </Text>
          <View style={styles.servicesList}>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceBullet}>•</Text>
              <Text style={[styles.serviceText, { color: colors.textSecondary }]}>
                Professional wash & fold services
              </Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceBullet}>•</Text>
              <Text style={[styles.serviceText, { color: colors.textSecondary }]}>
                Premium dry cleaning for delicate items
              </Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceBullet}>•</Text>
              <Text style={[styles.serviceText, { color: colors.textSecondary }]}>
                Expert ironing and pressing
              </Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceBullet}>•</Text>
              <Text style={[styles.serviceText, { color: colors.textSecondary }]}>
                Specialized shoe cleaning services
              </Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceBullet}>•</Text>
              <Text style={[styles.serviceText, { color: colors.textSecondary }]}>
                Free pickup and delivery
              </Text>
            </View>
          </View>
        </Card>

        {/* Contact Info */}
        <Card style={styles.contactCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Visit Our Location
          </Text>
          <TouchableOpacity onPress={openLocation} style={styles.contactItem}>
            <MapPin size={20} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]}>
              Nairobi, Kenya
            </Text>
            <ExternalLink size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={openWebsite} style={styles.contactItem}>
            <ExternalLink size={20} color={colors.success} />
            <Text style={[styles.contactText, { color: colors.text }]}>
              www.kleanly.co.ke
            </Text>
            <ExternalLink size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Team */}
        <Card style={styles.teamCard}>
          <View style={styles.teamHeader}>
            <View style={[styles.teamIcon, { backgroundColor: colors.success + '20' }]}>
              <Users size={32} color={colors.success} />
            </View>
            <Text style={[styles.teamTitle, { color: colors.text }]}>
              Our Team
            </Text>
          </View>
          <Text style={[styles.teamText, { color: colors.textSecondary }]}>
            Behind Kleanly is a dedicated team of laundry professionals, customer service experts, 
            and logistics specialists who work tirelessly to ensure your clothes receive the best care possible.
            {'\n\n'}
            Every team member is trained in the latest cleaning techniques and committed to delivering 
            exceptional service that exceeds your expectations.
          </Text>
        </Card>

        {/* App Version */}
        <View style={styles.versionInfo}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Kleanly Mobile App v1.0.0
          </Text>
          <Text style={[styles.copyrightText, { color: colors.textSecondary }]}>
            © 2024 Kleanly. All rights reserved.
          </Text>
        </View>
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
  introCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoSection: {
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  storyCard: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  storyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  valuesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  valueCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    alignItems: 'center',
  },
  valueIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  valueDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  servicesCard: {
    padding: 20,
    marginBottom: 20,
  },
  servicesList: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  serviceBullet: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  serviceText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  contactCard: {
    padding: 20,
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  contactText: {
    fontSize: 16,
    flex: 1,
  },
  teamCard: {
    padding: 20,
    marginBottom: 20,
  },
  teamHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  teamIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  teamTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  teamText: {
    fontSize: 16,
    lineHeight: 24,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
  },
});
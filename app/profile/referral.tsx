import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Gift, Users, Share2, Copy, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';

export default function ReferralScreen() {
  const colors = Colors.light;
  const [referralCode] = useState('KLEANLY2024');
  const [referralStats] = useState({
    totalReferrals: 5,
    successfulReferrals: 3,
    totalEarnings: 600,
    pendingEarnings: 200,
  });

  const handleShareReferral = async () => {
    try {
      const message = `Join me on Kleanly for premium laundry services! Use my referral code ${referralCode} and get KSH 100 off your first order. Download the app now!`;
      
      await Share.share({
        message,
        title: 'Join Kleanly - Premium Laundry Service',
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share referral code');
    }
  };

  const handleCopyCode = () => {
    Clipboard.setString(referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
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
        <Text style={styles.headerTitle}>Referral Program</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Referral Code Card */}
        <LinearGradient
          colors={[colors.success + '15', colors.success + '08']}
          style={styles.codeCardGradient}
        >
          <Card style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <View style={[styles.giftIcon, { backgroundColor: colors.success + '20' }]}>
                <Gift size={32} color={colors.success} />
              </View>
              <Text style={[styles.codeTitle, { color: colors.text }]}>
                Your Referral Code
              </Text>
              <Text style={[styles.codeSubtitle, { color: colors.textSecondary }]}>
                Share with friends and earn rewards
              </Text>
            </View>

            <View style={[styles.codeContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.codeText, { color: colors.primary }]}>
                {referralCode}
              </Text>
              <TouchableOpacity
                onPress={handleCopyCode}
                style={[styles.copyButton, { backgroundColor: colors.primary + '20' }]}
              >
                <Copy size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <LinearGradient
              colors={[colors.primary, colors.primary + 'E6']}
              style={styles.shareButtonGradient}
            >
              <TouchableOpacity style={styles.shareButton} onPress={handleShareReferral}>
                <Share2 size={20} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share Code</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Card>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
              <Users size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {referralStats.totalReferrals}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Referrals
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
              <Star size={20} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {referralStats.successfulReferrals}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Successful
            </Text>
          </Card>
        </View>

        {/* Earnings Card */}
        <Card style={styles.earningsCard}>
          <Text style={[styles.earningsTitle, { color: colors.text }]}>
            💰 Your Earnings
          </Text>
          <View style={styles.earningsContent}>
            <View style={styles.earningItem}>
              <Text style={[styles.earningLabel, { color: colors.textSecondary }]}>
                Total Earned:
              </Text>
              <Text style={[styles.earningValue, { color: colors.success }]}>
                KSH {(referralStats.totalEarnings || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={[styles.earningLabel, { color: colors.textSecondary }]}>
                Pending:
              </Text>
              <Text style={[styles.earningValue, { color: colors.warning }]}>
                KSH {(referralStats.pendingEarnings || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </Card>

        {/* How It Works */}
        <Card style={styles.howItWorksCard}>
          <Text style={[styles.howItWorksTitle, { color: colors.text }]}>
            🎯 How It Works
          </Text>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Share your referral code with friends
              </Text>
            </View>
            
            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                They sign up and place their first order
              </Text>
            </View>
            
            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                You both get KSH 200 credit!
              </Text>
            </View>
          </View>
        </Card>

        {/* Terms */}
        <Card style={styles.termsCard}>
          <Text style={[styles.termsTitle, { color: colors.text }]}>
            📋 Terms & Conditions
          </Text>
          <Text style={[styles.termsText, { color: colors.textSecondary }]}>
            • Referral rewards are credited after successful order completion{'\n'}
            • Maximum 10 referrals per month{'\n'}
            • Credits expire after 6 months if unused{'\n'}
            • Cannot be combined with other promotional offers{'\n'}
            • Kleanly reserves the right to modify terms
          </Text>
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
  codeCardGradient: {
    borderRadius: 24,
    marginBottom: 20,
  },
  codeCard: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  codeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  giftIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  codeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  codeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonGradient: {
    borderRadius: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  earningsCard: {
    padding: 20,
    marginBottom: 20,
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  earningsContent: {
    gap: 12,
  },
  earningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningLabel: {
    fontSize: 16,
  },
  earningValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  howItWorksCard: {
    padding: 20,
    marginBottom: 20,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 16,
    flex: 1,
  },
  termsCard: {
    padding: 20,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
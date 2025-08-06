import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Star, Send, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';

export default function RateReviewScreen() {
  const colors = Colors.light;
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const handleStarPress = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmitReview = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    Alert.alert(
      'Thank You!',
      `Your ${rating}-star review has been submitted. We appreciate your feedback!`,
      [
        {
          text: 'OK',
          onPress: () => {
            setRating(0);
            setReview('');
          },
        },
      ]
    );
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Rate our service';
    }
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
        <Text style={styles.headerTitle}>Rate & Review</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.ratingCard}>
          <View style={styles.ratingHeader}>
            <View style={[styles.heartContainer, { backgroundColor: colors.error + '20' }]}>
              <Heart size={32} color={colors.error} />
            </View>
            <Text style={[styles.ratingTitle, { color: colors.text }]}>
              How was your experience?
            </Text>
            <Text style={[styles.ratingSubtitle, { color: colors.textSecondary }]}>
              Your feedback helps us improve our service
            </Text>
          </View>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                style={styles.starButton}
              >
                <Star
                  size={40}
                  color={star <= rating ? '#FFD700' : colors.border}
                  fill={star <= rating ? '#FFD700' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.ratingText, { color: colors.primary }]}>
            {getRatingText(rating)}
          </Text>
        </Card>

        <Card style={styles.reviewCard}>
          <Text style={[styles.reviewTitle, { color: colors.text }]}>
            Tell us more (Optional)
          </Text>
          <TextInput
            style={[styles.reviewInput, { 
              color: colors.text, 
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }]}
            placeholder="Share your experience with Kleanly..."
            placeholderTextColor={colors.textSecondary}
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        <LinearGradient
          colors={[colors.primary, colors.primary + 'E6']}
          style={styles.submitButtonGradient}
        >
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReview}>
            <Send size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Submit Review</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Card style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            The Importance of Your Feedback
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Help other customers make informed decisions{'\n'}
            • Allow us to improve our services{'\n'}
            • Recognize our hardworking team{'\n'}
            • Build a trusted community of users
          </Text>
        </Card>

        <Card style={styles.statsCard}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            📊 Our Current Rating
          </Text>
          <View style={styles.statsContent}>
            <View style={styles.overallRating}>
              <Text style={[styles.ratingNumber, { color: colors.primary }]}>4.9</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    color="#FFD700"
                    fill="#FFD700"
                  />
                ))}
              </View>
              <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                Based on 1,247 reviews
              </Text>
            </View>
          </View>
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
  ratingCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heartContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ratingTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  reviewCard: {
    padding: 20,
    marginBottom: 20,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
  submitButtonGradient: {
    borderRadius: 16,
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    padding: 20,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsCard: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsContent: {
    alignItems: 'center',
  },
  overallRating: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 14,
  },
});
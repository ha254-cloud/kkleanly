import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react-native';
import { UserProfile, SavedAddress, PaymentMethod } from '../services/userProfileService';
import { Colors } from '../constants/Colors';

interface ProfileCompletionWidgetProps {
  userProfile: UserProfile | null;
  addresses: SavedAddress[];
  paymentMethods: PaymentMethod[];
  isDark: boolean;
  onActionPress: (action: string) => void;
}

export const ProfileCompletionWidget: React.FC<ProfileCompletionWidgetProps> = ({
  userProfile,
  addresses,
  paymentMethods,
  isDark,
  onActionPress
}) => {
  const colors = isDark ? Colors.dark : Colors.light;

  const completionItems = [
    {
      id: 'basic-info',
      title: 'Personal Information',
      description: 'Name, phone, and date of birth',
      completed: !!(userProfile?.firstName && userProfile?.lastName && userProfile?.phone),
      action: 'personal-info'
    },
    {
      id: 'addresses',
      title: 'Delivery Address',
      description: 'At least one saved address',
      completed: addresses.length > 0,
      action: 'addresses'
    }
  ];

  const completedCount = completionItems.filter(item => item.completed).length;
  const completionPercentage = (completedCount / completionItems.length) * 100;
  const isComplete = completionPercentage === 100;

  if (isComplete) {
    return (
      <View style={[styles.completedContainer, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.completedGradient}
        >
          <CheckCircle size={24} color="#FFFFFF" />
          <Text style={styles.completedText}>Profile Complete</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <LinearGradient
        colors={isDark ? ['#1F2937', '#374151'] : ['#FFFFFF', '#F8FAFC']}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Complete Your Profile
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {completedCount} of {completionItems.length} completed
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={[styles.progressFill, { width: `${completionPercentage}%` }]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.primary }]}>
            {Math.round(completionPercentage)}%
          </Text>
        </View>

        <View style={styles.itemsList}>
          {completionItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.item, { borderBottomColor: colors.border }]}
              onPress={() => onActionPress(item.action)}
              activeOpacity={0.7}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, item.completed && styles.iconCompleted]}>
                  {item.completed ? (
                    <CheckCircle size={20} color="#10B981" />
                  ) : (
                    <Circle size={20} color={colors.textSecondary} />
                  )}
                </View>
                <View style={styles.itemText}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
              {!item.completed && (
                <ArrowRight size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  content: {
    padding: 24,
    borderRadius: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  itemsList: {
    gap: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconCompleted: {
    // Additional styling if needed
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  completedContainer: {
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  completedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

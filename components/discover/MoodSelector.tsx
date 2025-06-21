import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Shuffle } from 'lucide-react-native';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { getMoodEmoji } from '@/utils/music';
import { type Mood } from '@/utils/constants';

interface MoodSelectorProps {
  availableMoods: Mood[];
  onMoodSelect: (mood: Mood | null) => void;
}

export function MoodSelector({ availableMoods, onMoodSelect }: MoodSelectorProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Heading variant="h3" color="primary" align="center" style={styles.title}>
          How do you feel today?
        </Heading>
      </View>

      {/* Mood Options */}
      <View style={styles.moodContainer}>
        <View style={styles.moodGrid}>
          {availableMoods.map((mood) => (
            <TouchableOpacity
              key={mood}
              onPress={() => onMoodSelect(mood)}
              style={styles.moodButton}
              activeOpacity={0.8}
            >
              <Text style={styles.moodEmoji}>
                {getMoodEmoji(mood)}
              </Text>
              <Text variant="caption" color="primary" align="center" style={styles.moodLabel}>
                {mood}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Surprise Me Button */}
        <View style={styles.surpriseContainer}>
          <Button
            variant="primary"
            size="large"
            onPress={() => onMoodSelect(null)}
            icon={<Shuffle size={20} color={colors.text.primary} strokeWidth={2} />}
            iconPosition="left"
            style={styles.surpriseButton}
          >
            Surprise me
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 28,
    marginBottom: spacing.xl,
  },
  moodContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  moodButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  moodLabel: {
    fontSize: 14,
  },
  surpriseContainer: {
    alignItems: 'center',
  },
  surpriseButton: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
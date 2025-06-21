import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/typography';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { getMoodEmoji } from '@/utils/music';
import { type Mood } from '@/utils/constants';

interface MoodButtonsProps {
  availableMoods: Mood[];
  onMoodSelect: (mood: Mood | null) => void;
  style?: any;
}

export function MoodButtons({ availableMoods, onMoodSelect, style }: MoodButtonsProps) {
  return (
    <View style={[styles.container, style]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'center',
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
}); 
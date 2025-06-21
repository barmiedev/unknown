import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SelectionChip } from './SelectionChip';
import { MOODS, type Mood } from '@/utils/constants';
import { spacing } from '@/utils/spacing';

interface MoodSelectorProps {
  selectedMoods: Mood[];
  onMoodToggle: (mood: Mood) => void;
  style?: any;
}

export function MoodSelector({ selectedMoods, onMoodToggle, style }: MoodSelectorProps) {
  return (
    <View style={[styles.container, style]}>
      {MOODS.map((mood) => (
        <SelectionChip
          key={mood}
          label={mood}
          selected={selectedMoods.includes(mood)}
          onPress={() => onMoodToggle(mood)}
          style={styles.moodChip}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  moodChip: {
    marginBottom: spacing.sm,
  },
}); 
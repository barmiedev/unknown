import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '@/components/typography/Text';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { getMoodEmoji } from '@/utils/music';

interface LoadingStateProps {
  selectedMood?: string | null;
}

export function LoadingState({ selectedMood }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎵</Text>
      <ActivityIndicator size="large" color={colors.text.secondary} />
      <Text variant="body" color="primary" align="center" style={styles.title}>
        Finding your perfect track...
      </Text>
      {selectedMood && (
        <Text variant="body" color="secondary" align="center" style={styles.moodText}>
          {getMoodEmoji(selectedMood)} {selectedMood} vibes
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 18,
    marginTop: spacing.md,
  },
  moodText: {
    fontSize: 16,
    marginTop: spacing.sm,
  },
});
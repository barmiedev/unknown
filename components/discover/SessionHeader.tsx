import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Gift } from 'lucide-react-native';
import { Text } from '@/components/typography/Text';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { getMoodEmoji } from '@/utils/music';

interface SessionHeaderProps {
  selectedMood: string | null;
  onNewSession: () => void;
}

export function SessionHeader({ selectedMood, onNewSession }: SessionHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Logo */}
      <Text variant="button" color="primary" style={styles.logo}>
        unknown
      </Text>
      
      {/* Mood session info */}
      <TouchableOpacity
        onPress={onNewSession}
        style={styles.sessionButton}
        activeOpacity={0.8}
      >
        {selectedMood ? (
          <>
            <Text style={styles.moodEmoji}>
              {getMoodEmoji(selectedMood)}
            </Text>
            <Text variant="caption" color="secondary" style={styles.moodText}>
              {selectedMood}
            </Text>
          </>
        ) : (
          <>
            <Gift size={16} color={colors.text.secondary} strokeWidth={2} />
            <Text variant="caption" color="secondary" style={styles.moodText}>
              surprise
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  logo: {
    fontSize: 24,
  },
  sessionButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodText: {
    fontSize: 14,
  },
});
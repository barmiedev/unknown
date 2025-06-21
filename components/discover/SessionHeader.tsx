import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Gift } from 'lucide-react-native';
import { Text } from '@/components/typography/Text';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';

interface SessionHeaderProps {
  selectedMood: string | null;
  onNewSession: () => void;
}

const MOOD_EMOJIS: { [key: string]: string } = {
  'Energetic': '⚡',
  'Chill': '😌',
  'Melancholic': '🌧️',
  'Uplifting': '☀️',
  'Aggressive': '🔥',
  'Romantic': '💕',
  'Mysterious': '🌙',
  'Nostalgic': '🍂',
  'Experimental': '🧪',
  'Peaceful': '🕊️',
  'Dark': '🖤',
  'Dreamy': '☁️',
  'Intense': '💥',
  'Playful': '🎈',
  'Contemplative': '🤔',
  'Euphoric': '🌟'
};

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
              {MOOD_EMOJIS[selectedMood]}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
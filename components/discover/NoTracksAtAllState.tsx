import React from 'react';
import { View, StyleSheet } from 'react-native';
import { History, Trophy } from 'lucide-react-native';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';

interface NoTracksAtAllStateProps {
  onGoToHistory: () => void;
  totalTracksRated: number;
}

export function NoTracksAtAllState({
  onGoToHistory,
  totalTracksRated,
}: NoTracksAtAllStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏆</Text>
        
        <Heading variant="h3" color="primary" align="center" style={styles.title}>
          You've discovered everything!
        </Heading>
        
        <Text variant="body" color="secondary" align="center" style={styles.description}>
          Congratulations! You've listened to all {totalTracksRated} tracks in our underground collection. 
          You're a true music explorer!
        </Text>
        
        <View style={styles.achievementContainer}>
          <Trophy size={24} color={colors.primary} strokeWidth={2} />
          <Text variant="body" color="accent" style={styles.achievementText}>
            Underground Explorer
          </Text>
        </View>
        
        <Button
          variant="primary"
          onPress={onGoToHistory}
          icon={<History size={20} color={colors.text.primary} strokeWidth={2} />}
          iconPosition="left"
          style={styles.button}
        >
          Go to My History
        </Button>
        
        <Text variant="caption" color="secondary" align="center" style={styles.hint}>
          Revisit your favorite discoveries and share them with friends
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.md,
  },
  description: {
    lineHeight: 24,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(69, 36, 81, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  achievementText: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
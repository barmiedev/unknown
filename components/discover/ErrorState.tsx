import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  onNewSession: () => void;
}

export function ErrorState({ error, onRetry, onNewSession }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text variant="body" color="primary" align="center" style={styles.errorText}>
        {error}
      </Text>
      
      <Button
        variant="primary"
        size="large"
        onPress={onRetry}
        style={styles.retryButton}
      >
        Try Again
      </Button>
      
      <Button
        variant="secondary"
        size="large"
        onPress={onNewSession}
        style={styles.newSessionButton}
      >
        Choose Different Mood
      </Button>
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
  errorText: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    marginBottom: spacing.md,
  },
  newSessionButton: {
    backgroundColor: colors.surface,
  },
});
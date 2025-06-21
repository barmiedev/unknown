import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';

export function WelcomeTip() {
  return (
    <View style={styles.container}>
      <Heading variant="h4" color="primary" style={styles.title}>
        Welcome to the Underground! 🎵
      </Heading>
      <Text variant="caption" color="secondary" style={styles.description}>
        Tap play to start discovering hidden gems. Rate tracks to reveal the artist and add them to your collection.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14,
  },
});
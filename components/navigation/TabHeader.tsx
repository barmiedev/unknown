import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { spacing } from '@/utils/spacing';

interface TabHeaderProps {
  title: string;
  subtitle?: string;
}

export function TabHeader({ title, subtitle }: TabHeaderProps) {
  return (
    <View style={styles.header}>
      <Heading variant="h2" color="primary">
        {title}
      </Heading>
      {subtitle && (
        <Text variant="body" color="secondary" style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    marginTop: spacing.sm,
  },
}); 
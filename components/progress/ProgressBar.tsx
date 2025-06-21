import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { Text } from '@/components/typography/Text';

interface ProgressBarProps {
  current: number;
  total: number;
  showText?: boolean;
  textFormat?: 'fraction' | 'percentage';
  style?: any;
}

export function ProgressBar({
  current,
  total,
  showText = true,
  textFormat = 'fraction',
  style,
}: ProgressBarProps) {
  const progress = Math.min(current / total, 1);
  
  const getProgressText = () => {
    if (textFormat === 'percentage') {
      return `${Math.round(progress * 100)}%`;
    }
    return `${current} of ${total}`;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${progress * 100}%` }
          ]} 
        />
      </View>
      {showText && (
        <Text variant="caption" color="secondary" style={styles.progressText}>
          {getProgressText()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
  },
});
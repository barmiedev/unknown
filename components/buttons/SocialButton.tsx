import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { Text } from '@/components/typography/Text';

interface SocialButtonProps {
  platform: 'apple' | 'google';
  onPress: () => void;
  disabled?: boolean;
}

export function SocialButton({ platform, onPress, disabled }: SocialButtonProps) {
  const platformText = platform === 'apple' ? 'Continue with Apple' : 'Continue with Google';
  
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text variant="body" color="primary">
        {platformText}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  disabled: {
    opacity: 0.6,
  },
});
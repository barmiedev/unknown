import React from 'react';
import { TouchableOpacity, View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { Text } from '@/components/typography/Text';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'outlineError' | 'setting';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: any;
}

const variantStyles = {
  primary: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  success: {
    backgroundColor: colors.status.success,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  outlineError: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  setting: {
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: 'transparent',
  }
};

const sizeStyles = {
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
};

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onPress,
  icon,
  iconPosition = 'left',
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  
  const textColor = variant === 'primary' ? 'primary' : 
                   variant === 'outline' ? 'accent' : 
                   variant === 'outlineError' ? 'statusError' : 'primary';

  const isSettingVariant = variant === 'setting';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && styles.disabled,
        isSettingVariant && styles.settingButton,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : (
        <View style={[styles.content, isSettingVariant && styles.settingContent]}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text 
            variant={isSettingVariant ? "body" : "button"} 
            color={textColor}
            weight={isSettingVariant ? "regular" : undefined}
            style={isSettingVariant && styles.settingText}
          >
            {children}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingButton: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  settingContent: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  settingText: {
    textAlign: 'left',
    flex: 1,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});
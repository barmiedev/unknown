import React, { forwardRef } from 'react';
import { View, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { Text } from '@/components/typography/Text';
import { fonts } from '@/lib/fonts';

interface TextInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: any;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
  onFocus?: () => void;
  onBlur?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  maxLength?: number;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(({
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  style,
  onFocus,
  onBlur,
  autoCapitalize = 'none',
  autoCorrect = false,
  maxLength,
}, ref) => {
  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, error && styles.inputError, style]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <RNTextInput
          ref={ref}
          style={[
            styles.input, 
            ...(icon ? [styles.inputWithIcon] : []),
            ...(multiline ? [styles.multilineInput] : [])
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.secondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={!disabled}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          onFocus={onFocus}
          onBlur={onBlur}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {error && (
        <Text variant="caption" color="statusError" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: colors.status.error,
  },
  icon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.chillax.regular,
    color: colors.text.primary,
  },
  inputWithIcon: {
  },
  multilineInput: {
    minHeight: 70,
  },
  errorText: {
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
});
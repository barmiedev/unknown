import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { TextInput as RNTextInput } from 'react-native';
import { fonts } from '@/lib/fonts';
import { Text } from '@/components/typography/Text';

interface PasswordInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  style?: any;
}

export function PasswordInput({
  placeholder,
  value,
  onChangeText,
  error,
  disabled,
  style,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const eyeIcon = (
    <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeButton}>
      {showPassword ? (
        <EyeOff size={20} color={colors.text.secondary} strokeWidth={2} />
      ) : (
        <Eye size={20} color={colors.text.secondary} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, error && styles.inputError, style]}>
        <View style={styles.leftIcon}>
          <Lock size={20} color={colors.text.secondary} strokeWidth={2} />
        </View>
        <RNTextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.text.secondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.rightIcon}>
          {eyeIcon}
        </View>
      </View>
      {error && (
        <Text variant="caption" color="statusError" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

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
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.chillax.regular,
    color: colors.text.primary,
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
});
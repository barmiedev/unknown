import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { colors } from '@/utils/colors';
import { TextInput } from './TextInput';

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
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        error={error}
        disabled={disabled}
        style={[styles.inputContainer, style]}
        icon={
          <View style={styles.iconContainer}>
            <Lock size={20} color={colors.text.secondary} strokeWidth={2} />
            {eyeIcon}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  inputContainer: {
    marginBottom: 0,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeButton: {
    padding: 4,
  },
});
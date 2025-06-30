import React, { useState } from 'react';
import { View, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Text } from '@/components/typography/Text';
import { TextInput } from '@/components/inputs/TextInput';
import { PasswordInput } from '@/components/inputs/PasswordInput';
import { Button } from '@/components/buttons/Button';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { validateEmail, validatePassword } from '@/utils/validation';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string; 
  }>({});
  const { signUp } = useAuth();

  const validateForm = () => {
    const newErrors: { 
      email?: string; 
      password?: string; 
      confirmPassword?: string; 
    } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordError = validatePassword(password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signUp(email, password);
      // Navigation will be handled by the auth state change
      router.replace('/onboarding/genres');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen paddingHorizontal={24}>
        <Header
          title="Create Account"
          showBackButton={true}
          onBackPress={() => router.back()}
        />

        <View style={styles.form}>
          <Text 
            variant="body" 
            color="secondary" 
            align="center"
            style={styles.subtitle}
          >
            Join the underground music community
          </Text>

          {/* Email Input */}
          <TextInput
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={errors.email}
            icon={<Mail size={20} color={colors.text.secondary} strokeWidth={2} />}
          />

          {/* Password Input */}
          <PasswordInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />

          {/* Confirm Password Input */}
          <PasswordInput
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
          />

          {/* Register Button */}
          <Button
            variant="primary"
            size="medium"
            loading={loading}
            onPress={handleRegister}
            style={styles.registerButton}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          {/* Login Link */}
          <View style={styles.loginLink}>
            <Text variant="caption" color="secondary">
              Already have an account?{' '}
            </Text>
            <Button
              variant="ghost"
              size="small"
              onPress={() => router.replace('/login')}
              style={styles.linkButton}
            >
              <Text variant="link" color="accent">Sign In</Text>
            </Button>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  form: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing.xl,
  },
  registerButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  linkButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});
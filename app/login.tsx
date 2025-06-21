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
import { SocialButton } from '@/components/buttons/SocialButton';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { validateEmail } from '@/utils/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn } = useAuth();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await signIn(email, password);
      
      if (!result.success) {
        // Check if it's an invalid credentials error
        if (result.error?.message?.includes('Invalid login credentials') || 
            result.error?.message?.includes('invalid_credentials') ||
            result.error?.code === 'invalid_credentials') {
          // Highlight both fields but only show message under password
          setErrors({ 
            email: '', // Empty string to highlight field without showing message
            password: 'Invalid email or password'
          });
        } else {
          // For other errors, show a generic alert
          Alert.alert('Login Failed', result.error?.message || 'An unexpected error occurred');
        }
      }
      // Navigation will be handled by the auth state change in _layout on success
    } catch (error: any) {
      // Fallback error handling
      Alert.alert('Login Failed', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Clear email error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    // Clear password error when user starts typing
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen paddingHorizontal={24}>
        <Header
          title="Welcome Back"
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
            Sign in to continue discovering
          </Text>

          {/* Email Input */}
          <TextInput
            placeholder="Email address"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            error={errors.email}
            icon={<Mail size={20} color={colors.text.secondary} strokeWidth={2} />}
          />

          {/* Password Input */}
          <PasswordInput
            placeholder="Password"
            value={password}
            onChangeText={handlePasswordChange}
            error={errors.password}
          />

          {/* Forgot Password */}
          <Button
            variant="ghost"
            size="small"
            onPress={() => {}}
            style={styles.forgotPassword}
          >
            <Text variant="link" color="accent">Forgot password?</Text>
          </Button>

          {/* Login Button */}
          <Button
            variant="primary"
            size="large"
            loading={loading}
            onPress={handleLogin}
            style={styles.loginButton}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text variant="caption" color="secondary" style={styles.dividerText}>
              or
            </Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons */}
          <SocialButton platform="apple" onPress={() => {}} />
          <SocialButton platform="google" onPress={() => {}} />

          {/* Register Link */}
          <View style={styles.registerLink}>
            <Text variant="caption" color="secondary">
              Don't have an account?{' '}
            </Text>
            <Button
              variant="ghost"
              size="small"
              onPress={() => router.replace('/register')}
              style={styles.linkButton}
            >
              <Text variant="link" color="accent">Sign Up</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    paddingHorizontal: 0,
  },
  loginButton: {
    marginBottom: spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surface,
  },
  dividerText: {
    marginHorizontal: spacing.md,
  },
  registerLink: {
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
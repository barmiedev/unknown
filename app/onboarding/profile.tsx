import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { User, Check, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { TextInput } from '@/components/inputs/TextInput';
import { Button } from '@/components/buttons/Button';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { validateUsername } from '@/utils/validation';
import { useDebounce } from '@/hooks/useDebounce';

export default function ProfileCustomizationScreen() {
  const params = useLocalSearchParams();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameValid, setUsernameValid] = useState(false);
  const { completeOnboarding } = useAuth();
  
  const debouncedUsername = useDebounce(username, 800);

  useEffect(() => {
    if (debouncedUsername) {
      checkUsernameAvailability(debouncedUsername);
    } else {
      setUsernameError(null);
      setUsernameValid(false);
    }
  }, [debouncedUsername]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim()) {
      setUsernameError(null);
      setUsernameValid(false);
      return;
    }

    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      setUsernameValid(false);
      return;
    }

    setCheckingUsername(true);
    setUsernameError(null);
    setUsernameValid(false);

    try {
      const { data, error } = await supabase.rpc('check_username_availability', {
        username_to_check: username.trim()
      });

      if (error) {
        console.error('Database error:', error);
        setUsernameError('Error checking username availability');
        setUsernameValid(false);
        return;
      }

      if (data === true) {
        setUsernameValid(true);
        setUsernameError(null);
      } else {
        setUsernameError('Username is already taken');
        setUsernameValid(false);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Error checking username availability');
      setUsernameValid(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleComplete = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (!usernameValid) {
      Alert.alert('Error', 'Please choose a valid and available username');
      return;
    }

    setLoading(true);
    try {
      const { data: isAvailable } = await supabase.rpc('check_username_availability', {
        username_to_check: username.trim()
      });

      if (!isAvailable) {
        Alert.alert('Error', 'Username is already taken. Please choose a different one.');
        setUsernameError('Username is already taken');
        setUsernameValid(false);
        setLoading(false);
        return;
      }

      const genres = params.genres ? JSON.parse(params.genres as string) : [];
      const moods = params.moods ? JSON.parse(params.moods as string) : [];

      await completeOnboarding({
        username: username.trim().toLowerCase(),
        display_name: displayName.trim() || username.trim(),
        preferred_genres: genres,
        preferred_moods: moods,
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      
      if (error.message && (
        error.message.includes('duplicate key value violates unique constraint') ||
        error.message.includes('profiles_username_key')
      )) {
        Alert.alert('Error', 'Username is already taken. Please choose a different one.');
        setUsernameError('Username is already taken');
        setUsernameValid(false);
      } else {
        Alert.alert('Error', error.message || 'Failed to complete onboarding');
      }
    } finally {
      setLoading(false);
    }
  };

  const getUsernameIcon = () => {
    if (checkingUsername) {
      return <Text style={styles.loadingText}>...</Text>;
    }
    if (usernameValid) {
      return <Check size={20} color={colors.status.success} strokeWidth={2} />;
    }
    if (usernameError) {
      return <AlertCircle size={20} color={colors.status.error} strokeWidth={2} />;
    }
    return null;
  };

  const getUsernameInputStyle = () => {
    if (usernameError) return styles.inputError;
    if (usernameValid) return styles.inputSuccess;
    return {};
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Screen paddingHorizontal={24}>
        {/* Header */}
        <View style={styles.header}>
          <Heading variant="h2" color="primary">
            Create your profile
          </Heading>
          <Text 
            variant="body" 
            color="secondary" 
            style={styles.subtitle}
          >
            How would you like to be known in the underground?
          </Text>
        </View>

        {/* Progress Indicator */}
        <ProgressBar current={3} total={3} />

        {/* Scrollable Form Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text variant="body" color="primary" style={styles.inputLabel}>
              Username *
            </Text>
            <TextInput
              placeholder="Choose a unique username"
              value={username}
              onChangeText={setUsername}
              error={usernameError || undefined}
              maxLength={20}
              style={getUsernameInputStyle()}
              icon={
                <View style={styles.iconContainer}>
                  <User size={20} color={colors.text.secondary} strokeWidth={2} />
                  {getUsernameIcon()}
                </View>
              }
            />
            {usernameValid && !checkingUsername && (
              <Text variant="caption" style={styles.successText}>
                Username is available!
              </Text>
            )}
            {!usernameError && !usernameValid && (
              <Text variant="caption" color="secondary" style={styles.hintText}>
                This will be your unique identifier in the community
              </Text>
            )}
          </View>

          {/* Display Name Input */}
          <View style={styles.inputContainer}>
            <Text variant="body" color="primary" style={styles.inputLabel}>
              Display Name (Optional)
            </Text>
            <TextInput
              placeholder="How others will see you"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={30}
              icon={<User size={20} color={colors.text.secondary} strokeWidth={2} />}
            />
            <Text variant="caption" color="secondary" style={styles.hintText}>
              Leave blank to use your username
            </Text>
          </View>

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <Text variant="body" color="primary" style={styles.summaryTitle}>
              You're almost ready!
            </Text>
            <Text variant="body" color="secondary" style={styles.summaryText}>
              Your personalized music discovery experience is about to begin.
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Complete Button */}
        <View style={styles.footer}>
          <Button
            variant="primary"
            size="large"
            disabled={!username.trim() || !usernameValid || loading || checkingUsername}
            loading={loading}
            onPress={handleComplete}
            icon={<Check size={20} color={colors.text.primary} strokeWidth={2} />}
            iconPosition="right"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </Button>
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
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputError: {
    borderColor: colors.status.error,
  },
  inputSuccess: {
    borderColor: colors.status.success,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  successText: {
    color: colors.status.success,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  hintText: {
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  summaryContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  summaryTitle: {
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
});
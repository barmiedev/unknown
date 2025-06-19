import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { User, Check, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { fonts } from '@/lib/fonts';

export default function ProfileCustomizationScreen() {
  const params = useLocalSearchParams();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameValid, setUsernameValid] = useState(false);
  const { completeOnboarding } = useAuth();

  const validateUsername = (text: string) => {
    // Basic validation rules
    if (text.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (text.length > 20) {
      return 'Username must be less than 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(text)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  };

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

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows returned, username is available
        setUsernameValid(true);
        setUsernameError(null);
      } else if (data) {
        // Username exists
        setUsernameError('Username is already taken');
        setUsernameValid(false);
      } else if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Error checking username availability');
      setUsernameValid(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    
    // Clear previous validation state
    setUsernameError(null);
    setUsernameValid(false);
    
    // Debounce the username check
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(text);
    }, 500);

    return () => clearTimeout(timeoutId);
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
      const genres = params.genres ? JSON.parse(params.genres as string) : [];
      const moods = params.moods ? JSON.parse(params.moods as string) : [];

      await completeOnboarding({
        username: username.trim().toLowerCase(),
        display_name: displayName.trim() || username.trim(),
        preferred_genres: genres,
        preferred_moods: moods,
      });

      // Navigation will be handled by the auth state change
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create your profile</Text>
            <Text style={styles.subtitle}>
              How would you like to be known in the underground?
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.progressText}>3 of 3</Text>
          </View>

          {/* Scrollable Form Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username *</Text>
              <View style={[
                styles.inputWrapper,
                usernameError && styles.inputWrapperError,
                usernameValid && styles.inputWrapperValid
              ]}>
                <User size={20} color="#8b6699" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Choose a unique username"
                  placeholderTextColor="#8b6699"
                  value={username}
                  onChangeText={handleUsernameChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
                {checkingUsername && (
                  <View style={styles.loadingIndicator}>
                    <Text style={styles.loadingText}>...</Text>
                  </View>
                )}
                {usernameValid && !checkingUsername && (
                  <Check size={20} color="#24512b" strokeWidth={2} />
                )}
                {usernameError && !checkingUsername && (
                  <AlertCircle size={20} color="#51242d" strokeWidth={2} />
                )}
              </View>
              {usernameError ? (
                <Text style={styles.inputError}>{usernameError}</Text>
              ) : usernameValid ? (
                <Text style={styles.inputSuccess}>Username is available!</Text>
              ) : (
                <Text style={styles.inputHint}>
                  This will be your unique identifier in the community
                </Text>
              )}
            </View>

            {/* Display Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Display Name (Optional)</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#8b6699" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="How others will see you"
                  placeholderTextColor="#8b6699"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCorrect={false}
                  maxLength={30}
                />
              </View>
              <Text style={styles.inputHint}>
                Leave blank to use your username
              </Text>
            </View>

            {/* Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>You're almost ready!</Text>
              <Text style={styles.summaryText}>
                Your personalized music discovery experience is about to begin.
              </Text>
            </View>
          </ScrollView>

          {/* Fixed Complete Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.completeButton,
                (!username.trim() || !usernameValid || loading || checkingUsername) && styles.completeButtonDisabled
              ]}
              onPress={handleComplete}
              disabled={!username.trim() || !usernameValid || loading || checkingUsername}
            >
              <Text style={styles.completeButtonText}>
                {loading ? 'Setting up...' : 'Complete Setup'}
              </Text>
              <Check size={20} color="#ded7e0" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#19161a',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
    lineHeight: 24,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#28232a',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#452451',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontFamily: fonts.chillax.medium,
    color: '#8b6699',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: fonts.chillax.medium,
    color: '#ded7e0',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28232a',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputWrapperError: {
    borderColor: '#51242d',
  },
  inputWrapperValid: {
    borderColor: '#24512b',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.chillax.regular,
    color: '#ded7e0',
    marginLeft: 12,
  },
  loadingIndicator: {
    paddingHorizontal: 8,
  },
  loadingText: {
    color: '#8b6699',
    fontFamily: fonts.chillax.bold,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 14,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
  },
  inputError: {
    fontSize: 14,
    fontFamily: fonts.chillax.medium,
    color: '#51242d',
  },
  inputSuccess: {
    fontSize: 14,
    fontFamily: fonts.chillax.medium,
    color: '#24512b',
  },
  summaryContainer: {
    backgroundColor: '#28232a',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#19161a',
    borderTopWidth: 1,
    borderTopColor: '#28232a',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#452451',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  completeButtonDisabled: {
    backgroundColor: '#28232a',
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 18,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
  },
});
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { User, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { fonts } from '@/lib/fonts';

export default function ProfileCustomizationScreen() {
  const params = useLocalSearchParams();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { completeOnboarding } = useAuth();

  const handleComplete = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setLoading(true);
    try {
      const genres = params.genres ? JSON.parse(params.genres as string) : [];
      const moods = params.moods ? JSON.parse(params.moods as string) : [];

      await completeOnboarding({
        username: username.trim(),
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
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea}>
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

        {/* Form */}
        <View style={styles.form}>
          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username *</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#8b6699" strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Choose a unique username"
                placeholderTextColor="#8b6699"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Text style={styles.inputHint}>
              This will be your unique identifier in the community
            </Text>
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
        </View>

        {/* Complete Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.completeButton,
              (!username.trim() || loading) && styles.completeButtonDisabled
            ]}
            onPress={handleComplete}
            disabled={!username.trim() || loading}
          >
            <Text style={styles.completeButtonText}>
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Text>
            <Check size={20} color="#ded7e0" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#19161a',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
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
  form: {
    flex: 1,
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
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.chillax.regular,
    color: '#ded7e0',
    marginLeft: 12,
  },
  inputHint: {
    fontSize: 14,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
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
    paddingTop: 24,
    paddingBottom: 32,
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
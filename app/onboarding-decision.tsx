import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Settings, Play } from 'lucide-react-native';
import { fonts } from '@/lib/fonts';

export default function OnboardingDecisionScreen() {
  const handlePersonalize = () => {
    router.replace('/onboarding/genres');
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>
            Would you like to personalize your music discovery experience?
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* Personalize Option */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handlePersonalize}
          >
            <View style={styles.optionIcon}>
              <Settings size={32} color="#452451" strokeWidth={2} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Yes, personalize my experience</Text>
              <Text style={styles.optionDescription}>
                Set your favorite genres and moods to get better recommendations
              </Text>
            </View>
          </TouchableOpacity>

          {/* Skip Option */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleSkip}
          >
            <View style={styles.optionIcon}>
              <Play size={32} color="#452451" strokeWidth={2} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Skip for now</Text>
              <Text style={styles.optionDescription}>
                Start discovering music right away with default settings
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You can always customize your preferences later in settings
          </Text>
        </View>
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
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 64,
    paddingBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
    textAlign: 'center',
    lineHeight: 26,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  optionButton: {
    flexDirection: 'row',
    backgroundColor: '#28232a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#452451',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 16,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
    lineHeight: 22,
  },
  footer: {
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
    textAlign: 'center',
  },
});
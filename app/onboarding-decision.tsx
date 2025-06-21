import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Settings, Play } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';

export default function OnboardingDecisionScreen() {
  const handlePersonalize = () => {
    router.replace('/onboarding/genres');
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <Screen paddingHorizontal={24}>
      {/* Header */}
      <View style={styles.header}>
        <Heading variant="h1" color="primary" align="center">
          Welcome back!
        </Heading>
        <Text 
          variant="body" 
          color="secondary" 
          align="center"
          style={styles.subtitle}
        >
          Would you like to personalize your music discovery experience?
        </Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {/* Personalize Option */}
        <Button
          variant="secondary"
          size="large"
          onPress={handlePersonalize}
          icon={<Settings size={32} color={colors.primary} strokeWidth={2} />}
          iconPosition="left"
          style={styles.optionButton}
        >
          <View style={styles.optionContent}>
            <Text variant="button" color="primary" style={styles.optionTitle}>
              Yes, personalize my experience
            </Text>
            <Text variant="body" color="secondary" style={styles.optionDescription}>
              Set your favorite genres and moods to get better recommendations
            </Text>
          </View>
        </Button>

        {/* Skip Option */}
        <Button
          variant="secondary"
          size="large"
          onPress={handleSkip}
          icon={<Play size={32} color={colors.primary} strokeWidth={2} />}
          iconPosition="left"
          style={styles.optionButton}
        >
          <View style={styles.optionContent}>
            <Text variant="button" color="primary" style={styles.optionTitle}>
              Skip for now
            </Text>
            <Text variant="body" color="secondary" style={styles.optionDescription}>
              Start discovering music right away with default settings
            </Text>
          </View>
        </Button>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text 
          variant="caption" 
          color="secondary" 
          align="center"
        >
          You can always customize your preferences later in settings
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    marginTop: spacing.md,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  optionButton: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'flex-start',
    minHeight: 120,
  },
  optionContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  optionTitle: {
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  optionDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  footer: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
});
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { MoodSelector } from '@/components/selection';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { type Mood } from '@/utils/constants';

export default function MoodPreferencesScreen() {
  const params = useLocalSearchParams();
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);

  const toggleMood = (mood: Mood) => {
    setSelectedMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const handleContinue = () => {
    const genres = params.genres ? JSON.parse(params.genres as string) : [];
    router.push({
      pathname: '/onboarding/profile',
      params: { 
        genres: JSON.stringify(genres),
        moods: JSON.stringify(selectedMoods)
      }
    });
  };

  return (
    <Screen scrollable paddingHorizontal={24}>
      {/* Header */}
      <View style={styles.header}>
        <Heading variant="h2" color="primary">
          What moods move you?
        </Heading>
        <Text 
          variant="body" 
          color="secondary" 
          style={styles.subtitle}
        >
          Select the vibes that resonate with your soul
        </Text>
      </View>

      {/* Progress Indicator */}
      <ProgressBar current={2} total={3} />

      {/* Mood Selection */}
      <MoodSelector
        selectedMoods={selectedMoods}
        onMoodToggle={toggleMood}
        style={styles.moodGrid}
      />

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="large"
          disabled={selectedMoods.length === 0}
          onPress={handleContinue}
          icon={<ArrowRight size={20} color={colors.text.primary} strokeWidth={2} />}
          iconPosition="right"
          style={styles.continueButton}
        >
          Continue ({selectedMoods.length} selected)
        </Button>

        <Button
          variant="ghost"
          size="medium"
          onPress={() => router.push('/onboarding/profile')}
          style={styles.skipButton}
        >
          <Text variant="body" color="secondary">Skip for now</Text>
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  subtitle: {
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  moodGrid: {
    paddingBottom: spacing.lg,
  },
  footer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  continueButton: {
    marginBottom: spacing.md,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
});
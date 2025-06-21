import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { SelectionChip } from '@/components/selection/SelectionChip';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';

const MOODS = [
  'Energetic', 'Chill', 'Melancholic', 'Uplifting', 'Aggressive',
  'Romantic', 'Mysterious', 'Nostalgic', 'Experimental', 'Peaceful',
  'Dark', 'Dreamy', 'Intense', 'Playful', 'Contemplative', 'Euphoric'
];

export default function MoodPreferencesScreen() {
  const params = useLocalSearchParams();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);

  const toggleMood = (mood: string) => {
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
      <View style={styles.moodGrid}>
        {MOODS.map((mood) => (
          <SelectionChip
            key={mood}
            label={mood}
            selected={selectedMoods.includes(mood)}
            onPress={() => toggleMood(mood)}
            style={styles.moodChip}
          />
        ))}
      </View>

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
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  subtitle: {
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  moodChip: {
    marginBottom: spacing.sm,
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
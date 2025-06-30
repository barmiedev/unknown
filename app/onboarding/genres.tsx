import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { GenreSelector } from '@/components/selection';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { type Genre } from '@/utils/constants';

export default function GenrePreferencesScreen() {
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);

  const toggleGenre = (genre: Genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const handleContinue = () => {
    router.push({
      pathname: '/onboarding/moods',
      params: { genres: JSON.stringify(selectedGenres) },
    });
  };

  return (
    <Screen scrollable paddingHorizontal={24}>
      {/* Header */}
      <View style={styles.header}>
        <Heading variant="h2" color="primary">
          What genres do you love?
        </Heading>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Choose your favorites to get personalized recommendations
        </Text>
      </View>

      {/* Progress Indicator */}
      <ProgressBar current={1} total={3} />

      {/* Genre Selection */}
      <GenreSelector
        selectedGenres={selectedGenres}
        onGenreToggle={toggleGenre}
        style={styles.genreGrid}
      />

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="large"
          disabled={selectedGenres.length === 0}
          onPress={handleContinue}
          icon={
            <ArrowRight size={20} color={colors.text.primary} strokeWidth={2} />
          }
          iconPosition="right"
          style={styles.continueButton}
        >
          Continue ({selectedGenres.length} selected)
        </Button>

        <Button
          variant="ghost"
          size="medium"
          onPress={handleContinue}
          style={styles.skipButton}
        >
          <Text variant="body" color="secondary">
            Skip for now
          </Text>
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
  genreGrid: {
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

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Shuffle, Settings } from 'lucide-react-native';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';

interface NoTracksInPreferencesStateProps {
  onBroadenSearch: () => void;
  onChooseDifferentMood: () => void;
  selectedMood?: string | null;
}

export function NoTracksInPreferencesState({
  onBroadenSearch,
  onChooseDifferentMood,
  selectedMood,
}: NoTracksInPreferencesStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎯</Text>
        
        <Heading variant="h3" color="primary" align="center" style={styles.title}>
          No tracks match your current taste
        </Heading>
        
        <Text variant="body" color="secondary" align="center" style={styles.description}>
          {selectedMood 
            ? `We couldn't find any ${selectedMood.toLowerCase()} tracks that match your preferences.`
            : "We couldn't find any tracks that match your current preferences."
          }
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            onPress={onBroadenSearch}
            icon={<Shuffle size={20} color={colors.text.primary} strokeWidth={2} />}
            iconPosition="left"
            style={styles.button}
          >
            Broaden My Search
          </Button>
          
          <Button
            variant="secondary"
            onPress={onChooseDifferentMood}
            icon={<Settings size={20} color={colors.text.primary} strokeWidth={2} />}
            iconPosition="left"
            style={styles.button}
          >
            Choose Different Mood
          </Button>
        </View>
        
        <Text variant="caption" color="secondary" align="center" style={styles.hint}>
          Broadening your search will look for tracks outside your usual preferences
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.md,
  },
  description: {
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  button: {
    width: '100%',
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
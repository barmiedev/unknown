import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Check } from 'lucide-react-native';
import { fonts } from '@/lib/fonts';

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
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What moods move you?</Text>
          <Text style={styles.subtitle}>
            Select the vibes that resonate with your soul
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '66%' }]} />
          </View>
          <Text style={styles.progressText}>2 of 3</Text>
        </View>

        {/* Mood Selection */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.moodGrid}>
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood}
                onPress={() => toggleMood(mood)}
                style={[
                  styles.moodButton,
                  selectedMoods.includes(mood) && styles.moodButtonSelected
                ]}
              >
                <Text style={[
                  styles.moodText,
                  selectedMoods.includes(mood) && styles.moodTextSelected
                ]}>
                  {mood}
                </Text>
                {selectedMoods.includes(mood) && (
                  <Check size={16} color="#ded7e0" strokeWidth={2} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              selectedMoods.length === 0 && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={selectedMoods.length === 0}
          >
            <Text style={styles.continueButtonText}>
              Continue ({selectedMoods.length} selected)
            </Text>
            <ArrowRight size={20} color="#ded7e0" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.push('/onboarding/profile')}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 24,
  },
  moodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28232a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  moodButtonSelected: {
    backgroundColor: '#452451',
  },
  moodText: {
    fontSize: 16,
    fontFamily: fonts.chillax.medium,
    color: '#8b6699',
  },
  moodTextSelected: {
    color: '#ded7e0',
  },
  footer: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#452451',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#28232a',
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: fonts.chillax.medium,
    color: '#8b6699',
  },
});
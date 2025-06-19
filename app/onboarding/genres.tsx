import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowRight, Check } from 'lucide-react-native';
import { fonts } from '@/lib/fonts';

const GENRES = [
  'Rock', 'Pop', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical',
  'Folk', 'R&B', 'Country', 'Reggae', 'Blues', 'Punk',
  'Metal', 'Indie', 'Alternative', 'Funk', 'Soul', 'Gospel',
  'Ambient', 'Lo-Fi', 'Psychedelic', 'Experimental'
];

export default function GenrePreferencesScreen() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleContinue = () => {
    router.push({
      pathname: '/onboarding/moods',
      params: { genres: JSON.stringify(selectedGenres) }
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What genres do you love?</Text>
          <Text style={styles.subtitle}>
            Choose your favorites to get personalized recommendations
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '33%' }]} />
          </View>
          <Text style={styles.progressText}>1 of 3</Text>
        </View>

        {/* Genre Selection */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.genreGrid}>
            {GENRES.map((genre) => (
              <TouchableOpacity
                key={genre}
                onPress={() => toggleGenre(genre)}
                style={[
                  styles.genreButton,
                  selectedGenres.includes(genre) && styles.genreButtonSelected
                ]}
              >
                <Text style={[
                  styles.genreText,
                  selectedGenres.includes(genre) && styles.genreTextSelected
                ]}>
                  {genre}
                </Text>
                {selectedGenres.includes(genre) && (
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
              selectedGenres.length === 0 && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={selectedGenres.length === 0}
          >
            <Text style={styles.continueButtonText}>
              Continue ({selectedGenres.length} selected)
            </Text>
            <ArrowRight size={20} color="#ded7e0" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.push('/onboarding/moods')}
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
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 24,
  },
  genreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28232a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  genreButtonSelected: {
    backgroundColor: '#452451',
  },
  genreText: {
    fontSize: 16,
    fontFamily: fonts.chillax.medium,
    color: '#8b6699',
  },
  genreTextSelected: {
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
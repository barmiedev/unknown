import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Save } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { fonts } from '@/lib/fonts';

const GENRES = [
  'Rock', 'Pop', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical',
  'Folk', 'R&B', 'Country', 'Reggae', 'Blues', 'Punk',
  'Metal', 'Indie', 'Alternative', 'Funk', 'Soul', 'Gospel',
  'Ambient', 'Lo-Fi', 'Psychedelic', 'Experimental'
];

const MOODS = [
  'Energetic', 'Chill', 'Melancholic', 'Uplifting', 'Aggressive',
  'Romantic', 'Mysterious', 'Nostalgic', 'Experimental', 'Peaceful',
  'Dark', 'Dreamy', 'Intense', 'Playful', 'Contemplative', 'Euphoric'
];

const DURATION_OPTIONS = [
  { label: '30s - 1min', min: 30, max: 60 },
  { label: '1min - 2min', min: 60, max: 120 },
  { label: '2min - 3min', min: 120, max: 180 },
  { label: '3min - 5min', min: 180, max: 300 },
  { label: '5min+', min: 300, max: 600 },
];

const STREAMING_PLATFORMS = [
  { id: 'spotify', name: 'Spotify', color: '#1DB954' },
  { id: 'apple_music', name: 'Apple Music', color: '#FA243C' },
  { id: 'soundcloud', name: 'SoundCloud', color: '#FF5500' },
  { id: 'bandcamp', name: 'Bandcamp', color: '#629AA0' },
  { id: 'youtube', name: 'YouTube Music', color: '#FF0000' },
];

export default function PreferencesScreen() {
  const { user } = useAuth();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState({ min: 60, max: 300 });
  const [preferredPlatform, setPreferredPlatform] = useState('spotify');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user?.id) return;

    try {
      // Load music preferences
      const { data: musicPrefs, error: musicError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (musicPrefs) {
        setSelectedGenres(musicPrefs.preferred_genres || []);
        setSelectedMoods(musicPrefs.preferred_moods || []);
        setSelectedDuration({
          min: musicPrefs.min_duration || 60,
          max: musicPrefs.max_duration || 300,
        });
      }

      // Load streaming preferences - use maybeSingle() to handle no results gracefully
      const { data: streamingPrefs, error: streamingError } = await supabase
        .from('user_streaming_preferences')
        .select('preferred_platform')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (streamingPrefs) {
        setPreferredPlatform(streamingPrefs.preferred_platform);
      }

    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      // Save music preferences
      const { error: musicError } = await supabase
        .from('user_preferences')
        .upsert({
          profile_id: user.id,
          user_id: user.id, // Keep for backward compatibility
          preferred_genres: selectedGenres,
          preferred_moods: selectedMoods,
          min_duration: selectedDuration.min,
          max_duration: selectedDuration.max,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (musicError) throw musicError;

      // Save streaming preferences
      const { error: streamingError } = await supabase
        .from('user_streaming_preferences')
        .upsert({
          profile_id: user.id,
          preferred_platform: preferredPlatform,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id'
        });

      if (streamingError) throw streamingError;

      Alert.alert('Success', 'Your preferences have been saved!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const selectDuration = (duration: { min: number; max: number }) => {
    setSelectedDuration(duration);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading preferences...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Preferences</Text>
          <Text style={styles.subtitle}>
            Customize your discovery experience
          </Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Streaming Platform Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Preferred Streaming Platform
            </Text>
            <Text style={styles.sectionDescription}>
              Choose your default platform for listening to discovered tracks
            </Text>
            
            <View style={styles.platformOptions}>
              {STREAMING_PLATFORMS.map((platform) => (
                <TouchableOpacity
                  key={platform.id}
                  onPress={() => setPreferredPlatform(platform.id)}
                  style={[
                    styles.platformButton,
                    preferredPlatform === platform.id && styles.platformButtonSelected
                  ]}
                >
                  <Text style={[
                    styles.platformText,
                    preferredPlatform === platform.id && styles.platformTextSelected
                  ]}>
                    {platform.name}
                  </Text>
                  {preferredPlatform === platform.id && (
                    <Check size={16} color="#ded7e0" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Genres Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Which genres do you prefer?
            </Text>
            <Text style={styles.sectionDescription}>
              Choose your favorite genres for more personalized music
            </Text>
            
            <View style={styles.optionsGrid}>
              {GENRES.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  onPress={() => toggleGenre(genre)}
                  style={[
                    styles.optionButton,
                    selectedGenres.includes(genre) && styles.optionButtonSelected
                  ]}
                >
                  <Text style={[
                    styles.optionText,
                    selectedGenres.includes(genre) && styles.optionTextSelected
                  ]}>
                    {genre}
                  </Text>
                  {selectedGenres.includes(genre) && (
                    <Check size={16} color="#ded7e0" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Moods Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              What moods do you enjoy?
            </Text>
            <Text style={styles.sectionDescription}>
              Select moods that match your listening preferences
            </Text>
            
            <View style={styles.optionsGrid}>
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood}
                  onPress={() => toggleMood(mood)}
                  style={[
                    styles.optionButton,
                    selectedMoods.includes(mood) && styles.optionButtonSelected
                  ]}
                >
                  <Text style={[
                    styles.optionText,
                    selectedMoods.includes(mood) && styles.optionTextSelected
                  ]}>
                    {mood}
                  </Text>
                  {selectedMoods.includes(mood) && (
                    <Check size={16} color="#ded7e0" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Track Duration
            </Text>
            <Text style={styles.sectionDescription}>
              Set your preferred track length range
            </Text>
            
            <View style={styles.durationOptions}>
              {DURATION_OPTIONS.map((duration) => (
                <TouchableOpacity
                  key={duration.label}
                  onPress={() => selectDuration(duration)}
                  style={[
                    styles.durationButton,
                    selectedDuration.min === duration.min && 
                    selectedDuration.max === duration.max && 
                    styles.durationButtonSelected
                  ]}
                >
                  <Text style={[
                    styles.durationText,
                    selectedDuration.min === duration.min && 
                    selectedDuration.max === duration.max && 
                    styles.durationTextSelected
                  ]}>
                    {duration.label}
                  </Text>
                  {selectedDuration.min === duration.min && 
                   selectedDuration.max === duration.max && (
                    <Check size={16} color="#ded7e0" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={savePreferences}
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          >
            <Save size={20} color="#ded7e0" strokeWidth={2} />
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ded7e0',
    fontFamily: fonts.chillax.regular,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    color: '#ded7e0',
    fontSize: 28,
    fontFamily: fonts.chillax.bold,
    marginBottom: 8,
  },
  subtitle: {
    color: '#8b6699',
    fontFamily: fonts.chillax.regular,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#ded7e0',
    fontSize: 20,
    fontFamily: fonts.chillax.bold,
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#8b6699',
    fontFamily: fonts.chillax.regular,
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  platformOptions: {
    gap: 12,
  },
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#28232a',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
  },
  platformButtonSelected: {
    backgroundColor: '#452451',
  },
  platformText: {
    fontFamily: fonts.chillax.medium,
    color: '#8b6699',
    fontSize: 16,
  },
  platformTextSelected: {
    color: '#ded7e0',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28232a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#452451',
  },
  optionText: {
    fontFamily: fonts.chillax.medium,
    color: '#8b6699',
    fontSize: 16,
  },
  optionTextSelected: {
    color: '#ded7e0',
  },
  durationOptions: {
    gap: 12,
  },
  durationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#28232a',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
  },
  durationButtonSelected: {
    backgroundColor: '#452451',
  },
  durationText: {
    fontFamily: fonts.chillax.medium,
    color: '#8b6699',
    fontSize: 16,
  },
  durationTextSelected: {
    color: '#ded7e0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#452451',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 32,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ded7e0',
    fontSize: 18,
    fontFamily: fonts.chillax.bold,
  },
});
import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Save } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { SelectionChip } from '@/components/selection/SelectionChip';
import { TabBar } from '@/components/navigation/TabBar';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { TabHeader } from '@/components/navigation';
import { 
  PLATFORM_NAMES, 
  PLATFORM_COLORS, 
  DEFAULT_STREAMING_PLATFORM 
} from '@/lib/platforms';

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

const STREAMING_PLATFORMS = Object.entries(PLATFORM_NAMES).map(([id, name]) => ({
  id,
  name,
  color: PLATFORM_COLORS[id as keyof typeof PLATFORM_COLORS],
}));

export default function PreferencesScreen() {
  const { user } = useAuth();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState({ min: 60, max: 300 });
  const [preferredPlatform, setPreferredPlatform] = useState<string>(DEFAULT_STREAMING_PLATFORM);
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

      // Load streaming preferences
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
          user_id: user.id,
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
      <Screen withoutBottomSafeArea>
        <View style={styles.loadingContainer}>
          <Text variant="body" color="primary">Loading preferences...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable paddingHorizontal={24} withoutBottomSafeArea>
      <TabHeader
        title="Preferences"
        subtitle="Customize your discovery experience"
      />

      {/* Streaming Platform Section */}
      <View style={styles.section}>
        <Heading variant="h4" color="primary" style={styles.sectionTitle}>
          Preferred Streaming Platform
        </Heading>
        <Text variant="body" color="secondary" style={styles.sectionDescription}>
          Choose your default platform for listening to discovered tracks
        </Text>
        
        <View style={styles.platformOptions}>
          {STREAMING_PLATFORMS.map((platform) => (
            <SelectionChip
              key={platform.id}
              label={platform.name}
              selected={preferredPlatform === platform.id}
              onPress={() => setPreferredPlatform(platform.id)}
              style={styles.platformChip}
            />
          ))}
        </View>
      </View>

      {/* Genres Section */}
      <View style={styles.section}>
        <Heading variant="h4" color="primary" style={styles.sectionTitle}>
          Which genres do you prefer?
        </Heading>
        <Text variant="body" color="secondary" style={styles.sectionDescription}>
          Choose your favorite genres for more personalized music
        </Text>
        
        <View style={styles.optionsGrid}>
          {GENRES.map((genre) => (
            <SelectionChip
              key={genre}
              label={genre}
              selected={selectedGenres.includes(genre)}
              onPress={() => toggleGenre(genre)}
              style={styles.optionChip}
            />
          ))}
        </View>
      </View>

      {/* Moods Section */}
      <View style={styles.section}>
        <Heading variant="h4" color="primary" style={styles.sectionTitle}>
          What moods do you enjoy?
        </Heading>
        <Text variant="body" color="secondary" style={styles.sectionDescription}>
          Select moods that match your listening preferences
        </Text>
        
        <View style={styles.optionsGrid}>
          {MOODS.map((mood) => (
            <SelectionChip
              key={mood}
              label={mood}
              selected={selectedMoods.includes(mood)}
              onPress={() => toggleMood(mood)}
              style={styles.optionChip}
            />
          ))}
        </View>
      </View>

      {/* Duration Section */}
      <View style={styles.section}>
        <Heading variant="h4" color="primary" style={styles.sectionTitle}>
          Track Duration
        </Heading>
        <Text variant="body" color="secondary" style={styles.sectionDescription}>
          Set your preferred track length range
        </Text>
        
        <View style={styles.durationOptions}>
          {DURATION_OPTIONS.map((duration) => (
            <SelectionChip
              key={duration.label}
              label={duration.label}
              selected={selectedDuration.min === duration.min && selectedDuration.max === duration.max}
              onPress={() => selectDuration(duration)}
              style={styles.durationChip}
            />
          ))}
        </View>
      </View>

      {/* Save Button */}
      <Button
        variant="primary"
        size="large"
        loading={saving}
        onPress={savePreferences}
        icon={<Save size={20} color={colors.text.primary} strokeWidth={2} />}
        iconPosition="left"
        style={styles.saveButton}
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  platformOptions: {
    gap: spacing.sm,
  },
  platformChip: {
    marginBottom: spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    marginBottom: spacing.sm,
  },
  durationOptions: {
    gap: spacing.sm,
  },
  durationChip: {
    marginBottom: spacing.sm,
  },
  saveButton: {
    marginBottom: spacing.xl,
  },
});
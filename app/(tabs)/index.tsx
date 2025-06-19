import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { fonts } from '@/lib/fonts';
import Ripple from '@/components/Ripple';
import RatingControls from '@/components/RatingControls';
import TrackReveal from '@/components/TrackReveal';

interface Track {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  genre: string;
  mood: string;
  duration: number;
  spotify_streams: number;
  artwork_url?: string;
}

interface UserPreferences {
  preferred_genres: string[];
  preferred_moods: string[];
  min_duration: number;
  max_duration: number;
}

type DiscoverState = 'loading' | 'playing' | 'rating' | 'revealed' | 'transitioning';

export default function DiscoverScreen() {
  const { user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [state, setState] = useState<DiscoverState>('loading');
  const [rating, setRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [ratingThreshold] = useState(0.8); // 80% of track length
  const [canSkip, setCanSkip] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const fadeOpacity = useSharedValue(1);
  const transitionTextOpacity = useSharedValue(0);

  useEffect(() => {
    if (user?.id) {
      loadUserPreferences();
      loadNextTrack();
    }

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [user]);

  // Monitor playback progress for rating trigger
  useEffect(() => {
    if (duration > 0 && position > 0 && state === 'playing') {
      const progress = position / duration;
      if (progress >= ratingThreshold) {
        setState('rating');
      }
    }
  }, [position, duration, ratingThreshold, state]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  const transitionTextStyle = useAnimatedStyle(() => ({
    opacity: transitionTextOpacity.value,
  }));

  const loadUserPreferences = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferred_genres, preferred_moods, min_duration, max_duration')
        .eq('profile_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setUserPreferences(data);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const loadNextTrack = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setState('loading');
      
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // Get tracks that user hasn't rated yet
      const { data: ratedTrackIds, error: ratedError } = await supabase
        .from('user_ratings')
        .select('track_id')
        .eq('profile_id', user?.id || '');

      if (ratedError && ratedError.code !== 'PGRST116') {
        throw ratedError;
      }

      const excludeIds = ratedTrackIds?.map(r => r.track_id) || [];

      // Build query based on user preferences
      let query = supabase
        .from('tracks')
        .select('*')
        .lt('spotify_streams', 5000); // Only underground tracks

      // Exclude already rated tracks
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      // Apply user preferences if available
      if (userPreferences) {
        if (userPreferences.preferred_genres && userPreferences.preferred_genres.length > 0) {
          query = query.in('genre', userPreferences.preferred_genres);
        }

        if (userPreferences.preferred_moods && userPreferences.preferred_moods.length > 0) {
          query = query.in('mood', userPreferences.preferred_moods);
        }

        query = query
          .gte('duration', userPreferences.min_duration)
          .lte('duration', userPreferences.max_duration);
      }

      const { data: tracks, error: tracksError } = await query.limit(50);

      if (tracksError) throw tracksError;

      if (!tracks || tracks.length === 0) {
        // Fallback to any available tracks
        const { data: fallbackTracks, error: fallbackError } = await supabase
          .from('tracks')
          .select('*')
          .lt('spotify_streams', 5000)
          .not('id', 'in', excludeIds.length > 0 ? `(${excludeIds.join(',')})` : '()')
          .limit(50);

        if (fallbackError) throw fallbackError;

        if (!fallbackTracks || fallbackTracks.length === 0) {
          throw new Error('No more tracks available to discover');
        }

        const randomTrack = fallbackTracks[Math.floor(Math.random() * fallbackTracks.length)];
        setCurrentTrack(randomTrack);
      } else {
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        setCurrentTrack(randomTrack);
      }

      // Reset state
      setRating(0);
      setState('playing');
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      setCanSkip(true);

    } catch (error) {
      console.error('Error loading track:', error);
      setError('Failed to load track. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const playPauseAudio = async () => {
    try {
      if (!currentTrack?.audio_url) {
        throw new Error('No audio URL available');
      }

      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: currentTrack.audio_url },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying || false);
    }
  };

  const handleTransition = async (callback: () => void) => {
    setIsTransitioning(true);
    
    // Fade out current content
    fadeOpacity.value = withTiming(0, { duration: 300 });
    
    // Show transition message
    transitionTextOpacity.value = withTiming(1, { duration: 300 });
    
    // Fade out audio
    if (sound) {
      try {
        await sound.setVolumeAsync(0);
      } catch (error) {
        console.error('Error fading audio:', error);
      }
    }
    
    // Wait for transition
    setTimeout(() => {
      runOnJS(callback)();
      
      // Fade back in
      setTimeout(() => {
        transitionTextOpacity.value = withTiming(0, { duration: 300 });
        fadeOpacity.value = withTiming(1, { duration: 300 });
        setIsTransitioning(false);
      }, 1000);
    }, 3000);
  };

  const skipTrack = async () => {
    if (!canSkip) return;
    
    handleTransition(() => {
      loadNextTrack();
    });
  };

  const handleRating = async (stars: number, review?: string) => {
    if (!currentTrack || !user?.id) return;

    setRating(stars);
    
    try {
      const { error } = await supabase
        .from('user_ratings')
        .insert({
          track_id: currentTrack.id,
          rating: stars,
          review_text: review,
          profile_id: user.id,
          user_id: user.id,
        });

      if (error && error.code !== '23505') {
        throw error;
      }

      // Update user stats
      try {
        const { error: statsError } = await supabase
          .from('user_stats')
          .upsert({
            profile_id: user.id,
            user_id: user.id,
            total_tracks_rated: 1,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (statsError) {
          console.error('Error updating stats:', statsError);
        }
      } catch (statsError) {
        console.error('Error updating user stats:', statsError);
      }

      if (stars >= 4) {
        setState('revealed');
      } else {
        handleTransition(() => {
          loadNextTrack();
        });
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  const handleContinueListening = () => {
    setCanSkip(false);
    setState('playing');
  };

  const handleDiscoverNext = () => {
    handleTransition(() => {
      loadNextTrack();
    });
  };

  const calculateBPM = () => {
    if (!currentTrack) return 120;
    // Simple BPM estimation based on track characteristics
    // In a real app, you'd have BPM data or use audio analysis
    return Math.max(60, Math.min(180, 120 + (currentTrack.duration % 60)));
  };

  if (isLoading) {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <Ripple bpm={120} />
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#8b6699" />
          <Text style={{ color: 'white', marginTop: 16, fontFamily: fonts.chillax.regular }}>
            Loading track...
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <Ripple bpm={120} />
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ color: 'white', textAlign: 'center', marginBottom: 16, fontFamily: fonts.chillax.regular }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => loadNextTrack()}
            style={{ backgroundColor: '#452451', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 }}
          >
            <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.bold, fontSize: 18 }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#19161a', flex: 1 }}>
      <Ripple bpm={calculateBPM()} />
      
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 48 }}>
          <Text style={{ fontSize: 24, fontFamily: fonts.chillax.bold, color: '#ded7e0' }}>
            unknown
          </Text>
          <Text style={{ fontSize: 14, fontFamily: fonts.chillax.medium, marginTop: 8, color: '#8b6699' }}>
            Discover underground music
          </Text>
        </View>

        {/* Transition Overlay */}
        {isTransitioning && (
          <Animated.View style={[
            transitionTextStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(25, 22, 26, 0.95)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              paddingHorizontal: 24,
            }
          ]}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 32 }}>🎵</Text>
              <Text style={{ 
                fontSize: 24, 
                fontFamily: fonts.chillax.bold, 
                color: '#ded7e0', 
                textAlign: 'center',
                marginBottom: 16 
              }}>
                Finding your next discovery...
              </Text>
              <ActivityIndicator size="large" color="#8b6699" />
            </View>
          </Animated.View>
        )}

        {/* Main Content */}
        <Animated.View style={[fadeStyle, { flex: 1 }]}>
          {state === 'playing' && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              {/* Play/Pause Button */}
              <TouchableOpacity
                onPress={playPauseAudio}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#452451',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 32,
                }}
              >
                {isPlaying ? (
                  <Pause size={32} color="#ded7e0" strokeWidth={2} />
                ) : (
                  <Play size={32} color="#ded7e0" strokeWidth={2} />
                )}
              </TouchableOpacity>

              {/* Progress Bar */}
              <View style={{ 
                width: '100%', 
                maxWidth: 320, 
                height: 4, 
                backgroundColor: '#28232a', 
                borderRadius: 2, 
                marginBottom: 32 
              }}>
                <View
                  style={{
                    width: duration > 0 ? `${(position / duration) * 100}%` : '0%',
                    height: '100%',
                    backgroundColor: '#452451',
                    borderRadius: 2,
                  }}
                />
              </View>

              {/* Skip Button */}
              {canSkip && (
                <TouchableOpacity
                  onPress={skipTrack}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 }}
                >
                  <SkipForward size={20} color='#8b6699' strokeWidth={2} />
                  <Text style={{ fontFamily: fonts.chillax.regular, color: '#8b6699' }}>Skip</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {state === 'rating' && currentTrack && (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <RatingControls
                onRating={handleRating}
                onSkip={skipTrack}
                trackTitle={currentTrack.title}
                trackArtist={currentTrack.artist}
              />
            </View>
          )}

          {state === 'revealed' && currentTrack && (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <TrackReveal
                track={currentTrack}
                rating={rating}
                onContinueListening={handleContinueListening}
                onDiscoverNext={handleDiscoverNext}
              />
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, TouchableWithoutFeedback, Keyboard, StyleSheet } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/layout/Screen';
import {
  MoodSelector,
  LoadingState,
  SessionHeader,
  WelcomeTip,
  PlaybackControls,
  RatingInterface,
  FullListeningMode,
  ThankYouOverlay,
  TransitionOverlay,
  ErrorState,
} from '@/components/discover';
import ArtistUnveilView from '@/components/ArtistUnveilView';
import { Track } from '@/types';
import { colors } from '@/utils/colors';

interface UserPreferences {
  preferred_genres: string[];
  preferred_moods: string[];
  min_duration: number;
  max_duration: number;
}

type DiscoverState = 'mood_selection' | 'loading' | 'playing' | 'rating' | 'revealed' | 'transitioning' | 'full_listening';

const ALL_MOODS = [
  'Energetic', 'Chill', 'Melancholic', 'Uplifting', 'Aggressive',
  'Romantic', 'Mysterious', 'Nostalgic', 'Experimental', 'Peaceful',
  'Dark', 'Dreamy', 'Intense', 'Playful', 'Contemplative', 'Euphoric'
];

export default function DiscoverScreen() {
  const { user } = useAuth();
  
  // State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [state, setState] = useState<DiscoverState>('mood_selection');
  const [selectedSessionMood, setSelectedSessionMood] = useState<string | null>(null);
  const [availableMoods, setAvailableMoods] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [trackRevealed, setTrackRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showWelcomeTip, setShowWelcomeTip] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [ratingThreshold] = useState(0.01);
  const [canSkip, setCanSkip] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserPreferences();
      checkFirstTimeUser();
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
        setShowRating(true);
      }
    }
  }, [position, duration, ratingThreshold, state]);

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
        if (data.preferred_moods && data.preferred_moods.length > 0) {
          const shuffledUserMoods = data.preferred_moods.sort(() => 0.5 - Math.random()).slice(0, 3);
          setAvailableMoods(shuffledUserMoods);
        } else {
          const randomMoods = ALL_MOODS.sort(() => 0.5 - Math.random()).slice(0, 3);
          setAvailableMoods(randomMoods);
        }
      } else {
        const randomMoods = ALL_MOODS.sort(() => 0.5 - Math.random()).slice(0, 3);
        setAvailableMoods(randomMoods);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      const randomMoods = ALL_MOODS.sort(() => 0.5 - Math.random()).slice(0, 3);
      setAvailableMoods(randomMoods);
    }
  };

  const checkFirstTimeUser = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('id')
        .eq('profile_id', user.id)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setShowWelcomeTip(true);
      }
    } catch (error) {
      console.error('Error checking first time user:', error);
    }
  };

  const handleMoodSelection = async (mood: string | null) => {
    setSelectedSessionMood(mood);
    setState('loading');
    setIsLoading(true);
    
    setTimeout(() => {
      loadNextTrack(false, mood);
    }, 500);
  };

  const loadNextTrack = async (isBackgroundLoad = false, sessionMood: string | null = null) => {
    try {
      if (!isBackgroundLoad) {
        setIsLoading(true);
        setError(null);
        setState('loading');
      }
      
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

      // Build query based on user preferences and session mood
      let query = supabase
        .from('tracks')
        .select('*')
        .lt('spotify_streams', 5000);

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      if (sessionMood) {
        query = query.eq('mood', sessionMood);
      }

      if (userPreferences && !sessionMood) {
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

      // Reset UI state
      setRating(0);
      setReview('');
      setShowRating(false);
      setTrackRevealed(false);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      setShowWelcomeTip(false);
      setCanSkip(true);
      setState('playing');

      if (!isBackgroundLoad) {
        setShowThankYou(false);
      }

    } catch (error) {
      console.error('Error loading track:', error);
      setError('Failed to load track. Please try again.');
    } finally {
      if (!isBackgroundLoad) {
        setIsLoading(false);
      }
    }
  };

  const loadNextTrackInBackground = async () => {
    await loadNextTrack(true, selectedSessionMood);
  };

  const fadeAudioAndTransition = async (callback: () => void) => {
    setIsTransitioning(true);
    
    if (sound) {
      try {
        await sound.setVolumeAsync(0, { duration: 200 });
      } catch (error) {
        console.error('Error fading audio:', error);
      }
    }
    
    setTimeout(() => {
      callback();
      setTimeout(() => {
        setIsTransitioning(false);
      }, 1000);
    }, 2000);
  };

  const showThankYouMessage = () => {
    setShowThankYou(true);
    loadNextTrackInBackground();
    
    setTimeout(() => {
      setShowThankYou(false);
    }, 3000);
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
            await sound.setVolumeAsync(0, { duration: 200 });
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.setVolumeAsync(1, { duration: 200 });
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

  const skipTrack = async () => {
    if (!canSkip) return;
    
    fadeAudioAndTransition(() => {
      loadNextTrack(false, selectedSessionMood);
    });
  };

  const submitRating = async (stars: number, reviewText?: string) => {
    if (!currentTrack || !user?.id) return;

    setRating(stars);
    setReview(reviewText || '');
    
    try {
      const { error } = await supabase
        .from('user_ratings')
        .insert({
          track_id: currentTrack.id,
          rating: stars,
          review_text: reviewText || null,
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
        setTrackRevealed(true);
        setState('revealed');
      } else {
        showThankYouMessage();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  const handleContinueListening = () => {
    setState('full_listening');
    setTrackRevealed(false);
    setCanSkip(true);
  };

  const handleDiscoverNext = () => {
    fadeAudioAndTransition(() => loadNextTrack(false, selectedSessionMood));
  };

  const handleNewSession = () => {
    setState('mood_selection');
    setSelectedSessionMood(null);
    setCurrentTrack(null);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
    
    loadUserPreferences();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Render different states
  if (state === 'mood_selection') {
    return (
      <Screen backgroundColor={colors.background}>
        <MoodSelector
          availableMoods={availableMoods}
          onMoodSelect={handleMoodSelection}
        />
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen backgroundColor={colors.background}>
        <LoadingState selectedMood={selectedSessionMood} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen backgroundColor={colors.background}>
        <ErrorState
          error={error}
          onRetry={() => loadNextTrack(false, selectedSessionMood)}
          onNewSession={handleNewSession}
        />
      </Screen>
    );
  }

  // Show artist unveil view when track is revealed
  if (trackRevealed && currentTrack) {
    return (
      <ArtistUnveilView
        track={currentTrack}
        onContinueListening={handleContinueListening}
        onDiscoverNext={handleDiscoverNext}
        userRating={rating}
        userReview={review}
      />
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <Screen backgroundColor={colors.background} style={styles.container}>
        {/* Session Header */}
        <SessionHeader
          selectedMood={selectedSessionMood}
          onNewSession={handleNewSession}
        />

        {/* Welcome Tip */}
        {showWelcomeTip && <WelcomeTip />}

        {/* Main Content */}
        <View style={styles.content}>
          {state === 'full_listening' && currentTrack ? (
            <FullListeningMode
              track={currentTrack}
              isPlaying={isPlaying}
              position={position}
              duration={duration}
              userRating={rating}
              userReview={review}
              onPlayPause={playPauseAudio}
              onSkip={skipTrack}
            />
          ) : showRating ? (
            <RatingInterface onRatingSubmit={submitRating} />
          ) : (
            <PlaybackControls
              isPlaying={isPlaying}
              canSkip={canSkip}
              onPlayPause={playPauseAudio}
              onSkip={skipTrack}
              position={position}
              duration={duration}
            />
          )}
        </View>

        {/* Overlays */}
        <ThankYouOverlay visible={showThankYou} />
        <TransitionOverlay visible={isTransitioning} />
      </Screen>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
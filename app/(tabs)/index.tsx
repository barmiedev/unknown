import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ActivityIndicator, TextInput, Keyboard, TouchableWithoutFeedback, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, Star, SkipForward, Shuffle, Gift } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { fonts } from '@/lib/fonts';
import ArtistUnveilView from '@/components/ArtistUnveilView';
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
  NoTracksInPreferencesState,
  NoTracksAtAllState,
} from '@/components/discover';

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

type DiscoverState = 'mood_selection' | 'loading' | 'playing' | 'rating' | 'revealed' | 'transitioning' | 'full_listening' | 'no_tracks_in_preferences' | 'no_tracks_at_all';

const ALL_MOODS = [
  'Energetic', 'Chill', 'Melancholic', 'Uplifting', 'Aggressive',
  'Romantic', 'Mysterious', 'Nostalgic', 'Experimental', 'Peaceful',
  'Dark', 'Dreamy', 'Intense', 'Playful', 'Contemplative', 'Euphoric'
];

const MOOD_EMOJIS: { [key: string]: string } = {
  'Energetic': '⚡',
  'Chill': '😌',
  'Melancholic': '🌧️',
  'Uplifting': '☀️',
  'Aggressive': '🔥',
  'Romantic': '💕',
  'Mysterious': '🌙',
  'Nostalgic': '🍂',
  'Experimental': '🧪',
  'Peaceful': '🕊️',
  'Dark': '🖤',
  'Dreamy': '☁️',
  'Intense': '💥',
  'Playful': '🎈',
  'Contemplative': '🤔',
  'Euphoric': '🌟'
};

interface AnimationBackgroundProps {
  animationUrl?: string;
  children: React.ReactNode;
}

// Animation Background Component - placeholder for future animation files
function AnimationBackground({ animationUrl, children }: AnimationBackgroundProps) {
  return (
    <View style={{ flex: 1, position: 'relative' }}>
      {/* Placeholder for future animation - transparent background */}
      <View style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        backgroundColor: 'transparent'
      }}>
        {/* Future animation will be rendered here based on animationUrl prop */}
      </View>
      
      {/* Content overlay */}
      <View style={{ flex: 1, zIndex: 1 }}>
        {children}
      </View>
    </View>
  );
}

// Helper function to check if audio URL is web-compatible
const isWebCompatibleAudio = (url: string): boolean => {
  if (Platform.OS !== 'web') return true;
  
  const webCompatibleFormats = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
  const urlLower = url.toLowerCase();
  return webCompatibleFormats.some(format => urlLower.includes(format));
};

// Helper function to get a fallback audio URL for web
const getWebCompatibleAudioUrl = (originalUrl: string): string => {
  if (Platform.OS !== 'web') return originalUrl;
  
  // If the original URL is already web-compatible, return it
  if (isWebCompatibleAudio(originalUrl)) {
    return originalUrl;
  }
  
  // For demo purposes, return a placeholder web-compatible audio file
  // In production, you would convert/serve the audio in a web-compatible format
  return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
};

export default function DiscoverScreen() {
  // All hooks must be called at the top level in the same order every time
  const { user } = useAuth();
  
  // State hooks - always called in the same order
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
  const [ratingThreshold] = useState(0.01); // 80% of track length
  const [canSkip, setCanSkip] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showReviewInput, setShowReviewInput] = useState(false);
  const [isReviewFocused, setIsReviewFocused] = useState(false);
  const [totalTracksRated, setTotalTracksRated] = useState(0);

  // Ref hooks - always called in the same order
  const reviewInputRef = useRef<TextInput>(null);

  // Animation shared values - always called in the same order
  const pulseAnimation = useSharedValue(1);
  const progressAnimation = useSharedValue(0);
  const thankYouOpacity = useSharedValue(0);
  const fadeOpacity = useSharedValue(1);
  const transitionTextOpacity = useSharedValue(0);
  const ratingContainerOpacity = useSharedValue(0);
  const ratingContainerScale = useSharedValue(0.8);
  const star1Animation = useSharedValue(0);
  const star2Animation = useSharedValue(0);
  const star3Animation = useSharedValue(0);
  const star4Animation = useSharedValue(0);
  const star5Animation = useSharedValue(0);
  const reviewInputAnimation = useSharedValue(0);
  const reviewInputHeight = useSharedValue(0);
  const moodSelectionOpacity = useSharedValue(1);
  const moodSelectionScale = useSharedValue(1);

  // Animated styles - always called in the same order
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${(position / duration) * 100}%`,
  }));

  const thankYouStyle = useAnimatedStyle(() => ({
    opacity: thankYouOpacity.value,
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  const transitionTextStyle = useAnimatedStyle(() => ({
    opacity: transitionTextOpacity.value,
  }));

  const ratingContainerStyle = useAnimatedStyle(() => ({
    opacity: ratingContainerOpacity.value,
    transform: [{ scale: ratingContainerScale.value }],
  }));

  const star1Style = useAnimatedStyle(() => ({
    opacity: star1Animation.value,
    transform: [
      { 
        scale: interpolate(
          star1Animation.value,
          [0, 1],
          [0.3, 1],
          Extrapolate.CLAMP
        )
      },
      {
        translateY: interpolate(
          star1Animation.value,
          [0, 1],
          [20, 0],
          Extrapolate.CLAMP
        )
      }
    ],
  }));

  const star2Style = useAnimatedStyle(() => ({
    opacity: star2Animation.value,
    transform: [
      { 
        scale: interpolate(
          star2Animation.value,
          [0, 1],
          [0.3, 1],
          Extrapolate.CLAMP
        )
      },
      {
        translateY: interpolate(
          star2Animation.value,
          [0, 1],
          [20, 0],
          Extrapolate.CLAMP
        )
      }
    ],
  }));

  const star3Style = useAnimatedStyle(() => ({
    opacity: star3Animation.value,
    transform: [
      { 
        scale: interpolate(
          star3Animation.value,
          [0, 1],
          [0.3, 1],
          Extrapolate.CLAMP
        )
      },
      {
        translateY: interpolate(
          star3Animation.value,
          [0, 1],
          [20, 0],
          Extrapolate.CLAMP
        )
      }
    ],
  }));

  const star4Style = useAnimatedStyle(() => ({
    opacity: star4Animation.value,
    transform: [
      { 
        scale: interpolate(
          star4Animation.value,
          [0, 1],
          [0.3, 1],
          Extrapolate.CLAMP
        )
      },
      {
        translateY: interpolate(
          star4Animation.value,
          [0, 1],
          [20, 0],
          Extrapolate.CLAMP
        )
      }
    ],
  }));

  const star5Style = useAnimatedStyle(() => ({
    opacity: star5Animation.value,
    transform: [
      { 
        scale: interpolate(
          star5Animation.value,
          [0, 1],
          [0.3, 1],
          Extrapolate.CLAMP
        )
      },
      {
        translateY: interpolate(
          star5Animation.value,
          [0, 1],
          [20, 0],
          Extrapolate.CLAMP
        )
      }
    ],
  }));

  const reviewInputStyle = useAnimatedStyle(() => ({
    opacity: reviewInputAnimation.value,
    transform: [
      {
        translateY: interpolate(
          reviewInputAnimation.value,
          [0, 1],
          [30, 0],
          Extrapolate.CLAMP
        )
      }
    ],
  }));

  const reviewInputContainerStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(
      reviewInputHeight.value,
      [0, 1],
      [0, 200],
      Extrapolate.CLAMP
    ),
  }));

  const moodSelectionStyle = useAnimatedStyle(() => ({
    opacity: moodSelectionOpacity.value,
    transform: [{ scale: moodSelectionScale.value }],
  }));

  // Effect hooks - always called in the same order
  useEffect(() => {
    if (user?.id) {
      loadUserPreferences();
      checkFirstTimeUser();
      loadUserStats();
    }

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [user]);

  useEffect(() => {
    if (isPlaying) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1
      );
    } else {
      pulseAnimation.value = withTiming(1);
    }
  }, [isPlaying]);

  // Monitor playback progress for rating trigger
  useEffect(() => {
    if (duration > 0 && position > 0 && state === 'playing') {
      const progress = position / duration;
      if (progress >= ratingThreshold) {
        setState('rating');
        setShowRating(true);
        // Trigger rating animations
        animateRatingAppearance();
      }
    }
  }, [position, duration, ratingThreshold, state]);

  // Function definitions
  const animateRatingAppearance = () => {
    // Container animation - faster
    ratingContainerOpacity.value = withTiming(1, { duration: 250 });
    ratingContainerScale.value = withTiming(1, { duration: 250 });

    // Staggered star animations - faster and tighter timing
    star1Animation.value = withDelay(100, withTiming(1, { duration: 200 }));
    star2Animation.value = withDelay(150, withTiming(1, { duration: 200 }));
    star3Animation.value = withDelay(200, withTiming(1, { duration: 200 }));
    star4Animation.value = withDelay(250, withTiming(1, { duration: 200 }));
    star5Animation.value = withDelay(300, withTiming(1, { duration: 200 }));
  };

  const animateReviewInput = () => {
    reviewInputAnimation.value = withTiming(1, { duration: 250 });
    reviewInputHeight.value = withTiming(1, { duration: 250 });
  };

  const resetRatingAnimations = () => {
    ratingContainerOpacity.value = 0;
    ratingContainerScale.value = 0.8;
    star1Animation.value = 0;
    star2Animation.value = 0;
    star3Animation.value = 0;
    star4Animation.value = 0;
    star5Animation.value = 0;
    reviewInputAnimation.value = 0;
    reviewInputHeight.value = 0;
  };

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
        // Set available moods - only 3 moods, preferably from user preferences
        if (data.preferred_moods && data.preferred_moods.length > 0) {
          // Shuffle user's preferred moods and take 3
          const shuffledUserMoods = data.preferred_moods.sort(() => 0.5 - Math.random()).slice(0, 3);
          setAvailableMoods(shuffledUserMoods);
        } else {
          // Show 3 random moods if no preferences
          const randomMoods = ALL_MOODS.sort(() => 0.5 - Math.random()).slice(0, 3);
          setAvailableMoods(randomMoods);
        }
      } else {
        // No preferences found, show 3 random moods
        const randomMoods = ALL_MOODS.sort(() => 0.5 - Math.random()).slice(0, 3);
        setAvailableMoods(randomMoods);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // Fallback to 3 random moods
      const randomMoods = ALL_MOODS.sort(() => 0.5 - Math.random()).slice(0, 3);
      setAvailableMoods(randomMoods);
    }
  };

  const loadUserStats = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('id')
        .eq('profile_id', user.id);

      if (error) throw error;

      setTotalTracksRated(data?.length || 0);
    } catch (error) {
      console.error('Error loading user stats:', error);
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
    
    // Animate mood selection fade out
    moodSelectionOpacity.value = withTiming(0, { duration: 500 });
    moodSelectionScale.value = withTiming(0.95, { duration: 500 });
    
    // Start loading track
    setState('loading');
    setIsLoading(true);
    
    // Wait for animation to complete, then load track
    setTimeout(() => {
      loadNextTrack(false, mood);
    }, 500);
  };

  const loadNextTrack = async (isBackgroundLoad = false, sessionMood: string | null = null, broadenSearch = false) => {
    try {
      if (!isBackgroundLoad && state !== 'no_tracks_in_preferences' && state !== 'no_tracks_at_all') {
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
        .lt('spotify_streams', 5000); // Only underground tracks

      // Exclude already rated tracks
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      // Apply session mood filter if selected (not "Surprise me") and not broadening search
      if (sessionMood && !broadenSearch) {
        query = query.eq('mood', sessionMood);
      }

      // Apply user preferences if available and no specific session mood and not broadening search
      if (userPreferences && !sessionMood && !broadenSearch) {
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

      // Get random track from filtered results
      const { data: tracks, error: tracksError } = await query.limit(50);

      if (tracksError) throw tracksError;

      if (!tracks || tracks.length === 0) {
        // If no tracks match current criteria and we haven't broadened search yet
        if (!broadenSearch) {
          // Check if there are any tracks available at all (broadened search)
          const { data: allTracks, error: allTracksError } = await supabase
            .from('tracks')
            .select('*')
            .lt('spotify_streams', 5000)
            .not('id', 'in', excludeIds.length > 0 ? `(${excludeIds.join(',')})` : '()')
            .limit(1);

          if (allTracksError) throw allTracksError;

          if (allTracks && allTracks.length > 0) {
            // There are tracks available, just not matching preferences
            setState('no_tracks_in_preferences');
            setIsLoading(false);
            return;
          } else {
            // No tracks available at all
            setState('no_tracks_at_all');
            setIsLoading(false);
            return;
          }
        } else {
          // Even broadened search found nothing
          setState('no_tracks_at_all');
          setIsLoading(false);
          return;
        }
      }

      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      setCurrentTrack(randomTrack);

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
      setShowReviewInput(false);
      setIsReviewFocused(false);
      setState('playing');

      // Reset animations
      resetRatingAnimations();
      
      // Reset mood selection animations for next time
      moodSelectionOpacity.value = 1;
      moodSelectionScale.value = 1;

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
    
    // Fade out audio volume over 0.2 seconds
    if (sound) {
      try {
        await sound.setVolumeAsync(0, { duration: 200 });
      } catch (error) {
        console.error('Error fading audio:', error);
      }
    }
    
    // Fade out current content
    fadeOpacity.value = withTiming(0, { duration: 300 });
    
    // Show transition message
    transitionTextOpacity.value = withTiming(1, { duration: 300 });
    
    // Wait for transition
    setTimeout(() => {
      runOnJS(callback)();
      
      // Fade back in
      setTimeout(() => {
        transitionTextOpacity.value = withTiming(0, { duration: 300 });
        fadeOpacity.value = withTiming(1, { duration: 300 });
        setIsTransitioning(false);
      }, 1000);
    }, 2000);
  };

  const showThankYouMessage = () => {
    setShowThankYou(true);
    thankYouOpacity.value = withTiming(1, { duration: 300 });
    
    loadNextTrackInBackground();
    
    setTimeout(() => {
      thankYouOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setShowThankYou)(false);
      });
    }, 3000);
  };

  const playPauseAudio = async () => {
    try {
      if (!currentTrack?.audio_url) {
        throw new Error('No audio URL available');
      }

      // Get web-compatible audio URL
      const audioUrl = getWebCompatibleAudioUrl(currentTrack.audio_url);

      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (isPlaying) {
            // Fade out volume over 0.2 seconds when pausing
            await sound.setVolumeAsync(0, { duration: 200 });
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            // Restore volume and play
            await sound.setVolumeAsync(1, { duration: 200 });
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
      } else {
        // Check if the audio URL is web-compatible before attempting to load
        if (Platform.OS === 'web' && !isWebCompatibleAudio(currentTrack.audio_url)) {
          console.warn('Audio file may not be web-compatible:', currentTrack.audio_url);
          setError('Audio format not supported in web browser. Please use MP3, WAV, or OGG format.');
          return;
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      
      // Provide more specific error messages for web
      if (Platform.OS === 'web') {
        if (error.message?.includes('no supported source')) {
          setError('Audio format not supported in web browser. Please ensure the audio file is in MP3, WAV, or OGG format and served with proper CORS headers.');
        } else if (error.message?.includes('CORS')) {
          setError('Unable to load audio due to CORS restrictions. Please ensure the audio server allows cross-origin requests.');
        } else {
          setError('Failed to load audio. Please check the audio file format and server configuration.');
        }
      } else {
        setError('Failed to play audio. Please try again.');
      }
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

  const submitRating = async (stars: number) => {
    if (!currentTrack || !user?.id) return;

    setRating(stars);
    
    try {
      const { error } = await supabase
        .from('user_ratings')
        .insert({
          track_id: currentTrack.id,
          rating: stars,
          review_text: review.trim() || null,
          profile_id: user.id,
          user_id: user.id,
        });

      if (error) {
        if (error.code !== '23505') {
          throw error;
        }
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

      // Update local count
      setTotalTracksRated(prev => prev + 1);

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

  const handleStarPress = (stars: number) => {
    if (stars >= 4) {
      setShowReviewInput(true);
      setRating(stars);
      // Animate review input appearance
      setTimeout(() => {
        animateReviewInput();
      }, 50);
    } else {
      submitRating(stars);
    }
  };

  const handleSubmitWithReview = () => {
    submitRating(rating);
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
    resetRatingAnimations();
    
    // Refresh available moods for new session
    loadUserPreferences();
  };

  const handleBroadenSearch = () => {
    setState('loading');
    setIsLoading(true);
    loadNextTrack(false, selectedSessionMood, true);
  };

  const handleChooseDifferentMood = () => {
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
    resetRatingAnimations();
    
    // Refresh available moods
    loadUserPreferences();
  };

  const handleGoToHistory = () => {
    router.push('/(tabs)/history');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setIsReviewFocused(false);
  };

  // No tracks in preferences state
  if (state === 'no_tracks_in_preferences') {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <SessionHeader
            selectedSessionMood={selectedSessionMood}
            onNewSession={handleNewSession}
          />
          <NoTracksInPreferencesState
            onBroadenSearch={handleBroadenSearch}
            onChooseDifferentMood={handleChooseDifferentMood}
            selectedMood={selectedSessionMood}
          />
        </SafeAreaView>
      </View>
    );
  }

  // No tracks at all state
  if (state === 'no_tracks_at_all') {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <SessionHeader
            selectedSessionMood={selectedSessionMood}
            onNewSession={handleNewSession}
          />
          <NoTracksAtAllState
            onGoToHistory={handleGoToHistory}
            totalTracksRated={totalTracksRated}
          />
        </SafeAreaView>
      </View>
    );
  }

  // Mood Selection Screen
  if (state === 'mood_selection') {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <AnimationBackground>
            <MoodSelector
              availableMoods={availableMoods}
              moodEmojis={MOOD_EMOJIS}
              onMoodSelect={handleMoodSelection}
              moodSelectionStyle={moodSelectionStyle}
            />
          </AnimationBackground>
        </SafeAreaView>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <LoadingState
            selectedSessionMood={selectedSessionMood}
            moodEmojis={MOOD_EMOJIS}
          />
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ErrorState
            error={error}
            onTryAgain={() => loadNextTrack(false, selectedSessionMood)}
            onNewSession={handleNewSession}
          />
        </SafeAreaView>
      </View>
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
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <AnimationBackground>
            <SessionHeader
              selectedSessionMood={selectedSessionMood}
              onNewSession={handleNewSession}
              moodEmojis={MOOD_EMOJIS}
            />

            {showWelcomeTip && (
              <WelcomeTip />
            )}

            <ThankYouOverlay
              showThankYou={showThankYou}
              thankYouStyle={thankYouStyle}
            />

            <TransitionOverlay
              isTransitioning={isTransitioning}
              transitionTextStyle={transitionTextStyle}
            />

            {/* Main Player Area */}
            <Animated.View style={[fadeStyle, { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
              {state === 'full_listening' && currentTrack ? (
                <FullListeningMode
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlayPause={playPauseAudio}
                  position={position}
                  duration={duration}
                  progressStyle={progressStyle}
                  onSkip={skipTrack}
                  rating={rating}
                  review={review}
                />
              ) : !showRating ? (
                <PlaybackControls
                  isPlaying={isPlaying}
                  onPlayPause={playPauseAudio}
                  pulseStyle={pulseStyle}
                  position={position}
                  duration={duration}
                  progressStyle={progressStyle}
                  canSkip={canSkip}
                  onSkip={skipTrack}
                />
              ) : (
                <RatingInterface
                  onStarPress={handleStarPress}
                  rating={rating}
                  showReviewInput={showReviewInput}
                  review={review}
                  onReviewChange={setReview}
                  onSubmitWithReview={handleSubmitWithReview}
                  isReviewFocused={isReviewFocused}
                  setIsReviewFocused={setIsReviewFocused}
                  reviewInputRef={reviewInputRef}
                  ratingContainerStyle={ratingContainerStyle}
                  starStyles={{
                    star1Style,
                    star2Style,
                    star3Style,
                    star4Style,
                    star5Style,
                  }}
                  reviewInputStyle={reviewInputStyle}
                  reviewInputContainerStyle={reviewInputContainerStyle}
                />
              )}
            </Animated.View>
          </AnimationBackground>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}
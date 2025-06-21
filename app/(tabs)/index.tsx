import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ActivityIndicator, TextInput, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, Star, SkipForward, Shuffle, Gift } from 'lucide-react-native';
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

type DiscoverState = 'mood_selection' | 'loading' | 'playing' | 'rating' | 'revealed' | 'transitioning' | 'full_listening';

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
        .lt('spotify_streams', 5000); // Only underground tracks

      // Exclude already rated tracks
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      // Apply session mood filter if selected (not "Surprise me")
      if (sessionMood) {
        query = query.eq('mood', sessionMood);
      }

      // Apply user preferences if available and no specific session mood
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

      // Get random track from filtered results
      const { data: tracks, error: tracksError } = await query.limit(50);

      if (tracksError) throw tracksError;

      if (!tracks || tracks.length === 0) {
        // If no tracks match preferences, try with relaxed filters
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

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setIsReviewFocused(false);
  };

  // Mood Selection Screen
  if (state === 'mood_selection') {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <AnimationBackground>
            <Animated.View style={[moodSelectionStyle, { flex: 1, paddingHorizontal: 24 }]}>
              {/* Header */}
              <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 64 }}>
                <Text style={{ fontSize: 24, fontFamily: fonts.chillax.bold, color: '#ded7e0', marginBottom: 32 }}>
                  unknown
                </Text>
                <Text style={{ fontSize: 28, fontFamily: fonts.chillax.bold, color: '#ded7e0', textAlign: 'center' }}>
                  How do you feel today?
                </Text>
              </View>

              {/* Mood Options - Only 3 moods */}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ 
                  flexDirection: 'row', 
                  flexWrap: 'wrap', 
                  gap: 20, 
                  justifyContent: 'center',
                  marginBottom: 48
                }}>
                  {availableMoods.map((mood) => (
                    <TouchableOpacity
                      key={mood}
                      onPress={() => handleMoodSelection(mood)}
                      style={{
                        backgroundColor: '#28232a',
                        paddingHorizontal: 20,
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: 'center',
                        minWidth: 120,
                        shadowColor: '#452451',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <Text style={{ fontSize: 28, marginBottom: 6 }}>
                        {MOOD_EMOJIS[mood] || '🎵'}
                      </Text>
                      <Text style={{ 
                        fontSize: 14, 
                        fontFamily: fonts.chillax.regular, 
                        color: '#ded7e0',
                        textAlign: 'center'
                      }}>
                        {mood}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Surprise Me Button */}
                <View style={{ alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => handleMoodSelection(null)}
                    style={{
                      backgroundColor: '#452451',
                      paddingHorizontal: 28,
                      paddingVertical: 16,
                      borderRadius: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      shadowColor: '#452451',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.4,
                      shadowRadius: 12,
                      elevation: 8,
                    }}
                  >
                    <Shuffle size={20} color="#ded7e0" strokeWidth={2} />
                    <Text style={{ 
                      fontSize: 16, 
                      fontFamily: fonts.chillax.bold, 
                      color: '#ded7e0'
                    }}>
                      Surprise me
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </AnimationBackground>
        </SafeAreaView>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 32 }}>🎵</Text>
          <ActivityIndicator size="large" color="#8b6699" />
          <Text style={{ color: '#ded7e0', marginTop: 16, fontFamily: fonts.chillax.regular, fontSize: 18 }}>
            Finding your perfect track...
          </Text>
          {selectedSessionMood && (
            <Text style={{ color: '#8b6699', marginTop: 8, fontFamily: fonts.chillax.regular, fontSize: 16 }}>
              {MOOD_EMOJIS[selectedSessionMood]} {selectedSessionMood} vibes
            </Text>
          )}
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ color: 'white', textAlign: 'center', marginBottom: 16, fontFamily: fonts.chillax.regular }}>{error}</Text>
          <TouchableOpacity
            onPress={() => loadNextTrack(false, selectedSessionMood)}
            style={{ backgroundColor: '#452451', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, marginBottom: 16 }}
          >
            <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.bold, fontSize: 18 }}>
              Try Again
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNewSession}
            style={{ backgroundColor: '#28232a', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 }}
          >
            <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.medium, fontSize: 16 }}>
              Choose Different Mood
            </Text>
          </TouchableOpacity>
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
            {/* Header with Session Info - Same background as player */}
            <View style={{ 
              backgroundColor: '#19161a',
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingHorizontal: 24, 
              paddingTop: 24, 
              paddingBottom: 16 
            }}>
              {/* Logo positioned at top left */}
              <Text style={{ fontSize: 24, fontFamily: fonts.chillax.bold, color: '#ded7e0' }}>
                unknown
              </Text>
              
              {/* Mood session info positioned at top right */}
              <TouchableOpacity
                onPress={handleNewSession}
                style={{ 
                  backgroundColor: '#28232a', 
                  paddingHorizontal: 16, 
                  paddingVertical: 8, 
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {selectedSessionMood ? (
                  <>
                    <Text style={{ fontSize: 16 }}>
                      {MOOD_EMOJIS[selectedSessionMood]}
                    </Text>
                    <Text style={{ fontSize: 14, fontFamily: fonts.chillax.medium, color: '#8b6699' }}>
                      {selectedSessionMood}
                    </Text>
                  </>
                ) : (
                  <>
                    <Gift size={16} color="#8b6699" strokeWidth={2} />
                    <Text style={{ fontSize: 14, fontFamily: fonts.chillax.medium, color: '#8b6699' }}>
                      surprise
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Welcome Tip */}
            {showWelcomeTip && (
              <View style={{ backgroundColor: '#28232a', borderRadius: 16, padding: 16, marginHorizontal: 24, marginBottom: 24 }}>
                <Text style={{ fontSize: 16, fontFamily: fonts.chillax.bold, color: '#ded7e0', marginBottom: 8 }}>
                  Welcome to the Underground! 🎵
                </Text>
                <Text style={{ fontSize: 14, fontFamily: fonts.chillax.regular, color: '#8b6699' }}>
                  Tap play to start discovering hidden gems. Rate tracks to reveal the artist and add them to your collection.
                </Text>
              </View>
            )}

            {/* Thank You Overlay */}
            {showThankYou && (
              <Animated.View style={[
                thankYouStyle,
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
                  <Text style={{ fontSize: 64, marginBottom: 32 }}>🙏</Text>
                  <Text style={{ 
                    fontSize: 32, 
                    fontFamily: fonts.chillax.bold, 
                    color: '#ded7e0', 
                    textAlign: 'center',
                    marginBottom: 20 
                  }}>
                    Thank you for your feedback!
                  </Text>
                  <Text style={{ 
                    fontSize: 18, 
                    fontFamily: fonts.chillax.regular, 
                    color: '#8b6699', 
                    textAlign: 'center',
                    lineHeight: 28,
                    maxWidth: 280
                  }}>
                    Your taste helps us discover better music for everyone
                  </Text>
                </View>
              </Animated.View>
            )}

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

            {/* Main Player Area */}
            <Animated.View style={[fadeStyle, { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
              {state === 'full_listening' && currentTrack ? (
                /* Full Listening Mode - Cover art with play button, track info below */
                <>
                  {/* Cover Art with Play Button */}
                  <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <View style={{ 
                      width: 280, 
                      height: 280, 
                      borderRadius: 24, 
                      overflow: 'hidden',
                      position: 'relative',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.3,
                      shadowRadius: 16,
                      elevation: 8,
                    }}>
                      {currentTrack.artwork_url ? (
                        <Image
                          source={{ uri: currentTrack.artwork_url }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{ 
                          width: '100%', 
                          height: '100%', 
                          backgroundColor: '#28232a', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <Text style={{ fontSize: 64 }}>🎵</Text>
                        </View>
                      )}
                      
                      {/* Play/Pause Button Overlay */}
                      <TouchableOpacity
                        onPress={playPauseAudio}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: [{ translateX: -30 }, { translateY: -30 }],
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: 'rgba(69, 36, 81, 0.9)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 4,
                        }}
                      >
                        {isPlaying ? (
                          <Pause size={24} color="#ded7e0" strokeWidth={2} />
                        ) : (
                          <Play size={24} color="#ded7e0" strokeWidth={2} style={{ marginLeft: 2 }} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Track Info */}
                  <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <Text style={{ 
                      color: '#ded7e0', 
                      fontSize: 24, 
                      fontFamily: fonts.chillax.bold, 
                      textAlign: 'center',
                      marginBottom: 8 
                    }}>
                      {currentTrack.title}
                    </Text>
                    <Text style={{ 
                      color: '#8b6699', 
                      fontSize: 18, 
                      fontFamily: fonts.chillax.regular, 
                      textAlign: 'center' 
                    }}>
                      {currentTrack.artist}
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={{ width: '100%', maxWidth: 320, height: 4, backgroundColor: '#28232a', borderRadius: 2, marginBottom: 32 }}>
                    <Animated.View
                      style={[progressStyle, { height: '100%', backgroundColor: '#452451', borderRadius: 2 }]}
                    />
                  </View>

                  {/* Next Button */}
                  <TouchableOpacity
                    onPress={skipTrack}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      gap: 8, 
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      backgroundColor: '#28232a',
                      borderRadius: 16,
                      marginBottom: 32,
                    }}
                  >
                    <SkipForward size={20} color='#8b6699' strokeWidth={2} />
                    <Text style={{ fontFamily: fonts.chillax.medium, color: '#8b6699', fontSize: 16 }}>Next</Text>
                  </TouchableOpacity>

                  {/* Rating Display - Full width */}
                  <View style={{ 
                    width: '100%', 
                    backgroundColor: 'rgba(222, 215, 224, 0.1)', 
                    borderRadius: 16, 
                    padding: 16,
                    alignItems: 'flex-start'
                  }}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontFamily: fonts.chillax.medium, 
                      color: '#ded7e0', 
                      marginBottom: 8 
                    }}>
                      Your Rating
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 4, marginBottom: 12 }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Text key={i} style={{ color: i < rating ? '#ded7e0' : '#8b6699', fontSize: 18 }}>
                          ★
                        </Text>
                      ))}
                    </View>
                    {review && (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', maxWidth: '100%' }}>
                        <Text style={{ fontSize: 28, fontFamily: fonts.chillax.bold, color: '#452451', lineHeight: 24 }}>"</Text>
                        <Text style={{ 
                          fontSize: 18, 
                          fontFamily: fonts.chillax.regular, 
                          color: '#8b6699', 
                          fontStyle: 'italic',
                          flex: 1,
                          marginHorizontal: 8,
                          lineHeight: 26
                        }}>
                          {review}
                        </Text>
                        <Text style={{ fontSize: 28, fontFamily: fonts.chillax.bold, color: '#452451', lineHeight: 24 }}>"</Text>
                      </View>
                    )}
                  </View>
                </>
              ) : !showRating ? (
                <>
                  {/* Play Button */}
                  <Animated.View style={[pulseStyle, { marginBottom: 40 }]}>
                    <TouchableOpacity
                      onPress={playPauseAudio}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: '#452451',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#452451',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.3,
                        shadowRadius: 16,
                        elevation: 8,
                      }}
                    >
                      {isPlaying ? (
                        <Pause size={40} color="#ded7e0" strokeWidth={2} />
                      ) : (
                        <Play size={40} color="#ded7e0" strokeWidth={2} style={{ marginLeft: 4 }} />
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Progress Bar */}
                  <View style={{ width: '100%', maxWidth: 320, height: 4, backgroundColor: '#28232a', borderRadius: 2, marginBottom: 40 }}>
                    <Animated.View
                      style={[progressStyle, { height: '100%', backgroundColor: '#452451', borderRadius: 2 }]}
                    />
                  </View>

                  {/* Next Button - only show when not rating */}
                  {canSkip && (
                    <TouchableOpacity
                      onPress={skipTrack}
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        gap: 8, 
                        paddingHorizontal: 24,
                        paddingVertical: 16,
                        backgroundColor: '#28232a',
                        borderRadius: 16,
                      }}
                    >
                      <SkipForward size={20} color='#8b6699' strokeWidth={2} />
                      <Text style={{ fontFamily: fonts.chillax.medium, color: '#8b6699', fontSize: 16 }}>Next</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                /* Rating Interface - Full width */
                <Animated.View style={[ratingContainerStyle, { alignItems: 'center', width: '100%' }]}>
                  <Text style={{ fontSize: 18, fontFamily: fonts.chillax.medium, textAlign: 'center', marginBottom: 32, color: '#ded7e0' }}>
                    How does this track make you feel?
                  </Text>

                  {/* Rating Stars with Individual Animated Styles - Full width */}
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    width: '100%', 
                    paddingHorizontal: 24,
                    marginBottom: 24 
                  }}>
                    <Animated.View style={star1Style}>
                      <TouchableOpacity
                        onPress={() => handleStarPress(1)}
                        style={{ padding: 6 }}
                      >
                        <Star
                          size={28}
                          color={1 <= rating ? '#ded7e0' : '#8b6699'}
                          fill={1 <= rating ? '#ded7e0' : 'transparent'}
                          strokeWidth={1.5}
                        />
                      </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={star2Style}>
                      <TouchableOpacity
                        onPress={() => handleStarPress(2)}
                        style={{ padding: 6 }}
                      >
                        <Star
                          size={28}
                          color={2 <= rating ? '#ded7e0' : '#8b6699'}
                          fill={2 <= rating ? '#ded7e0' : 'transparent'}
                          strokeWidth={1.5}
                        />
                      </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={star3Style}>
                      <TouchableOpacity
                        onPress={() => handleStarPress(3)}
                        style={{ padding: 6 }}
                      >
                        <Star
                          size={28}
                          color={3 <= rating ? '#ded7e0' : '#8b6699'}
                          fill={3 <= rating ? '#ded7e0' : 'transparent'}
                          strokeWidth={1.5}
                        />
                      </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={star4Style}>
                      <TouchableOpacity
                        onPress={() => handleStarPress(4)}
                        style={{ padding: 6 }}
                      >
                        <Star
                          size={28}
                          color={4 <= rating ? '#ded7e0' : '#8b6699'}
                          fill={4 <= rating ? '#ded7e0' : 'transparent'}
                          strokeWidth={1.5}
                        />
                      </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={star5Style}>
                      <TouchableOpacity
                        onPress={() => handleStarPress(5)}
                        style={{ padding: 6 }}
                      >
                        <Star
                          size={28}
                          color={5 <= rating ? '#ded7e0' : '#8b6699'}
                          fill={5 <= rating ? '#ded7e0' : 'transparent'}
                          strokeWidth={1.5}
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  </View>

                  {/* Review Input for High Ratings */}
                  {showReviewInput && (
                    <Animated.View style={[reviewInputContainerStyle, { width: '100%', overflow: 'hidden' }]}>
                      <Animated.View style={[reviewInputStyle, { width: '100%', marginBottom: 20 }]}>
                        <Text style={{ fontSize: 16, fontFamily: fonts.chillax.medium, color: '#ded7e0', marginBottom: 10 }}>
                          Share your thoughts (optional)
                        </Text>
                        <View style={{ backgroundColor: '#28232a', borderRadius: 16, padding: 14 }}>
                          <TextInput
                            ref={reviewInputRef}
                            style={{ 
                              fontSize: 16, 
                              fontFamily: fonts.chillax.regular, 
                              color: '#ded7e0',
                              minHeight: 70,
                              textAlignVertical: 'top'
                            }}
                            placeholder="What did you love about this track?"
                            placeholderTextColor="#8b6699"
                            value={review}
                            onChangeText={setReview}
                            multiline
                            onFocus={() => setIsReviewFocused(true)}
                            onBlur={() => setIsReviewFocused(false)}
                          />
                        </View>
                        
                        <TouchableOpacity
                          onPress={handleSubmitWithReview}
                          style={{ backgroundColor: '#452451', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 12 }}
                        >
                          <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.bold, fontSize: 16 }}>
                            Submit Rating
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    </Animated.View>
                  )}
                </Animated.View>
              )}
            </Animated.View>
          </AnimationBackground>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}
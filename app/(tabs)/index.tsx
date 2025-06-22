import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Alert, TextInput, Keyboard, TouchableWithoutFeedback, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Shuffle } from 'lucide-react-native';
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
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAudio } from '@/contexts/AudioContext';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { useAudioPlayerPadding } from '@/hooks/useAudioPlayerPadding';
import { Button } from '@/components/buttons';
import { Heading } from '@/components/typography';
import { Text } from '@/components/typography/Text';
import { Logo } from '@/components/typography/Logo';
import ArtistUnveilView from '@/components/ArtistUnveilView';
import { Track, UserPreferences, DiscoverState, AnimationBackgroundProps, GamificationReward } from '@/types';
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
  GamificationRewardDisplay,
} from '@/components/discover';
import { getMoodsForSession } from '@/utils/music';
import { type Mood } from '@/utils/constants';
import { MoodButtons } from '@/components/selection';
import { Screen } from '@/components/layout/Screen';

// Animation Background Component - placeholder for future animation files
function AnimationBackground({ animationUrl, children }: AnimationBackgroundProps) {
  return (
    <View style={{ flex: 1, position: 'relative', backgroundColor: colors.background }}>
      {/* Placeholder for future animation - transparent background */}
      <View style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        backgroundColor: colors.background
      }}>
        {/* Future animation will be rendered here based on animationUrl prop */}
      </View>
      
      {/* Content overlay */}
      <View style={{ flex: 1, zIndex: 1, backgroundColor: colors.background }}>
        {children}
      </View>
    </View>
  );
}

export default function DiscoverScreen() {
  // All hooks must be called at the top level in the same order every time
  const { user, refreshUser } = useAuth();
  const { 
    currentTrack: globalCurrentTrack, 
    isPlaying, 
    position, 
    duration, 
    loadTrack, 
    playPause, 
    stop, 
    error: audioError,
    unveilTrack
  } = useAudio();
  const { paddingBottom } = useAudioPlayerPadding();
  
  // State hooks - always called in the same order
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [state, setState] = useState<DiscoverState>('mood_selection');
  const [selectedSessionMood, setSelectedSessionMood] = useState<string | null>(null);
  const [availableMoods, setAvailableMoods] = useState<Mood[]>([]);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [trackRevealed, setTrackRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeTip, setShowWelcomeTip] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [ratingThreshold] = useState(0.05); // 5% of track length
  const [canSkip, setCanSkip] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showReviewInput, setShowReviewInput] = useState(false);
  const [isReviewFocused, setIsReviewFocused] = useState(false);
  const [totalTracksRated, setTotalTracksRated] = useState(0);
  // Track if we're in broadened search mode (Surprise me or broadened search)
  const [isBroadenedSearch, setIsBroadenedSearch] = useState(false);
  const [ratedTrackIds, setRatedTrackIds] = useState<string[]>([]);
  
  // Gamification state
  const [gamificationReward, setGamificationReward] = useState<GamificationReward | null>(null);
  const [showGamificationReward, setShowGamificationReward] = useState(false);

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

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  // Effect hooks - always called in the same order
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

  const loadUserData = async () => {
    if (!user?.id) return;

    try {
      // Single query to get all user ratings data
      const { data: ratings, error } = await supabase
        .from('user_ratings')
        .select('id, track_id')
        .eq('profile_id', user.id);

      if (error) throw error;

      // Use the same data for all three purposes
      const totalTracksRated = ratings?.length || 0;
      const isFirstTimeUser = totalTracksRated === 0;
      const ratedTrackIds = ratings?.map(r => r.track_id) || [];

      // Update state
      setTotalTracksRated(totalTracksRated);
      if (isFirstTimeUser) {
        setShowWelcomeTip(true);
      }

      // Store rated track IDs for use in loadNextTrack
      setRatedTrackIds(ratedTrackIds);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
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
        throw error;
      }

      if (data) {
        setUserPreferences(data);
        // Set available moods using the utility function
        const moodsForSession = getMoodsForSession(data.preferred_moods || [], 3);
        setAvailableMoods(moodsForSession);
      } else {
        // No preferences found, show 3 random moods
        const moodsForSession = getMoodsForSession([], 3);
        setAvailableMoods(moodsForSession);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // Fallback to 3 random moods
      const moodsForSession = getMoodsForSession([], 3);
      setAvailableMoods(moodsForSession);
    }
  };

  // Load user data when user changes
  useEffect(() => {
    if (user?.id) {
      loadUserData();
      loadUserPreferences();
    }
  }, [user]);

  const handleMoodSelection = async (mood: string | null) => {
    setSelectedSessionMood(mood);
    
    // Set broadened search mode if "Surprise me" is selected
    const shouldBroadenSearch = mood === null;
    setIsBroadenedSearch(shouldBroadenSearch);
    
    // Animate mood selection fade out
    moodSelectionOpacity.value = withTiming(0, { duration: 200 });
    moodSelectionScale.value = withTiming(0.95, { duration: 200 });
    
    // Start loading track
    setState('loading');
    setIsLoading(true);
    
    // Wait for animation to complete, then load track
    setTimeout(async () => {
      // For "Surprise me" (mood === null), always broaden search to avoid "no tracks" scenario
      await loadNextTrack(false, mood, shouldBroadenSearch);
    }, 200);
  };

  const loadNextTrack = async (isBackgroundLoad = false, sessionMood: string | null = null, broadenSearch = false, autoPlay = true) => {
    try {
      if (!isBackgroundLoad && state !== 'no_tracks_in_preferences' && state !== 'no_tracks_at_all') {
        setIsLoading(true);
        setError(null);
        setState('loading');
      }

      // Use stored rated track IDs instead of making another query
      const excludeIds = ratedTrackIds || [];

      // Build query based on user preferences and session mood
      let query = supabase
        .from('tracks')
        .select('*')
        .lt('spotify_streams', 5000); // Only underground tracks

      // Exclude already rated tracks
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      // Use broadened search if we're in that mode OR if explicitly requested
      const shouldUseBroadenedSearch = isBroadenedSearch || broadenSearch;

      // Apply session mood filter if selected (not "Surprise me") and not broadening search
      if (sessionMood && !shouldUseBroadenedSearch) {
        query = query.eq('mood', sessionMood);
      }

      // Apply user preferences if available and no specific session mood and not broadening search
      if (userPreferences && !sessionMood && !shouldUseBroadenedSearch) {
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
        if (!shouldUseBroadenedSearch) {
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
          // Even broadened search found no tracks
          setState('no_tracks_at_all');
          setIsLoading(false);
          return;
        }
      }

      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      setCurrentTrack(randomTrack);

      // Load track into global audio context
      await loadTrack(randomTrack, autoPlay);

      // Reset UI state
      setRating(0);
      setReview('');
      setShowRating(false);
      setTrackRevealed(false);
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

    } catch (error) {
      console.error('Error loading track:', error);
      setError('Failed to load track. Please try again.');
    } finally {
      if (!isBackgroundLoad) {
        setIsLoading(false);
      }
    }
  };

  const fadeAudioAndTransition = useCallback(async (callback: () => void) => {
    setIsTransitioning(true);
    
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
  }, [fadeOpacity, transitionTextOpacity]);

  const showThankYouMessage = () => {
    setShowThankYou(true);
    thankYouOpacity.value = withTiming(1, { duration: 300 });
    
    // Immediately reset UI state to hide rating interface
    setShowRating(false);
    setRating(0);
    setReview('');
    setShowReviewInput(false);
    setIsReviewFocused(false);
    
    setTimeout(() => {
      thankYouOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setShowThankYou)(false);
      });
    }, 3000);
  };

  const skipTrack = async () => {
    if (!canSkip || !currentTrack || !user?.id) return;
    
    fadeAudioAndTransition(() => {
      // Maintain the current broadened search state when skipping
      loadNextTrack(false, selectedSessionMood, isBroadenedSearch);
    });
  };

  const submitRating = async (stars: number) => {
    if (!currentTrack || !user?.id) return;

    setRating(stars);
    
    try {
      // Determine gamification flags
      const isBlindRating = !trackRevealed; // If track was not revealed before rating
      
      // Determine if rating is outside user preferences
      let isOutsidePreference = false;
      if (userPreferences && currentTrack) {
        const preferredGenres = userPreferences.preferred_genres || [];
        const preferredMoods = userPreferences.preferred_moods || [];
        
        const isGenrePreferred = preferredGenres.includes(currentTrack.genre);
        const isMoodPreferred = preferredMoods.includes(currentTrack.mood);
        
        // Consider it "outside preference" if either genre or mood is not preferred
        // and the user has preferences set for that category, and the rating is positive (4-5 stars)
        if (stars >= 4 && (
          (preferredGenres.length > 0 && !isGenrePreferred) ||
          (preferredMoods.length > 0 && !isMoodPreferred)
        )) {
          isOutsidePreference = true;
        }
      }

      const listenPercentage = duration > 0 ? position / duration : 0;

      // Insert user rating
      const { error: ratingError } = await supabase
        .from('user_ratings')
        .insert({
          track_id: currentTrack.id,
          rating: stars,
          review_text: review.trim() || null,
          profile_id: user.id,
          user_id: user.id, // Keep for backward compatibility
          is_blind_rating: isBlindRating,
          is_outside_preference: isOutsidePreference,
          listen_percentage: listenPercentage,
        });

      // Handle duplicate rating error gracefully
      if (ratingError && ratingError.code === '23505') {
        console.warn('Attempted to re-rate an already rated track. Skipping update.');
        return;
      } else if (ratingError) {
        throw ratingError;
      }

      // Call gamification RPC function only for good ratings
      let gamificationData = null;
      if (stars >= 4) {
        const { data: gamificationResult, error: gamificationError } = await supabase.rpc('calculate_gamification_rewards', {
          p_user_id: user.id,
          p_rating_data: {
            track_id: currentTrack.id,
            rating: stars,
            review_text: review.trim() || null,
            is_blind_rating: isBlindRating,
            is_outside_preference: isOutsidePreference,
            listen_percentage: listenPercentage,
          },
        });

        if (gamificationError) {
          console.error('Error calculating gamification rewards:', gamificationError);
        } else if (gamificationResult) {
          gamificationData = gamificationResult;
          setGamificationReward(gamificationResult);
          
          // Refresh user data to update XP
          refreshUser();
        }
      }

      // Update user stats (legacy)
      try {
        const { error: statsError } = await supabase
          .from('user_stats')
          .upsert({
            profile_id: user.id,
            user_id: user.id,
            total_tracks_rated_count: 1,
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
        setShowThankYou(false);
        setIsTransitioning(false);
        setShowWelcomeTip(false);
        
        // Unveil track in global audio player for high ratings
        unveilTrack();
        
        // Show gamification reward immediately when track is revealed
        if (gamificationData) {
          setShowGamificationReward(true);
        }
      } else {
        showThankYouMessage();
        // For low ratings, just immediately load next track without thank you message
        loadNextTrack(false, selectedSessionMood, isBroadenedSearch, true);
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
    fadeAudioAndTransition(() => {
      // Maintain the current broadened search state when discovering next
      loadNextTrack(false, selectedSessionMood, isBroadenedSearch);
    });
  };

  const handleNewSession = async () => {
    setState('mood_selection');
    setSelectedSessionMood(null);
    setCurrentTrack(null);
    // Reset broadened search state when starting new session
    setIsBroadenedSearch(false);
    
    // Stop audio using global context
    await stop();
    
    resetRatingAnimations();
    
    // Refresh available moods for new session
    await loadUserPreferences();
  };

  const handleBroadenSearch = () => {
    setState('loading');
    setIsLoading(true);
    // Set broadened search mode when user explicitly chooses to broaden
    setIsBroadenedSearch(true);
    loadNextTrack(false, selectedSessionMood, true);
  };

  const handleChooseDifferentMood = async () => {
    setState('mood_selection');
    setSelectedSessionMood(null);
    setCurrentTrack(null);
    // Reset broadened search state when choosing different mood
    setIsBroadenedSearch(false);
    
    // Stop audio using global context
    await stop();
    
    resetRatingAnimations();
    
    // Refresh available moods
    await loadUserPreferences();
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
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
          <Screen backgroundColor={colors.background} withoutBottomSafeArea paddingHorizontal={0}>
            <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingBottom }}>
              <SessionHeader
                selectedMood={selectedSessionMood}
                onNewSession={handleNewSession}
              />
              <NoTracksInPreferencesState
                onBroadenSearch={handleBroadenSearch}
                onChooseDifferentMood={handleChooseDifferentMood}
                selectedMood={selectedSessionMood}
              />
            </View>
          </Screen>
        </Animated.View>
      </View>
    );
  }

  // No tracks at all state
  if (state === 'no_tracks_at_all') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
          <Screen backgroundColor={colors.background} withoutBottomSafeArea paddingHorizontal={0}>
            <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingBottom }}>
              <SessionHeader
                selectedMood={selectedSessionMood}
                onNewSession={handleNewSession}
              />
              <NoTracksAtAllState
                onGoToHistory={handleGoToHistory}
                totalTracksRated={totalTracksRated}
              />
            </View>
          </Screen>
        </Animated.View>
      </View>
    );
  }

  // Mood Selection Screen
  if (state === 'mood_selection') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
          <Screen backgroundColor={colors.background} withoutBottomSafeArea>
            <AnimationBackground>
              <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingBottom }}>
                {/* Logo at top left */}
                <View style={{ 
                  position: 'absolute', 
                  top: spacing.md,
                  zIndex: 10 
                }}>
                  <Text variant="button" color="primary" style={{ fontSize: 24 }}>
                    unknown
                  </Text>
                </View>

                {/* Header with more space */}
                <View style={{ alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.xxl }}>
                  <Heading variant="h3" color="primary" align="center" style={{ fontSize: 28, marginBottom: spacing.xl, marginTop: spacing.xxl }}>
                    How do you feel today?
                  </Heading>
                </View>

                {/* Mood Buttons */}
                <MoodButtons
                  availableMoods={availableMoods}
                  onMoodSelect={handleMoodSelection}
                  style={{ flex: 1, justifyContent: 'center' }}
                />

                {/* Surprise Me Button */}
                <View style={{ alignItems: 'center', paddingBottom: spacing.xxl }}>
                  <Button
                    variant="primary"
                    size="large"
                    onPress={() => handleMoodSelection(null)}
                    icon={<Shuffle size={20} color={colors.text.primary} strokeWidth={2} />}
                    iconPosition="left"
                    style={{
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.4,
                      shadowRadius: 12,
                      elevation: 8,
                    }}
                  >
                    Surprise me
                  </Button>
                </View>
              </View>
            </AnimationBackground>
          </Screen>
        </Animated.View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
          <Screen backgroundColor={colors.background} withoutBottomSafeArea>
            <View style={{ flex: 1, paddingBottom }}>
              <LoadingState
                selectedMood={selectedSessionMood}
              />
            </View>
          </Screen>
        </Animated.View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
          <Screen backgroundColor={colors.background} withoutBottomSafeArea>
            <View style={{ flex: 1, paddingBottom }}>
              <ErrorState
                error={error}
                onRetry={() => loadNextTrack(false, selectedSessionMood, isBroadenedSearch)}
                onNewSession={handleNewSession}
              />
            </View>
          </Screen>
        </Animated.View>
      </View>
    );
  }

  // Show artist unveil view when track is revealed
  if (trackRevealed && currentTrack) {
    // Ensure artwork_url is provided for ArtistUnveilView
    const trackWithRequiredArtwork: Track & { artwork_url: string } = {
      ...currentTrack,
      artwork_url: currentTrack.artwork_url || ''
    };
    
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
          <ArtistUnveilView
            track={trackWithRequiredArtwork}
            onContinueListening={handleContinueListening}
            onDiscoverNext={handleDiscoverNext}
            userRating={rating}
            userReview={review}
            gamificationReward={gamificationReward}
            showGamificationReward={showGamificationReward}
            onGamificationRewardDismiss={() => {
              setShowGamificationReward(false);
              setGamificationReward(null);
            }}
            withoutBottomSafeArea
            paddingBottom={paddingBottom}
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
          <Screen backgroundColor={colors.background} withoutBottomSafeArea paddingHorizontal={0}>
            <AnimationBackground>
              <View style={{ paddingHorizontal: spacing.lg }}>
                <SessionHeader
                  selectedMood={selectedSessionMood}
                  onNewSession={handleNewSession}
                />
              </View>

              {showWelcomeTip && (
                <WelcomeTip />
              )}

              <ThankYouOverlay
                visible={showThankYou}
              />

              <GamificationRewardDisplay
                reward={gamificationReward}
                visible={showGamificationReward}
                onDismiss={() => {
                  setShowGamificationReward(false);
                  setGamificationReward(null);
                }}
              />

              <TransitionOverlay
                visible={isTransitioning}
              />

              {/* Main Player Area */}
              <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                <Animated.View style={[fadeStyle, { height: '100%', width: '100%', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom }]}>
                  {state === 'full_listening' && currentTrack ? (
                    <FullListeningMode
                      track={currentTrack}
                      isPlaying={isPlaying}
                      onPlayPause={playPause}
                      position={position}
                      duration={duration}
                      userRating={rating}
                      userReview={review}
                      onSkip={skipTrack}
                      paddingBottom={paddingBottom}
                    />
                  ) : !showRating ? (
                    <PlaybackControls
                      isPlaying={isPlaying}
                      onPlayPause={playPause}
                      position={position}
                      duration={duration}
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
                    />
                  )}
                </Animated.View>
              </KeyboardAvoidingView>
            </AnimationBackground>
          </Screen>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}
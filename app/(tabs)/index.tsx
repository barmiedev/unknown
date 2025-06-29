import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Alert,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { Shuffle } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useAudio } from '@/contexts/AudioContext';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { useAudioPlayerPadding } from '@/hooks/useAudioPlayerPadding';
import { Button } from '@/components/buttons';
import { Heading } from '@/components/typography';
import { Text } from '@/components/typography/Text';
import ArtistUnveilView from '@/components/ArtistUnveilView';
import {
  Track,
  DiscoverState,
  AnimationBackgroundProps,
  GamificationReward,
} from '@/types';
import {
  LoadingState,
  SessionHeader,
  PlaybackControls,
  RatingInterface,
  FullListeningMode,
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
import {
  useUserPreferences,
  useRandomTrack,
  useRatedTrackIds,
  useSubmitRating,
  useDiscoveryStats,
  getUserHasTracksAvailable,
} from '@/lib/queries';

// Animation Background Component - placeholder for future animation files
function AnimationBackground({
  animationUrl,
  children,
}: AnimationBackgroundProps) {
  return (
    <View
      style={{
        flex: 1,
        position: 'relative',
        backgroundColor: colors.background,
      }}
    >
      {/* Placeholder for future animation - transparent background */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.background,
        }}
      >
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
    unveilTrack,
    isPlayingFromFinds,
    setPlayingFromFinds,
  } = useAudio();
  const { paddingBottom } = useAudioPlayerPadding();

  // State hooks - always called in the same order
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [state, setState] = useState<DiscoverState>('mood_selection');
  const [selectedSessionMood, setSelectedSessionMood] = useState<string | null>(
    null,
  );
  const [availableMoods, setAvailableMoods] = useState<Mood[]>([]);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [trackRevealed, setTrackRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingThreshold] = useState(0.2); // 20% of track length
  const [canSkip, setCanSkip] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showReviewInput, setShowReviewInput] = useState(false);
  const [isReviewFocused, setIsReviewFocused] = useState(false);
  // Track if we're in broadened search mode (Surprise me or broadened search)
  const [isBroadenedSearch, setIsBroadenedSearch] = useState(false);

  // Gamification state
  const [gamificationReward, setGamificationReward] =
    useState<GamificationReward | null>(null);
  const [showGamificationReward, setShowGamificationReward] = useState(false);

  // Ref hooks - always called in the same order
  const reviewInputRef = useRef<TextInput>(null);

  // Animation shared values - always called in the same order
  const pulseAnimation = useSharedValue(1);
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

  // Tanstack Query hooks
  const { data: userPreferences } = useUserPreferences(user?.id);
  const { data: ratedTrackIds = [] } = useRatedTrackIds(user?.id);
  const { data: discoveryStats } = useDiscoveryStats(user?.id);
  const submitRatingMutation = useSubmitRating();

  // Track fetching queries
  const randomTrackQuery = useRandomTrack({
    sessionMood: selectedSessionMood,
    userPreferences,
    excludeIds: ratedTrackIds,
    broadenSearch: isBroadenedSearch,
  });

  const resetState = () => {
    setState('mood_selection');
    setSelectedSessionMood(null);
    setIsBroadenedSearch(false);
    setCurrentTrack(null);
    setRating(0);
    setReview('');
    setShowRating(false);
  };

  useEffect(() => {
    // reseting state of the discover screen when playing from finds
    if (isPlayingFromFinds) {
      resetState();
    }
  }, [isPlayingFromFinds]);

  useEffect(() => {
    if (isBroadenedSearch) {
      setSelectedSessionMood(null);
    }
  }, [isBroadenedSearch]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  // Effect hooks - always called in the same order
  useEffect(() => {
    if (isPlaying) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
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

  // Set available moods using the utility function
  useEffect(() => {
    if (userPreferences) {
      const moodsForSession = getMoodsForSession(
        (userPreferences.preferred_moods as Mood[]) || [],
        3,
      );
      setAvailableMoods(moodsForSession);
    } else {
      // Fallback to 3 random moods
      const moodsForSession = getMoodsForSession([], 3);
      setAvailableMoods(moodsForSession);
    }
  }, [userPreferences]);

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

    // Wait for animation to complete, then load track
    setTimeout(async () => {
      await loadNextTrack({ autoPlay: true });
    }, 200);
  };

  const loadNextTrack = async ({ autoPlay }: { autoPlay: boolean }) => {
    try {
      setState('loading');
      setError(null);
      setPlayingFromFinds(false);

      // Check track availability first
      const availability = await getUserHasTracksAvailable({
        sessionMood: selectedSessionMood,
        userPreferences,
        excludeIds: ratedTrackIds,
      });

      if (!availability?.hasTracksAtAll) {
        setState('no_tracks_at_all');
        return;
      }

      if (!availability.hasTracksInPreferences && !isBroadenedSearch) {
        setState('no_tracks_in_preferences');
        return;
      }

      // Fetch a random track - the hook will automatically use the updated state values
      const trackResult = await randomTrackQuery.refetch();
      const randomTrack = trackResult.data;

      if (!randomTrack) {
        if (!isBroadenedSearch) {
          setState('no_tracks_in_preferences');
        } else {
          setState('no_tracks_at_all');
        }
        return;
      }

      setCurrentTrack(randomTrack);

      // Load track into global audio context
      await loadTrack(randomTrack, autoPlay);

      // Reset UI state
      setRating(0);
      setReview('');
      setShowRating(false);
      setTrackRevealed(false);
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
      setState('mood_selection');
    }
  };

  const fadeAudioAndTransition = useCallback(
    async (callback: () => void) => {
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
    },
    [fadeOpacity, transitionTextOpacity],
  );

  const skipTrack = async () => {
    if (!canSkip || !currentTrack || !user?.id) return;

    fadeAudioAndTransition(() => {
      // Maintain the current broadened search state when skipping
      loadNextTrack({ autoPlay: true });
    });
  };

  // Skip track with rating 3 (neutral)
  const skipWithRating = async () => {
    if (!canSkip || !currentTrack || !user?.id) return;
    submitRating(3);
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
        if (
          stars >= 4 &&
          ((preferredGenres.length > 0 && !isGenrePreferred) ||
            (preferredMoods.length > 0 && !isMoodPreferred))
        ) {
          isOutsidePreference = true;
        }
      }

      const listenPercentage = duration > 0 ? position / duration : 0;

      const result = await submitRatingMutation.mutateAsync({
        userId: user.id,
        trackId: currentTrack.id,
        rating: stars,
        reviewText: review.trim() || undefined,
        isBlindRating,
        isOutsidePreference,
        listenPercentage,
      });

      if (result?.gamificationData) {
        setGamificationReward(result.gamificationData);
        // Refresh user data to update XP
        refreshUser();
      }

      if (stars >= 4) {
        setTrackRevealed(true);
        setState('revealed');
        setIsTransitioning(false);

        // Unveil track in global audio player for high ratings
        unveilTrack();

        // Show gamification reward immediately when track is revealed
        if (result?.gamificationData) {
          setShowGamificationReward(true);
        }
      } else {
        // For low ratings, just immediately load next track
        skipTrack();
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
      loadNextTrack({ autoPlay: true });
    });
  };

  const handleNewSession = async () => {
    setState('mood_selection');
    setSelectedSessionMood(null);
    setCurrentTrack(null);
    // Reset broadened search state when starting new session
    setIsBroadenedSearch(false);
    resetRatingAnimations();
  };

  const handleBroadenSearch = () => {
    setState('loading');
    // Set broadened search mode when user explicitly chooses to broaden
    setIsBroadenedSearch(true);
    setTimeout(() => {
      loadNextTrack({ autoPlay: true });
    }, 500);
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
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={{ flex: 1 }}
        >
          <Screen
            backgroundColor={colors.background}
            withoutBottomSafeArea
            paddingHorizontal={0}
          >
            <View
              style={{ flex: 1, paddingHorizontal: spacing.lg, paddingBottom }}
            >
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
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={{ flex: 1 }}
        >
          <Screen
            backgroundColor={colors.background}
            withoutBottomSafeArea
            paddingHorizontal={0}
          >
            <View
              style={{ flex: 1, paddingHorizontal: spacing.lg, paddingBottom }}
            >
              <SessionHeader
                selectedMood={selectedSessionMood}
                onNewSession={handleNewSession}
              />
              <NoTracksAtAllState
                onGoToHistory={handleGoToHistory}
                totalTracksRated={discoveryStats?.totalTracks || 0}
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
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={{ flex: 1 }}
        >
          <Screen backgroundColor={colors.background} withoutBottomSafeArea>
            <AnimationBackground>
              <View
                style={{
                  flex: 1,
                  paddingHorizontal: spacing.lg,
                  paddingBottom: paddingBottom - 40,
                }}
              >
                {/* Logo at top left */}
                <View
                  style={{
                    position: 'absolute',
                    top: spacing.md,
                    zIndex: 10,
                  }}
                >
                  <Text
                    variant="button"
                    color="primary"
                    style={{ fontSize: 24 }}
                  >
                    unknown
                  </Text>
                </View>

                {/* Header with more space */}
                <View
                  style={{
                    alignItems: 'center',
                    paddingTop: spacing.xxl,
                    paddingBottom: spacing.xxl,
                  }}
                >
                  <Heading
                    variant="h3"
                    color="primary"
                    align="center"
                    style={{
                      fontSize: 28,
                      marginBottom: spacing.xl,
                      marginTop: spacing.xxl,
                    }}
                  >
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
                <View
                  style={{ alignItems: 'center', paddingBottom: spacing.xxl }}
                >
                  <Button
                    variant="primary"
                    size="large"
                    onPress={() => handleMoodSelection(null)}
                    icon={
                      <Shuffle
                        size={20}
                        color={colors.text.primary}
                        strokeWidth={2}
                      />
                    }
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

  if (state === 'loading' || randomTrackQuery.isFetching) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={{ flex: 1 }}
        >
          <Screen backgroundColor={colors.background} withoutBottomSafeArea>
            <View style={{ flex: 1, paddingBottom }}>
              <LoadingState selectedMood={selectedSessionMood} />
            </View>
          </Screen>
        </Animated.View>
      </View>
    );
  }

  if (error || randomTrackQuery.error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={{ flex: 1 }}
        >
          <Screen backgroundColor={colors.background} withoutBottomSafeArea>
            <View style={{ flex: 1, paddingBottom }}>
              <ErrorState
                error={
                  error ||
                  randomTrackQuery.error?.message ||
                  'An error occurred'
                }
                onRetry={() => {
                  setError(null);
                  randomTrackQuery.refetch();
                }}
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
      artwork_url: currentTrack.artwork_url || '',
    };

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={{ flex: 1 }}
        >
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
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={{ flex: 1 }}
        >
          <Screen
            backgroundColor={colors.background}
            withoutBottomSafeArea
            paddingHorizontal={0}
          >
            <AnimationBackground>
              <View style={{ paddingHorizontal: spacing.lg }}>
                <SessionHeader
                  selectedMood={selectedSessionMood}
                  onNewSession={handleNewSession}
                />
              </View>

              <GamificationRewardDisplay
                reward={gamificationReward}
                visible={showGamificationReward}
                onDismiss={() => {
                  setShowGamificationReward(false);
                  setGamificationReward(null);
                }}
              />

              <TransitionOverlay visible={isTransitioning} />

              {/* Main Player Area */}
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                <Animated.View
                  style={[
                    fadeStyle,
                    {
                      height: '100%',
                      width: '100%',
                      alignItems: 'center',
                      paddingHorizontal: spacing.lg,
                      paddingBottom,
                    },
                  ]}
                >
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
                      onSkip={skipWithRating}
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

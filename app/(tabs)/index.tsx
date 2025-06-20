import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ActivityIndicator, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, Star, SkipForward } from 'lucide-react-native';
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
  const { user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [state, setState] = useState<DiscoverState>('loading');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [trackRevealed, setTrackRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showWelcomeTip, setShowWelcomeTip] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [ratingThreshold] = useState(0.8); // 80% of track length
  const [canSkip, setCanSkip] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showReviewInput, setShowReviewInput] = useState(false);
  const [isReviewFocused, setIsReviewFocused] = useState(false);

  const reviewInputRef = useRef<TextInput>(null);

  // Animation values
  const pulseAnimation = useSharedValue(1);
  const progressAnimation = useSharedValue(0);
  const thankYouOpacity = useSharedValue(0);
  const fadeOpacity = useSharedValue(1);
  const transitionTextOpacity = useSharedValue(0);
  
  // Rating animation values
  const ratingContainerOpacity = useSharedValue(0);
  const ratingContainerScale = useSharedValue(0.8);
  const star1Animation = useSharedValue(0);
  const star2Animation = useSharedValue(0);
  const star3Animation = useSharedValue(0);
  const star4Animation = useSharedValue(0);
  const star5Animation = useSharedValue(0);
  const reviewInputAnimation = useSharedValue(0);
  const reviewInputHeight = useSharedValue(0);

  useEffect(() => {
    if (user?.id) {
      loadUserPreferences();
      loadNextTrack();
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

  // Animate rating interface appearance
  const animateRatingAppearance = () => {
    // Container animation
    ratingContainerOpacity.value = withTiming(1, { duration: 400 });
    ratingContainerScale.value = withTiming(1, { duration: 400 });

    // Staggered star animations
    star1Animation.value = withDelay(200, withTiming(1, { duration: 300 }));
    star2Animation.value = withDelay(300, withTiming(1, { duration: 300 }));
    star3Animation.value = withDelay(400, withTiming(1, { duration: 300 }));
    star4Animation.value = withDelay(500, withTiming(1, { duration: 300 }));
    star5Animation.value = withDelay(600, withTiming(1, { duration: 300 }));
  };

  // Animate review input appearance
  const animateReviewInput = () => {
    reviewInputAnimation.value = withTiming(1, { duration: 400 });
    reviewInputHeight.value = withTiming(1, { duration: 400 });
  };

  // Reset rating animations
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

  // Animated styles
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

  const createStarAnimatedStyle = (animationValue: Animated.SharedValue<number>) => {
    return useAnimatedStyle(() => ({
      opacity: animationValue.value,
      transform: [
        { 
          scale: interpolate(
            animationValue.value,
            [0, 1],
            [0.3, 1],
            Extrapolate.CLAMP
          )
        },
        {
          translateY: interpolate(
            animationValue.value,
            [0, 1],
            [20, 0],
            Extrapolate.CLAMP
          )
        }
      ],
    }));
  };

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

  const loadNextTrack = async (isBackgroundLoad = false) => {
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
    await loadNextTrack(true);
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
    }, 3000);
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
      loadNextTrack();
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
      }, 100);
    } else {
      submitRating(stars);
    }
  };

  const handleSubmitWithReview = () => {
    submitRating(rating);
  };

  const handleContinueListening = () => {
    Alert.alert(
      'Continue Listening',
      'Would you like to listen to the full track? You won\'t be able to skip until it ends.',
      [
        { text: 'No, discover next', style: 'cancel', onPress: () => fadeAudioAndTransition(() => loadNextTrack()) },
        { text: 'Yes, continue', onPress: () => {
          setCanSkip(false);
          setState('playing');
          setTrackRevealed(false);
        }},
      ]
    );
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setIsReviewFocused(false);
  };

  if (isLoading) {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#8b6699" />
          <Text style={{ color: 'white', marginTop: 16, fontFamily: fonts.chillax.regular }}>Loading track...</Text>
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
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <AnimationBackground>
            {/* Header */}
            <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 48 }}>
              <Text style={{ fontSize: 24, fontFamily: fonts.chillax.bold, color: '#ded7e0' }}>unknown</Text>
              <Text style={{ fontSize: 14, fontFamily: fonts.chillax.medium, marginTop: 8, color: '#8b6699' }}>
                Discover underground music
              </Text>
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
              {!showRating && !trackRevealed ? (
                <>
                  {/* Play Button */}
                  <Animated.View style={[pulseStyle, { marginBottom: 48 }]}>
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
                  <View style={{ width: '100%', maxWidth: 320, height: 4, backgroundColor: '#28232a', borderRadius: 2, marginBottom: 48 }}>
                    <Animated.View
                      style={[progressStyle, { height: '100%', backgroundColor: '#452451', borderRadius: 2 }]}
                    />
                  </View>

                  {/* Skip Button */}
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
                      <Text style={{ fontFamily: fonts.chillax.medium, color: '#8b6699', fontSize: 16 }}>Skip</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : showRating && !trackRevealed ? (
                /* Rating Interface */
                <Animated.View style={[ratingContainerStyle, { alignItems: 'center', width: '100%' }]}>
                  <Text style={{ fontSize: 20, fontFamily: fonts.chillax.medium, textAlign: 'center', marginBottom: 48, color: '#ded7e0' }}>
                    How does this track make you feel?
                  </Text>

                  {/* Rating Stars with Staggered Animation */}
                  <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
                    {[
                      { index: 1, animation: star1Animation },
                      { index: 2, animation: star2Animation },
                      { index: 3, animation: star3Animation },
                      { index: 4, animation: star4Animation },
                      { index: 5, animation: star5Animation },
                    ].map(({ index, animation }) => (
                      <Animated.View key={index} style={createStarAnimatedStyle(animation)}>
                        <TouchableOpacity
                          onPress={() => handleStarPress(index)}
                          style={{ padding: 8 }}
                        >
                          <Star
                            size={32}
                            color={index <= rating ? '#452451' : '#8b6699'}
                            fill={index <= rating ? '#452451' : 'transparent'}
                            strokeWidth={1.5}
                          />
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>

                  {/* Review Input for High Ratings */}
                  {showReviewInput && (
                    <Animated.View style={[reviewInputContainerStyle, { width: '100%', overflow: 'hidden' }]}>
                      <Animated.View style={[reviewInputStyle, { width: '100%', marginBottom: 32 }]}>
                        <Text style={{ fontSize: 16, fontFamily: fonts.chillax.medium, color: '#ded7e0', marginBottom: 12 }}>
                          Share your thoughts (optional)
                        </Text>
                        <View style={{ backgroundColor: '#28232a', borderRadius: 16, padding: 16 }}>
                          <TextInput
                            ref={reviewInputRef}
                            style={{ 
                              fontSize: 16, 
                              fontFamily: fonts.chillax.regular, 
                              color: '#ded7e0',
                              minHeight: 80,
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
                          style={{ backgroundColor: '#452451', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 16 }}
                        >
                          <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.bold, fontSize: 18 }}>
                            Submit Rating
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    </Animated.View>
                  )}

                  {/* Skip Button */}
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
                    <Text style={{ fontFamily: fonts.chillax.medium, color: '#8b6699', fontSize: 16 }}>Skip</Text>
                  </TouchableOpacity>
                </Animated.View>
              ) : trackRevealed && currentTrack ? (
                /* Track Revealed */
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 256, height: 256, borderRadius: 24, backgroundColor: '#28232a', marginBottom: 32, overflow: 'hidden' }}>
                    {currentTrack?.artwork_url ? (
                      <Image
                        source={{ uri: currentTrack.artwork_url }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ width: '100%', height: '100%', backgroundColor: '#28232a', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 48 }}>🎵</Text>
                      </View>
                    )}
                  </View>

                  <Text style={{ color: '#ded7e0', fontSize: 24, fontFamily: fonts.chillax.bold, textAlign: 'center', marginBottom: 8 }}>
                    {currentTrack?.title}
                  </Text>
                  <Text style={{ color: '#8b6699', fontSize: 18, fontFamily: fonts.chillax.regular, textAlign: 'center', marginBottom: 16 }}>
                    {currentTrack?.artist}
                  </Text>
                  <Text style={{ color: '#452451', fontSize: 14, fontFamily: fonts.chillax.medium, marginBottom: 32 }}>
                    {currentTrack?.genre} • {currentTrack?.mood}
                  </Text>

                  <TouchableOpacity
                    onPress={handleContinueListening}
                    style={{ backgroundColor: '#452451', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, marginBottom: 16 }}
                  >
                    <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.bold, fontSize: 18 }}>
                      Listen to Full Track
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => fadeAudioAndTransition(() => loadNextTrack())}
                    style={{ backgroundColor: '#28232a', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 }}
                  >
                    <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.bold, fontSize: 18 }}>
                      Discover Next
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </Animated.View>
          </AnimationBackground>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, Star, SkipForward } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
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

export default function DiscoverScreen() {
  const { user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [rating, setRating] = useState(0);
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

  const pulseAnimation = useSharedValue(1);
  const progressAnimation = useSharedValue(0);
  const thankYouOpacity = useSharedValue(0);

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

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${(position / duration) * 100}%`,
  }));

  const thankYouStyle = useAnimatedStyle(() => ({
    opacity: thankYouOpacity.value,
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

      // If no ratings exist, show welcome tip
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
        // Filter by preferred genres (if any selected)
        if (userPreferences.preferred_genres && userPreferences.preferred_genres.length > 0) {
          query = query.in('genre', userPreferences.preferred_genres);
        }

        // Filter by preferred moods (if any selected)
        if (userPreferences.preferred_moods && userPreferences.preferred_moods.length > 0) {
          query = query.in('mood', userPreferences.preferred_moods);
        }

        // Filter by duration preferences
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

        // Pick random track from fallback results
        const randomTrack = fallbackTracks[Math.floor(Math.random() * fallbackTracks.length)];
        setCurrentTrack(randomTrack);
      } else {
        // Pick random track from preferred results
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        setCurrentTrack(randomTrack);
      }

      // Reset UI state
      setRating(0);
      setShowRating(false);
      setTrackRevealed(false);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      setShowWelcomeTip(false);

      // Only reset showThankYou if this is not a background load
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

  const showThankYouMessage = () => {
    setShowThankYou(true);
    thankYouOpacity.value = withTiming(1, { duration: 300 });
    
    // Start loading next track in background (completely hidden from user)
    loadNextTrackInBackground();
    
    // Hide thank you message after 3 seconds
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

  const skipTrack = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    setIsPlaying(false);
    loadNextTrack();
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
          profile_id: user.id,
          user_id: user.id, // Keep for backward compatibility
        });

      if (error) {
        // If it's a duplicate key error, just continue (user already rated this track)
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
            total_tracks_rated: 1, // This would need to be incremented properly
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
      } else {
        // Show thank you message for poor ratings
        showThankYouMessage();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    }
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
    <View style={{ backgroundColor: '#19161a', flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 48 }}>
          <Text style={{ fontSize: 24, fontFamily: fonts.chillax.bold, color: '#ded7e0' }}>unknown</Text>
          <Text style={{ fontSize: 14, fontFamily: fonts.chillax.medium, marginTop: 8, color: '#8b6699' }}>
            Discover underground music
          </Text>
        </View>

        {/* Welcome Tip */}
        {showWelcomeTip && (
          <View style={{ backgroundColor: '#28232a', borderRadius: 16, padding: 16, marginBottom: 24 }}>
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

        {/* Main Player Area */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {!trackRevealed ? (
            <>
              {/* Mystery Track Visualization */}
              <Animated.View
                style={[
                  pulseStyle,
                  {
                    width: 256,
                    height: 256,
                    borderRadius: 128,
                    backgroundColor: 'rgba(69, 36, 81, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 32,
                  }
                ]}
              >
                <View style={{
                  width: 192,
                  height: 192,
                  borderRadius: 96,
                  backgroundColor: '#28232a',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <TouchableOpacity
                    onPress={playPauseAudio}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: '#452451',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isPlaying ? (
                      <Pause size={32} color="#ded7e0" strokeWidth={2} />
                    ) : (
                      <Play size={32} color="#ded7e0" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Progress Bar */}
              <View style={{ width: '100%', maxWidth: 320, height: 4, backgroundColor: '#28232a', borderRadius: 2, marginBottom: 32 }}>
                <Animated.View
                  style={[progressStyle, { height: '100%', backgroundColor: '#452451', borderRadius: 2 }]}
                />
              </View>

              {/* Question Text */}
              <Text style={{ fontSize: 20, fontFamily: fonts.chillax.medium, textAlign: 'center', marginBottom: 48, color: '#ded7e0' }}>
                How does this track make you feel?
              </Text>

              {/* Rating Stars */}
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => submitRating(star)}
                    style={{ padding: 8 }}
                  >
                    <Star
                      size={32}
                      color={star <= rating ? '#452451' : '#8b6699'}
                      fill={star <= rating ? '#452451' : 'transparent'}
                      strokeWidth={1.5}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Skip Button */}
              <TouchableOpacity
                onPress={skipTrack}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 }}
              >
                <SkipForward size={20} color='#8b6699' strokeWidth={2} />
                <Text style={{ fontFamily: fonts.chillax.regular, color: '#8b6699' }}>Skip</Text>
              </TouchableOpacity>
            </>
          ) : (
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
                onPress={() => loadNextTrack()}
                style={{ backgroundColor: '#452451', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 }}
              >
                <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.bold, fontSize: 18 }}>
                  Discover Next
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
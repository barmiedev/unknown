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
  spotify_streams: number;
  artwork_url?: string;
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

  const pulseAnimation = useSharedValue(1);
  const progressAnimation = useSharedValue(0);

  useEffect(() => {
    loadNextTrack();
    
    // Check if this is user's first time in Discover
    if (user?.profile?.onboarding_complete) {
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

  const loadNextTrack = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .lt('spotify_streams', 5000)
        .limit(1)
        .single();

      if (error) throw error;
      if (!data?.audio_url) throw new Error('No audio URL found');

      setCurrentTrack(data);
      setRating(0);
      setShowRating(false);
      setTrackRevealed(false);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      setShowWelcomeTip(false);
    } catch (error) {
      console.error('Error loading track:', error);
      setError('Failed to load track. Please try again.');
      Alert.alert('Error', 'Failed to load track');
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

      if (error) throw error;

      if (stars >= 4) {
        setTrackRevealed(true);
      } else {
        setTimeout(() => {
          skipTrack();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
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
            onPress={loadNextTrack}
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
                {currentTrack?.genre}
              </Text>

              <TouchableOpacity
                onPress={loadNextTrack}
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
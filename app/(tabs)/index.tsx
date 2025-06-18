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

  const pulseAnimation = useSharedValue(1);
  const progressAnimation = useSharedValue(0);

  useEffect(() => {
    loadNextTrack();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

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
    if (!currentTrack) return;

    setRating(stars);
    
    try {
      const { error } = await supabase
        .from('user_ratings')
        .insert({
          track_id: currentTrack.id,
          rating: stars,
          user_id: 'demo-user', // Replace with actual user ID
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
      <View style={{ backgroundColor: '#19161a' }} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8b6699" />
          <Text style={{ color: 'white', marginTop: 16, fontFamily: fonts.chillax.regular }}>Loading track...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ backgroundColor: '#19161a' }} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <Text style={{ color: 'white', textAlign: 'center', marginBottom: 16, fontFamily: fonts.chillax.regular }}>{error}</Text>
          <TouchableOpacity
            onPress={loadNextTrack}
            className="bg-brand-accent px-8 py-4 rounded-full"
          >
            <Text style={{ color: 'black', fontFamily: fonts.chillax.bold, fontSize: 18 }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#19161a' }} className="flex-1">
      <SafeAreaView className="flex-1 px-6">
        {/* Header */}
        <View className="items-center pt-8 pb-12">
          <Text className='text-brand-text' style={{ fontSize: 24, fontFamily: fonts.chillax.bold }}>unknown</Text>
          <Text className='text-brand-gray' style={{ fontSize: 14, fontFamily: fonts.chillax.medium, marginTop: 8 }}>
            Discover underground music
          </Text>
        </View>

        {/* Main Player Area */}
        <View className="flex-1 justify-center items-center">
          {!trackRevealed ? (
            <>
              {/* Mystery Track Visualization */}
              <Animated.View
                style={pulseStyle}
                className="w-64 h-64 rounded-full bg-gradient-to-br from-brand-accent/20 to-brand-secondary/20 items-center justify-center mb-8"
              >
                <View className="w-48 h-48 rounded-full bg-brand-backgroundLighter items-center justify-center">
                  <TouchableOpacity
                    onPress={playPauseAudio}
                    className="w-20 h-20 rounded-full bg-brand-accent items-center justify-center"
                  >
                    {isPlaying ? (
                      <Pause size={32} color="#8b6699" strokeWidth={2} />
                    ) : (
                      <Play size={32} color="#8b6699" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Progress Bar */}
              <View className="w-full max-w-sm h-1 bg-brand-backgroundLighter rounded-full mb-8">
                <Animated.View
                  style={progressStyle}
                  className="h-full bg-brand-accent rounded-full"
                />
              </View>

              {/* Question Text */}
              <Text className='text-brand-text' style={{ fontSize: 20, fontFamily: fonts.chillax.medium, textAlign: 'center', marginBottom: 48 }}>
                How does this track make you feel?
              </Text>

              {/* Rating Stars */}
              <View className="flex-row space-x-4 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => submitRating(star)}
                    className="p-2"
                  >
                    <Star
                      size={32}
                      color={star <= rating ? '#8b6699' : '#d9d9d9'}
                      fill={star <= rating ? '#8b6699' : 'transparent'}
                      strokeWidth={1.5}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Skip Button */}
              <TouchableOpacity
                onPress={skipTrack}
                className="flex-row items-center space-x-2 p-4"
              >
                <SkipForward size={20} color='#d9d9d9' strokeWidth={2} />
                <Text className='text-brand-text' style={{ fontFamily: fonts.chillax.regular }}>Skip</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* Track Revealed */
            <View className="items-center">
              <View className="w-64 h-64 rounded-2xl bg-dark-200 mb-8 overflow-hidden">
                {currentTrack?.artwork_url ? (
                  <Image
                    source={{ uri: currentTrack.artwork_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-brand-backgroundLighter items-center justify-center">
                    <Text className="text-4xl">🎵</Text>
                  </View>
                )}
              </View>

              <Text style={{ color: 'white', fontSize: 24, fontFamily: fonts.chillax.bold, textAlign: 'center', marginBottom: 8 }}>
                {currentTrack?.title}
              </Text>
              <Text style={{ color: '#d1d5db', fontSize: 18, fontFamily: fonts.chillax.regular, textAlign: 'center', marginBottom: 16 }}>
                {currentTrack?.artist}
              </Text>
              <Text style={{ color: '#8b6699', fontSize: 14, fontFamily: fonts.chillax.medium, marginBottom: 32 }}>
                {currentTrack?.genre}
              </Text>

              <TouchableOpacity
                onPress={loadNextTrack}
                className="bg-brand-accent px-8 py-4 rounded-full"
              >
                <Text style={{ color: 'black', fontFamily: fonts.chillax.bold, fontSize: 18 }}>
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
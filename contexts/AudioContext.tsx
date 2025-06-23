import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Platform } from 'react-native';
import { Track } from '@/types';

interface AudioContextType {
  // Current track and playback state
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  
  // Audio control functions
  loadTrack: (track: Track, autoPlay?: boolean) => Promise<void>;
  playPause: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  skip: () => void;
  setSkipCallback: (callback: (() => void) | null) => void;
  
  // State management
  isLoading: boolean;
  error: string | null;
  
  // Helper functions
  getProgress: () => number;
  formatTime: (milliseconds: number) => string;
  
  // Global player visibility
  isGlobalPlayerVisible: boolean;
  showGlobalPlayer: () => void;
  hideGlobalPlayer: () => void;
  
  // Track unveiling
  isTrackUnveiled: boolean;
  unveilTrack: () => void;
  hideTrack: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

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
  
  if (isWebCompatibleAudio(originalUrl)) {
    return originalUrl;
  }
  
  return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
};

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGlobalPlayerVisible, setIsGlobalPlayerVisible] = useState(false);
  const [isTrackUnveiled, setIsTrackUnveiled] = useState(false);
  const [skipCallback, setSkipCallback] = useState<(() => void) | null>(null);
  
  const audioOperationInProgressRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        try {
          audioOperationInProgressRef.current = true;
          sound.stopAsync().catch(() => {});
          sound.unloadAsync().catch(() => {});
        } catch (error) {
          console.warn('Error cleaning up audio on unmount:', error);
        } finally {
          audioOperationInProgressRef.current = false;
        }
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying || false);
    }
  }, []);

  const loadTrack = useCallback(async (track: Track, autoPlay = true) => {
    if (audioOperationInProgressRef.current) {
      console.warn('Audio operation in progress, skipping load');
      return;
    }

    audioOperationInProgressRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Unload existing sound if any
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.stopAsync();
          }
        } catch (error) {
          console.warn('Error stopping existing sound:', error);
        }
        
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.warn('Error unloading existing sound:', error);
        }
        
        setSound(null);
        setIsPlaying(false);
        
        // Small delay to ensure unloading is complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!track?.audio_url) {
        throw new Error('No audio URL available');
      }

      // Get web-compatible audio URL
      const audioUrl = getWebCompatibleAudioUrl(track.audio_url);
      
      if (!audioUrl) {
        throw new Error('Invalid audio URL');
      }

      // Check web compatibility
      if (Platform.OS === 'web' && !isWebCompatibleAudio(track.audio_url)) {
        throw new Error('Audio format not supported in web browser');
      }

      // Create new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: autoPlay },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setCurrentTrack(track);
      setIsPlaying(autoPlay);
      setPosition(0);
      setDuration(0);
      
      // Reset track unveil state for new track
      setIsTrackUnveiled(false);

    } catch (error) {
      console.error('Error loading track:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audio';
      setError(errorMessage);
      
      // Provide more specific error messages for web
      if (Platform.OS === 'web') {
        if (errorMessage.includes('no supported source')) {
          setError('Audio format not supported in web browser. Please ensure the audio file is in MP3, WAV, or OGG format and served with proper CORS headers.');
        } else if (errorMessage.includes('CORS')) {
          setError('Unable to load audio due to CORS restrictions. Please ensure the audio server allows cross-origin requests.');
        }
      }
    } finally {
      setIsLoading(false);
      audioOperationInProgressRef.current = false;
    }
  }, [sound, onPlaybackStatusUpdate]);

  const playPause = useCallback(async () => {
    if (audioOperationInProgressRef.current || !sound) {
      return;
    }

    audioOperationInProgressRef.current = true;

    try {
      const status = await sound.getStatusAsync();
      
      if (!status.isLoaded) {
        console.warn('Sound not loaded, cannot play/pause');
        return;
      }
      
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
      setError('Failed to control audio playback');
    } finally {
      audioOperationInProgressRef.current = false;
    }
  }, [sound, isPlaying]);

  const stop = useCallback(async () => {
    if (audioOperationInProgressRef.current || !sound) {
      return;
    }

    audioOperationInProgressRef.current = true;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.stopAsync();
        setIsPlaying(false);
        setPosition(0);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    } finally {
      audioOperationInProgressRef.current = false;
    }
  }, [sound]);

  const seekTo = useCallback(async (newPosition: number) => {
    if (audioOperationInProgressRef.current || !sound) {
      return;
    }

    audioOperationInProgressRef.current = true;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.setPositionAsync(newPosition);
        setPosition(newPosition);
      }
    } catch (error) {
      console.error('Error seeking audio:', error);
    } finally {
      audioOperationInProgressRef.current = false;
    }
  }, [sound]);

  const getProgress = useCallback(() => {
    return duration > 0 ? position / duration : 0;
  }, [position, duration]);

  const formatTime = useCallback((milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const unveilTrack = useCallback(() => {
    setIsTrackUnveiled(true);
  }, []);

  const hideTrack = useCallback(() => {
    setIsTrackUnveiled(false);
  }, []);

  const showGlobalPlayer = useCallback(() => {
    setIsGlobalPlayerVisible(true);
  }, []);

  const hideGlobalPlayer = useCallback(() => {
    setIsGlobalPlayerVisible(false);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<AudioContextType>(() => ({
    currentTrack,
    isPlaying,
    position,
    duration,
    loadTrack,
    playPause,
    stop,
    seekTo,
    skip: () => {
      if (skipCallback) {
        skipCallback();
      }
    },
    setSkipCallback: (callback: (() => void) | null) => {
      setSkipCallback(() => callback);
    },
    isLoading,
    error,
    getProgress,
    formatTime,
    isGlobalPlayerVisible,
    showGlobalPlayer,
    hideGlobalPlayer,
    isTrackUnveiled,
    unveilTrack,
    hideTrack,
  }), [
    currentTrack,
    isPlaying,
    position,
    duration,
    loadTrack,
    playPause,
    stop,
    seekTo,
    skipCallback,
    isLoading,
    error,
    getProgress,
    formatTime,
    isGlobalPlayerVisible,
    showGlobalPlayer,
    hideGlobalPlayer,
    isTrackUnveiled,
    unveilTrack,
    hideTrack,
  ]);

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
} 
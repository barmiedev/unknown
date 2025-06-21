import { colors } from '@/utils/colors';

// Streaming platform colors
export const PLATFORM_COLORS = {
  spotify: '#1DB954',
  apple_music: '#FA243C',
  soundcloud: '#FF5500',
  bandcamp: '#629AA0',
  youtube: '#FF0000',
} as const;

// Streaming platform display names
export const PLATFORM_NAMES = {
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  soundcloud: 'SoundCloud',
  bandcamp: 'Bandcamp',
  youtube: 'YouTube Music',
} as const;

// Type definitions
export type PlatformKey = keyof typeof PLATFORM_COLORS;
export type SocialPlatform = 'instagram' | 'twitter' | 'facebook' | 'youtube' | 'website' | 'github';

// Helper functions
export const getPlatformColor = (platform: string): string => {
  return PLATFORM_COLORS[platform as PlatformKey] || colors.text.secondary;
};

export const getPlatformName = (platform: string): string => {
  return PLATFORM_NAMES[platform as PlatformKey] || platform;
};

// Default platform preferences
export const DEFAULT_STREAMING_PLATFORM = 'spotify' as const; 
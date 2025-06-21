import { StyleProp, ViewStyle } from 'react-native';

// User and Profile Types
export interface User {
  id: string;
  email: string;
  profile?: Profile;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  preferred_genres: string[];
  preferred_moods: string[];
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

// Track and Music Types
export interface Track {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  genre: string;
  mood: string;
  duration: number;
  spotify_streams: number;
  artwork_url?: string;
  spotify_url?: string;
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  location: string;
  genres: string[];
  avatar_url: string;
}

// Rating and Review Types
export interface Rating {
  id: string;
  track_id: string;
  profile_id: string;
  rating: number;
  review?: string;
  created_at: string;
}

// UI State Types
export interface DiscoverState {
  currentTrack: Track | null;
  state: 'mood_selection' | 'loading' | 'playing' | 'rating' | 'revealed';
  selectedMood: string | null;
  rating: number;
  review: string;
}

// Component Props Types
export interface BaseComponentProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface PressableProps extends BaseComponentProps {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}
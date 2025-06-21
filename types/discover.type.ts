import { Track } from './track.type';

export type DiscoverState = 'mood_selection' | 'loading' | 'playing' | 'rating' | 'revealed' | 'transitioning' | 'full_listening' | 'no_tracks_in_preferences' | 'no_tracks_at_all';

export interface DiscoverStateData {
  currentTrack: Track | null;
  state: DiscoverState;
  selectedMood: string | null;
  rating: number;
  review: string;
}

export interface AnimationBackgroundProps {
  animationUrl?: string;
  children: React.ReactNode;
} 
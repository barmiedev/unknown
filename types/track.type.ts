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
  total_ratings_count?: number; // Added for gamification
  average_rating?: number; // Added for gamification
  last_rated_at?: string; // Added for gamification
  first_rated_by?: string; // Added for gamification
}

export interface HistoryTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  rating: number;
  review_text?: string;
  artwork_url?: string;
  spotify_url?: string;
  created_at: string;
  artist_location?: string;
}

export interface TrackDisplay {
  id: string;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  artwork_url?: string;
}
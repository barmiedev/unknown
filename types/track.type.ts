export interface Track {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  genre: string;
  mood: string;
  duration?: number;
  artwork_url?: string;
  total_ratings_count?: number; // Added for gamification
  average_rating?: number; // Added for gamification
  last_rated_at?: string; // Added for gamification
  first_rated_by?: string; // Added for gamification
  in_app_streams_count?: number; // New: internal streams tracking
  reviews_data?: ReviewData[]; // New: array of all reviews and ratings
}

export interface ReviewData {
  rating: number;
  review_text?: string;
  created_at: string;
  user_id: string;
  is_blind_rating: boolean;
  is_outside_preference: boolean;
  listen_percentage: number;
}

export interface HistoryTrack {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  genre: string;
  mood: string;
  rating: number;
  review_text?: string;
  artwork_url?: string;
  created_at: string;
  artist_location?: string;
  duration: number;
}

export interface TrackDisplay {
  id: string;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  artwork_url?: string;
}
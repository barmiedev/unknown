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

export interface HistoryTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  rating: number;
  artwork_url?: string;
  spotify_url?: string;
  created_at: string;
}

export interface TrackDisplay {
  id: string;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  artwork_url?: string;
} 
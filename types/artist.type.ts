export interface Artist {
  id: string;
  name: string;
  bio: string;
  location: string;
  genres: string[];
  avatar_url: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface StreamingLink {
  platform: string;
  url: string;
}

export interface SubscribedArtist extends Artist {
  subscribed_at: string;
  discovered_track_title?: string;
} 
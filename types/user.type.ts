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

export interface User {
  id: string;
  email: string;
  profile?: Profile;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

export interface UserPreferences {
  preferred_genres: string[];
  preferred_moods: string[];
  min_duration: number;
  max_duration: number;
}

export interface UserStats {
  totalTracks: number;
  averageRating: number;
  streakDays: number;
  badges: string[];
  points: number;
  reviewsWritten: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
} 
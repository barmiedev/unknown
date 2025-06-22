export interface Profile {
  id: string;
  username: string;
  display_name: string;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
  total_xp: number; // Added for gamification
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
  totalTracksRatedCount: number; // Renamed from totalTracks
  totalTextReviewsCount: number; // New
  totalStarRatingsCount: number; // New
  totalSongsListened50PercentCount: number; // New
  totalSongsListened80PercentCount: number; // New
  totalSongsListened100PercentCount: number; // New
  totalBlindRatingsCount: number; // New
  totalOutsidePreferenceRatingsCount: number; // New
  totalSkipsCount: number; // New
  totalArtistsDiscoveredCount: number; // New
  totalGenresRatedCount: number; // New
  consecutiveListenStreak: number; // New
  maxConsecutiveListenStreak: number; // New
  averageRating: number;
  streakDays: number;
  badges: string[];
  points: number; // This will be total_xp from profiles
  reviewsWritten: number; // This can be total_text_reviews_count
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  is_rare: boolean;
  unlocked: boolean;
}

export interface GamificationReward {
  xp_earned: number;
  new_badges: string[];
  action_type: 'rating' | 'skip';
  daily_streak_xp?: number;
  consecutive_bonus_xp?: number;
}

export interface LeaderboardEntry {
  rank: number;
  display_name: string;
  total_xp: number;
  is_current_user: boolean;
}

export interface LeaderboardData {
  user_rank: number;
  user_xp: number;
  leaderboard: LeaderboardEntry[];
}
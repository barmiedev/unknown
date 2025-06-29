import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { UserStats } from '@/types';

export const useUserStats = (userId?: string) => {
  return useQuery({
    queryKey: ['userStats', userId],
    queryFn: async (): Promise<UserStats> => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Load user ratings for average calculation
      const { data: ratings, error: ratingsError } = await supabase
        .from('user_ratings')
        .select(`
          rating,
          tracks!inner (
            genre,
            mood
          )
        `)
        .eq('profile_id', userId);

      if (ratingsError) throw ratingsError;

      // Load user stats from gamification table
      const { data: userStatsData, error: userStatsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('profile_id', userId)
        .single();

      if (userStatsError && userStatsError.code !== 'PGRST116') {
        console.error('Error loading user stats:', userStatsError);
      }

      // Load profile for total_xp
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      }

      // Load user badges
      const { data: userBadges, error: badgesError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('profile_id', userId);

      if (badgesError) throw badgesError;

      // Calculate stats
      const totalTracks = ratings?.length || 0;
      const averageRating = ratings?.length 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      // Map to UserStats interface
      return {
        totalTracksRatedCount: totalTracks,
        totalTextReviewsCount: userStatsData?.total_text_reviews_count || 0,
        totalStarRatingsCount: userStatsData?.total_star_ratings_count || 0,
        totalSongsListened50PercentCount: userStatsData?.total_songs_listened_50_percent_count || 0,
        totalSongsListened80PercentCount: userStatsData?.total_songs_listened_80_percent_count || 0,
        totalSongsListened100PercentCount: userStatsData?.total_songs_listened_100_percent_count || 0,
        totalBlindRatingsCount: userStatsData?.total_blind_ratings_count || 0,
        totalOutsidePreferenceRatingsCount: userStatsData?.total_outside_preference_ratings_count || 0,
        totalSkipsCount: userStatsData?.total_skips_count || 0,
        totalArtistsDiscoveredCount: userStatsData?.total_artists_discovered_count || 0,
        totalGenresRatedCount: userStatsData?.total_genres_rated_count || 0,
        consecutiveListenStreak: userStatsData?.consecutive_listen_streak || 0,
        maxConsecutiveListenStreak: userStatsData?.max_consecutive_listen_streak || 0,
        averageRating: averageRating,
        streakDays: userStatsData?.current_streak_days || 0,
        badges: userBadges?.map(b => b.badge_id) || [],
        points: profileData?.total_xp || 0,
        reviewsWritten: userStatsData?.total_text_reviews_count || 0,
      };
    },
    enabled: !!userId,
  });
};

export const useDiscoveryStats = (userId?: string) => {
  return useQuery({
    queryKey: ['discoveryStats', userId],
    queryFn: async () => {
      if (!userId) return { totalTracks: 0, averageRating: 0 };

      const { data: ratings, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('profile_id', userId);

      if (error) throw error;

      const total = ratings?.length || 0;
      const average = ratings?.length 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      return { totalTracks: total, averageRating: average };
    },
    enabled: !!userId,
  });
};
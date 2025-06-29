import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { LeaderboardData } from '@/types';

export const useLeaderboard = (userId?: string) => {
  return useQuery({
    queryKey: ['leaderboard', userId],
    queryFn: async (): Promise<LeaderboardData | null> => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc('get_user_leaderboard', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
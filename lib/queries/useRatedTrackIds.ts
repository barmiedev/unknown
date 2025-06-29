import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useRatedTrackIds = (userId?: string) => {
  return useQuery({
    queryKey: ['ratedTrackIds', userId],
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];

      const { data: ratings, error } = await supabase
        .from('user_ratings')
        .select('track_id')
        .eq('profile_id', userId);

      if (error) throw error;
      return ratings?.map(r => r.track_id) || [];
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute - keep fresh for discovery
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
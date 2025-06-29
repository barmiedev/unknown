import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/types';

export const useAllBadges = () => {
  return useQuery({
    queryKey: ['allBadges'],
    queryFn: async (): Promise<Badge[]> => {
      const { data: allBadges, error } = await supabase
        .from('badges')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return allBadges || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - badges don't change often
  });
};

export const useUserBadges = (userId?: string) => {
  return useQuery({
    queryKey: ['userBadges', userId],
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];

      const { data: userBadges, error } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('profile_id', userId);

      if (error) throw error;
      return userBadges?.map(b => b.badge_id) || [];
    },
    enabled: !!userId,
  });
};

export const useBadgesWithStatus = (userId?: string) => {
  const { data: allBadges = [] } = useAllBadges();
  const { data: userBadgeIds = [] } = useUserBadges(userId);

  return {
    data: allBadges.map(badge => ({
      ...badge,
      unlocked: userBadgeIds.includes(badge.id),
    })),
    isLoading: false, // Derived from other queries
  };
};
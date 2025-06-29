import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { UserPreferences } from '@/types';

export const useUserPreferences = (userId?: string) => {
  return useQuery({
    queryKey: ['userPreferences', userId],
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferred_genres, preferred_moods, min_duration, max_duration')
        .eq('profile_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    enabled: !!userId,
  });
};

export const useUserStreamingPreferences = (userId?: string) => {
  return useQuery({
    queryKey: ['userStreamingPreferences', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_streaming_preferences')
        .select('preferred_platform')
        .eq('profile_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      preferences 
    }: { 
      userId: string; 
      preferences: Partial<UserPreferences> 
    }) => {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          profile_id: userId,
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', userId] });
    },
  });
};

export const useUpdateStreamingPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      platform 
    }: { 
      userId: string; 
      platform: string 
    }) => {
      const { data, error } = await supabase
        .from('user_streaming_preferences')
        .upsert({
          profile_id: userId,
          preferred_platform: platform,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['userStreamingPreferences', userId] });
    },
  });
};
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useFollowArtist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      artistId, 
      discoveredTrackId 
    }: { 
      userId: string; 
      artistId: string; 
      discoveredTrackId?: string;
    }) => {
      const { error } = await supabase
        .from('user_artist_subscriptions')
        .insert({
          profile_id: userId,
          artist_id: artistId,
          discovered_track_id: discoveredTrackId,
          subscribed_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['subscribedArtists', userId] });
      queryClient.invalidateQueries({ queryKey: ['userHistory', userId] });
    },
  });
};

export const useUnfollowArtist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      artistId 
    }: { 
      userId: string; 
      artistId: string;
    }) => {
      const { error } = await supabase
        .from('user_artist_subscriptions')
        .delete()
        .eq('profile_id', userId)
        .eq('artist_id', artistId);

      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['subscribedArtists', userId] });
      queryClient.invalidateQueries({ queryKey: ['userHistory', userId] });
    },
  });
};
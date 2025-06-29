import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/lib/auth';

export const useSubmitRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      trackId,
      rating,
      reviewText,
      isBlindRating,
      isOutsidePreference,
      listenPercentage,
    }: {
      userId: string;
      trackId: string;
      rating: number;
      reviewText?: string;
      isBlindRating?: boolean;
      isOutsidePreference?: boolean;
      listenPercentage?: number;
    }) => {
      // Insert user rating
      const { error: ratingError } = await supabase
        .from('user_ratings')
        .insert({
          track_id: trackId,
          rating: rating,
          review_text: reviewText?.trim() || null,
          profile_id: userId,
          user_id: userId,
          is_blind_rating: isBlindRating || false,
          is_outside_preference: isOutsidePreference || false,
          listen_percentage: listenPercentage || 0,
        });

      if (ratingError && ratingError.code === '23505') {
        console.warn('Attempted to re-rate an already rated track. Skipping update.');
        return null;
      } else if (ratingError) {
        throw ratingError;
      }

      // Call gamification RPC function for good ratings
      let gamificationData = null;
      if (rating >= 4) {
        const { data: gamificationResult, error: gamificationError } = await supabase.rpc('calculate_gamification_rewards', {
          p_user_id: userId,
          p_rating_data: {
            track_id: trackId,
            rating: rating,
            review_text: reviewText?.trim() || null,
            is_blind_rating: isBlindRating || false,
            is_outside_preference: isOutsidePreference || false,
            listen_percentage: listenPercentage || 0,
          },
        });

        if (gamificationError) {
          console.error('Error calculating gamification rewards:', gamificationError);
        } else if (gamificationResult) {
          gamificationData = gamificationResult;
        }
      }

      return { gamificationData };
    },
    onSuccess: (_, { userId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['ratedTrackIds', userId] });
      queryClient.invalidateQueries({ queryKey: ['userHistory', userId] });
      queryClient.invalidateQueries({ queryKey: ['userStats', userId] });
      queryClient.invalidateQueries({ queryKey: ['discoveryStats', userId] });
      queryClient.invalidateQueries({ queryKey: ['userBadges', userId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard', userId] });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: any) => {
      return await AuthService.updateProfile(updates);
    },
    onSuccess: () => {
      // Invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
    },
  });
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Track, UserPreferences } from '@/types';

interface TrackFilters {
  sessionMood?: string | null;
  userPreferences?: UserPreferences | null;
  excludeIds?: string[];
  broadenSearch?: boolean;
}

export const useRandomTrack = (filters: TrackFilters) => {
  return useQuery({
    queryKey: ['randomTrack', filters],
    queryFn: async (): Promise<Track | null> => {
      let query = supabase
        .from('tracks')
        .select('*');

      // Exclude already rated tracks
      if (filters.excludeIds && filters.excludeIds.length > 0) {
        query = query.not('id', 'in', `(${filters.excludeIds.join(',')})`);
      }

      // Apply session mood filter if selected and not broadening search
      if (filters.sessionMood && !filters.broadenSearch) {
        query = query.eq('mood', filters.sessionMood);
      }

      // Apply user preferences if available and no specific session mood and not broadening search
      if (filters.userPreferences && !filters.sessionMood && !filters.broadenSearch) {
        if (filters.userPreferences.preferred_genres && filters.userPreferences.preferred_genres.length > 0) {
          query = query.in('genre', filters.userPreferences.preferred_genres);
        }

        if (filters.userPreferences.preferred_moods && filters.userPreferences.preferred_moods.length > 0) {
          query = query.in('mood', filters.userPreferences.preferred_moods);
        }

        query = query
          .gte('duration', filters.userPreferences.min_duration)
          .lte('duration', filters.userPreferences.max_duration);
      }

      // Get random track from filtered results
      const { data: tracks, error } = await query.limit(50);

      if (error) throw error;

      if (!tracks || tracks.length === 0) {
        return null;
      }

      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      return randomTrack;
    },
    enabled: false, // Only fetch when explicitly called
    retry: 1,
  });
};

// New mutation to increment track streams when a track is played
export const useIncrementTrackStreams = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackId: string) => {
      const { error } = await supabase.rpc('increment_track_streams', {
        track_id_param: trackId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      // Optionally invalidate track-related queries if needed
      // queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
};
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { UserPreferences } from '@/types';

interface TrackAvailabilityFilters {
  sessionMood?: string | null;
  userPreferences?: UserPreferences | null;
  excludeIds?: string[];
}

export const getUserHasTracksAvailable = async (filters: TrackAvailabilityFilters): Promise<{ hasTracksInPreferences: boolean; hasTracksAtAll: boolean }> => {
  const excludeIds = filters.excludeIds || [];

  // Check if there are any tracks available at all (broadened search)
  const { count: allTracksCount, error: allTracksError } = await supabase
    .from('tracks')
    .select('id', { count: 'exact', head: true })
    .not('id', 'in', excludeIds.length > 0 ? `(${excludeIds.join(',')})` : '()');

  if (allTracksError) throw allTracksError;

  const hasTracksAtAll = (allTracksCount || 0) > 0;

  if (!hasTracksAtAll) {
    return { hasTracksInPreferences: false, hasTracksAtAll };
  }

  // Check if there are tracks matching preferences
  let query = supabase
    .from('tracks')
    .select('id', { count: 'exact', head: true })
    .not('id', 'in', excludeIds.length > 0 ? `(${excludeIds.join(',')})` : '()');

  // Apply session mood filter if selected
  if (filters.sessionMood) {
    query = query.eq('mood', filters.sessionMood);
  }

  // Apply user preferences if available and no specific session mood
  if (filters.userPreferences && !filters.sessionMood) {
    if (filters.userPreferences.preferred_genres && filters.userPreferences.preferred_genres.length > 0) {
      query = query.in('genre', filters.userPreferences.preferred_genres);
    }

    if (filters.userPreferences.preferred_moods && filters.userPreferences.preferred_moods.length > 0) {
      query = query.in('mood', filters.userPreferences.preferred_moods);
    }
  }

  const { count: preferencesCount, error: preferencesError } = await query;
  if (preferencesError) throw preferencesError;

  const hasTracksInPreferences = (preferencesCount || 0) > 0;
  return { hasTracksInPreferences, hasTracksAtAll };
}

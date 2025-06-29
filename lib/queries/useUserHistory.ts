import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { HistoryTrack, SubscribedArtist } from '@/types';

export const useUserHistory = (userId?: string) => {
  return useQuery({
    queryKey: ['userHistory', userId],
    queryFn: async (): Promise<HistoryTrack[]> => {
      if (!userId) return [];

      const { data: trackData, error: trackError } = await supabase
        .from('user_ratings')
        .select(`
          rating,
          review_text,
          created_at,
          tracks (
            id,
            title,
            artist,
            genre,
            mood,
            artwork_url,
            spotify_url,
            artists (
              location
            )
          )
        `)
        .eq('profile_id', userId)
        .gte('rating', 4)
        .order('created_at', { ascending: false });

      if (trackError) throw trackError;

      return trackData.map((item: any) => ({
        id: item.tracks.id,
        title: item.tracks.title,
        artist: item.tracks.artist,
        genre: item.tracks.genre,
        mood: item.tracks.mood,
        rating: item.rating,
        review_text: item.review_text,
        artwork_url: item.tracks.artwork_url,
        spotify_url: item.tracks.spotify_url,
        created_at: item.created_at,
        artist_location: item.tracks.artists?.location,
      }));
    },
    enabled: !!userId,
  });
};

export const useSubscribedArtists = (userId?: string) => {
  return useQuery({
    queryKey: ['subscribedArtists', userId],
    queryFn: async (): Promise<SubscribedArtist[]> => {
      if (!userId) return [];

      const { data: artistData, error: artistError } = await supabase
        .from('user_artist_subscriptions')
        .select(`
          subscribed_at,
          artists (
            id,
            name,
            bio,
            location,
            genres,
            avatar_url
          ),
          tracks (
            title
          )
        `)
        .eq('profile_id', userId)
        .order('subscribed_at', { ascending: false });

      if (artistError) throw artistError;

      return artistData.map((item: any) => ({
        id: item.artists.id,
        name: item.artists.name,
        bio: item.artists.bio,
        location: item.artists.location,
        genres: item.artists.genres,
        avatar_url: item.artists.avatar_url,
        subscribed_at: item.subscribed_at,
        discovered_track_title: item.tracks?.title,
      }));
    },
    enabled: !!userId,
  });
};
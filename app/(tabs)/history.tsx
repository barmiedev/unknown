import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, TouchableOpacity, RefreshControl, StyleSheet, ScrollView } from 'react-native';
import { ExternalLink, Music, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { TabBar } from '@/components/navigation/TabBar';
import { StarRating } from '@/components/rating/StarRating';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { formatDate } from '@/utils/formatting';
import ArtistUnveilView from '@/components/ArtistUnveilView';
import { HistoryTrack, SubscribedArtist, TabType, TrackDisplay } from '@/types';
import { FloatingBackButton, TabHeader } from '@/components/navigation';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('tracks');
  const [tracks, setTracks] = useState<HistoryTrack[]>([]);
  const [artists, setArtists] = useState<SubscribedArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<HistoryTrack | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<SubscribedArtist | null>(null);

  const tabs = [
    {
      key: 'tracks',
      label: 'Tracks',
      icon: <Music size={16} color={activeTab === 'tracks' ? colors.text.primary : colors.text.secondary} strokeWidth={2} />
    },
    {
      key: 'artists',
      label: 'Artists',
      icon: <Users size={16} color={activeTab === 'artists' ? colors.text.primary : colors.text.secondary} strokeWidth={2} />
    }
  ];

  // Reload history when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [user])
  );

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;

    try {
      // Load tracks
      const { data: trackData, error: trackError } = await supabase
        .from('user_ratings')
        .select(`
          rating,
          created_at,
          tracks (
            id,
            title,
            artist,
            genre,
            mood,
            artwork_url,
            spotify_url
          )
        `)
        .eq('profile_id', user.id)
        .gte('rating', 4)
        .order('created_at', { ascending: false });

      if (trackError) throw trackError;

      const formattedTracks = trackData.map((item: any) => ({
        id: item.tracks.id,
        title: item.tracks.title,
        artist: item.tracks.artist,
        genre: item.tracks.genre,
        mood: item.tracks.mood,
        rating: item.rating,
        artwork_url: item.tracks.artwork_url,
        spotify_url: item.tracks.spotify_url,
        created_at: item.created_at,
      }));

      setTracks(formattedTracks);

      // Load subscribed artists
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
        .eq('profile_id', user.id)
        .order('subscribed_at', { ascending: false });

      if (artistError) throw artistError;

      const formattedArtists = artistData.map((item: any) => ({
        id: item.artists.id,
        name: item.artists.name,
        bio: item.artists.bio,
        location: item.artists.location,
        genres: item.artists.genres,
        avatar_url: item.artists.avatar_url,
        subscribed_at: item.subscribed_at,
        discovered_track_title: item.tracks?.title,
      }));

      setArtists(formattedArtists);

    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, [user]);

  const handleTrackPress = (track: HistoryTrack) => {
    setSelectedTrack(track);
  };

  const handleArtistPress = (artist: SubscribedArtist) => {
    setSelectedArtist(artist);
  };

  const handleBackToHistory = () => {
    setSelectedTrack(null);
    setSelectedArtist(null);
  };

  // Show track unveil view
  if (selectedTrack) {
    // Convert HistoryTrack to TrackDisplay for ArtistUnveilView
    const trackDisplay: TrackDisplay = {
      id: selectedTrack.id,
      title: selectedTrack.title,
      artist: selectedTrack.artist,
      genre: selectedTrack.genre,
      mood: selectedTrack.mood,
      artwork_url: selectedTrack.artwork_url,
    };
    
    return (
      <ArtistUnveilView
        track={trackDisplay}
        showPlaybackControls={false}
        onContinueListening={handleBackToHistory}
        withoutBottomSafeArea
      />
    );
  }

  // Show artist detail view
  if (selectedArtist) {
    return (
      <Screen backgroundColor={colors.background} withoutBottomSafeArea paddingHorizontal={0}>
        <FloatingBackButton onPress={handleBackToHistory} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: spacing.lg }}>
            {/* Artist Header */}
            <View style={styles.artistHeader}>
              <View style={styles.artistAvatarContainer}>
                {selectedArtist.avatar_url ? (
                  <Image
                    source={{ uri: selectedArtist.avatar_url }}
                    style={styles.artistAvatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.artistAvatarPlaceholder}>
                    <Users size={40} color={colors.text.secondary} strokeWidth={1.5} />
                  </View>
                )}
              </View>
              
              <Heading variant="h3" color="primary" align="center" style={styles.artistName}>
                {selectedArtist.name}
              </Heading>
              
              {selectedArtist.location && (
                <Text variant="body" color="secondary" align="center" style={styles.artistLocation}>
                  {selectedArtist.location}
                </Text>
              )}

              {selectedArtist.genres && selectedArtist.genres.length > 0 && (
                <View style={styles.genresContainer}>
                  {selectedArtist.genres.map((genre) => (
                    <Text key={genre} style={styles.genreTag}>
                      {genre}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Discovery Info */}
            {selectedArtist.discovered_track_title && (
              <View style={styles.discoveryInfo}>
                <Heading variant="h4" color="primary" style={styles.discoveryTitle}>
                  How you discovered this artist
                </Heading>
                <Text variant="body" color="secondary" style={styles.discoveryText}>
                  You discovered {selectedArtist.name || 'Unknown Artist'} by listening to "{selectedArtist.discovered_track_title || 'Unknown Track'}"
                </Text>
              </View>
            )}

            {/* Artist Bio */}
            {selectedArtist.bio && (
              <View style={styles.bioSection}>
                <Heading variant="h4" color="primary" style={styles.bioTitle}>
                  About the Artist
                </Heading>
                <Text variant="body" color="primary" style={styles.bioText}>
                  {selectedArtist.bio}
                </Text>
              </View>
            )}

            {/* Following Since */}
            <View style={styles.followingSince}>
              <Text variant="caption" color="secondary" align="center">
                Following since {formatDate(selectedArtist.subscribed_at)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen withoutBottomSafeArea>
        <View style={styles.loadingContainer}>
          <Text variant="body" color="primary">Loading your discoveries...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable paddingHorizontal={24} withoutBottomSafeArea>
      <TabHeader
        title="Your Discoveries"
        subtitle={activeTab === 'tracks' ? `${tracks.length} tracks you've loved` : `${artists.length} artists you're following`}
      />

      {/* Tab Navigation */}
      <TabBar
        activeTab={activeTab}
        onTabPress={(tab) => setActiveTab(tab as TabType)}
        tabs={tabs}
        style={styles.tabBar}
      />

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'tracks' ? (
          tracks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎵</Text>
              <Heading variant="h4" color="primary" align="center" style={styles.emptyTitle}>
                No discoveries yet
              </Heading>
              <Text variant="body" color="secondary" align="center" style={styles.emptyDescription}>
                Start exploring to build your collection of favorite underground tracks
              </Text>
            </View>
          ) : (
            <View style={styles.tracksList}>
              {tracks.map((track) => (
                <TouchableOpacity
                  key={track.id}
                  onPress={() => handleTrackPress(track)}
                  style={styles.trackCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.trackContent}>
                    {/* Artwork */}
                    <View style={styles.trackArtworkContainer}>
                      {track.artwork_url ? (
                        <Image
                          source={{ uri: track.artwork_url }}
                          style={styles.trackArtwork}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.trackArtworkPlaceholder}>
                          <Music size={20} color={colors.text.secondary} strokeWidth={1.5} />
                        </View>
                      )}
                    </View>

                    {/* Track Info */}
                    <View style={styles.trackInfo}>
                      <Heading variant="h4" color="primary" style={styles.trackTitle}>
                        {track.title}
                      </Heading>
                      <Text variant="body" color="secondary" style={styles.trackArtist}>
                        {track.artist}
                      </Text>
                      
                      <View style={styles.trackDetails}>
                        <View style={styles.trackTags}>
                          <Text style={styles.trackTag}>{track.genre}</Text>
                          <Text style={styles.trackTag}>{track.mood}</Text>
                        </View>
                        <StarRating rating={track.rating} readonly size="small" />
                      </View>

                      <Text variant="caption" color="secondary" style={styles.trackDate}>
                        {formatDate(track.created_at)}
                      </Text>
                    </View>

                    <ExternalLink size={16} color={colors.text.secondary} strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : (
          artists.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Heading variant="h4" color="primary" align="center" style={styles.emptyTitle}>
                No artists followed yet
              </Heading>
              <Text variant="body" color="secondary" align="center" style={styles.emptyDescription}>
                Discover and rate tracks to start following underground artists
              </Text>
            </View>
          ) : (
            <View style={styles.artistsList}>
              {artists.map((artist) => (
                <TouchableOpacity
                  key={artist.id}
                  onPress={() => handleArtistPress(artist)}
                  style={styles.artistCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.artistContent}>
                    {/* Artist Avatar */}
                    <View style={styles.artistCardAvatarContainer}>
                      {artist.avatar_url ? (
                        <Image
                          source={{ uri: artist.avatar_url }}
                          style={styles.artistCardAvatar}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.artistCardAvatarPlaceholder}>
                          <Users size={24} color={colors.text.secondary} strokeWidth={1.5} />
                        </View>
                      )}
                    </View>

                    {/* Artist Info */}
                    <View style={styles.artistInfo}>
                      <Heading variant="h4" color="primary" style={styles.artistCardName}>
                        {artist.name}
                      </Heading>
                      
                      {artist.location && (
                        <Text variant="caption" color="secondary" style={styles.artistCardLocation}>
                          {artist.location}
                        </Text>
                      )}
                      
                      {artist.genres && artist.genres.length > 0 && (
                        <View style={styles.artistCardGenres}>
                          {artist.genres.slice(0, 3).map((genre) => (
                            <Text key={genre} style={styles.artistCardGenreTag}>
                              {genre}
                            </Text>
                          ))}
                        </View>
                      )}

                      <Text variant="caption" color="secondary" style={styles.artistCardDate}>
                        Following since {formatDate(artist.subscribed_at)}
                      </Text>
                    </View>

                    <ExternalLink size={16} color={colors.text.secondary} strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    marginBottom: spacing.lg,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  tracksList: {
    gap: spacing.md,
  },
  trackCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  trackContent: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  trackArtworkContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  trackArtwork: {
    width: '100%',
    height: '100%',
  },
  trackArtworkPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  trackArtist: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  trackDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  trackTags: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  trackTag: {
    color: colors.primary,
    fontSize: 12,
    backgroundColor: 'rgba(69, 36, 81, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  trackDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  artistsList: {
    gap: spacing.md,
  },
  artistCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  artistContent: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  artistCardAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  artistCardAvatar: {
    width: '100%',
    height: '100%',
  },
  artistCardAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInfo: {
    flex: 1,
  },
  artistCardName: {
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  artistCardLocation: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  artistCardGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  artistCardGenreTag: {
    color: colors.primary,
    fontSize: 11,
    backgroundColor: 'rgba(69, 36, 81, 0.2)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: spacing.xs,
  },
  artistCardDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  // Artist detail styles
  artistHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  artistAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  artistAvatar: {
    width: '100%',
    height: '100%',
  },
  artistAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistName: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  artistLocation: {
    fontSize: 16,
    marginBottom: spacing.md,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  genreTag: {
    color: colors.primary,
    fontSize: 12,
    backgroundColor: 'rgba(69, 36, 81, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  discoveryInfo: {
    marginBottom: spacing.xl,
  },
  discoveryTitle: {
    fontSize: 18,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  discoveryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  bioSection: {
    marginBottom: spacing.xl,
  },
  bioTitle: {
    fontSize: 18,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
  },
  followingSince: {
    paddingBottom: spacing.lg,
  },
});
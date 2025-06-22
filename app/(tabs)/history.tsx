import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TouchableOpacity, RefreshControl, StyleSheet, ScrollView, Image } from 'react-native';
import { Users, Music } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useAudioPlayerPadding } from '@/hooks/useAudioPlayerPadding';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { TabBar } from '@/components/navigation/TabBar';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import ArtistUnveilView from '@/components/ArtistUnveilView';
import ArtistDetailView from '@/components/ArtistDetailView';
import { HistoryTrack, SubscribedArtist, TabType, TrackDisplay } from '@/types';
import { FloatingBackButton, TabHeader } from '@/components/navigation';
import { TrackListItem, ArtistListItem, FilterBar, type SortOption } from '@/components/lists';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { paddingBottom } = useAudioPlayerPadding();
  const [activeTab, setActiveTab] = useState<TabType>('tracks');
  const [tracks, setTracks] = useState<HistoryTrack[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<HistoryTrack[]>([]);
  const [artists, setArtists] = useState<SubscribedArtist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<SubscribedArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<HistoryTrack | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<SubscribedArtist | null>(null);
  const [isFollowingArtist, setIsFollowingArtist] = useState(true);

  // Filter states for tracks
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<SortOption>('date_desc');
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableMoods, setAvailableMoods] = useState<string[]>([]);

  // Filter states for artists (no mood filter)
  const [selectedArtistGenre, setSelectedArtistGenre] = useState<string | null>(null);
  const [selectedArtistSort, setSelectedArtistSort] = useState<SortOption>('name_asc');
  const [availableArtistGenres, setAvailableArtistGenres] = useState<string[]>([]);

  // Scroll position restoration
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPositionRef = useRef(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const shouldRestoreScrollRef = useRef(false);

  const tabs = [
    {
      key: 'tracks',
      label: 'Tracks',
      icon: <Music size={16} color={(activeTab) === 'tracks' ? colors.text.primary : colors.text.secondary} strokeWidth={2} />
    },
    {
      key: 'artists',
      label: 'Artists',
      icon: <Users size={16} color={(activeTab) === 'artists' ? colors.text.primary : colors.text.secondary} strokeWidth={2} />
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

  // Restore scroll position when component re-renders after returning from detail view
  useEffect(() => {
    if (shouldRestoreScrollRef.current && scrollPositionRef.current > 0) {
      const timer = setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: scrollPositionRef.current, animated: true });
        }
        shouldRestoreScrollRef.current = false;
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [selectedTrack, selectedArtist]);

  // Filter and sort tracks when filters change
  useEffect(() => {
    let filtered = [...tracks];

    // Apply genre filter
    if (selectedGenre) {
      filtered = filtered.filter(track => track.genre === selectedGenre);
    }

    // Apply mood filter
    if (selectedMood) {
      filtered = filtered.filter(track => track.mood === selectedMood);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'artist_asc':
          return a.artist.localeCompare(b.artist);
        case 'artist_desc':
          return b.artist.localeCompare(a.artist);
        default:
          return 0;
      }
    });

    setFilteredTracks(filtered);
  }, [tracks, selectedGenre, selectedMood, selectedSort]);

  // Filter and sort artists when filters change
  useEffect(() => {
    let filtered = [...artists];

    // Apply genre filter
    if (selectedArtistGenre) {
      filtered = filtered.filter(artist => 
        artist.genres && artist.genres.includes(selectedArtistGenre)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (selectedArtistSort) {
        case 'date_asc':
          return new Date(a.subscribed_at).getTime() - new Date(b.subscribed_at).getTime();
        case 'date_desc':
          return new Date(b.subscribed_at).getTime() - new Date(a.subscribed_at).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    setFilteredArtists(filtered);
  }, [artists, selectedArtistGenre, selectedArtistSort]);

  const loadHistory = async () => {
    if (!user?.id) return;

    try {
      // Load tracks with artist location
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
        review_text: item.review_text,
        artwork_url: item.tracks.artwork_url,
        spotify_url: item.tracks.spotify_url,
        created_at: item.created_at,
        artist_location: item.tracks.artists?.location,
      }));

      setTracks(formattedTracks);

      // Extract unique genres and moods for filters
      const genres = [...new Set(formattedTracks.map(track => track.genre))].sort();
      const moods = [...new Set(formattedTracks.map(track => track.mood))].sort();
      setAvailableGenres(genres);
      setAvailableMoods(moods);

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

      // Extract unique genres for artist filters
      const artistGenres = [...new Set(
        formattedArtists.flatMap(artist => artist.genres || [])
      )].sort();
      setAvailableArtistGenres(artistGenres);

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

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollPositionRef.current = offsetY;
    setScrollPosition(offsetY);
  };

  const handleTabPress = (tabKey: string) => {
    if (tabKey === activeTab) return;
    setActiveTab(tabKey as TabType);
  };

  const handleTrackPress = (track: HistoryTrack) => {
    setSelectedTrack(track);
  };

  const handleArtistPress = (artist: SubscribedArtist) => {
    setSelectedArtist(artist);
    setIsFollowingArtist(true);
  };

  const handleBackToHistory = () => {
    setSelectedTrack(null);
    setSelectedArtist(null);
    shouldRestoreScrollRef.current = true;
  };

  const handleUnfollow = async (artistId: string) => {
    if (!user?.id) return;

    try {
      // Remove the artist subscription from the database
      const { error } = await supabase
        .from('user_artist_subscriptions')
        .delete()
        .eq('profile_id', user.id)
        .eq('artist_id', artistId);

      if (error) throw error;

      // Update local state
      setArtists(prev => prev.filter(artist => artist.id !== artistId));
      // Don't go back to history, just update the artist state
      setSelectedArtist(prev => prev ? { ...prev, isFollowing: false } : null);
      setIsFollowingArtist(false);
    } catch (error) {
      console.error('Error unfollowing artist:', error);
    }
  };

  const handleFollow = async (artistId: string) => {
    if (!user?.id) return;

    try {
      // Add the artist subscription to the database
      const { error } = await supabase
        .from('user_artist_subscriptions')
        .insert({
          profile_id: user.id,
          artist_id: artistId,
          subscribed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state - add the artist back to the list
      // For now, we'll just update the selected artist state
      setSelectedArtist(prev => prev ? { ...prev, isFollowing: true } : null);
      setIsFollowingArtist(true);
    } catch (error) {
      console.error('Error following artist:', error);
    }
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
      <Animated.View entering={SlideInRight.duration(300)} exiting={SlideOutLeft.duration(300)} style={{ flex: 1, backgroundColor: colors.background }}>
        <ArtistUnveilView
          track={trackDisplay}
          showPlaybackControls={false}
          onContinueListening={handleBackToHistory}
          withoutBottomSafeArea
          paddingBottom={paddingBottom}
        />
      </Animated.View>
    );
  }

  // Show artist detail view
  if (selectedArtist) {
    return (
      <Animated.View entering={SlideInRight.duration(300)} exiting={SlideOutLeft.duration(300)} style={{ flex: 1, backgroundColor: colors.background }}>
        <ArtistDetailView
          artist={selectedArtist}
          onBack={handleBackToHistory}
          onUnfollow={handleUnfollow}
          onFollow={handleFollow}
          isFollowing={isFollowingArtist}
          paddingBottom={paddingBottom}
        />
      </Animated.View>
    );
  }

  if (loading) {
    return (
      <Animated.View style={{ flex: 1, backgroundColor: colors.background }}>
        <Screen withoutBottomSafeArea>
          <View style={styles.loadingContainer}>
            <Text variant="body" color="primary">Loading your discoveries...</Text>
          </View>
        </Screen>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen paddingHorizontal={24} withoutBottomSafeArea>
        {/* Fixed Header Section */}
        <View style={styles.fixedHeader}>
          <TabHeader
            title="Your Discoveries"
            subtitle={activeTab === 'tracks' ? `${tracks.length} tracks you've loved` : `${artists.length} artists you're following`}
          />

          {/* Tab Navigation */}
          <TabBar
            activeTab={activeTab}
            onTabPress={handleTabPress}
            tabs={tabs}
            style={styles.tabBar}
          />

          {/* Fixed Filter Bar */}
          {activeTab === 'tracks' && tracks.length > 0 && (
            <FilterBar
              selectedGenre={selectedGenre}
              selectedMood={selectedMood}
              selectedSort={selectedSort}
              availableGenres={availableGenres}
              availableMoods={availableMoods}
              onGenreChange={setSelectedGenre}
              onMoodChange={setSelectedMood}
              onSortChange={setSelectedSort}
              totalTracks={tracks.length}
              filteredCount={filteredTracks.length}
              isArtistTab={false}
            />
          )}

          {activeTab === 'artists' && artists.length > 0 && (
            <FilterBar
              selectedGenre={selectedArtistGenre}
              selectedMood={null} // Always null for artists
              selectedSort={selectedArtistSort}
              availableGenres={availableArtistGenres}
              availableMoods={[]} // Empty array for artists
              onGenreChange={setSelectedArtistGenre}
              onMoodChange={() => {}} // No-op for artists
              onSortChange={setSelectedArtistSort}
              totalTracks={artists.length}
              filteredCount={filteredArtists.length}
              isArtistTab={true}
            />
          )}
        </View>

        {/* Scrollable Content with smooth transitions */}
        <Animated.View style={{ flex: 1 }}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.content}
            contentContainerStyle={{ paddingBottom }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
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
                  {filteredTracks.map((track, index) => (
                    <TrackListItem
                      key={track.id}
                      track={track}
                      onPress={() => handleTrackPress(track)}
                      showSeparator={index < filteredTracks.length - 1}
                    />
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
                  {filteredArtists.map((artist, index) => (
                    <ArtistListItem
                      key={artist.id}
                      artist={artist}
                      onPress={() => handleArtistPress(artist)}
                      showSeparator={index < filteredArtists.length - 1}
                    />
                  ))}
                </View>
              )
            )}
          </ScrollView>
        </Animated.View>
      </Screen>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedHeader: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  tabBar: {
    marginBottom: spacing.sm,
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
    gap: 0,
  },
  artistsList: {
    gap: 0,
  },
});
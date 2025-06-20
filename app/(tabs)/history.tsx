import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink, Music, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { fonts } from '@/lib/fonts';
import ArtistUnveilView from '@/components/ArtistUnveilView';

interface HistoryTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  rating: number;
  artwork_url?: string;
  spotify_url?: string;
  created_at: string;
}

interface SubscribedArtist {
  id: string;
  name: string;
  bio: string;
  location: string;
  genres: string[];
  avatar_url: string;
  subscribed_at: string;
  discovered_track_title?: string;
}

type TabType = 'tracks' | 'artists';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('tracks');
  const [tracks, setTracks] = useState<HistoryTrack[]>([]);
  const [artists, setArtists] = useState<SubscribedArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<HistoryTrack | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<SubscribedArtist | null>(null);

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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Text key={i} style={{ color: i < rating ? '#452451' : '#8b6699', fontSize: 14 }}>
        ★
      </Text>
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

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
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Back Button */}
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
            <TouchableOpacity
              onPress={handleBackToHistory}
              style={{
                backgroundColor: '#28232a',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ color: '#8b6699', fontFamily: fonts.chillax.medium, fontSize: 14 }}>
                ← Back to History
              </Text>
            </TouchableOpacity>
          </View>
          
          <ArtistUnveilView
            track={selectedTrack}
            showPlaybackControls={false}
          />
        </SafeAreaView>
      </View>
    );
  }

  // Show artist detail view
  if (selectedArtist) {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Back Button */}
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
            <TouchableOpacity
              onPress={handleBackToHistory}
              style={{
                backgroundColor: '#28232a',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ color: '#8b6699', fontFamily: fonts.chillax.medium, fontSize: 14 }}>
                ← Back to History
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
            {/* Artist Header */}
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <View style={{ 
                width: 120, 
                height: 120, 
                borderRadius: 60, 
                backgroundColor: '#28232a', 
                overflow: 'hidden',
                marginBottom: 16
              }}>
                {selectedArtist.avatar_url ? (
                  <Image
                    source={{ uri: selectedArtist.avatar_url }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ 
                    width: '100%', 
                    height: '100%', 
                    backgroundColor: '#28232a', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Users size={40} color="#8b6699" strokeWidth={1.5} />
                  </View>
                )}
              </View>
              
              <Text style={{ 
                color: '#ded7e0', 
                fontSize: 24, 
                fontFamily: fonts.chillax.bold, 
                textAlign: 'center',
                marginBottom: 8
              }}>
                {selectedArtist.name}
              </Text>
              
              {selectedArtist.location && (
                <Text style={{ 
                  color: '#8b6699', 
                  fontSize: 16, 
                  fontFamily: fonts.chillax.regular,
                  textAlign: 'center',
                  marginBottom: 16
                }}>
                  {selectedArtist.location}
                </Text>
              )}

              {selectedArtist.genres && selectedArtist.genres.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {selectedArtist.genres.map((genre) => (
                    <Text key={genre} style={{
                      color: '#452451',
                      fontSize: 12,
                      fontFamily: fonts.chillax.medium,
                      backgroundColor: 'rgba(69, 36, 81, 0.2)',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}>
                      {genre}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Discovery Info */}
            {selectedArtist.discovered_track_title && (
              <View style={{
                backgroundColor: '#28232a',
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
              }}>
                <Text style={{
                  color: '#ded7e0',
                  fontSize: 16,
                  fontFamily: fonts.chillax.bold,
                  marginBottom: 8,
                }}>
                  How you discovered this artist
                </Text>
                <Text style={{
                  color: '#8b6699',
                  fontSize: 14,
                  fontFamily: fonts.chillax.regular,
                  lineHeight: 20,
                }}>
                  You discovered {selectedArtist.name} by listening to "{selectedArtist.discovered_track_title}"
                </Text>
              </View>
            )}

            {/* Artist Bio */}
            {selectedArtist.bio && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  color: '#ded7e0',
                  fontSize: 18,
                  fontFamily: fonts.chillax.bold,
                  marginBottom: 12,
                }}>
                  About the Artist
                </Text>
                <Text style={{
                  color: '#ded7e0',
                  fontSize: 16,
                  fontFamily: fonts.chillax.regular,
                  lineHeight: 24,
                }}>
                  {selectedArtist.bio}
                </Text>
              </View>
            )}

            {/* Following Since */}
            <View style={{
              backgroundColor: '#28232a',
              borderRadius: 16,
              padding: 16,
              marginBottom: 32,
            }}>
              <Text style={{
                color: '#8b6699',
                fontSize: 14,
                fontFamily: fonts.chillax.regular,
                textAlign: 'center',
              }}>
                Following since {formatDate(selectedArtist.subscribed_at)}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.regular }}>Loading your discoveries...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#19161a', flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 }}>
          <Text style={{ color: '#ded7e0', fontSize: 28, fontFamily: fonts.chillax.bold, marginBottom: 8 }}>
            Your Discoveries
          </Text>
          <Text style={{ color: '#8b6699', fontFamily: fonts.chillax.regular, fontSize: 16 }}>
            {activeTab === 'tracks' ? `${tracks.length} tracks you've loved` : `${artists.length} artists you're following`}
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View style={{ 
            flexDirection: 'row', 
            backgroundColor: '#28232a', 
            borderRadius: 16, 
            padding: 4 
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: activeTab === 'tracks' ? '#452451' : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onPress={() => setActiveTab('tracks')}
            >
              <Music size={16} color={activeTab === 'tracks' ? '#ded7e0' : '#8b6699'} strokeWidth={2} />
              <Text style={{
                color: activeTab === 'tracks' ? '#ded7e0' : '#8b6699',
                fontFamily: fonts.chillax.medium,
                fontSize: 14,
              }}>
                Tracks
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: activeTab === 'artists' ? '#452451' : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onPress={() => setActiveTab('artists')}
            >
              <Users size={16} color={activeTab === 'artists' ? '#ded7e0' : '#8b6699'} strokeWidth={2} />
              <Text style={{
                color: activeTab === 'artists' ? '#ded7e0' : '#8b6699',
                fontFamily: fonts.chillax.medium,
                fontSize: 14,
              }}>
                Artists
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView 
          style={{ flex: 1, paddingHorizontal: 24 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8b6699"
              colors={["#8b6699"]}
              progressBackgroundColor="#28232a"
            />
          }
        >
          {activeTab === 'tracks' ? (
            tracks.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🎵</Text>
                <Text style={{ color: '#ded7e0', fontSize: 20, fontFamily: fonts.chillax.bold, textAlign: 'center', marginBottom: 8 }}>
                  No discoveries yet
                </Text>
                <Text style={{ color: '#8b6699', fontFamily: fonts.chillax.regular, textAlign: 'center', fontSize: 16, lineHeight: 24 }}>
                  Start exploring to build your collection of favorite underground tracks
                </Text>
              </View>
            ) : (
              <View style={{ gap: 16, paddingBottom: 24 }}>
                {tracks.map((track) => (
                  <TouchableOpacity
                    key={track.id}
                    onPress={() => handleTrackPress(track)}
                    style={{
                      backgroundColor: '#28232a',
                      borderRadius: 16,
                      padding: 16,
                    }}
                  >
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      {/* Artwork */}
                      <View style={{ 
                        width: 64, 
                        height: 64, 
                        borderRadius: 12, 
                        backgroundColor: '#19161a', 
                        overflow: 'hidden' 
                      }}>
                        {track.artwork_url ? (
                          <Image
                            source={{ uri: track.artwork_url }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={{ 
                            width: '100%', 
                            height: '100%', 
                            backgroundColor: '#19161a', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <Text style={{ fontSize: 20 }}>🎵</Text>
                          </View>
                        )}
                      </View>

                      {/* Track Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          color: '#ded7e0', 
                          fontFamily: fonts.chillax.bold, 
                          fontSize: 18, 
                          marginBottom: 4 
                        }}>
                          {track.title}
                        </Text>
                        <Text style={{ 
                          color: '#8b6699', 
                          fontFamily: fonts.chillax.regular, 
                          fontSize: 16, 
                          marginBottom: 8 
                        }}>
                          {track.artist}
                        </Text>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={{ 
                                color: '#452451', 
                                fontSize: 12, 
                                fontFamily: fonts.chillax.medium,
                                backgroundColor: 'rgba(69, 36, 81, 0.2)',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 8,
                              }}>
                                {track.genre}
                              </Text>
                              <Text style={{ 
                                color: '#8b6699', 
                                fontSize: 12, 
                                fontFamily: fonts.chillax.medium,
                                backgroundColor: 'rgba(139, 102, 153, 0.2)',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 8,
                              }}>
                                {track.mood}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                              {renderStars(track.rating)}
                            </View>
                          </View>

                          <ExternalLink size={16} color="#8b6699" strokeWidth={2} />
                        </View>

                        <Text style={{ 
                          color: '#8b6699', 
                          fontSize: 12, 
                          fontFamily: fonts.chillax.regular,
                          marginTop: 8,
                          opacity: 0.7 
                        }}>
                          {formatDate(track.created_at)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
          ) : (
            artists.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>👥</Text>
                <Text style={{ color: '#ded7e0', fontSize: 20, fontFamily: fonts.chillax.bold, textAlign: 'center', marginBottom: 8 }}>
                  No artists followed yet
                </Text>
                <Text style={{ color: '#8b6699', fontFamily: fonts.chillax.regular, textAlign: 'center', fontSize: 16, lineHeight: 24 }}>
                  Discover and rate tracks to start following underground artists
                </Text>
              </View>
            ) : (
              <View style={{ gap: 16, paddingBottom: 24 }}>
                {artists.map((artist) => (
                  <TouchableOpacity
                    key={artist.id}
                    onPress={() => handleArtistPress(artist)}
                    style={{
                      backgroundColor: '#28232a',
                      borderRadius: 16,
                      padding: 16,
                    }}
                  >
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      {/* Artist Avatar */}
                      <View style={{ 
                        width: 64, 
                        height: 64, 
                        borderRadius: 32, 
                        backgroundColor: '#19161a', 
                        overflow: 'hidden' 
                      }}>
                        {artist.avatar_url ? (
                          <Image
                            source={{ uri: artist.avatar_url }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={{ 
                            width: '100%', 
                            height: '100%', 
                            backgroundColor: '#19161a', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <Users size={24} color="#8b6699" strokeWidth={1.5} />
                          </View>
                        )}
                      </View>

                      {/* Artist Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          color: '#ded7e0', 
                          fontFamily: fonts.chillax.bold, 
                          fontSize: 18, 
                          marginBottom: 4 
                        }}>
                          {artist.name}
                        </Text>
                        
                        {artist.location && (
                          <Text style={{ 
                            color: '#8b6699', 
                            fontFamily: fonts.chillax.regular, 
                            fontSize: 14, 
                            marginBottom: 8 
                          }}>
                            {artist.location}
                          </Text>
                        )}
                        
                        {artist.genres && artist.genres.length > 0 && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {artist.genres.slice(0, 3).map((genre) => (
                              <Text key={genre} style={{ 
                                color: '#452451', 
                                fontSize: 11, 
                                fontFamily: fonts.chillax.medium,
                                backgroundColor: 'rgba(69, 36, 81, 0.2)',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                              }}>
                                {genre}
                              </Text>
                            ))}
                          </View>
                        )}

                        <Text style={{ 
                          color: '#8b6699', 
                          fontSize: 12, 
                          fontFamily: fonts.chillax.regular,
                          opacity: 0.7 
                        }}>
                          Following since {formatDate(artist.subscribed_at)}
                        </Text>
                      </View>

                      <ExternalLink size={16} color="#8b6699" strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { fonts } from '@/lib/fonts';

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

export default function HistoryScreen() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<HistoryTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      const { data, error } = await supabase
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

      if (error) throw error;

      const formattedTracks = data.map((item: any) => ({
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
            {tracks.length} tracks you've loved
          </Text>
        </View>

        {/* Track List */}
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
          {tracks.length === 0 ? (
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
                <View
                  key={track.id}
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

                        {track.spotify_url && (
                          <TouchableOpacity
                            style={{ padding: 8 }}
                            onPress={() => {
                              // Open Spotify URL - would need Linking.openURL in real app
                            }}
                          >
                            <ExternalLink size={16} color="#8b6699" strokeWidth={2} />
                          </TouchableOpacity>
                        )}
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
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
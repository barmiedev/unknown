import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface HistoryTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  rating: number;
  artwork_url?: string;
  spotify_url?: string;
  created_at: string;
}

export default function HistoryScreen() {
  const [tracks, setTracks] = useState<HistoryTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
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
            artwork_url,
            spotify_url
          )
        `)
        .gte('rating', 4)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTracks = data.map((item: any) => ({
        id: item.tracks.id,
        title: item.tracks.title,
        artist: item.tracks.artist,
        genre: item.tracks.genre,
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
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Text key={i} className={i < rating ? 'text-brand-accent' : 'text-brand-gray'}>
        ★
      </Text>
    ));
  };

  if (loading) {
    return (
      <View style={{ backgroundColor: '#19161a' }} className="flex-1">
        <SafeAreaView className="flex-1 justify-center items-center">
          <Text className="text-brand-text font-chillax">Loading your discoveries...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#19161a' }} className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-8 pb-6">
          <Text className="text-brand-text text-2xl font-chillax-bold mb-2">Your Discoveries</Text>
          <Text className="text-brand-text font-chillax">
            {tracks.length} tracks you've loved
          </Text>
        </View>

        {/* Track List */}
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {tracks.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-brand-text text-lg font-chillax text-center mb-4">
                No discoveries yet
              </Text>
              <Text className="text-brand-text font-chillax text-center">
                Start exploring to build your collection
              </Text>
            </View>
          ) : (
            <View className="space-y-4 pb-6">
              {tracks.map((track) => (
                <View
                  key={track.id}
                  className="bg-brand-backgroundLighter rounded-2xl p-4"
                >
                  <View className="flex-row space-x-4">
                    {/* Artwork */}
                    <View className="w-16 h-16 rounded-xl bg-brand-backgroundLighter overflow-hidden">
                      {track.artwork_url ? (
                        <Image
                          source={{ uri: track.artwork_url }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full bg-brand-backgroundLighter items-center justify-center">
                          <Text className="text-lg">🎵</Text>
                        </View>
                      )}
                    </View>

                    {/* Track Info */}
                    <View className="flex-1">
                      <Text className="text-brand-text font-chillax-bold text-lg mb-1">
                        {track.title}
                      </Text>
                      <Text className="text-brand-text font-chillax mb-2">
                        {track.artist}
                      </Text>
                      
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center space-x-2">
                          <Text className="text-brand-accent text-xs font-chillax-medium bg-brand-accent/10 px-2 py-1 rounded-full">
                            {track.genre}
                          </Text>
                          <View className="flex-row">
                            {renderStars(track.rating)}
                          </View>
                        </View>

                        {track.spotify_url && (
                          <TouchableOpacity
                            className="p-2"
                            onPress={() => {
                              // Open Spotify URL
                            }}
                          >
                            <ExternalLink size={16} color="#8b6699" strokeWidth={2} />
                          </TouchableOpacity>
                        )}
                      </View>
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
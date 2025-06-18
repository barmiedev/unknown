import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Flame, Music, Star, TrendingUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface UserStats {
  totalTracks: number;
  averageRating: number;
  streakDays: number;
  badges: string[];
  points: number;
  reviewsWritten: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'first_discovery',
    name: 'First Discovery',
    description: 'Rated your first track',
    icon: '🎵',
    unlocked: false,
  },
  {
    id: 'streak_7',
    name: 'Weekly Explorer',
    description: '7-day listening streak',
    icon: '🔥',
    unlocked: false,
  },
  {
    id: 'critic',
    name: 'Music Critic',
    description: 'Written 10 reviews',
    icon: '✍️',
    unlocked: false,
  },
  {
    id: 'trendsetter',
    name: 'Trendsetter',
    description: 'First to 5-star a track that hit 5K streams',
    icon: '🚀',
    unlocked: false,
  },
  {
    id: 'deep_diver',
    name: 'Deep Diver',
    description: 'Discovered 100 tracks',
    icon: '🤿',
    unlocked: false,
  },
];

export default function ProfileScreen() {
  const [stats, setStats] = useState<UserStats>({
    totalTracks: 0,
    averageRating: 0,
    streakDays: 0,
    badges: [],
    points: 0,
    reviewsWritten: 0,
  });
  const [badges, setBadges] = useState<Badge[]>(AVAILABLE_BADGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      // Load user ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from('user_ratings')
        .select('rating, created_at')
        .eq('user_id', 'demo-user'); // Replace with actual user ID

      if (ratingsError) throw ratingsError;

      // Load user badges
      const { data: userBadges, error: badgesError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', 'demo-user'); // Replace with actual user ID

      if (badgesError) throw badgesError;

      // Calculate stats
      const totalTracks = ratings?.length || 0;
      const averageRating = ratings?.length 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;
      
      // Calculate streak (simplified)
      const streakDays = 5; // Demo value
      const points = totalTracks * 10 + (userBadges?.length || 0) * 50;
      
      const unlockedBadgeIds = userBadges?.map(b => b.badge_id) || [];
      const updatedBadges = badges.map(badge => ({
        ...badge,
        unlocked: unlockedBadgeIds.includes(badge.id),
      }));

      setStats({
        totalTracks,
        averageRating,
        streakDays,
        badges: unlockedBadgeIds,
        points,
        reviewsWritten: 0, // Would need separate query
      });
      setBadges(updatedBadges);

    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1a1a1a', '#2a2a2a']} className="flex-1">
        <SafeAreaView className="flex-1 justify-center items-center">
          <Text className="text-white font-chillax">Loading profile...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a1a', '#2a2a2a']} className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-8 pb-6">
          <Text className="text-white text-2xl font-chillax-bold mb-2">Profile</Text>
          <Text className="text-gray-400 font-chillax">
            Your music discovery journey
          </Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Stats Overview */}
          <View className="bg-gradient-to-r from-neon-green/10 to-neon-blue/10 rounded-2xl p-6 mb-6 border border-neon-green/20">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-chillax-bold">Discovery Stats</Text>
              <View className="bg-neon-green/20 px-3 py-1 rounded-full">
                <Text className="text-neon-green font-chillax-bold text-sm">
                  {stats.points} pts
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-white text-2xl font-chillax-bold">
                  {stats.totalTracks}
                </Text>
                <Text className="text-gray-400 font-chillax text-sm">Tracks</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-2xl font-chillax-bold">
                  {stats.averageRating.toFixed(1)}
                </Text>
                <Text className="text-gray-400 font-chillax text-sm">Avg Rating</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-2xl font-chillax-bold">
                  {stats.streakDays}
                </Text>
                <Text className="text-gray-400 font-chillax text-sm">Day Streak</Text>
              </View>
            </View>
          </View>

          {/* Achievements */}
          <View className="mb-6">
            <Text className="text-white text-xl font-chillax-bold mb-4">
              Achievements
            </Text>
            
            <View className="space-y-3">
              {badges.map((badge) => (
                <View
                  key={badge.id}
                  className={`bg-dark-200 rounded-2xl p-4 border ${
                    badge.unlocked 
                      ? 'border-neon-green/30 bg-neon-green/5' 
                      : 'border-dark-300'
                  }`}
                >
                  <View className="flex-row items-center space-x-4">
                    <View className={`w-12 h-12 rounded-xl items-center justify-center ${
                      badge.unlocked ? 'bg-neon-green/20' : 'bg-dark-300'
                    }`}>
                      <Text className="text-lg">{badge.icon}</Text>
                    </View>
                    
                    <View className="flex-1">
                      <Text className={`font-chillax-bold ${
                        badge.unlocked ? 'text-white' : 'text-gray-500'
                      }`}>
                        {badge.name}
                      </Text>
                      <Text className={`font-chillax text-sm ${
                        badge.unlocked ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {badge.description}
                      </Text>
                    </View>

                    {badge.unlocked && (
                      <Award size={20} color="#00ff41" strokeWidth={2} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Stats */}
          <View className="mb-8">
            <Text className="text-white text-xl font-chillax-bold mb-4">
              Quick Stats
            </Text>
            
            <View className="flex-row justify-between space-x-3">
              <View className="flex-1 bg-dark-200 rounded-2xl p-4 border border-dark-300">
                <Flame size={24} color="#ff6b35" strokeWidth={2} className="mb-2" />
                <Text className="text-white text-lg font-chillax-bold">
                  {stats.streakDays}
                </Text>
                <Text className="text-gray-400 font-chillax text-sm">
                  Current Streak
                </Text>
              </View>

              <View className="flex-1 bg-dark-200 rounded-2xl p-4 border border-dark-300">
                <Star size={24} color="#ffd700" strokeWidth={2} className="mb-2" />
                <Text className="text-white text-lg font-chillax-bold">
                  {stats.averageRating.toFixed(1)}
                </Text>
                <Text className="text-gray-400 font-chillax text-sm">
                  Avg Rating
                </Text>
              </View>

              <View className="flex-1 bg-dark-200 rounded-2xl p-4 border border-dark-300">
                <TrendingUp size={24} color="#00ff41" strokeWidth={2} className="mb-2" />
                <Text className="text-white text-lg font-chillax-bold">
                  {stats.badges.length}
                </Text>
                <Text className="text-gray-400 font-chillax text-sm">
                  Badges
                </Text>
              </View>
            </View>
          </View>

          {/* Settings */}
          <View className="mb-8">
            <Text className="text-white text-xl font-chillax-bold mb-4">
              Settings
            </Text>
            
            <TouchableOpacity className="bg-dark-200 rounded-2xl p-4 border border-dark-300 mb-3">
              <Text className="text-white font-chillax-medium">Account Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-dark-200 rounded-2xl p-4 border border-dark-300 mb-3">
              <Text className="text-white font-chillax-medium">Privacy Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-dark-200 rounded-2xl p-4 border border-dark-300 mb-3">
              <Text className="text-white font-chillax-medium">Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-red-600/10 border-red-600/30 rounded-2xl p-4 border">
              <Text className="text-red-400 font-chillax-medium">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, Flame, Star, TrendingUp } from 'lucide-react-native';
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
      <View style={{ backgroundColor: '#19161a' }} className="flex-1">
        <SafeAreaView className="flex-1 justify-center items-center">
          <Text className="text-brand-text font-chillax">Loading profile...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#19161a' }} className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-8 pb-6">
          <Text className="text-brand-text text-2xl font-chillax-bold mb-2">Profile</Text>
          <Text className="text-brand-text font-chillax">
            Your music discovery journey
          </Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Stats Overview */}
          <View className="bg-brand-backgroundLighter rounded-2xl p-6 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-brand-text text-xl font-chillax-bold">Discovery Stats</Text>
              <View className="bg-brand-accent px-3 py-1 rounded-full">
                <Text className="text-brand-text font-chillax-bold text-sm">
                  {stats.points} pts
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-brand-text text-2xl font-chillax-bold">
                  {stats.totalTracks}
                </Text>
                <Text className="text-brand-text font-chillax text-sm">Tracks</Text>
              </View>
              <View className="items-center">
                <Text className="text-brand-text text-2xl font-chillax-bold">
                  {stats.averageRating.toFixed(1)}
                </Text>
                <Text className="text-brand-text font-chillax text-sm">Avg Rating</Text>
              </View>
              <View className="items-center">
                <Text className="text-brand-text text-2xl font-chillax-bold">
                  {stats.streakDays}
                </Text>
                <Text className="text-brand-text font-chillax text-sm">Day Streak</Text>
              </View>
            </View>
          </View>

          {/* Achievements */}
          <View className="mb-6">
            <Text className="text-brand-text text-xl font-chillax-bold mb-4">
              Achievements
            </Text>
            
            <View className="space-y-3">
              {badges.map((badge) => (
                <View
                  key={badge.id}
                  className={`bg-brand-backgroundLighter rounded-2xl p-4 ${
                    !badge.unlocked && 'opacity-50'
                  }`}
                >
                  <View className="flex-row items-center space-x-4">
                    <View className={`w-12 h-12 rounded-xl items-center justify-center ${
                      badge.unlocked ? 'bg-brand-accent/20' : 'bg-brand-backgroundLighter'
                    }`}>
                      <Text className="text-lg">{badge.icon}</Text>
                    </View>
                    
                    <View className="flex-1">
                      <Text className={`font-chillax-bold ${
                        badge.unlocked ? 'text-brand-text' : 'text-brand-gray'
                      }`}>
                        {badge.name}
                      </Text>
                      <Text className={`font-chillax text-sm ${
                        badge.unlocked ? 'text-brand-text' : 'text-brand-gray'
                      }`}>
                        {badge.description}
                      </Text>
                    </View>

                    {badge.unlocked && (
                      <Award size={20} color="#8b6699" strokeWidth={2} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Stats */}
          <View className="mb-8">
            <Text className="text-brand-text text-xl font-chillax-bold mb-4">
              Quick Stats
            </Text>
            
            <View className="flex-row justify-between space-x-3">
              <View className="flex-1 bg-brand-backgroundLighter rounded-2xl p-4">
                <Flame size={24} color="#8b6699" strokeWidth={2} className="mb-2" />
                <Text className="text-brand-text text-lg font-chillax-bold">
                  {stats.streakDays}
                </Text>
                <Text className="text-brand-text font-chillax text-sm">
                  Current Streak
                </Text>
              </View>

              <View className="flex-1 bg-brand-backgroundLighter rounded-2xl p-4">
                <Star size={24} color="#8b6699" strokeWidth={2} className="mb-2" />
                <Text className="text-brand-text text-lg font-chillax-bold">
                  {stats.averageRating.toFixed(1)}
                </Text>
                <Text className="text-brand-text font-chillax text-sm">
                  Avg Rating
                </Text>
              </View>

              <View className="flex-1 bg-brand-backgroundLighter rounded-2xl p-4">
                <TrendingUp size={24} color="#8b6699" strokeWidth={2} className="mb-2" />
                <Text className="text-brand-text text-lg font-chillax-bold">
                  {stats.badges.length}
                </Text>
                <Text className="text-brand-text font-chillax text-sm">
                  Badges
                </Text>
              </View>
            </View>
          </View>

          {/* Settings */}
          <View className="mb-8">
            <Text className="text-brand-text text-xl font-chillax-bold mb-4">
              Settings
            </Text>
            
            <TouchableOpacity className="bg-brand-backgroundLighter rounded-2xl p-4 mb-3">
              <Text className="text-brand-text font-chillax-medium">Account Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-brand-backgroundLighter rounded-2xl p-4 mb-3">
              <Text className="text-brand-text font-chillax-medium">Privacy Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-brand-backgroundLighter rounded-2xl p-4 mb-3">
              <Text className="text-brand-text font-chillax-medium">Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-brand-destructive rounded-2xl p-4">
              <Text className="text-brand-text font-chillax-medium">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
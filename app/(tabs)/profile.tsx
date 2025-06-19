import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, Flame, Star, TrendingUp, LogOut } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { fonts } from '@/lib/fonts';

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
  const { user, signOut } = useAuth();
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
    if (user?.id) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user?.id) return;

    try {
      // Load user ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from('user_ratings')
        .select('rating, created_at')
        .eq('profile_id', user.id);

      if (ratingsError) throw ratingsError;

      // Load user badges
      const { data: userBadges, error: badgesError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('profile_id', user.id);

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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <View style={{ backgroundColor: '#19161a', flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.regular }}>Loading profile...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#19161a', flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 }}>
          <Text style={{ color: '#ded7e0', fontSize: 24, fontFamily: fonts.chillax.bold, marginBottom: 8 }}>
            {user?.profile?.display_name || user?.profile?.username || 'Profile'}
          </Text>
          <Text style={{ color: '#8b6699', fontFamily: fonts.chillax.regular }}>
            Your music discovery journey
          </Text>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
          {/* Stats Overview */}
          <View style={{ backgroundColor: '#28232a', borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#ded7e0', fontSize: 20, fontFamily: fonts.chillax.bold }}>Discovery Stats</Text>
              <View style={{ backgroundColor: '#452451', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.bold, fontSize: 14 }}>
                  {stats.points} pts
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#ded7e0', fontSize: 24, fontFamily: fonts.chillax.bold }}>
                  {stats.totalTracks}
                </Text>
                <Text style={{ color: '#8b6699', fontFamily: fonts.chillax.regular, fontSize: 14 }}>Tracks</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#ded7e0', fontSize: 24, fontFamily: fonts.chillax.bold }}>
                  {stats.averageRating.toFixed(1)}
                </Text>
                <Text style={{ color: '#8b6699', fontFamily: fonts.chillax.regular, fontSize: 14 }}>Avg Rating</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#ded7e0', fontSize: 24, fontFamily: fonts.chillax.bold }}>
                  {stats.streakDays}
                </Text>
                <Text style={{ color: '#8b6699', fontFamily: fonts.chillax.regular, fontSize: 14 }}>Day Streak</Text>
              </View>
            </View>
          </View>

          {/* Achievements */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: '#ded7e0', fontSize: 20, fontFamily: fonts.chillax.bold, marginBottom: 16 }}>
              Achievements
            </Text>
            
            <View style={{ gap: 12 }}>
              {badges.map((badge) => (
                <View
                  key={badge.id}
                  style={[
                    { backgroundColor: '#28232a', borderRadius: 16, padding: 16 },
                    !badge.unlocked && { opacity: 0.5 }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={[
                      { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
                      badge.unlocked ? { backgroundColor: 'rgba(69, 36, 81, 0.2)' } : { backgroundColor: '#28232a' }
                    ]}>
                      <Text style={{ fontSize: 18 }}>{badge.icon}</Text>
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        { fontFamily: fonts.chillax.bold },
                        badge.unlocked ? { color: '#ded7e0' } : { color: '#8b6699' }
                      ]}>
                        {badge.name}
                      </Text>
                      <Text style={[
                        { fontFamily: fonts.chillax.regular, fontSize: 14 },
                        badge.unlocked ? { color: '#8b6699' } : { color: '#8b6699' }
                      ]}>
                        {badge.description}
                      </Text>
                    </View>

                    {badge.unlocked && (
                      <Award size={20} color="#452451" strokeWidth={2} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Stats */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: '#ded7e0', fontSize: 20, fontFamily: fonts.chillax.bold, marginBottom: 16 }}>
              Quick Stats
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: '#28232a', borderRadius: 16, padding: 16 }}>
                <Flame size={24} color="#452451" strokeWidth={2} style={{ marginBottom: 8 }} />
                <Text style={{ color: '#ded7e0', fontSize: 18, fontFamily: fonts.chillax.bold }}>
                  {stats.streakDays}
                </Text>
                <Text style={{ color: '#8b6699', fontFamily: fonts.chillax.regular, fontSize: 14 }}>
                  Current Streak
                </Text>
              </View>

              <View style={{ flex: 1, backgroundColor: '#28232a', borderRadius: 16, padding: 16 }}>
                <Star size={24} color="#452451" strokeWidth={2} style={{ marginBottom: 8 }} />
                <Text style={{ color: '#ded7e0', fontSize: 18, fontFamily: fonts.chillax.bold }}>
                  {stats.averageRating.toFixed(1)}
                </Text>
                <Text style={{ color: '#8b6699', fontFamily: fonts.chillax.regular, fontSize: 14 }}>
                  Avg Rating
                </Text>
              </View>

              <View style={{ flex: 1, backgroundColor: '#28232a', borderRadius: 16, padding: 16 }}>
                <TrendingUp size={24} color="#452451" strokeWidth={2} style={{ marginBottom: 8 }} />
                <Text style={{ color: '#ded7e0', fontSize: 18, fontFamily: fonts.chillax.bold }}>
                  {stats.badges.length}
                </Text>
                <Text style={{ color: '#8b6699', fontFamily: fonts.chillax.regular, fontSize: 14 }}>
                  Badges
                </Text>
              </View>
            </View>
          </View>

          {/* Settings */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: '#ded7e0', fontSize: 20, fontFamily: fonts.chillax.bold, marginBottom: 16 }}>
              Settings
            </Text>
            
            <TouchableOpacity style={{ backgroundColor: '#28232a', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.medium }}>Account Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ backgroundColor: '#28232a', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.medium }}>Privacy Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ backgroundColor: '#28232a', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.medium }}>Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ backgroundColor: '#51242d', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              onPress={handleSignOut}
            >
              <LogOut size={20} color="#ded7e0" strokeWidth={2} />
              <Text style={{ color: '#ded7e0', fontFamily: fonts.chillax.medium }}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
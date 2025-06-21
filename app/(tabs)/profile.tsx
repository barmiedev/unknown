import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Award, Flame, Star, TrendingUp, LogOut } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { UserStats, Badge } from '@/types';
import { TabHeader } from '@/components/navigation';

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
        reviewsWritten: 0,
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
      <Screen withoutBottomSafeArea>
        <View style={styles.loadingContainer}>
          <Text variant="body" color="primary">Loading profile...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable paddingHorizontal={24} withoutBottomSafeArea>
      <TabHeader
        title={user?.profile?.display_name || user?.profile?.username || 'Profile'}
        subtitle="Your music discovery journey"
      />

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statsHeader}>
          <Heading variant="h4" color="primary">Discovery Stats</Heading>
          <View style={styles.pointsBadge}>
            <Text variant="caption" color="primary" style={styles.pointsText}>
              {stats.points} pts
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text variant="button" color="primary" style={styles.statValue}>
              {stats.totalTracks}
            </Text>
            <Text variant="caption" color="secondary">Tracks</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="button" color="primary" style={styles.statValue}>
              {stats.averageRating.toFixed(1)}
            </Text>
            <Text variant="caption" color="secondary">Avg Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="button" color="primary" style={styles.statValue}>
              {stats.streakDays}
            </Text>
            <Text variant="caption" color="secondary">Day Streak</Text>
          </View>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Heading variant="h4" color="primary" style={styles.sectionTitle}>
          Achievements
        </Heading>
        
        <View style={styles.badgesContainer}>
          {badges.map((badge) => (
            <View
              key={badge.id}
              style={[
                styles.badgeItem,
                !badge.unlocked && styles.badgeItemLocked
              ]}
            >
              <View style={styles.badgeContent}>
                <View style={[
                  styles.badgeIcon,
                  badge.unlocked ? styles.badgeIconUnlocked : styles.badgeIconLocked
                ]}>
                  <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                </View>
                
                <View style={styles.badgeInfo}>
                  <Text 
                    variant="body" 
                    color={badge.unlocked ? 'primary' : 'secondary'}
                    style={styles.badgeName}
                  >
                    {badge.name}
                  </Text>
                  <Text 
                    variant="caption" 
                    color="secondary"
                    style={styles.badgeDescription}
                  >
                    {badge.description}
                  </Text>
                </View>

                {badge.unlocked && (
                  <Award size={20} color={colors.primary} strokeWidth={2} />
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Heading variant="h4" color="primary" style={styles.sectionTitle}>
          Quick Stats
        </Heading>
        
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatItem}>
            <Flame size={24} color={colors.primary} strokeWidth={2} style={styles.quickStatIcon} />
            <Text variant="body" color="primary" style={styles.quickStatValue}>
              {stats.streakDays}
            </Text>
            <Text variant="caption" color="secondary" style={styles.quickStatLabel}>
              Current Streak
            </Text>
          </View>

          <View style={styles.quickStatItem}>
            <Star size={24} color={colors.primary} strokeWidth={2} style={styles.quickStatIcon} />
            <Text variant="body" color="primary" style={styles.quickStatValue}>
              {stats.averageRating.toFixed(1)}
            </Text>
            <Text variant="caption" color="secondary" style={styles.quickStatLabel}>
              Avg Rating
            </Text>
          </View>

          <View style={styles.quickStatItem}>
            <TrendingUp size={24} color={colors.primary} strokeWidth={2} style={styles.quickStatIcon} />
            <Text variant="body" color="primary" style={styles.quickStatValue}>
              {stats.badges.length}
            </Text>
            <Text variant="caption" color="secondary" style={styles.quickStatLabel}>
              Badges
            </Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Heading variant="h4" color="primary" style={styles.sectionTitle}>
          Settings
        </Heading>
        
        <Button variant="secondary" size="medium" onPress={() => {}} style={styles.settingButton}>
          Account Settings
        </Button>
        
        <Button variant="secondary" size="medium" onPress={() => {}} style={styles.settingButton}>
          Privacy Settings
        </Button>
        
        <Button variant="secondary" size="medium" onPress={() => {}} style={styles.settingButton}>
          Notifications
        </Button>
        
        <Button 
          variant="outline" 
          size="medium" 
          onPress={handleSignOut}
          icon={<LogOut size={20} color={colors.text.primary} strokeWidth={2} />}
          iconPosition="left"
          style={[styles.settingButton, styles.signOutButton]}
        >
          Sign Out
        </Button>
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
  statsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pointsBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  pointsText: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: spacing.md,
  },
  badgesContainer: {
    gap: spacing.sm,
  },
  badgeItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  badgeItemLocked: {
    opacity: 0.5,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconUnlocked: {
    backgroundColor: 'rgba(69, 36, 81, 0.2)',
  },
  badgeIconLocked: {
    backgroundColor: colors.surface,
  },
  badgeEmoji: {
    fontSize: 18,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
  },
  badgeDescription: {
    fontSize: 14,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  quickStatIcon: {
    marginBottom: spacing.sm,
  },
  quickStatValue: {
    fontSize: 18,
  },
  quickStatLabel: {
    fontSize: 14,
  },
  settingButton: {
    marginBottom: spacing.sm,
  },
  signOutButton: {
    borderColor: colors.status.error,
  },
});
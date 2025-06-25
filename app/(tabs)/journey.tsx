import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Award, Flame, Star, TrendingUp, Trophy, X, Users, Crown } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { UserStats, Badge, LeaderboardData } from '@/types';
import { TabHeader } from '@/components/navigation';
import { fonts } from '@/lib/fonts';
import { useAudioPlayerPadding } from '@/hooks/useAudioPlayerPadding';

export default function JourneyScreen() {
  const { user } = useAuth();
  const { paddingBottom } = useAudioPlayerPadding();
  const [stats, setStats] = useState<UserStats>({
    totalTracksRatedCount: 0,
    totalTextReviewsCount: 0,
    totalStarRatingsCount: 0,
    totalSongsListened50PercentCount: 0,
    totalSongsListened80PercentCount: 0,
    totalSongsListened100PercentCount: 0,
    totalBlindRatingsCount: 0,
    totalOutsidePreferenceRatingsCount: 0,
    totalSkipsCount: 0,
    totalArtistsDiscoveredCount: 0,
    totalGenresRatedCount: 0,
    consecutiveListenStreak: 0,
    maxConsecutiveListenStreak: 0,
    averageRating: 0,
    streakDays: 0,
    badges: [],
    points: 0,
    reviewsWritten: 0,
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [favoriteGenre, setFavoriteGenre] = useState<string>('');
  const [favoriteMood, setFavoriteMood] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // Reload data when screen comes into focus (after XP changes)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadUserStats();
      }
    }, [user?.id]) // Only depend on user.id, not the entire user object
  );

  const loadUserStats = async () => {
    if (!user?.id) return;

    try {
      // Load user ratings for average calculation
      const { data: ratings, error: ratingsError } = await supabase
        .from('user_ratings')
        .select(`
          rating,
          tracks!inner (
            genre,
            mood
          )
        `)
        .eq('profile_id', user.id);

      if (ratingsError) throw ratingsError;

      // Load user stats from gamification table
      const { data: userStatsData, error: userStatsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (userStatsError && userStatsError.code !== 'PGRST116') {
        console.error('Error loading user stats:', userStatsError);
      }

      // Load profile for total_xp
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      }

      // Load user badges
      const { data: userBadges, error: badgesError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('profile_id', user.id);

      if (badgesError) throw badgesError;

      // Load all available badges
      const { data: allBadges, error: allBadgesError } = await supabase
        .from('badges')
        .select('*')
        .order('category', { ascending: true });

      if (allBadgesError) throw allBadgesError;

      // Load leaderboard data
      const { data: leaderboard, error: leaderboardError } = await supabase.rpc('get_user_leaderboard', {
        p_user_id: user.id
      });

      if (leaderboardError) {
        console.error('Error loading leaderboard:', leaderboardError);
      } else {
        setLeaderboardData(leaderboard);
      }

      // Calculate stats
      const totalTracks = ratings?.length || 0;
      const averageRating = ratings?.length 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      // Calculate favorite genre and mood
      const genreCounts: Record<string, number> = {};
      const moodCounts: Record<string, number> = {};
      const genreSkips: Record<string, number> = {};

      ratings?.forEach(rating => {
        const track = Array.isArray(rating.tracks) ? rating.tracks[0] : rating.tracks;
        if (track?.genre) {
          genreCounts[track.genre] = (genreCounts[track.genre] || 0) + 1;
        }
        if (track?.mood) {
          moodCounts[track.mood] = (moodCounts[track.mood] || 0) + 1;
        }
      });

      const favoriteGenre = Object.keys(genreCounts).reduce((a, b) => 
        genreCounts[a] > genreCounts[b] ? a : b, '');
      const favoriteMood = Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b, '');

      setFavoriteGenre(favoriteGenre);
      setFavoriteMood(favoriteMood);

      // Map badges
      const unlockedBadgeIds = userBadges?.map(b => b.badge_id) || [];
      const mappedBadges = allBadges?.map(badge => ({
        ...badge,
        unlocked: unlockedBadgeIds.includes(badge.id),
      })) || [];

      // Get newest badges (last 3 unlocked)
      const newestBadges = userBadges?.slice(-3).map(ub => ub.badge_id) || [];

      setStats({
        totalTracksRatedCount: totalTracks,
        totalTextReviewsCount: userStatsData?.total_text_reviews_count || 0,
        totalStarRatingsCount: userStatsData?.total_star_ratings_count || 0,
        totalSongsListened50PercentCount: userStatsData?.total_songs_listened_50_percent_count || 0,
        totalSongsListened80PercentCount: userStatsData?.total_songs_listened_80_percent_count || 0,
        totalSongsListened100PercentCount: userStatsData?.total_songs_listened_100_percent_count || 0,
        totalBlindRatingsCount: userStatsData?.total_blind_ratings_count || 0,
        totalOutsidePreferenceRatingsCount: userStatsData?.total_outside_preference_ratings_count || 0,
        totalSkipsCount: userStatsData?.total_skips_count || 0,
        totalArtistsDiscoveredCount: userStatsData?.total_artists_discovered_count || 0,
        totalGenresRatedCount: userStatsData?.total_genres_rated_count || 0,
        consecutiveListenStreak: userStatsData?.consecutive_listen_streak || 0,
        maxConsecutiveListenStreak: userStatsData?.max_consecutive_listen_streak || 0,
        averageRating: averageRating,
        streakDays: userStatsData?.current_streak_days || 0,
        badges: unlockedBadgeIds,
        points: profileData?.total_xp || 0,
        reviewsWritten: userStatsData?.total_text_reviews_count || 0,
      });
      setBadges(mappedBadges);

    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgesByCategory = (category: string) => {
    return badges.filter(badge => badge.category === category);
  };

  const getUnlockedBadgesCount = () => {
    return badges.filter(badge => badge.unlocked).length;
  };

  const getNewestBadges = () => {
    return badges.filter(badge => badge.unlocked).slice(-3);
  };

  if (loading) {
    return (
      <Screen withoutBottomSafeArea>
        <View style={styles.loadingContainer}>
          <Text variant="body" color="primary">Loading your journey...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen 
      scrollable 
      paddingHorizontal={24} 
      withoutBottomSafeArea
      contentContainerStyle={{ paddingBottom }}
    >
      <TabHeader
        title="Your Journey"
        subtitle="Track your music discovery progress"
      />

      {/* XP Summary */}
      <View style={styles.section}>
        <View style={styles.xpContainer}>
          <View style={styles.xpBadge}>
            <Text variant="button" color="primary" style={styles.xpAmount}>
              {stats.points.toLocaleString()}
            </Text>
            <Text variant="caption" color="secondary">Total XP</Text>
          </View>
          
          <View style={styles.xpStats}>
            <View style={styles.xpStatItem}>
              <Text variant="body" color="primary" style={styles.xpStatValue}>
                {getUnlockedBadgesCount()}
              </Text>
              <Text variant="caption" color="secondary" style={styles.xpStatLabel}>Badges</Text>
            </View>
            <View style={styles.xpStatItem}>
              <Text variant="body" color="primary" style={styles.xpStatValue}>
                {stats.totalTracksRatedCount}
              </Text>
              <Text variant="caption" color="secondary" style={styles.xpStatLabel}>Tracks Rated</Text>
            </View>
            <View style={styles.xpStatItem}>
              <Text variant="body" color="primary" style={styles.xpStatValue}>
                {stats.averageRating.toFixed(1)}
              </Text>
              <Text variant="caption" color="secondary" style={styles.xpStatLabel}>Avg Rating</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Heading variant="h4" color="primary" style={styles.sectionTitle}>
          Discovery Stats
        </Heading>
        
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatItem}>
            <Flame size={24} color={colors.text.secondary} strokeWidth={2} style={styles.quickStatIcon} />
            <Text variant="body" color="primary" style={styles.quickStatValue}>
              {stats.streakDays}
            </Text>
            <Text variant="caption" color="secondary" style={styles.quickStatLabel}>
              Current Streak
            </Text>
          </View>

          <View style={styles.quickStatItem}>
            <Star size={24} color={colors.text.secondary} strokeWidth={2} style={styles.quickStatIcon} />
            <Text variant="body" color="primary" style={styles.quickStatValue}>
              {stats.reviewsWritten}
            </Text>
            <Text variant="caption" color="secondary" style={styles.quickStatLabel}>
              Reviews Written
            </Text>
          </View>

          <View style={styles.quickStatItem}>
            <TrendingUp size={24} color={colors.text.secondary} strokeWidth={2} style={styles.quickStatIcon} />
            <Text variant="body" color="primary" style={styles.quickStatValue}>
              {stats.consecutiveListenStreak}
            </Text>
            <Text variant="caption" color="secondary" style={styles.quickStatLabel}>
              Listen Streak
            </Text>
          </View>
        </View>
      </View>

      {/* Music Preferences */}
      {favoriteGenre || favoriteMood ? <View style={styles.section}>
        <Heading variant="h4" color="primary" style={styles.sectionTitle}>
          Your Music DNA
        </Heading>
        
        <View style={styles.preferencesContainer}>
          {favoriteGenre ? (
            <View>
              <Text variant="caption" color="secondary" style={styles.preferenceLabel}>
                Favorite Genre
              </Text>
              <Text variant="body" color="primary" style={styles.preferenceValue}>
                {favoriteGenre}
              </Text>
            </View>
          ) : null}
          
          {favoriteMood ? (
            <View>
              <Text variant="caption" color="secondary" style={styles.preferenceLabel}>
                Favorite Mood
              </Text>
              <Text variant="body" color="primary" style={styles.preferenceValue}>
                {favoriteMood}
              </Text>
            </View>
          ) : null}
        </View>
      </View> : null}

      {/* Newest Achievements */}
      {getNewestBadges().length > 0 ? (
        <View style={styles.section}>
          <Heading variant="h4" color="primary" style={styles.sectionTitle}>
            Recent Achievements
          </Heading>
          
          <View style={styles.newestBadgesContainer}>
            {getNewestBadges().map((badge) => (
              <View key={badge.id} style={styles.newestBadgeItem}>
                <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                <View style={styles.newestBadgeInfo}>
                  <Text variant="body" color="primary" style={styles.newestBadgeName}>
                    {badge.name}
                  </Text>
                  <Text variant="caption" color="secondary" style={styles.newestBadgeDescription}>
                    {badge.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.lastSection}>
        <View style={styles.actionButtonsContainer}>
          <Button
            variant="secondary"
            size="medium"
            onPress={() => setShowBadgesModal(true)}
            icon={<Trophy size={20} color={colors.text.primary} strokeWidth={2} />}
            iconPosition="left"
            style={styles.actionButton}
          >
            View All Badges ({getUnlockedBadgesCount()})
          </Button>

          <Button
            variant="secondary"
            size="medium"
            onPress={() => setShowLeaderboardModal(true)}
            icon={<Crown size={20} color={colors.text.primary} strokeWidth={2} />}
            iconPosition="left"
            style={styles.actionButton}
          >
            Leaderboard
          </Button>
        </View>
      </View>

      {/* Badges Modal */}
      <Modal
        visible={showBadgesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBadgesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Heading variant="h4" color="primary">Your Badges</Heading>
              <TouchableOpacity
                onPress={() => setShowBadgesModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={colors.text.secondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            {/* if no unlocked badges, show a message */}
            {getUnlockedBadgesCount() === 0 ? (
              <View style={styles.noBadgesContainer}>
                <Text variant="body" color="secondary">No badges unlocked yet</Text>
              </View>
            ) : null}

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {['discovery', 'engagement', 'critic', 'listening', 'social', 'special', 'experimental'].map((category) => {
                const categoryBadges = getBadgesByCategory(category).filter(badge => badge.unlocked);
                
                // if user has no badges in this category, don't show the category
                if (categoryBadges.length === 0) return null;
                return (
                  <View key={category} style={styles.badgeCategoryContainer}>
                    <Text variant="body" color="primary" style={styles.badgeCategoryTitle}>
                      {category.charAt(0).toUpperCase() + category.slice(1)} Badges
                    </Text>
                    <View style={styles.badgesGrid}>
                      {categoryBadges.map((badge) => (
                        <View
                          key={badge.id}
                          style={[
                            styles.badgeItem,
                          ]}
                        >
                          <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                          <Text 
                            variant="caption" 
                            color='primary'
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
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Leaderboard Modal */}
      <Modal
        visible={showLeaderboardModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLeaderboardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Heading variant="h4" color="primary">Leaderboard</Heading>
              <TouchableOpacity
                onPress={() => setShowLeaderboardModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={colors.text.secondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {leaderboardData ? (
                <View style={styles.leaderboardContainer}>
                  <View style={styles.leaderboardList}>
                    {leaderboardData.leaderboard.map((entry) => (
                      <View
                        key={entry.rank}
                        style={[
                          styles.leaderboardItem,
                          entry.is_current_user && styles.leaderboardItemCurrent
                        ]}
                      >
                        <View style={styles.leaderboardRank}>
                          <Text 
                            variant="body" 
                            color='primary'
                            style={styles.leaderboardRankText}
                          >
                            #{entry.rank}
                          </Text>
                        </View>
                        <View style={styles.leaderboardInfo}>
                          <Text 
                            variant="body" 
                            color='primary'
                            style={[styles.leaderboardName, entry.is_current_user && styles.leaderboardNameCurrent]}
                          >
                            {entry.display_name}
                          </Text>
                          <Text 
                            variant="caption" 
                            color="secondary"
                            style={styles.leaderboardXP}
                          >
                            {entry.total_xp.toLocaleString()} XP
                          </Text>
                        </View>
                        {entry.is_current_user && (
                          <Users size={16} color={colors.text.primary} strokeWidth={2} />
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.noBadgesContainer}>
                  <Text variant="body" color="secondary">No leaderboard data available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  lastSection: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: spacing.md,
  },
  xpContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  xpBadge: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  xpAmount: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  xpStats: {
    flexDirection: 'row',
    width: '100%',
  },
  xpStatItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  xpStatValue: {
    fontSize: 18,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  xpStatLabel: {
    textAlign: 'center',
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
    marginBottom: spacing.xs,
  },
  quickStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  preferencesContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  preferenceLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  preferenceValue: {
    fontSize: 16,
  },
  newestBadgesContainer: {
    gap: spacing.sm,
  },
  newestBadgeItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  newestBadgeInfo: {
    flex: 1,
  },
  newestBadgeName: {
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  newestBadgeDescription: {
    fontSize: 12,
  },
  actionButtonsContainer: {
    gap: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalScrollView: {
    maxHeight: 500,
  },
  badgeCategoryContainer: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  badgeCategoryTitle: {
    fontSize: 16,
    marginBottom: spacing.md,
  },
  badgesGrid: {
    gap: spacing.sm,
  },
  badgeItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    position: 'relative',
  },
  badgeItemLocked: {
    opacity: 0.5,
  },
  badgeEmoji: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  badgeName: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  badgeDescription: {
    fontSize: 12,
  },
  badgeUnlockedIcon: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  noBadgesContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  leaderboardContainer: {
    padding: spacing.md,
  },
  leaderboardSubtitle: {
    fontSize: 14,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  leaderboardList: {
    gap: spacing.sm,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  leaderboardItemCurrent: {
    borderWidth: 1,
    borderColor: colors.surface,
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center',
  },
  leaderboardRankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  leaderboardNameCurrent: {
    fontFamily: fonts.chillax.bold,
    color: colors.text.primary,
  },
  leaderboardXP: {
    fontSize: 12,
  },
});
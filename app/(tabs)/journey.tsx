import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Award, Flame, Star, TrendingUp, Trophy, X, Users, Crown } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
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
import { 
  useUserStats, 
  useLeaderboard, 
  useBadgesWithStatus 
} from '@/lib/queries';

export default function JourneyScreen() {
  const { user } = useAuth();
  const { paddingBottom } = useAudioPlayerPadding();
  const [favoriteGenre, setFavoriteGenre] = useState<string>('');
  const [favoriteMood, setFavoriteMood] = useState<string>('');
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // Tanstack Query hooks
  const { 
    data: stats, 
    isLoading: statsLoading, 
    refetch: refetchStats 
  } = useUserStats(user?.id);
  
  const { 
    data: leaderboardData, 
    isLoading: leaderboardLoading 
  } = useLeaderboard(user?.id);
  
  const { 
    data: badges = [], 
    isLoading: badgesLoading 
  } = useBadgesWithStatus(user?.id);

  const loading = statsLoading || leaderboardLoading || badgesLoading;

  // Reload data when screen comes into focus (after XP changes)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        refetchStats();
      }
    }, [user?.id, refetchStats])
  );

  // Calculate favorite genre and mood from stats
  useEffect(() => {
    // This would need to be calculated from the actual ratings data
    // For now, we'll use placeholder values
    setFavoriteGenre('Electronic');
    setFavoriteMood('Energetic');
  }, [stats]);

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

  if (!stats) {
    return (
      <Screen withoutBottomSafeArea>
        <View style={styles.loadingContainer}>
          <Text variant="body" color="primary">No journey data available</Text>
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
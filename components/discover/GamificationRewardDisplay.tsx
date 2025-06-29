import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { X, Zap, Star, Trophy } from 'lucide-react-native';
import Animated, { withSpring, useSharedValue, useAnimatedStyle, SlideInUp } from 'react-native-reanimated';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { GamificationReward } from '@/types';

interface GamificationRewardDisplayProps {
  reward: GamificationReward | null;
  visible: boolean;
  onDismiss: () => void;
}

export function GamificationRewardDisplay({ 
  reward, 
  visible, 
  onDismiss 
}: GamificationRewardDisplayProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withSpring(1, { damping: 15, stiffness: 150 });
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    } else {
      opacity.value = withSpring(0, { damping: 15, stiffness: 150 });
      scale.value = withSpring(0.8, { damping: 15, stiffness: 150 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!reward || !visible) return null;

  return (
    <Animated.View style={styles.gamificationOverlay}>
      <Animated.View style={[styles.gamificationCard, animatedStyle]}>
        {/* Celebration Header */}
        <View style={styles.celebrationHeader}>
          <View style={styles.celebrationIcon}>
            <Zap size={32} color={colors.rewards.accent} strokeWidth={2} />
          </View>
          <Heading variant="h3" color="primary" style={styles.celebrationTitle}>
            Great Job!
          </Heading>
        </View>

        {/* XP Display */}
        <View style={styles.xpDisplay}>
          <View style={styles.xpBadge}>
            <Text style={styles.xpAmount}>+{reward.xp_earned} <Text variant="caption" color="secondary" style={styles.xpLabel}>XP</Text></Text>
          </View>
        </View>

        {/* XP Breakdown */}
        {reward.daily_streak_xp || reward.consecutive_bonus_xp ? <View style={styles.xpBreakdown}>
          <Text variant="body" color="primary" style={styles.breakdownTitle}>
            XP Breakdown:
          </Text>

          {/* Daily Streak XP */}
          {reward.daily_streak_xp && reward.daily_streak_xp > 0 ? (
            <View style={styles.breakdownItem}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text variant="caption" color="secondary" style={styles.breakdownText}>
                Daily Streak: +{reward.daily_streak_xp} XP
              </Text>
            </View>
          ) : null}

          {/* Consecutive Bonus XP */}
          {reward.consecutive_bonus_xp && reward.consecutive_bonus_xp > 0 ? (
            <View style={styles.breakdownItem}>
              <Text style={styles.streakEmoji}>⚡</Text>
              <Text variant="caption" color="secondary" style={styles.breakdownText}>
                Listen Streak: +{reward.consecutive_bonus_xp} XP
              </Text>
            </View>
          ) : null}
        </View> : null}

        {/* New Badges */}
        {reward.new_badges && reward.new_badges.length > 0 ? (
          <View style={styles.badgesSection}>
            <View style={styles.badgeHeader}>
              <Trophy size={20} color={colors.primary} strokeWidth={2} />
              <Text variant="body" color="primary" style={styles.badgeTitle}>
                New Badge{reward.new_badges.length > 1 ? 's' : ''} Unlocked!
              </Text>
            </View>
            
            <View style={styles.badgesList}>
              {reward.new_badges.map((badgeId) => (
                <View 
                  key={badgeId}
                  style={styles.badgeItem}
                >
                  <Text style={styles.badgeEmoji}>🏆</Text>
                  <Text variant="caption" color="primary" style={styles.badgeName}>
                    {badgeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Continue Button */}
        <Button
          variant="primary"
          size="large"
          onPress={onDismiss}
          style={styles.continueButton}
        >
          Continue
        </Button>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Gamification Styles - Duolingo-inspired
  gamificationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: spacing.lg,
  },
  gamificationCard: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 380,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  celebrationTitle: {
    fontSize: 28,
    textAlign: 'center',
  },
  xpDisplay: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  xpBadge: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  xpAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    flexDirection: 'row',
  },
  xpLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  xpBreakdown: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  breakdownTitle: {
    fontSize: 16,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  breakdownText: {
    fontSize: 14,
    flex: 1,
  },
  streakEmoji: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  badgesSection: {
    marginBottom: spacing.lg,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  badgesList: {
    gap: spacing.sm,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(69, 36, 81, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  badgeEmoji: {
    fontSize: 20,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  continueButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
}); 
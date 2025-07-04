import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { Text } from '@/components/typography/Text';

interface PlaybackControlsProps {
  isPlaying: boolean;
  canSkip: boolean;
  onPlayPause: () => void;
  onSkip: () => void;
  position: number;
  duration: number;
}

export function PlaybackControls({
  isPlaying,
  canSkip,
  onPlayPause,
  onSkip,
  position,
  duration,
}: PlaybackControlsProps) {
  const pulseAnimation = useSharedValue(1);

  React.useEffect(() => {
    if (isPlaying) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
      );
    } else {
      pulseAnimation.value = withTiming(1);
    }
  }, [isPlaying]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: duration > 0 ? `${(position / duration) * 100}%` : '0%',
  }));

  // Calculate circular progress (stops at 20% of duration)
  const maxProgressPercent = 20; // 20% of total duration
  const currentPercent = duration > 0 ? (position / duration) * 100 : 0;
  const progressPercent =
    currentPercent <= maxProgressPercent
      ? (currentPercent / maxProgressPercent) * 100
      : 100;
  const strokeDasharray = 2 * Math.PI * 70; // circumference of circle with radius 70
  const strokeDashoffset = strokeDasharray * (1 - progressPercent / 100);

  return (
    <View style={styles.container}>
      {/* Play Button with Circular Progress */}
      <View style={styles.playButtonWrapper}>
        {/* Circular Progress Background */}
        <Svg width={160} height={160} style={styles.progressSvg}>
          <Circle
            cx={80}
            cy={80}
            r={70}
            stroke={colors.surface}
            strokeWidth={4}
            fill="none"
          />
          {/* Circular Progress Fill */}
          <Circle
            cx={80}
            cy={80}
            r={70}
            stroke={colors.primary}
            strokeWidth={4}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
          />
        </Svg>

        {/* Play Button */}
        <Animated.View style={[pulseStyle]}>
          <TouchableOpacity
            onPress={onPlayPause}
            style={styles.playButton}
            activeOpacity={0.8}
          >
            {isPlaying ? (
              <Pause size={40} color={colors.text.primary} strokeWidth={2} />
            ) : (
              <Play
                size={40}
                color={colors.text.primary}
                strokeWidth={2}
                style={{ marginLeft: 4 }}
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[progressStyle, styles.progressFill]} />
        </View>
      </View>

      {/* Skip Button */}
      {canSkip && (
        <TouchableOpacity
          onPress={onSkip}
          style={styles.skipButton}
          activeOpacity={0.8}
        >
          <SkipForward
            size={20}
            color={colors.text.secondary}
            strokeWidth={2}
          />
          <Text variant="body" color="secondary" style={styles.skipText}>
            Next
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  playButtonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  progressSvg: {
    position: 'absolute',
  },
  playButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
  },
  skipText: {
    fontSize: 16,
  },
});

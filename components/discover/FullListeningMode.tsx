import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { StarRating } from '@/components/rating/StarRating';
import { Track } from '@/types';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';

interface FullListeningModeProps {
  track: Track;
  isPlaying: boolean;
  position: number;
  duration: number;
  userRating: number;
  userReview: string;
  onPlayPause: () => void;
  onSkip: () => void;
}

export function FullListeningMode({
  track,
  isPlaying,
  position,
  duration,
  userRating,
  userReview,
  onPlayPause,
  onSkip,
}: FullListeningModeProps) {
  const progressStyle = useAnimatedStyle(() => ({
    width: duration > 0 ? `${(position / duration) * 100}%` : '0%',
  }));

  return (
    <View style={styles.container}>
      {/* Cover Art with Play Button */}
      <View style={styles.artworkContainer}>
        <View style={styles.artworkWrapper}>
          {track.artwork_url ? (
            <Image
              source={{ uri: track.artwork_url }}
              style={styles.artwork}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderArtwork}>
              <Text style={styles.placeholderEmoji}>🎵</Text>
            </View>
          )}
          
          {/* Play/Pause Button Overlay */}
          <TouchableOpacity
            onPress={onPlayPause}
            style={styles.playButton}
            activeOpacity={0.8}
          >
            {isPlaying ? (
              <Pause size={24} color={colors.text.primary} strokeWidth={2} />
            ) : (
              <Play size={24} color={colors.text.primary} strokeWidth={2} style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Track Info */}
      <View style={styles.trackInfo}>
        <Heading variant="h3" color="primary" align="center" style={styles.trackTitle}>
          {track.title}
        </Heading>
        <Text variant="body" color="secondary" align="center" style={styles.trackArtist}>
          {track.artist}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[progressStyle, styles.progressFill]} />
        </View>
      </View>

      {/* Next Button */}
      <Button
        variant="secondary"
        size="medium"
        onPress={onSkip}
        icon={<SkipForward size={20} color={colors.text.secondary} strokeWidth={2} />}
        iconPosition="left"
        style={styles.nextButton}
      >
        Next
      </Button>

      {/* Rating Display */}
      <View style={styles.ratingDisplay}>
        <Text variant="body" color="primary" style={styles.ratingTitle}>
          Your Rating
        </Text>
        <StarRating rating={userRating} readonly style={styles.starRating} />
        {userReview && userReview.trim() ? (
          <View style={styles.reviewContainer}>
            <Text style={styles.quoteSymbol}>"</Text>
            <Text variant="body" color="secondary" style={styles.reviewText}>
              {userReview.trim()}
            </Text>
            <Text style={styles.quoteSymbol}>"</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  artworkWrapper: {
    width: 280,
    height: 280,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  placeholderArtwork: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(69, 36, 81, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  trackTitle: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  trackArtist: {
    fontSize: 18,
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
  nextButton: {
    marginBottom: spacing.xl,
  },
  ratingDisplay: {
    width: '100%',
    backgroundColor: 'rgba(222, 215, 224, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  ratingTitle: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  starRating: {
    marginBottom: spacing.sm,
  },
  reviewContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '100%',
  },
  quoteSymbol: {
    fontSize: 28,
    color: colors.primary,
    lineHeight: 24,
  },
  reviewText: {
    fontSize: 18,
    fontStyle: 'italic',
    flex: 1,
    marginHorizontal: spacing.sm,
    lineHeight: 26,
  },
});
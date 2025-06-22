import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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
  paddingBottom?: number;
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
  paddingBottom,
}: FullListeningModeProps) {
  const progressStyle = useAnimatedStyle(() => ({
    width: duration > 0 ? `${(position / duration) * 100}%` : '0%',
  }));

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ 
        paddingBottom,
        alignItems: 'center',
        paddingTop: spacing.md
      }}
      showsVerticalScrollIndicator={false}
    >
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

          {/* Next Button Overlay */}
          <TouchableOpacity
            onPress={onSkip}
            style={styles.nextButtonOverlay}
            activeOpacity={0.8}
          >
            <SkipForward size={20} color={colors.text.primary} strokeWidth={2} />
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

      {/* Rating Display */}
      <TouchableOpacity style={styles.ratingDisplay} onPress={() => {}}>
        <Text variant="body" color="primary" style={styles.ratingTitle}>
          Your Rating
        </Text>
        <StarRating rating={userRating} readonly style={styles.starRating} />
        {userReview && userReview.trim() ? (
          <View style={styles.reviewContainer}>
            <Text variant="body" color="secondary" style={styles.reviewText}>
              {userReview.trim()}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
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
    fontSize: 48,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
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
    marginBottom: spacing.sm,
  },
  trackTitle: {
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  trackArtist: {
    fontSize: 16,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
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
  nextButtonOverlay: {
    position: 'absolute',
    top: '50%',
    right: 10,
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(69, 36, 81, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingDisplay: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.md
  },
  ratingTitle: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  starRating: {
    marginBottom: spacing.sm,
    justifyContent: 'center',
  },
  reviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  quoteSymbol: {
    fontSize: 28,
    color: colors.primary,
    lineHeight: 24,
  },
  reviewText: {
    width: '100%',
    fontSize: 18,
    fontStyle: 'italic',
    flex: 1,
    marginHorizontal: spacing.sm,
    lineHeight: 26,
  },
});
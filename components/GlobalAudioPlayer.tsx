import React, { useState, memo } from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Play, Pause, SkipForward, Music, ArrowLeft } from 'lucide-react-native';
import { usePathname, router } from 'expo-router';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useAudio } from '@/contexts/AudioContext';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { fonts } from '@/lib/fonts';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';

interface GlobalAudioPlayerProps {
  onPress?: () => void;
  onSkip?: () => void;
  hidden?: boolean;
  hideTrackInfo?: boolean;
}

const GlobalAudioPlayer = memo(function GlobalAudioPlayer({ onPress, onSkip, hidden, hideTrackInfo }: GlobalAudioPlayerProps) {
  const { 
    currentTrack, 
    isPlaying, 
    position, 
    duration, 
    playPause, 
    getProgress,
    isGlobalPlayerVisible,
    showGlobalPlayer,
    hideGlobalPlayer,
    isTrackUnveiled,
    isPlayerExpanded,
    setPlayerExpanded,
    isPlayingFromFinds,
    setPlayingFromFinds
  } = useAudio();
  
  const pathname = usePathname();
  
  // Animation values
  const progressAnimation = useSharedValue(0);
  const expandAnimation = useSharedValue(0);

  // Progress animation
  React.useEffect(() => {
    progressAnimation.value = withTiming(getProgress(), { duration: 100 });
  }, [position, duration]);

  // Expand animation
  React.useEffect(() => {
    expandAnimation.value = withTiming(isPlayerExpanded ? 1 : 0, { duration: 300 });
  }, [isPlayerExpanded]);

  // Auto-show/hide global player based on track availability
  React.useEffect(() => {
    if (currentTrack && !isGlobalPlayerVisible) {
      showGlobalPlayer();
    } else if (!currentTrack && isGlobalPlayerVisible) {
      hideGlobalPlayer();
    }
  }, [currentTrack, isGlobalPlayerVisible, showGlobalPlayer, hideGlobalPlayer]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value * 100}%`,
  }));

  const expandStyle = useAnimatedStyle(() => ({
    height: interpolate(
      expandAnimation.value,
      [0, 1],
      [80, 320],
      Extrapolate.CLAMP
    ),
  }));

  // Don't render if no track is loaded or if explicitly hidden
  if (!currentTrack || hidden) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (!isTrackUnveiled) {
      // If track is hidden and we're not on the discover page, navigate there
      const isOnDiscoverPage = pathname === '/(tabs)/' || pathname === '/(tabs)/index';
      if (!isOnDiscoverPage) {
        router.push('/(tabs)');
      }
    } else if (isPlayingFromFinds) {
      // Only allow expansion when playing from finds
      setPlayerExpanded(!isPlayerExpanded);
    }
  };

  const handlePlayPause = async () => {
    await playPause();
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const handleDiscoverNew = () => {
    // Reset playing from finds state and collapse player
    setPlayingFromFinds(false);
    setPlayerExpanded(false);
    // Navigate to discover tab
    router.push('/(tabs)');
  };

  const handleCollapse = () => {
    setPlayerExpanded(false);
  };

  // Determine if track info should be hidden
  const shouldHideTrackInfo = hideTrackInfo || !isTrackUnveiled;

  return (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      exiting={FadeOut.duration(300)}
      style={[styles.container, expandStyle]}
    >
      {/* Progress bar at top */}
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, progressStyle]} />
      </View>

      {/* Expanded view */}
      {isPlayerExpanded && isPlayingFromFinds && (
        <Animated.View style={styles.expandedContent}>
          {/* Header with collapse button */}
          <View style={styles.expandedHeader}>
            <TouchableOpacity onPress={handleCollapse} style={styles.collapseButton}>
              <ArrowLeft size={24} color={colors.text.primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Artwork */}
          <View style={styles.expandedArtworkContainer}>
            {currentTrack.artwork_url ? (
              <Image
                source={{ uri: currentTrack.artwork_url }}
                style={styles.expandedArtwork}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.expandedPlaceholderArtwork}>
                <Music size={64} color={colors.text.secondary} strokeWidth={1.5} />
              </View>
            )}
          </View>

          {/* Track info */}
          <View style={styles.expandedTrackInfo}>
            <Text 
              variant="body" 
              color="primary" 
              style={styles.expandedTrackTitle}
            >
              {currentTrack.title}
            </Text>
            <Text 
              variant="caption" 
              color="secondary" 
              style={styles.expandedTrackArtist}
            >
              {currentTrack.artist}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.expandedControls}>
            <TouchableOpacity 
              onPress={handlePlayPause} 
              style={styles.expandedPlayButton}
              disabled={!currentTrack}
            >
              {isPlaying ? (
                <Pause size={32} color={colors.text.primary} strokeWidth={2} />
              ) : (
                <Play size={32} color={colors.text.primary} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>

          {/* Discover new button */}
          <View style={styles.discoverButtonContainer}>
            <Button
              variant="primary"
              size="medium"
              onPress={handleDiscoverNew}
              style={styles.discoverButton}
            >
              Discover New Song
            </Button>
          </View>
        </Animated.View>
      )}

      {/* Collapsed view */}
      {!isPlayerExpanded && (
        <View style={styles.content}>
          {/* Track info */}
          <TouchableOpacity onPress={handlePress} style={styles.trackInfo}>
            <Text 
              variant="body" 
              color="primary" 
              style={styles.trackTitle}
            >
              {shouldHideTrackInfo ? 'unknown' : currentTrack.title}
            </Text>
            <Text 
              variant="caption" 
              color="secondary" 
              style={styles.trackArtist}
            >
              {shouldHideTrackInfo ? 'unknown artist' : currentTrack.artist}
            </Text>
          </TouchableOpacity>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity 
              onPress={handlePlayPause} 
              style={styles.playButton}
              disabled={!currentTrack}
            >
              {isPlaying ? (
                <Pause size={24} color={colors.text.primary} strokeWidth={2} />
              ) : (
                <Play size={24} color={colors.text.primary} strokeWidth={2} />
              )}
            </TouchableOpacity>

            {onSkip && (
              <TouchableOpacity 
                onPress={handleSkip} 
                style={styles.skipButton}
              >
                <SkipForward size={20} color={colors.text.secondary} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
});

export default GlobalAudioPlayer;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.surface,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    flex: 1,
  },
  trackInfo: {
    flex: 1,
    marginRight: spacing.md,
    gap: spacing.xs,
  },
  trackTitle: {
    fontFamily: fonts.chillax.bold,
  },
  trackArtist: {
    fontFamily: fonts.chillax.regular,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.text.secondary,
  },
  // Expanded view styles
  expandedContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  collapseButton: {
    padding: spacing.sm,
  },
  expandedArtworkContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  expandedArtwork: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  expandedPlaceholderArtwork: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedTrackInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  expandedTrackTitle: {
    fontSize: 18,
    fontFamily: fonts.chillax.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  expandedTrackArtist: {
    fontSize: 14,
    fontFamily: fonts.chillax.regular,
    textAlign: 'center',
  },
  expandedControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  expandedPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discoverButtonContainer: {
    alignItems: 'center',
  },
  discoverButton: {
    paddingHorizontal: spacing.lg,
  },
});
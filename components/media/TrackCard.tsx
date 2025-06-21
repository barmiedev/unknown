import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { Text } from '@/components/typography/Text';
import { Heading } from '@/components/typography/Heading';
import { Track } from '@/types';
import { Music } from 'lucide-react-native';

interface TrackCardProps {
  track: Track;
  onPress?: () => void;
  showRating?: boolean;
  showArtwork?: boolean;
  variant?: 'compact' | 'detailed';
  style?: any;
}

export function TrackCard({
  track,
  onPress,
  showRating = false,
  showArtwork = true,
  variant = 'detailed',
  style,
}: TrackCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {showArtwork && (
        <View style={styles.artworkContainer}>
          {track.artwork_url ? (
            <Image source={{ uri: track.artwork_url }} style={styles.artwork} />
          ) : (
            <View style={styles.placeholderArtwork}>
              <Music size={24} color={colors.text.secondary} strokeWidth={1.5} />
            </View>
          )}
        </View>
      )}
      
      <View style={styles.content}>
        <Heading variant="h4" color="primary" style={styles.title}>
          {track.title}
        </Heading>
        <Text variant="body" color="secondary" style={styles.artist}>
          {track.artist}
        </Text>
        
        {variant === 'detailed' && (
          <View style={styles.details}>
            <View style={styles.tags}>
              <Text variant="caption" color="secondary" style={styles.tag}>
                {track.genre}
              </Text>
              <Text variant="caption" color="secondary" style={styles.tag}>
                {track.mood}
              </Text>
            </View>
            {showRating && (
              <Text variant="caption" color="accent">
                ★★★★★
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  artworkContainer: {
    marginRight: spacing.md,
  },
  artwork: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
  },
  placeholderArtwork: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  artist: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: 'rgba(139, 102, 153, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    fontSize: 12,
  },
});
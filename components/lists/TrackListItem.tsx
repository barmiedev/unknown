import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { StarRating } from '@/components/rating/StarRating';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { formatDate } from '@/utils/formatting';
import { fonts } from '@/lib/fonts';

interface TrackListItemProps {
  track: {
    id: string;
    title: string;
    artist: string;
    genre: string;
    mood: string;
    rating: number;
    review_text?: string;
    created_at: string;
    artist_location?: string;
  };
  onPress: () => void;
  showSeparator?: boolean;
}

export const TrackListItem = React.memo(function TrackListItem({ track, onPress, showSeparator = true }: TrackListItemProps) {
  const extractCityFromLocation = (location: string | undefined): string => {
    if (!location) return '';
    // Extract city name (first part before comma)
    const city = location.split(',')[0].trim();
    return city;
  };

  const renderTrackTags = () => {
    const tags = [];
    
    // Add genre
    if (track.genre) {
      tags.push({ text: track.genre, bold: false });
    }
    
    // Add city (medium weight)
    const city = extractCityFromLocation(track.artist_location);
    if (city) {
      tags.push({ text: city, bold: true });
    }
    
    // Add mood
    if (track.mood) {
      tags.push({ text: track.mood, bold: false });
    }

    return (
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Text style={styles.tagSeparator}> ⋅ </Text>}
            <Text style={[styles.tagText, tag.bold && styles.tagTextBold]}>
              {tag.text}
            </Text>
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        style={styles.trackCard}
        activeOpacity={0.8}
      >
        <View style={styles.trackHeader}>
          <View style={styles.trackTitleContainer}>
            <Heading variant="h4" color="primary" style={styles.trackTitle}>
              {track.title}
            </Heading>
            <Text variant="body" color="secondary" style={styles.trackArtist}>
              {track.artist}
            </Text>
          </View>
          
          <Text variant="caption" color="secondary" style={styles.trackDate}>
            {formatDate(track.created_at)}
          </Text>
        </View>

        {/* Tags */}
        {renderTrackTags()}

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <StarRating rating={track.rating} readonly size="small" />
        </View>

        {/* Review */}
        {track.review_text && track.review_text.trim() && (
          <View style={styles.reviewContainer}>
            <Text variant="body" color="primary" style={styles.reviewText}>
              {track.review_text.trim()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      {showSeparator && <View style={styles.separator} />}
    </View>
  );
});

const styles = StyleSheet.create({
  trackCard: {
    paddingVertical: spacing.sm,
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  trackTitleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  trackTitle: {
    fontSize: 18,
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 16,
  },
  trackDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tagText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  tagTextBold: {
    fontFamily: fonts.chillax.medium,
    color: colors.text.secondary,
  },
  tagSeparator: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  ratingContainer: {
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  reviewContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: spacing.sm,
  },
});
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { formatDate } from '@/utils/formatting';

interface ArtistListItemProps {
  artist: {
    id: string;
    name: string;
    location?: string;
    genres?: string[];
    avatar_url?: string;
    subscribed_at: string;
  };
  onPress: () => void;
  showSeparator?: boolean;
}

export const ArtistListItem = React.memo(function ArtistListItem({ artist, onPress, showSeparator = true }: ArtistListItemProps) {
  const renderGenreTags = () => {
    if (!artist.genres || artist.genres.length === 0) return null;

    return (
      <View style={styles.tagsContainer}>
        {artist.genres.map((genre, index) => (
          <React.Fragment key={genre}>
            {index > 0 && <Text style={styles.tagSeparator}> ⋅ </Text>}
            <Text style={styles.tagText}>{genre}</Text>
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        style={styles.artistCard}
        activeOpacity={0.8}
      >
        <View style={styles.artistContent}>
          {/* Artist Avatar */}
          <View style={styles.artistAvatarContainer}>
            {artist.avatar_url ? (
              <OptimizedImage
                source={{ uri: artist.avatar_url }}
                style={styles.artistAvatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.artistAvatarPlaceholder}>
                <Users size={24} color={colors.text.secondary} strokeWidth={1.5} />
              </View>
            )}
          </View>

          {/* Artist Info */}
          <View style={styles.artistInfo}>
            <View style={styles.artistHeader}>
              <Heading variant="h4" color="primary" style={styles.artistName}>
                {artist.name}
              </Heading>
              <Text variant="caption" color="secondary" style={styles.artistDate}>
                {formatDate(artist.subscribed_at)}
              </Text>
            </View>
            
            {artist.location && (
              <Text variant="body" color="secondary" style={styles.artistLocation}>
                {artist.location}
              </Text>
            )}
            
            {renderGenreTags()}
          </View>
        </View>
      </TouchableOpacity>
      
      {showSeparator && <View style={styles.separator} />}
    </View>
  );
});

const styles = StyleSheet.create({
  artistCard: {
    paddingVertical: spacing.sm,
  },
  artistContent: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  artistAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  artistAvatar: {
    width: '100%',
    height: '100%',
  },
  artistAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInfo: {
    flex: 1,
  },
  artistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  artistName: {
    fontSize: 18,
    flex: 1,
    marginRight: spacing.md,
  },
  artistDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  artistLocation: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tagText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  tagSeparator: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: spacing.sm,
  },
});
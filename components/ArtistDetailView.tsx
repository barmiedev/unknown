import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Users, UserMinus, UserPlus } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { FloatingBackButton } from '@/components/navigation';
import { Button } from '@/components/buttons';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { formatDate } from '@/utils/formatting';
import { SubscribedArtist, SocialLink } from '@/types';
import SocialIcon from '@/components/media/SocialIcon';
import { supabase } from '@/lib/supabase';

interface ArtistDetailViewProps {
  artist: SubscribedArtist;
  onBack: () => void;
  onUnfollow: (artistId: string) => void;
  onFollow: (artistId: string) => void;
  isFollowing: boolean;
  paddingBottom?: number;
}

export default function ArtistDetailView({ 
  artist, 
  onBack, 
  onUnfollow, 
  onFollow, 
  isFollowing,
  paddingBottom = 0
}: ArtistDetailViewProps) {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    loadSocialLinks();
  }, [artist.id]);

  const loadSocialLinks = async () => {
    try {
      const { data: socialData, error: socialError } = await supabase
        .from('artist_social_links')
        .select('platform, url')
        .eq('artist_id', artist.id);

      if (socialError) throw socialError;
      setSocialLinks(socialData || []);
    } catch (error) {
      console.error('Error loading social links:', error);
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const handleToggleFollow = () => {
    if (isFollowing) {
      onUnfollow(artist.id);
    } else {
      onFollow(artist.id);
    }
  };

  return (
    <Screen backgroundColor={colors.background} withoutBottomSafeArea paddingHorizontal={0}>
      <FloatingBackButton onPress={onBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom }}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          {/* Artist Header */}
          <View style={styles.artistHeader}>
            <View style={styles.artistAvatarContainer}>
              {artist.avatar_url ? (
                <OptimizedImage 
                  source={{ uri: artist.avatar_url }} 
                  style={styles.artistAvatar} 
                />
              ) : (
                <View style={styles.artistAvatarPlaceholder}>
                  <Users size={40} color={colors.text.secondary} strokeWidth={1.5} />
                </View>
              )}
            </View>
            
            <Heading variant="h3" color="primary" align="center" style={styles.artistName}>
              {artist.name}
            </Heading>
            
            {artist.location && (
              <Text variant="body" color="secondary" align="center" style={styles.artistLocation}>
                {artist.location}
              </Text>
            )}

            {artist.genres && artist.genres.length > 0 && (
              <View style={styles.genresContainer}>
                {artist.genres.map((genre) => (
                  <Text key={genre} style={styles.tag}>
                    {genre}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Discovery Info */}
          {artist.discovered_track_title && (
            <View style={styles.discoveryInfo}>
              <Heading variant="h4" color="primary" style={styles.discoveryTitle}>
                How you discovered this artist
              </Heading>
              <Text variant="body" color="secondary" style={styles.discoveryText}>
                You discovered {artist.name || 'Unknown Artist'} by listening to "{artist.discovered_track_title || 'Unknown Track'}"
              </Text>
            </View>
          )}

          {/* Artist Bio */}
          {artist.bio && (
            <View style={styles.bioSection}>
              <Heading variant="h4" color="primary" style={styles.bioTitle}>
                About the Artist
              </Heading>
              <Text variant="body" color="primary" style={styles.bioText}>
                {artist.bio}
              </Text>
            </View>
          )}

          {/* Following Since */}
          {isFollowing && (
            <View style={styles.followingSince}>
              <Text variant="caption" color="secondary" align="center">
                Following since {formatDate(artist.subscribed_at)}
              </Text>
            </View>
          )}

          

          {/* Social Media Links */}
          {socialLinks.length > 0? (
            <View style={styles.socialSection}>
              <Heading variant="h4" color="primary" style={styles.socialTitle}>
                Connect with {artist.name}
              </Heading>
              <View style={styles.socialLinksContainer}>
                {socialLinks.map((link) => (
                  <TouchableOpacity
                    key={link.platform}
                    style={styles.socialButton}
                    onPress={() => handleOpenLink(link.url)}
                    activeOpacity={0.8}
                  >
                    <SocialIcon platform={link.platform} size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ): null}

          {/* Follow/Unfollow Button */}
          <View style={styles.followSection}>
            <Button
              variant={isFollowing ? "outlineError" : "primary"}
              onPress={handleToggleFollow}
              icon={
                isFollowing ? (
                  <UserMinus size={16} color={colors.status.error} strokeWidth={2} />
                ) : (
                  <UserPlus size={16} color={colors.text.primary} strokeWidth={2} />
                )
              }
              iconPosition="left"
              style={[
                styles.followButton,
                isFollowing ? styles.unfollowButton : styles.followButtonActive
              ]}
            >
              {isFollowing ? "Unfollow Artist" : "Follow Artist"}
            </Button>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  artistHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  artistAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: spacing.md,
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
  artistName: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  artistLocation: {
    fontSize: 16,
    marginBottom: spacing.md,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  tag: {
    fontSize: 12,
    color: colors.text.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  discoveryInfo: {
    marginBottom: spacing.xl,
  },
  discoveryTitle: {
    fontSize: 18,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  discoveryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  bioSection: {
    marginBottom: spacing.xl,
  },
  bioTitle: {
    fontSize: 18,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
  },
  followingSince: {
    paddingBottom: spacing.lg,
  },
  followSection: {
    paddingBottom: spacing.md,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  followButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unfollowButton: {
    borderColor: colors.status.error,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  socialSection: {
    paddingBottom: spacing.sm,
  },
  socialTitle: {
    fontSize: 18,
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  socialLinksContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  socialButton: {
    backgroundColor: colors.surface,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
});
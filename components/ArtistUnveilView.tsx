import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Image, StyleSheet, Linking, Alert, Modal } from 'react-native';
import { 
  Heart,
  HeartHandshake,
  MapPin,
  Music,
  Play,
  SkipForward,
  X,
  ArrowLeft,
  ExternalLink
} from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { StarRating } from '@/components/rating/StarRating';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import {
  getPlatformColor, 
  getPlatformName,
  DEFAULT_STREAMING_PLATFORM 
} from '@/lib/platforms';
import SocialIcon from '@/components/media/SocialIcon';
import { Artist, SocialLink, StreamingLink, TrackDisplay, GamificationReward, Badge } from '@/types';
import { FloatingBackButton } from '@/components/navigation';
import { GamificationRewardDisplay } from '@/components/discover';

interface ArtistUnveilViewProps {
  track: TrackDisplay;
  onContinueListening?: () => void;
  onDiscoverNext?: () => void;
  showPlaybackControls?: boolean;
  userRating?: number | null;
  userReview?: string | null;
  onPlayInApp?: () => void;
  withoutBottomSafeArea?: boolean;
  gamificationReward?: GamificationReward | null;
  showGamificationReward?: boolean;
  onGamificationRewardDismiss?: () => void;
  paddingBottom?: number;
}

export default function ArtistUnveilView({ 
  track, 
  onContinueListening, 
  onDiscoverNext, 
  showPlaybackControls = true,
  userRating,
  userReview,
  onPlayInApp,
  withoutBottomSafeArea = false,
  gamificationReward,
  showGamificationReward = false,
  onGamificationRewardDismiss,
  paddingBottom,
}: ArtistUnveilViewProps) {
  const { user } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [streamingLinks, setStreamingLinks] = useState<StreamingLink[]>([]);
  const [preferredPlatform, setPreferredPlatform] = useState<string>(DEFAULT_STREAMING_PLATFORM);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOtherPlatforms, setShowOtherPlatforms] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    setLoading(true);
    loadArtistData();
    loadUserPreferences();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [track.id, user?.id]);

  const loadArtistData = async () => {
    try {
      // Get artist data
      const { data: artistData, error: artistError } = await supabase
        .from('tracks')
        .select(`
          artists (
            id,
            name,
            bio,
            location,
            genres,
            avatar_url
          )
        `)
        .eq('id', track.id)
        .single();

      if (artistError) throw artistError;

      if (artistData?.artists) {
        // Handle the case where artists might be an array or single object
        const artist = Array.isArray(artistData.artists) ? artistData.artists[0] : artistData.artists;
        
        if (artist) {
          if (isMountedRef.current) {
            setArtist(artist);
          }

          // Get social links
          const { data: socialData, error: socialError } = await supabase
            .from('artist_social_links')
            .select('platform, url')
            .eq('artist_id', artist.id);

          if (socialError) throw socialError;
          if (isMountedRef.current) {
            setSocialLinks(socialData || []);
          }

          // Check if user is subscribed
          if (user?.id) {
            const { data: subscriptionData } = await supabase
              .from('user_artist_subscriptions')
              .select('id')
              .eq('profile_id', user.id)
              .eq('artist_id', artist.id);

            // Check if subscription exists by checking if data array is not empty
            if (isMountedRef.current) {
              setIsSubscribed(Boolean(subscriptionData && subscriptionData.length > 0));
            }
          }
        }
      }

      // Get streaming links
      const { data: streamingData, error: streamingError } = await supabase
        .from('track_streaming_links')
        .select('platform, url')
        .eq('track_id', track.id);

      if (streamingError) throw streamingError;
      if (isMountedRef.current) {
        setStreamingLinks(streamingData || []);
      }

    } catch (error) {
      console.error('Error loading artist data:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loadUserPreferences = async () => {
    if (!user?.id) return;

    try {
      // Use maybeSingle() to handle no results gracefully
      const { data, error } = await supabase
        .from('user_streaming_preferences')
        .select('preferred_platform')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (data) {
        if (isMountedRef.current) {
          setPreferredPlatform(data.preferred_platform);
        }
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const handleSubscribeToArtist = async () => {
    if (!user?.id || !artist) return;

    try {
      if (isSubscribed) {
        // Unsubscribe
        const { error } = await supabase
          .from('user_artist_subscriptions')
          .delete()
          .eq('profile_id', user.id)
          .eq('artist_id', artist.id);

        if (error) throw error;
        setIsSubscribed(false);
      } else {
        // Subscribe
        const { error } = await supabase
          .from('user_artist_subscriptions')
          .insert({
            profile_id: user.id,
            artist_id: artist.id,
            discovered_track_id: track.id,
          });

        if (error) throw error;
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      Alert.alert('Error', 'Failed to update subscription');
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
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const getPreferredStreamingLink = useCallback(() => {
    return streamingLinks.find(link => link.platform === preferredPlatform) || streamingLinks[0];
  }, [streamingLinks, preferredPlatform]);

  const getOtherStreamingLinks = useCallback(() => {
    return streamingLinks.filter(link => link.platform !== preferredPlatform);
  }, [streamingLinks, preferredPlatform]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Text variant="body" color="primary">Loading artist details...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen 
      backgroundColor={colors.background} 
      withoutBottomSafeArea={withoutBottomSafeArea}
      paddingHorizontal={0}
    >
      {/* Floating Back Button */}
      {onContinueListening && (
        <FloatingBackButton onPress={onContinueListening} />
      )}

      {/* Gamification Reward Overlay - Show FIRST before other content */}
      {showGamificationReward && gamificationReward && (
        <GamificationRewardDisplay
          reward={gamificationReward}
          visible={showGamificationReward}
          onDismiss={onGamificationRewardDismiss || (() => {})}
        />
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom }}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          {/* Track Artwork */}
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
                  <Music size={64} color={colors.text.secondary} strokeWidth={1.5} />
                </View>
              )}
            </View>
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Heading variant="h2" color="primary" align="center" style={styles.trackTitle}>
              {track.title && track.title.trim() ? track.title : 'Unknown Track'}
            </Heading>
            <Text variant="body" color="secondary" align="center" style={styles.artistName}>
              {track.artist && track.artist.trim() ? track.artist : 'Unknown Artist'}
            </Text>
            <View style={styles.genreMoodContainer}>
              <Text style={styles.tag}>{track.genre && track.genre.trim() ? track.genre : 'Unknown Genre'}</Text>
              <Text style={styles.tag}>{track.mood && track.mood.trim() ? track.mood : 'Unknown Mood'}</Text>
            </View>
          </View>

          {/* User Rating Display */}
          {userRating && (
            <View style={styles.section}>
              <View style={styles.userRatingContainer}>
                <Heading variant="h4" color="primary" style={styles.userRatingTitle}>
                  Your Rating
                </Heading>
                <StarRating rating={userRating} readonly style={styles.userRatingStars} />
                {userReview && userReview.trim() ? (
                  <View style={styles.artisticQuoteContainer}>
                    <Text style={styles.quoteSymbol}>"</Text>
                    <Text variant="body" color="secondary" style={styles.userReviewText}>
                      {userReview.trim()}
                    </Text>
                    <Text style={styles.quoteSymbol}>"</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* Streaming Links */}
          {streamingLinks.length > 0 && (
            <View style={styles.section}>
              <Heading variant="h4" color="primary" style={styles.sectionTitle}>
                Listen Now
              </Heading>
              <View style={styles.streamingLinksContainer}>
                {/* Play in App Button */}
                {onPlayInApp && (
                  <Button
                    variant="primary"
                    size="large"
                    onPress={onPlayInApp}
                    icon={<Play size={20} color={colors.text.primary} strokeWidth={2} />}
                    iconPosition="left"
                    style={styles.playInAppButton}
                  >
                    Play in unknown
                  </Button>
                )}

                {/* Streaming Buttons Row */}
                <View style={styles.streamingButtonsRow}>
                  {/* Preferred Platform First */}
                  {getPreferredStreamingLink() && (
                    <Button
                      variant="secondary"
                      size="medium"
                      onPress={() => handleOpenLink(getPreferredStreamingLink()!.url)}
                      style={[styles.preferredStreamingButton, { flex: 1, marginRight: getOtherStreamingLinks().length > 0 ? 4 : 0 }]}
                    >
                      <Text 
                        variant="body" 
                        style={[
                          styles.preferredStreamingButtonText,
                          { color: getPlatformColor(getPreferredStreamingLink()!.platform) }
                        ]}
                      >
                        {getPlatformName(getPreferredStreamingLink()!.platform) || 'Listen'}
                      </Text>
                    </Button>
                  )}

                  {/* Listen Elsewhere Button */}
                  {getOtherStreamingLinks().length > 0 && (
                    <Button
                      variant="secondary"
                      size="medium"
                      onPress={() => setShowOtherPlatforms(true)}
                      icon={<ExternalLink size={16} color={colors.text.secondary} strokeWidth={2} />}
                      iconPosition="right"
                      style={[styles.otherPlatformsButton, { flex: 1, marginLeft: getPreferredStreamingLink() ? 4 : 0 }]}
                    >
                      Elsewhere
                    </Button>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Artist Info */}
          {artist && (
            <>
              {/* Connect with Artist Section */}
              <View style={styles.section}>
                <Heading variant="h4" color="primary" style={styles.sectionTitle}>
                  Connect with {artist.name && artist.name.trim() ? artist.name : 'Artist'}
                </Heading>
                
                {/* Follow Button */}
                <Button
                  variant={isSubscribed ? "success" : "primary"}
                  size="medium"
                  onPress={handleSubscribeToArtist}
                  icon={isSubscribed ? 
                    <HeartHandshake size={20} color={colors.text.primary} strokeWidth={2} /> :
                    <Heart size={20} color={colors.text.primary} strokeWidth={2} />
                  }
                  iconPosition="left"
                  style={styles.followButton}
                >
                  {isSubscribed ? 'Following on unknown' : 'Follow on unknown'}
                </Button>

                {/* Social Media Links */}
                {socialLinks.length > 0 && (
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
                )}
              </View>

              {/* About the Artist */}
              <View style={styles.lastSection}>
                <Heading variant="h4" color="primary" style={styles.sectionTitle}>
                  About the Artist
                </Heading>
                <View style={styles.artistDetailsContainer}>
                  {artist.avatar_url && (
                    <View style={styles.artistAvatarContainer}>
                      <Image
                        source={{ uri: artist.avatar_url }}
                        style={styles.artistAvatar}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  
                  <View style={styles.artistDetails}>
                    {artist.location && artist.location.trim() && (
                      <View style={styles.artistDetailRow}>
                        <MapPin size={16} color={colors.text.secondary} strokeWidth={2} />
                        <Text variant="body" color="secondary" style={styles.artistDetailText}>
                          {artist.location.trim()}
                        </Text>
                      </View>
                    )}
                    
                    {artist.genres && artist.genres.length > 0 && artist.genres.some(genre => genre && genre.trim()) && (
                      <View style={styles.genresContainer}>
                        {artist.genres.filter(genre => genre && genre.trim()).map((genre) => (
                          <Text key={genre} style={styles.tag}>
                            {genre.trim()}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {artist.bio && artist.bio.trim() && (
                  <Text variant="body" color="primary" style={styles.artistBio}>
                    {artist.bio.trim()}
                  </Text>
                )}
              </View>
            </>
          )}

          {/* Playback Controls */}
          {showPlaybackControls && (
            <View style={[styles.section, styles.lastSection]}>
              <View style={styles.playbackControls}>
                {onContinueListening && (
                  <Button
                    variant="primary"
                    size="medium"
                    onPress={onContinueListening}
                    icon={<Play size={20} color={colors.text.primary} strokeWidth={2} />}
                    iconPosition="left"
                  >
                    Listen to Full Track
                  </Button>
                )}

                {onDiscoverNext && (
                  <Button
                    variant="secondary"
                    size="medium"
                    onPress={onDiscoverNext}
                    icon={<SkipForward size={20} color={colors.text.primary} strokeWidth={2} />}
                    iconPosition="left"
                  >
                    Discover Next
                  </Button>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Other Platforms Modal */}
      <Modal
        visible={showOtherPlatforms}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOtherPlatforms(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Heading variant="h4" color="primary">Listen elsewhere</Heading>
              <TouchableOpacity
                onPress={() => setShowOtherPlatforms(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={colors.text.secondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalPlatformsList}>
              {getOtherStreamingLinks().map((link) => (
                <Button
                  key={link.platform}
                  variant="secondary"
                  size="medium"
                  onPress={() => {
                    handleOpenLink(link.url);
                    setShowOtherPlatforms(false);
                  }}
                  icon={<ExternalLink size={16} color={getPlatformColor(link.platform)} strokeWidth={2} />}
                  iconPosition="right"
                  style={styles.modalPlatformButton}
                >
                  <Text 
                    variant="body"
                    style={[
                      styles.modalPlatformButtonText,
                      { color: getPlatformColor(link.platform) }
                    ]}
                  >
                    {getPlatformName(link.platform) || link.platform}
                  </Text>
                </Button>
              ))}
            </View>
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
  scrollView: {
    flex: 1,
  },
  artworkContainer: {
    alignItems: 'center',
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
  },
  artworkWrapper: {
    width: 280,
    height: 280,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  trackTitle: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  artistName: {
    fontSize: 20,
    marginBottom: spacing.md,
  },
  genreMoodContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tag: {
    fontSize: 12,
    color: colors.text.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
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
  userRatingContainer: {
    // backgroundColor: 'rgba(222, 215, 224, 0.1)',
    borderRadius: borderRadius.lg,
    // padding: spacing.md,
    alignItems: 'flex-start',
    width: '100%',
  },
  userRatingTitle: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  userRatingStars: {
  },
  artisticQuoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '100%',
    marginTop: spacing.sm,
  },
  quoteSymbol: {
    fontSize: 28,
    color: colors.primary,
    lineHeight: 24,
  },
  userReviewText: {
    fontSize: 18,
    fontStyle: 'italic',
    flex: 1,
    marginHorizontal: spacing.sm,
    lineHeight: 26,
  },
  streamingLinksContainer: {
    gap: spacing.sm,
  },
  playInAppButton: {
    marginBottom: spacing.sm,
  },
  streamingButtonsRow: {
    flexDirection: 'row',
  },
  preferredStreamingButton: {
    backgroundColor: colors.surface,
  },
  preferredStreamingButtonText: {
    fontSize: 16,
  },
  otherPlatformsButton: {
    backgroundColor: colors.surface,
  },
  followButton: {
    marginBottom: spacing.sm,
  },
  socialLinksContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  socialButton: {
    backgroundColor: colors.surface,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  artistDetailsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  artistAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  artistAvatar: {
    width: '100%',
    height: '100%',
  },
  artistDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  artistDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  artistDetailText: {
    fontSize: 16,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  artistBio: {
    fontSize: 16,
    lineHeight: 24,
  },
  playbackControls: {
    gap: spacing.sm,
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
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalPlatformsList: {
    gap: spacing.sm,
  },
  modalPlatformButton: {
    backgroundColor: colors.surface,
    justifyContent: 'space-between',
  },
  modalPlatformButtonText: {
    fontSize: 16,
  },
});
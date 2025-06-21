import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Image, StyleSheet, Linking, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Instagram, 
  Twitter, 
  Facebook, 
  Youtube, 
  Globe, 
  Github,
  ExternalLink,
  Heart,
  HeartHandshake,
  MapPin,
  Music,
  Play,
  SkipForward,
  X,
  ArrowLeft
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { StarRating } from '@/components/rating/StarRating';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';

interface Artist {
  id: string;
  name: string;
  bio: string;
  location: string;
  genres: string[];
  avatar_url: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface StreamingLink {
  platform: string;
  url: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  artwork_url: string;
  genre: string;
  mood: string;
}

interface ArtistUnveilViewProps {
  track: Track;
  onContinueListening?: () => void;
  onDiscoverNext?: () => void;
  showPlaybackControls?: boolean;
  userRating?: number | null;
  userReview?: string | null;
  onPlayInApp?: () => void;
}

const PLATFORM_COLORS = {
  spotify: '#1DB954',
  apple_music: '#FA243C',
  soundcloud: '#FF5500',
  bandcamp: '#629AA0',
  youtube: '#FF0000',
};

const PLATFORM_NAMES = {
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  soundcloud: 'SoundCloud',
  bandcamp: 'Bandcamp',
  youtube: 'YouTube Music',
};

const getSocialIcon = (platform: string, size: number = 24, color: string = colors.text.primary) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <Instagram size={size} color={color} strokeWidth={2} />;
    case 'twitter':
      return <Twitter size={size} color={color} strokeWidth={2} />;
    case 'facebook':
      return <Facebook size={size} color={color} strokeWidth={2} />;
    case 'youtube':
      return <Youtube size={size} color={color} strokeWidth={2} />;
    case 'website':
      return <Globe size={size} color={color} strokeWidth={2} />;
    case 'github':
      return <Github size={size} color={color} strokeWidth={2} />;
    default:
      return <ExternalLink size={size} color={color} strokeWidth={2} />;
  }
};

export default function ArtistUnveilView({ 
  track, 
  onContinueListening, 
  onDiscoverNext, 
  showPlaybackControls = true,
  userRating,
  userReview,
  onPlayInApp
}: ArtistUnveilViewProps) {
  const { user } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [streamingLinks, setStreamingLinks] = useState<StreamingLink[]>([]);
  const [preferredPlatform, setPreferredPlatform] = useState<string>('spotify');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOtherPlatforms, setShowOtherPlatforms] = useState(false);

  useEffect(() => {
    loadArtistData();
    loadUserPreferences();
  }, [track]);

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
          setArtist(artist);

          // Get social links
          const { data: socialData, error: socialError } = await supabase
            .from('artist_social_links')
            .select('platform, url')
            .eq('artist_id', artist.id);

          if (socialError) throw socialError;
          setSocialLinks(socialData || []);

          // Check if user is subscribed
          if (user?.id) {
            const { data: subscriptionData } = await supabase
              .from('user_artist_subscriptions')
              .select('id')
              .eq('profile_id', user.id)
              .eq('artist_id', artist.id);

            // Check if subscription exists by checking if data array is not empty
            setIsSubscribed(Boolean(subscriptionData && subscriptionData.length > 0));
          }
        }
      }

      // Get streaming links
      const { data: streamingData, error: streamingError } = await supabase
        .from('track_streaming_links')
        .select('platform, url')
        .eq('track_id', track.id);

      if (streamingError) throw streamingError;
      setStreamingLinks(streamingData || []);

    } catch (error) {
      console.error('Error loading artist data:', error);
    } finally {
      setLoading(false);
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
        setPreferredPlatform(data.preferred_platform);
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

  const getPreferredStreamingLink = () => {
    return streamingLinks.find(link => link.platform === preferredPlatform) || streamingLinks[0];
  };

  const getOtherStreamingLinks = () => {
    return streamingLinks.filter(link => link.platform !== preferredPlatform);
  };

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
    <Screen backgroundColor={colors.background}>
      <SafeAreaView style={styles.safeArea}>
        {/* Floating Back Button */}
        {onContinueListening && (
          <TouchableOpacity
            onPress={onContinueListening}
            style={styles.floatingBackButton}
          >
            <ArrowLeft size={20} color={colors.text.primary} strokeWidth={2} />
          </TouchableOpacity>
        )}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              {track.title || 'Unknown Track'}
            </Heading>
            <Text variant="body" color="secondary" align="center" style={styles.artistName}>
              {track.artist || 'Unknown Artist'}
            </Text>
            <View style={styles.genreMoodContainer}>
              <Text style={styles.genreTag}>{track.genre || 'Unknown Genre'}</Text>
              <Text style={styles.moodTag}>{track.mood || 'Unknown Mood'}</Text>
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
                {userReview && (
                  <View style={styles.artisticQuoteContainer}>
                    <Text style={styles.quoteSymbol}>"</Text>
                    <Text variant="body" color="secondary" style={styles.userReviewText}>
                      {userReview}
                    </Text>
                    <Text style={styles.quoteSymbol}>"</Text>
                  </View>
                )}
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
                          { color: PLATFORM_COLORS[getPreferredStreamingLink()!.platform as keyof typeof PLATFORM_COLORS] || '#1DB954' }
                        ]}
                      >
                        {PLATFORM_NAMES[getPreferredStreamingLink()!.platform as keyof typeof PLATFORM_NAMES] || getPreferredStreamingLink()!.platform}
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
                  Connect with {artist.name || 'Artist'}
                </Heading>
                
                {/* Follow Button */}
                <Button
                  variant={isSubscribed ? "outline" : "primary"}
                  size="large"
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
                        {getSocialIcon(link.platform, 24, colors.text.primary)}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* About the Artist */}
              <View style={styles.section}>
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
                    {artist.location && (
                      <View style={styles.artistDetailRow}>
                        <MapPin size={16} color={colors.text.secondary} strokeWidth={2} />
                        <Text variant="body" color="secondary" style={styles.artistDetailText}>
                          {artist.location}
                        </Text>
                      </View>
                    )}
                    
                    {artist.genres && artist.genres.length > 0 && (
                      <View style={styles.genresContainer}>
                        {artist.genres.map((genre) => (
                          <Text key={genre} style={styles.artistGenreTag}>
                            {genre || 'Unknown'}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {artist.bio && (
                  <Text variant="body" color="primary" style={styles.artistBio}>
                    {artist.bio}
                  </Text>
                )}
              </View>
            </>
          )}

          {/* Playback Controls */}
          {showPlaybackControls && (
            <View style={styles.section}>
              <View style={styles.playbackControls}>
                {onContinueListening && (
                  <Button
                    variant="primary"
                    size="large"
                    onPress={onContinueListening}
                    icon={<Play size={20} color={colors.text.primary} strokeWidth={2} />}
                    iconPosition="left"
                    style={styles.playbackButton}
                  >
                    Listen to Full Track
                  </Button>
                )}

                {onDiscoverNext && (
                  <Button
                    variant="secondary"
                    size="large"
                    onPress={onDiscoverNext}
                    icon={<SkipForward size={20} color={colors.text.primary} strokeWidth={2} />}
                    iconPosition="left"
                    style={styles.playbackButton}
                  >
                    Discover Next
                  </Button>
                )}
              </View>
            </View>
          )}
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
                    icon={<ExternalLink size={16} color={PLATFORM_COLORS[link.platform as keyof typeof PLATFORM_COLORS] || colors.text.secondary} strokeWidth={2} />}
                    iconPosition="right"
                    style={styles.modalPlatformButton}
                  >
                    <Text 
                      variant="body"
                      style={[
                        styles.modalPlatformButtonText,
                        { color: PLATFORM_COLORS[link.platform as keyof typeof PLATFORM_COLORS] || colors.text.secondary }
                      ]}
                    >
                      {PLATFORM_NAMES[link.platform as keyof typeof PLATFORM_NAMES] || link.platform}
                    </Text>
                  </Button>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingBackButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    zIndex: 10,
    backgroundColor: 'rgba(40, 35, 42, 0.9)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  artworkContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
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
    paddingHorizontal: spacing.lg,
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
  genreTag: {
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: 'rgba(222, 215, 224, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  moodTag: {
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: 'rgba(222, 215, 224, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: spacing.md,
  },
  userRatingContainer: {
    backgroundColor: 'rgba(222, 215, 224, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'flex-start',
    width: '100%',
  },
  userRatingTitle: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  userRatingStars: {
    marginBottom: spacing.sm,
  },
  artisticQuoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '100%',
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
    gap: spacing.md,
  },
  playInAppButton: {
    marginBottom: spacing.sm,
  },
  streamingButtonsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
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
    marginBottom: spacing.md,
  },
  socialLinksContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
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
    gap: spacing.md,
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
  artistGenreTag: {
    fontSize: 12,
    color: colors.text.primary,
    backgroundColor: 'rgba(222, 215, 224, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  artistBio: {
    fontSize: 16,
    lineHeight: 24,
  },
  playbackControls: {
    gap: spacing.md,
  },
  playbackButton: {
    marginBottom: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
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
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  modalPlatformButtonText: {
    fontSize: 16,
  },
});
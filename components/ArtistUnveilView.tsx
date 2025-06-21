import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Linking, Alert, Modal } from 'react-native';
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
import { fonts } from '@/lib/fonts';

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

const getSocialIcon = (platform: string, size: number = 24, color: string = '#ded7e0') => {
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
        setArtist(artistData.artists);

        // Get social links
        const { data: socialData, error: socialError } = await supabase
          .from('artist_social_links')
          .select('platform, url')
          .eq('artist_id', artistData.artists.id);

        if (socialError) throw socialError;
        setSocialLinks(socialData || []);

        // Check if user is subscribed - Remove .single() to avoid 406 error
        if (user?.id) {
          const { data: subscriptionData } = await supabase
            .from('user_artist_subscriptions')
            .select('id')
            .eq('profile_id', user.id)
            .eq('artist_id', artistData.artists.id);

          // Check if subscription exists by checking if data array is not empty
          setIsSubscribed(subscriptionData && subscriptionData.length > 0);
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
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading artist details...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Floating Back Button - Higher position */}
        {onContinueListening && (
          <TouchableOpacity
            onPress={onContinueListening}
            style={styles.floatingBackButton}
          >
            <ArrowLeft size={20} color="#ded7e0" strokeWidth={2} />
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
                  <Music size={64} color="#8b6699" strokeWidth={1.5} />
                </View>
              )}
            </View>
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>{track.title}</Text>
            <Text style={styles.artistName}>{track.artist}</Text>
            <View style={styles.genreMoodContainer}>
              <Text style={styles.genreTag}>{track.genre}</Text>
              <Text style={styles.moodTag}>{track.mood}</Text>
            </View>
          </View>

          {/* User Rating Display - Left aligned with artistic quote styling and lighter background */}
          {userRating && (
            <View style={styles.section}>
              <View style={styles.userRatingContainer}>
                <Text style={styles.userRatingTitle}>Your Rating</Text>
                <View style={styles.userRatingStars}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Text key={i} style={{ color: i < userRating ? '#ded7e0' : '#8b6699', fontSize: 18 }}>
                      ★
                    </Text>
                  ))}
                </View>
                {userReview && (
                  <View style={styles.artisticQuoteContainer}>
                    <Text style={styles.quoteSymbol}>"</Text>
                    <Text style={styles.userReviewText}>{userReview}</Text>
                    <Text style={styles.quoteSymbol}>"</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Streaming Links */}
          {streamingLinks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Listen Now</Text>
              <View style={styles.streamingLinksContainer}>
                {/* Play in App Button - Priority button */}
                {onPlayInApp && (
                  <TouchableOpacity
                    style={styles.playInAppButton}
                    onPress={onPlayInApp}
                  >
                    <Play size={20} color="#ded7e0" strokeWidth={2} />
                    <Text style={styles.playInAppButtonText}>Play in unknown</Text>
                  </TouchableOpacity>
                )}

                {/* Preferred Platform and Listen Elsewhere in one row on wider screens */}
                <View style={styles.streamingButtonsRow}>
                  {/* Preferred Platform First */}
                  {getPreferredStreamingLink() && (
                    <TouchableOpacity
                      style={[styles.preferredStreamingButton, { flex: 1, marginRight: getOtherStreamingLinks().length > 0 ? 4 : 0 }]}
                      onPress={() => handleOpenLink(getPreferredStreamingLink()!.url)}
                    >
                      <Text style={[
                        styles.preferredStreamingButtonText,
                        { color: PLATFORM_COLORS[getPreferredStreamingLink()!.platform as keyof typeof PLATFORM_COLORS] || '#1DB954' }
                      ]}>
                        {PLATFORM_NAMES[getPreferredStreamingLink()!.platform as keyof typeof PLATFORM_NAMES] || getPreferredStreamingLink()!.platform}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Listen Elsewhere Button */}
                  {getOtherStreamingLinks().length > 0 && (
                    <TouchableOpacity
                      style={[styles.otherPlatformsButton, { flex: 1, marginLeft: getPreferredStreamingLink() ? 4 : 0 }]}
                      onPress={() => setShowOtherPlatforms(true)}
                    >
                      <Text style={styles.otherPlatformsButtonText}>Elsewhere</Text>
                      <ExternalLink size={16} color="#8b6699" strokeWidth={2} />
                    </TouchableOpacity>
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
                <Text style={styles.sectionTitle}>Connect with {artist.name}</Text>
                
                {/* Follow Button */}
                <TouchableOpacity
                  style={[styles.followButton, isSubscribed && styles.followingButton]}
                  onPress={handleSubscribeToArtist}
                >
                  {isSubscribed ? (
                    <HeartHandshake size={20} color="#ded7e0" strokeWidth={2} />
                  ) : (
                    <Heart size={20} color="#ded7e0" strokeWidth={2} />
                  )}
                  <Text style={styles.followButtonText}>
                    {isSubscribed ? 'Following on unknown' : 'Follow on unknown'}
                  </Text>
                </TouchableOpacity>

                {/* Social Media Links - Rectangular buttons that fill width with consistent gap */}
                {socialLinks.length > 0 && (
                  <View style={styles.socialLinksContainer}>
                    {socialLinks.map((link) => (
                      <TouchableOpacity
                        key={link.platform}
                        style={[styles.socialButton, { flex: 1 }]}
                        onPress={() => handleOpenLink(link.url)}
                      >
                        {getSocialIcon(link.platform, 24, '#ded7e0')}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* About the Artist */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About the Artist</Text>
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
                        <MapPin size={16} color="#8b6699" strokeWidth={2} />
                        <Text style={styles.artistDetailText}>{artist.location}</Text>
                      </View>
                    )}
                    
                    {artist.genres && artist.genres.length > 0 && (
                      <View style={styles.genresContainer}>
                        {artist.genres.map((genre) => (
                          <Text key={genre} style={styles.artistGenreTag}>{genre}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {artist.bio && (
                  <Text style={styles.artistBio}>{artist.bio}</Text>
                )}
              </View>
            </>
          )}

          {/* Playback Controls */}
          {showPlaybackControls && (
            <View style={styles.section}>
              <View style={styles.playbackControls}>
                {onContinueListening && (
                  <TouchableOpacity
                    style={styles.playbackButton}
                    onPress={onContinueListening}
                  >
                    <Play size={20} color="#ded7e0" strokeWidth={2} />
                    <Text style={styles.playbackButtonText}>Listen to Full Track</Text>
                  </TouchableOpacity>
                )}

                {onDiscoverNext && (
                  <TouchableOpacity
                    style={[styles.playbackButton, styles.secondaryPlaybackButton]}
                    onPress={onDiscoverNext}
                  >
                    <SkipForward size={20} color="#ded7e0" strokeWidth={2} />
                    <Text style={styles.playbackButtonText}>Discover Next</Text>
                  </TouchableOpacity>
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
                <Text style={styles.modalTitle}>Listen elsewhere</Text>
                <TouchableOpacity
                  onPress={() => setShowOtherPlatforms(false)}
                  style={styles.modalCloseButton}
                >
                  <X size={24} color="#8b6699" strokeWidth={2} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalPlatformsList}>
                {getOtherStreamingLinks().map((link) => (
                  <TouchableOpacity
                    key={link.platform}
                    style={styles.modalPlatformButton}
                    onPress={() => {
                      handleOpenLink(link.url);
                      setShowOtherPlatforms(false);
                    }}
                  >
                    <Text style={[
                      styles.modalPlatformButtonText,
                      { color: PLATFORM_COLORS[link.platform as keyof typeof PLATFORM_COLORS] || '#8b6699' }
                    ]}>
                      {PLATFORM_NAMES[link.platform as keyof typeof PLATFORM_NAMES] || link.platform}
                    </Text>
                    <ExternalLink size={16} color={PLATFORM_COLORS[link.platform as keyof typeof PLATFORM_COLORS] || '#8b6699'} strokeWidth={2} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#19161a',
  },
  safeArea: {
    flex: 1,
  },
  floatingBackButton: {
    position: 'absolute',
    top: 24,
    left: 24,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ded7e0',
    fontFamily: fonts.chillax.regular,
    fontSize: 16,
  },
  artworkContainer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
  },
  artworkWrapper: {
    width: 280,
    height: 280,
    borderRadius: 24,
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
    backgroundColor: '#28232a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  trackTitle: {
    fontSize: 28,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 20,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
    textAlign: 'center',
    marginBottom: 16,
  },
  genreMoodContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genreTag: {
    fontSize: 14,
    fontFamily: fonts.chillax.medium,
    color: '#ded7e0',
    backgroundColor: 'rgba(222, 215, 224, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moodTag: {
    fontSize: 14,
    fontFamily: fonts.chillax.medium,
    color: '#ded7e0',
    backgroundColor: 'rgba(222, 215, 224, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
    marginBottom: 16,
  },
  userRatingContainer: {
    backgroundColor: 'rgba(222, 215, 224, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    width: '100%',
  },
  userRatingTitle: {
    fontSize: 16,
    fontFamily: fonts.chillax.medium,
    color: '#ded7e0',
    marginBottom: 8,
  },
  userRatingStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  artisticQuoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '100%',
  },
  quoteSymbol: {
    fontSize: 28,
    fontFamily: fonts.chillax.bold,
    color: '#452451',
    lineHeight: 24,
  },
  userReviewText: {
    fontSize: 18,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
    fontStyle: 'italic',
    flex: 1,
    marginHorizontal: 8,
    lineHeight: 26,
  },
  streamingLinksContainer: {
    gap: 16,
  },
  playInAppButton: {
    backgroundColor: '#452451',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  playInAppButtonText: {
    fontSize: 16,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
  },
  streamingButtonsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  preferredStreamingButton: {
    backgroundColor: '#28232a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  preferredStreamingButtonText: {
    fontSize: 16,
    fontFamily: fonts.chillax.medium,
  },
  otherPlatformsButton: {
    backgroundColor: '#28232a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  otherPlatformsButtonText: {
    fontSize: 16,
    fontFamily: fonts.chillax.medium,
    color: '#8b6699',
  },
  followButton: {
    backgroundColor: '#452451',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    marginBottom: 16,
  },
  followingButton: {
    backgroundColor: '#24512b',
  },
  followButtonText: {
    fontSize: 16,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
  },
  socialLinksContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  socialButton: {
    backgroundColor: '#28232a',
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistDetailsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
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
    gap: 8,
    marginBottom: 8,
  },
  artistDetailText: {
    fontSize: 16,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  artistGenreTag: {
    fontSize: 12,
    fontFamily: fonts.chillax.medium,
    color: '#ded7e0',
    backgroundColor: 'rgba(222, 215, 224, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  artistBio: {
    fontSize: 16,
    fontFamily: fonts.chillax.regular,
    color: '#ded7e0',
    lineHeight: 24,
  },
  playbackControls: {
    gap: 16,
  },
  playbackButton: {
    backgroundColor: '#452451',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  secondaryPlaybackButton: {
    backgroundColor: '#28232a',
  },
  playbackButtonText: {
    fontSize: 16,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#28232a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalPlatformsList: {
    gap: 12,
  },
  modalPlatformButton: {
    backgroundColor: '#19161a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalPlatformButtonText: {
    fontSize: 16,
    fontFamily: fonts.chillax.medium,
  },
});
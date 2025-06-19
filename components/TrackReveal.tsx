import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { fonts } from '@/lib/fonts';

interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  artwork_url?: string;
}

interface TrackRevealProps {
  track: Track;
  rating: number;
  onContinueListening: () => void;
  onDiscoverNext: () => void;
}

export default function TrackReveal({ 
  track, 
  rating, 
  onContinueListening, 
  onDiscoverNext 
}: TrackRevealProps) {
  const handleContinueListening = () => {
    Alert.alert(
      'Continue Listening',
      'Would you like to listen to the full track? You won\'t be able to skip until it ends.',
      [
        { text: 'No, discover next', style: 'cancel', onPress: onDiscoverNext },
        { text: 'Yes, continue', onPress: onContinueListening },
      ]
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Text key={i} style={{ color: i < rating ? '#452451' : '#8b6699', fontSize: 16 }}>
        ★
      </Text>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Artwork */}
      <View style={styles.artworkContainer}>
        {track.artwork_url ? (
          <Image
            source={{ uri: track.artwork_url }}
            style={styles.artwork}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderArtwork}>
            <Text style={styles.placeholderIcon}>🎵</Text>
          </View>
        )}
      </View>

      {/* Track Info */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>{track.title}</Text>
        <Text style={styles.trackArtist}>{track.artist}</Text>
        
        <View style={styles.genreContainer}>
          <Text style={styles.genreTag}>{track.genre}</Text>
          <Text style={styles.moodTag}>{track.mood}</Text>
        </View>

        {/* Rating Display */}
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Your rating:</Text>
          <View style={styles.starsContainer}>
            {renderStars(rating)}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {rating >= 4 && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinueListening}
          >
            <Text style={styles.continueButtonText}>
              Listen to Full Track
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.discoverButton}
          onPress={onDiscoverNext}
        >
          <Text style={styles.discoverButtonText}>
            Discover Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  artworkContainer: {
    width: 256,
    height: 256,
    borderRadius: 24,
    marginBottom: 32,
    overflow: 'hidden',
    backgroundColor: '#28232a',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  placeholderArtwork: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#28232a',
  },
  placeholderIcon: {
    fontSize: 48,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  trackTitle: {
    fontSize: 24,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
    textAlign: 'center',
    marginBottom: 8,
  },
  trackArtist: {
    fontSize: 18,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
    textAlign: 'center',
    marginBottom: 16,
  },
  genreContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  genreTag: {
    fontSize: 14,
    fontFamily: fonts.chillax.medium,
    color: '#452451',
    backgroundColor: 'rgba(69, 36, 81, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moodTag: {
    fontSize: 14,
    fontFamily: fonts.chillax.medium,
    color: '#8b6699',
    backgroundColor: 'rgba(139, 102, 153, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 16,
    fontFamily: fonts.chillax.medium,
    color: '#ded7e0',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  continueButton: {
    backgroundColor: '#452451',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
  },
  discoverButton: {
    backgroundColor: '#28232a',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  discoverButtonText: {
    fontSize: 18,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
  },
});
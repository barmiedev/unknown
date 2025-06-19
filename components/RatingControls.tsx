import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { Star } from 'lucide-react-native';
import { fonts } from '@/lib/fonts';

interface RatingControlsProps {
  onRating: (rating: number, review?: string) => void;
  onSkip: () => void;
  trackTitle?: string;
  trackArtist?: string;
}

export default function RatingControls({ 
  onRating, 
  onSkip, 
  trackTitle, 
  trackArtist 
}: RatingControlsProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showReview, setShowReview] = useState(false);

  const handleStarPress = (stars: number) => {
    setRating(stars);
    if (stars >= 4) {
      setShowReview(true);
    } else {
      // For ratings below 4, submit immediately
      onRating(stars);
    }
  };

  const handleSubmitRating = () => {
    if (rating === 0) {
      Alert.alert('Please select a rating', 'Tap the stars to rate this track');
      return;
    }
    onRating(rating, review.trim() || undefined);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Track',
      'Are you sure you want to skip this track?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: onSkip },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Track Info */}
      {trackTitle && trackArtist && (
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle}>{trackTitle}</Text>
          <Text style={styles.trackArtist}>{trackArtist}</Text>
        </View>
      )}

      {/* Rating Question */}
      <Text style={styles.question}>
        How does this track make you feel?
      </Text>

      {/* Rating Stars */}
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            style={styles.starButton}
          >
            <Star
              size={40}
              color={star <= rating ? '#452451' : '#8b6699'}
              fill={star <= rating ? '#452451' : 'transparent'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Review Text Area */}
      {showReview && (
        <View style={styles.reviewContainer}>
          <Text style={styles.reviewLabel}>
            Share your thoughts (optional)
          </Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="What did you love about this track?"
            placeholderTextColor="#8b6699"
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {review.length}/500
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {rating >= 4 && showReview ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitRating}
          >
            <Text style={styles.submitButtonText}>
              Submit Rating
            </Text>
          </TouchableOpacity>
        ) : rating > 0 && rating < 4 ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitRating}
          >
            <Text style={styles.submitButtonText}>
              Submit Rating
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>Skip Track</Text>
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
  trackInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  trackTitle: {
    fontSize: 20,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
    textAlign: 'center',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
    textAlign: 'center',
  },
  question: {
    fontSize: 18,
    fontFamily: fonts.chillax.medium,
    color: '#ded7e0',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  starButton: {
    padding: 8,
  },
  reviewContainer: {
    width: '100%',
    marginBottom: 32,
  },
  reviewLabel: {
    fontSize: 16,
    fontFamily: fonts.chillax.medium,
    color: '#ded7e0',
    marginBottom: 12,
  },
  reviewInput: {
    backgroundColor: '#28232a',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: fonts.chillax.regular,
    color: '#ded7e0',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
    textAlign: 'right',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  submitButton: {
    backgroundColor: '#452451',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: fonts.chillax.medium,
    color: '#8b6699',
  },
});
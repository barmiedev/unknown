import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { TextInput } from '@/components/inputs/TextInput';
import { Button } from '@/components/buttons/Button';
import { StarRating } from '@/components/rating/StarRating';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';

interface RatingInterfaceProps {
  onRatingSubmit: (rating: number, review?: string) => void;
}

export function RatingInterface({ onRatingSubmit }: RatingInterfaceProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showReviewInput, setShowReviewInput] = useState(false);

  // Animation values
  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.8);
  const reviewInputAnimation = useSharedValue(0);
  const reviewInputHeight = useSharedValue(0);

  React.useEffect(() => {
    // Animate container appearance
    containerOpacity.value = withTiming(1, { duration: 250 });
    containerScale.value = withTiming(1, { duration: 250 });
  }, []);

  React.useEffect(() => {
    if (showReviewInput) {
      reviewInputAnimation.value = withTiming(1, { duration: 250 });
      reviewInputHeight.value = withTiming(1, { duration: 250 });
    }
  }, [showReviewInput]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const reviewInputStyle = useAnimatedStyle(() => ({
    opacity: reviewInputAnimation.value,
    transform: [
      {
        translateY: interpolate(
          reviewInputAnimation.value,
          [0, 1],
          [30, 0],
          Extrapolate.CLAMP
        )
      }
    ],
  }));

  const reviewInputContainerStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(
      reviewInputHeight.value,
      [0, 1],
      [0, 200],
      Extrapolate.CLAMP
    ),
  }));

  const handleStarPress = (stars: number) => {
    setRating(stars);
    if (stars >= 4) {
      setShowReviewInput(true);
    } else {
      onRatingSubmit(stars);
    }
  };

  const handleSubmitWithReview = () => {
    onRatingSubmit(rating, review.trim() || undefined);
  };

  return (
    <Animated.View style={[containerStyle, styles.container]}>
      <Heading variant="h4" color="primary" align="center" style={styles.title}>
        How does this track make you feel?
      </Heading>

      {/* Star Rating */}
      <View style={styles.ratingContainer}>
        <StarRating
          rating={rating}
          onRatingChange={handleStarPress}
          size="large"
          style={styles.starRating}
        />
      </View>

      {/* Review Input for High Ratings */}
      {showReviewInput && (
        <Animated.View style={[reviewInputContainerStyle, styles.reviewInputContainer]}>
          <Animated.View style={[reviewInputStyle, styles.reviewInput]}>
            <Text variant="body" color="primary" style={styles.reviewLabel}>
              Share your thoughts (optional)
            </Text>
            <TextInput
              placeholder="What did you love about this track?"
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={3}
              style={styles.textInput}
            />
            
            <Button
              variant="primary"
              size="large"
              onPress={handleSubmitWithReview}
              style={styles.submitButton}
            >
              Submit Rating
            </Button>
          </Animated.View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 18,
    marginBottom: spacing.xl,
  },
  ratingContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  starRating: {
    justifyContent: 'space-between',
  },
  reviewInputContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  reviewInput: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  reviewLabel: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  textInput: {
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
});
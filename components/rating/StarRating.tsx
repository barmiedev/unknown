import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';
import { Text } from '@/components/typography/Text';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
  style?: any;
}

const sizeStyles = {
  small: { fontSize: 14 },
  medium: { fontSize: 18 },
  large: { fontSize: 24 },
};

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'medium',
  showValue = false,
  style,
}: StarRatingProps) {
  const handleStarPress = (starIndex: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.stars}>
        {Array.from({ length: 5 }, (_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleStarPress(index)}
            disabled={readonly}
            activeOpacity={readonly ? 1 : 0.7}
            style={styles.starButton}
          >
            <Text 
              style={[
                sizeStyles[size],
                { color: index < rating ? colors.text.primary : colors.text.secondary }
              ]}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {showValue && (
        <Text variant="caption" color="secondary" style={styles.value}>
          {rating}/5
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  starButton: {
    padding: spacing.xs,
  },
  value: {
    marginLeft: spacing.sm,
  },
});
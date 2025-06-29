import React, { useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, ImageProps, ViewStyle } from 'react-native';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';

interface OptimizedImageProps extends Omit<ImageProps, 'style'> {
  source: { uri: string } | number;
  style?: ViewStyle;
  loadingIndicatorColor?: string;
  loadingIndicatorSize?: 'small' | 'large';
  placeholderBackgroundColor?: string;
  fallbackComponent?: React.ReactNode;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  source,
  style,
  loadingIndicatorColor = colors.text.secondary,
  loadingIndicatorSize = 'small',
  placeholderBackgroundColor = colors.surface,
  fallbackComponent,
  onLoadStart,
  onLoadEnd,
  onError,
  ...imageProps
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    onLoadEnd?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // If it's a local image (number), don't show loading state
  if (typeof source === 'number') {
    return (
      <Image
        source={source}
        style={[styles.image, style]}
        {...imageProps}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Only hide image when there's an error, not when loading */}
      <Image
        source={source}
        style={[styles.image, { opacity: hasError ? 0 : 1 }]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        {...imageProps}
      />
      
      {/* Loading state - only show when loading and no error */}
      {isLoading && !hasError && (
        <View style={[styles.placeholder, { backgroundColor: placeholderBackgroundColor }]}>
          <ActivityIndicator 
            size={loadingIndicatorSize} 
            color={loadingIndicatorColor} 
          />
        </View>
      )}
      
      {/* Error state - only show when there's an error */}
      {hasError && (
        <View style={[styles.placeholder, { backgroundColor: placeholderBackgroundColor }]}>
          {fallbackComponent || (
            <View style={styles.errorContainer}>
              <View style={styles.errorIcon}>
                <View style={styles.errorIconInner} />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text.secondary,
    opacity: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
});
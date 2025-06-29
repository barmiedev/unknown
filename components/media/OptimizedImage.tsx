import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, ImageProps, ViewStyle, ImageStyle } from 'react-native';
import { colors } from '@/utils/colors';

// Global cache to track loaded images
const imageCache = new Set<string>();

interface OptimizedImageProps extends Omit<ImageProps, 'style'> {
  source: { uri: string } | number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
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
  imageStyle,
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
  const [isCached, setIsCached] = useState(false);
  const mountedRef = useRef(true);

  // Check if image is already cached when component mounts
  useEffect(() => {
    mountedRef.current = true;
    
    if (typeof source === 'object' && source.uri) {
      const imageUri = source.uri;
      
      // Check if image is already in our cache
      if (imageCache.has(imageUri)) {
        setIsCached(true);
        setIsLoading(false);
        return;
      }
      
      // Try to prefetch the image to check if it's cached by React Native
      Image.prefetch(imageUri)
        .then(() => {
          if (mountedRef.current) {
            imageCache.add(imageUri);
            setIsCached(true);
            setIsLoading(false);
          }
        })
        .catch(() => {
          // If prefetch fails, proceed with normal loading
          if (mountedRef.current) {
            setIsCached(false);
            setIsLoading(true);
          }
        });
    } else {
      // For local images, no loading needed
      setIsLoading(false);
      setIsCached(true);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [source]);

  const handleLoadStart = () => {
    if (mountedRef.current && !isCached) {
      setIsLoading(true);
    }
    setHasError(false);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    if (mountedRef.current) {
      // Add to cache when successfully loaded
      if (typeof source === 'object' && source.uri) {
        imageCache.add(source.uri);
      }
      
      setIsLoading(false);
      setIsCached(true);
    }
    
    onLoadEnd?.();
  };

  const handleError = () => {
    if (mountedRef.current) {
      setIsLoading(false);
      setHasError(true);
      setIsCached(false);
    }
    onError?.();
  };

  // If it's a local image (number), don't show loading state
  if (typeof source === 'number') {
    return (
      <Image
        source={source}
        style={[styles.image, imageStyle]}
        {...imageProps}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Only hide image when there's an error, not when loading */}
      <Image
        source={source}
        style={[styles.image, { opacity: hasError ? 0 : 1 }, imageStyle]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        {...imageProps}
      />
      
      {/* Loading state - only show when loading and no error and not cached */}
      {isLoading && !hasError && !isCached && (
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
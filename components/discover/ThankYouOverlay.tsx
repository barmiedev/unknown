import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';

interface ThankYouOverlayProps {
  visible: boolean;
}

export function ThankYouOverlay({ visible }: ThankYouOverlayProps) {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 300 });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, animatedStyle]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🙏</Text>
        <Heading variant="h1" color="primary" align="center" style={styles.title}>
          Thank you for your feedback!
        </Heading>
        <Text variant="body" color="secondary" align="center" style={styles.description}>
          Your taste helps us discover better music for everyone
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(25, 22, 26, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: spacing.lg,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 280,
  },
});
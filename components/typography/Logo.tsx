import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Heading } from './Heading';
import { Text } from './Text';
import { colors } from '@/utils/colors';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
}

const sizeStyles = {
  small: { fontSize: 24 },
  medium: { fontSize: 32 },
  large: { fontSize: 40 },
};

export function Logo({ size = 'medium', showTagline = true }: LogoProps) {
  return (
    <View style={styles.container}>
      <Heading 
        variant="h1" 
        color="primary" 
        align="center"
        style={[sizeStyles[size], styles.logo]}
      >
        unknown
      </Heading>
      {showTagline && (
        <Text 
          variant="body" 
          color="secondary" 
          align="center"
          style={styles.tagline}
        >
          Discover underground music
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: 12,
  },
  tagline: {
    fontSize: 18,
  },
});
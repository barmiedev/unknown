import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '@/utils/colors';
import { fonts } from '@/lib/fonts';

interface HeadingProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4';
  color?: 'primary' | 'secondary' | 'accent';
  align?: 'left' | 'center' | 'right';
  style?: any;
}

const headingStyles = {
  h1: { fontSize: 32, fontFamily: fonts.chillax.bold },
  h2: { fontSize: 28, fontFamily: fonts.chillax.bold },
  h3: { fontSize: 24, fontFamily: fonts.chillax.bold },
  h4: { fontSize: 20, fontFamily: fonts.chillax.bold },
};

const colorStyles = {
  primary: { color: colors.text.primary },
  secondary: { color: colors.text.secondary },
  accent: { color: colors.primary },
};

export function Heading({ 
  children, 
  variant = 'h2', 
  color = 'primary', 
  align = 'left',
  style 
}: HeadingProps) {
  return (
    <Text style={[
      headingStyles[variant],
      colorStyles[color],
      { textAlign: align },
      style
    ]}>
      {children}
    </Text>
  );
}
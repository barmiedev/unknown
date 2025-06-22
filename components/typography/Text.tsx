import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { colors } from '@/utils/colors';
import { fonts } from '@/lib/fonts';
import { FontWeight } from '@/lib/fonts';

interface TextProps {
  children: React.ReactNode;
  variant?: 'body' | 'caption' | 'button' | 'link';
  color?: 'primary' | 'secondary' | 'accent' | 'statusError' | 'reward';
  weight?: FontWeight;
  align?: 'left' | 'center' | 'right';
  style?: any;
}

const textStyles = {
  body: { fontSize: 16, fontFamily: fonts.chillax.regular },
  caption: { fontSize: 14, fontFamily: fonts.chillax.medium },
  button: { fontSize: 18, fontFamily: fonts.chillax.bold },
  link: { fontSize: 16, fontFamily: fonts.chillax.medium },
};

const colorStyles = {
  primary: { color: colors.text.primary },
  secondary: { color: colors.text.secondary },
  accent: { color: colors.primary },
  statusError: { color: colors.status.error },
  reward: { color: colors.rewards.accent },
};

export function Text({ 
  children, 
  variant = 'body', 
  color = 'primary', 
  weight,
  align = 'left',
  style 
}: TextProps) {
  const fontFamily = weight ? fonts.chillax[weight] : textStyles[variant].fontFamily;
  
  return (
    <RNText style={[
      textStyles[variant],
      { fontFamily },
      colorStyles[color],
      { textAlign: align },
      style
    ]}>
      {children}
    </RNText>
  );
}
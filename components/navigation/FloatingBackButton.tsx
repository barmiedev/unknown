import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';

interface FloatingBackButtonProps {
  onPress: () => void;
  style?: any;
  size?: number;
  iconSize?: number;
  iconColor?: string;
}

export function FloatingBackButton({ 
  onPress, 
  style, 
  size = 40, 
  iconSize = 20, 
  iconColor = colors.text.primary 
}: FloatingBackButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.floatingBackButton,
        { width: size, height: size, borderRadius: size / 2 },
        style
      ]}
      activeOpacity={0.8}
    >
      <ArrowLeft size={iconSize} color={iconColor} strokeWidth={2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingBackButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    zIndex: 10,
    backgroundColor: 'rgba(40, 35, 42, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
}); 
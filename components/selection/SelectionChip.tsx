import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { Text } from '@/components/typography/Text';

interface SelectionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  style?: any;
}

export function SelectionChip({
  label,
  selected,
  onPress,
  icon,
  style,
}: SelectionChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && styles.chipSelected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text 
        variant="body" 
        color={selected ? 'primary' : 'secondary'}
        style={styles.label}
      >
        {label}
      </Text>
      {selected && (
        <Check size={16} color={colors.text.primary} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 16,
  },
  icon: {
    marginRight: spacing.xs,
  },
});
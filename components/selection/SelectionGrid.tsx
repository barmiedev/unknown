import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SelectionGridProps<T> {
  items: T[];
  selectedItems: T[];
  onToggleItem: (item: T) => void;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  columns?: number;
  gap?: number;
  style?: any;
}

export function SelectionGrid<T>({
  items,
  selectedItems,
  onToggleItem,
  renderItem,
  columns = 2,
  gap = 12,
  style,
}: SelectionGridProps<T>) {
  return (
    <View style={[styles.grid, { gap }, style]}>
      {items.map((item, index) => {
        const isSelected = selectedItems.includes(item);
        return (
          <View key={index} style={styles.item}>
            {renderItem(item, isSelected)}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    flex: 1,
    minWidth: '48%',
  },
});
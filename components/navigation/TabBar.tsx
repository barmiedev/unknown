import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { Text } from '@/components/typography';
import { TabItem } from '@/types';

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabKey: string) => void;
  style?: any;
}

export function TabBar({ activeTab, onTabPress, tabs, style }: TabBarProps) {
  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && styles.activeTab,
          ]}
          onPress={() => onTabPress(tab.key)}
          activeOpacity={0.8}
        >
          <View style={styles.tabContent}>
            {tab.icon}
            <Text 
              variant="caption" 
              color={activeTab === tab.key ? 'primary' : 'secondary'}
              style={styles.tabLabel}
            >
              {tab.label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabContent: {
    alignItems: 'center',
  },
  tabLabel: {
    marginTop: spacing.xs,
  },
});
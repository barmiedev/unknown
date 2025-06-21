import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue, interpolate } from 'react-native-reanimated';
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
  const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
  const translateX = useSharedValue(activeIndex * (100 / tabs.length));

  React.useEffect(() => {
    const newIndex = tabs.findIndex(tab => tab.key === activeTab);
    translateX.value = withTiming(newIndex * (100 / tabs.length), { duration: 200 });
  }, [activeTab, tabs.length]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          translateX.value,
          [0, 100],
          [0, 100],
          'clamp'
        )
      }
    ],
    width: `${100 / tabs.length}%`,
  }));

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tab}
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
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    zIndex: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    zIndex: 1,
  },
  tabContent: {
    alignItems: 'center',
  },
  tabLabel: {
    marginTop: spacing.xs,
  },
});
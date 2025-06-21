import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
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
  const containerRef = React.useRef<View>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
  const translateX = useSharedValue(0);

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  React.useEffect(() => {
    if (containerWidth > 0) {
      const availableWidth = containerWidth - (spacing.xs * 2); // Subtract left and right padding
      const tabWidth = availableWidth / tabs.length;
      const newIndex = tabs.findIndex(tab => tab.key === activeTab);
      translateX.value = withTiming(spacing.xs + (newIndex * tabWidth) - 1, { duration: 200 }); // Small offset for visual alignment
    }
  }, [activeTab, containerWidth, tabs.length]);

  const indicatorStyle = useAnimatedStyle(() => {
    if (containerWidth === 0) return {};
    
    const availableWidth = containerWidth - (spacing.xs * 2); // Subtract left and right padding
    const tabWidth = availableWidth / tabs.length;
    
    return {
      transform: [
        {
          translateX: translateX.value
        }
      ],
      width: tabWidth + 1, // Slightly wider to account for visual alignment
    };
  });

  return (
    <View 
      ref={containerRef}
      style={[styles.container, style]}
      onLayout={handleLayout}
    >
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
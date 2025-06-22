import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/utils/colors';

interface ScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  paddingHorizontal?: number;
  scrollable?: boolean;
  showsVerticalScrollIndicator?: boolean;
  style?: any;
  withoutBottomSafeArea?: boolean;
  contentContainerStyle?: any;
}

export function Screen({
  children,
  backgroundColor = colors.background,
  paddingHorizontal = 24,
  scrollable = false,
  showsVerticalScrollIndicator = false,
  style,
  withoutBottomSafeArea = false,
  contentContainerStyle,
}: ScreenProps) {
  const Container = scrollable ? ScrollView : View;
  
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <SafeAreaView 
        style={styles.safeArea}
        edges={withoutBottomSafeArea ? ['top', 'left', 'right'] : ['top', 'right', 'bottom', 'left']}
      >
        <Container 
          style={[styles.content, { paddingHorizontal }]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          contentContainerStyle={[scrollable ? styles.scrollContent : undefined, contentContainerStyle]}
        >
          {children}
        </Container>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
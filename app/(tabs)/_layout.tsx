import React from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, History, Trophy, User, Gem, Radar, Route } from 'lucide-react-native';
import { TouchableOpacity, Image, StyleSheet, Linking } from 'react-native';
import { colors } from '@/utils/colors';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';

const BoltBadge = () => {
  const handlePress = async () => {
    try {
      await Linking.openURL('https://bolt.new/');
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.boltBadge} activeOpacity={0.8}>
      <Image 
        source={require('../../assets/images/black_circle_360x360.png')} 
        style={styles.boltBadgeImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
            borderBottomColor: '#28232a',
            borderBottomWidth: 1,
          },
          headerTitleStyle: {
            color: colors.text.primary,
            fontFamily: 'Chillax-Bold',
            fontSize: 18,
          },
          headerRight: () => <BoltBadge />,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: '#28232a',
            borderTopWidth: 1,
            height: 100,
            paddingTop: 10,
            paddingBottom: 20,
          },
          tabBarActiveTintColor: colors.text.primary,
          tabBarInactiveTintColor: colors.text.secondary,
          tabBarIconStyle: {
            marginBottom: 4,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: 'Chillax-Regular',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Discover',
            tabBarIcon: ({ size, color }) => (
              <Radar size={size} color={color} strokeWidth={1.5} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'My finds',
            tabBarIcon: ({ size, color }) => (
              <Gem size={size} color={color} strokeWidth={1.5} />
            ),
          }}
        />
        <Tabs.Screen
          name="journey"
          options={{
            title: 'Journey',
            tabBarIcon: ({ size, color }) => (
              <Route size={size} color={color} strokeWidth={1.5} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ size, color }) => (
              <User size={size} color={color} strokeWidth={1.5} />
            ),
          }}
        />
      </Tabs>
      
      {/* Global Audio Player - positioned above tab bar */}
      <GlobalAudioPlayer />
    </>
  );
}

const styles = StyleSheet.create({
  boltBadge: {
    marginRight: 16,
    padding: 4,
  },
  boltBadgeImage: {
    width: 32,
    height: 32,
  },
});
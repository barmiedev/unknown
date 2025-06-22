import React from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, History, Trophy, User, Gem, Radar, Route } from 'lucide-react-native';
import { colors } from '@/utils/colors';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
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
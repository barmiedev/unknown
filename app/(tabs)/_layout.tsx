import { Tabs } from 'expo-router';
import { Home, History, Settings, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#19161a',
          borderTopColor: '#28232a',
          borderTopWidth: 1,
          height: 100,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#8b6699',
        tabBarInactiveTintColor: '#ded7e0',
        tabBarIconStyle: {
          marginBottom: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Chillax-Regular',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ size, color }) => (
            <History size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="preferences"
        options={{
          title: 'Preferences',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} strokeWidth={1.5} />
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
  );
}
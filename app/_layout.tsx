import { useEffect, useRef } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AudioProvider } from '@/contexts/AudioContext';
import { router } from 'expo-router';
import { queryClient } from '@/lib/queryClient';
import '../global.css';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading, refreshUser } = useAuth();
  const hasRedirected = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!user || loading) {
      refreshUser();
    }
  }, []);

  useEffect(() => {
    if (!loading && !hasRedirected.current) {
      if (!user) {
        // User is not authenticated, show welcome screen
        if (pathname !== '/welcome') {
          router.replace('/welcome');
        }
        hasRedirected.current = true;
      } else if (!user.profile?.onboarding_complete) {
        // User is authenticated but hasn't completed onboarding
        // Check if they just registered (no profile data) or returning user
        if (!user.profile?.username) {
          // New user, start onboarding
          if (pathname !== '/onboarding/genres') {
            router.replace('/onboarding/genres');
          }
          hasRedirected.current = true;
        } else {
          // Returning user with incomplete onboarding, ask if they want to complete it
          if (pathname !== '/onboarding-decision') {
            router.replace('/onboarding-decision');
          }
          hasRedirected.current = true;
        }
      } else {
        // User is authenticated and onboarding is complete
        if (pathname !== '/(tabs)' && !pathname.startsWith('/(tabs)/')) {
          router.replace('/(tabs)');
        }
        hasRedirected.current = true;
      }
    }
  }, [user, loading, pathname]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#19161a' },
        gestureEnabled: false,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="onboarding-decision" />
      <Stack.Screen name="onboarding/genres" />
      <Stack.Screen name="onboarding/moods" />
      <Stack.Screen name="onboarding/profile" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Chillax-Regular': require('../assets/fonts/Chillax-Regular.otf'),
    'Chillax-Light': require('../assets/fonts/Chillax-Light.otf'),
    'Chillax-Extralight': require('../assets/fonts/Chillax-Extralight.otf'),
    'Chillax-Medium': require('../assets/fonts/Chillax-Medium.otf'),
    'Chillax-Semibold': require('../assets/fonts/Chillax-Semibold.otf'),
    'Chillax-Bold': require('../assets/fonts/Chillax-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (fontError) {
        console.error('Font loading error:', fontError);
      }
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AudioProvider>
          <RootLayoutNav />
          <StatusBar style="light" backgroundColor="#19161a" />
        </AudioProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

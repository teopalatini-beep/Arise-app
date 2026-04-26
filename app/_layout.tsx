import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppProvider } from '../src/context/AppContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ONBOARDING_KEY } from './onboarding';

function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const handled = useRef(false);

  useEffect(() => {
    if (loading || handled.current) return;

    const inLogin = segments[0] === 'login';
    const inOnboarding = segments[0] === 'onboarding';
    const inWelcome = segments[0] === 'welcome';

    if (!isAuthenticated && !inLogin) {
      handled.current = true;
      router.replace('/login');
      return;
    }

    if (isAuthenticated && (inLogin || (!inOnboarding && !inWelcome))) {
      handled.current = true;
      Promise.all([
        AsyncStorage.getItem(ONBOARDING_KEY),
        AsyncStorage.getItem('arise_welcome_date'),
      ]).then(([onboarding, welcomeDate]) => {
        const today = format(new Date(), 'yyyy-MM-dd');

        // First time ever — go to onboarding
        if (!onboarding) {
          router.replace('/onboarding');
          return;
        }

        // Show welcome once per day
        if (welcomeDate !== today) {
          AsyncStorage.setItem('arise_welcome_date', today);
          router.replace('/welcome');
          return;
        }

        if (inLogin) router.replace('/(tabs)');
      });
    }
  }, [isAuthenticated, loading, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </AuthProvider>
  );
}

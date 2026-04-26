import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppProvider } from '../src/context/AppContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const handled = useRef(false);

  useEffect(() => {
    if (loading || handled.current) return;

    const inLogin = segments[0] === 'login';
    const inWelcome = segments[0] === 'welcome';

    if (!isAuthenticated && !inLogin) {
      handled.current = true;
      router.replace('/login');
    } else if (isAuthenticated && inLogin) {
      handled.current = true;
      // Check if welcome was shown today
      AsyncStorage.getItem('arise_welcome_date').then(saved => {
        const today = format(new Date(), 'yyyy-MM-dd');
        if (saved !== today) {
          AsyncStorage.setItem('arise_welcome_date', today);
          router.replace('/welcome');
        } else {
          router.replace('/(tabs)');
        }
      });
    } else if (isAuthenticated && !inLogin && !inWelcome) {
      // Fresh authenticated open — show welcome once per day
      handled.current = true;
      AsyncStorage.getItem('arise_welcome_date').then(saved => {
        const today = format(new Date(), 'yyyy-MM-dd');
        if (saved !== today) {
          AsyncStorage.setItem('arise_welcome_date', today);
          router.replace('/welcome');
        }
        // else stay on current screen
      });
    }
  }, [isAuthenticated, loading, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
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

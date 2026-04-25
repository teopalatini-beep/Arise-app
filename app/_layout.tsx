import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AppProvider } from '../src/context/AppContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';

function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inLogin = segments[0] === 'login';

    if (!isAuthenticated && !inLogin) {
      router.replace('/login');
    } else if (isAuthenticated && inLogin) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
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

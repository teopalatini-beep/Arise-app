import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LogBox } from 'react-native';
import { AppProvider, useApp } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLoadingState from '@components/ui/ScreenLoadingState';
import { useReducedMotionSetting } from '@/hooks/useReducedMotionSetting';
import {
  APP_DATA_KEY,
  ONBOARDING_KEY,
  ONBOARDING_STATUS_KEY,
  WELCOME_DATE_KEY,
  WELCOME_SEEN_KEY,
} from '@/lib/storageKeys';

LogBox.ignoreLogs([
  'TypeError: Network request failed',
  'AuthRetryableFetchError: Network request failed',
]);

// ── Error Boundary ───────────────────────────────────────────────────────────
interface EBState { hasError: boolean; error?: Error }

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('[ARISE ErrorBoundary]', error);
  }

  handleReset = async () => {
    // Clear all cached data so the app can restart cleanly
    try {
      await AsyncStorage.multiRemove([
        APP_DATA_KEY,
        WELCOME_DATE_KEY,
        WELCOME_SEEN_KEY,
        ONBOARDING_KEY,
        ONBOARDING_STATUS_KEY,
      ]);
    } catch {}
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={ebStyles.container}>
        <Text style={ebStyles.emoji}>⚠️</Text>
        <Text style={ebStyles.title}>Algo salió mal</Text>
        <Text style={ebStyles.message}>
          {this.state.error?.message ?? 'Error inesperado'}
        </Text>
        <TouchableOpacity style={ebStyles.btn} onPress={this.handleReset}>
          <Text style={ebStyles.btnText}>REINICIAR APP</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const ebStyles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#05050A',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#F5F0FF', marginBottom: 8 },
  message: {
    fontSize: 14, color: '#8B8FA8', textAlign: 'center',
    lineHeight: 22, marginBottom: 32,
  },
  btn: {
    backgroundColor: '#E8460A', borderRadius: 16,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 2 },
});

function RootNavigator() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { loading: appLoading, hasRemoteProfile, hasCompletedOnboarding } = useApp();
  const { reducedMotion } = useReducedMotionSetting();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let cancelled = false;
    async function guardRoutes() {
      if (authLoading) return;

      const inLogin = segments[0] === 'login';
      const inOnboarding = segments[0] === 'onboarding';
      const inWelcome = segments[0] === 'welcome';

      if (!isAuthenticated && !inLogin) {
        router.replace('/login');
        return;
      }
      if (!isAuthenticated) return;
      if (appLoading) return;

      if ((!hasRemoteProfile || !hasCompletedOnboarding) && !inOnboarding) {
        router.replace('/onboarding');
        return;
      }
      if (hasCompletedOnboarding && inOnboarding) {
        router.replace('/(tabs)');
        return;
      }

      if (!inWelcome && !inOnboarding) {
        const seenWelcome = await AsyncStorage.getItem(WELCOME_SEEN_KEY);
        if (!seenWelcome) {
          await AsyncStorage.setItem(WELCOME_SEEN_KEY, '1');
          if (!cancelled) router.replace('/welcome');
          return;
        }
      }

      if (inLogin) {
        router.replace('/(tabs)');
      }
    }

    void guardRoutes();
    return () => { cancelled = true; };
  }, [
    isAuthenticated,
    authLoading,
    appLoading,
    hasRemoteProfile,
    hasCompletedOnboarding,
    segments,
    router,
  ]);

  if (authLoading || (isAuthenticated && appLoading)) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="light" />
        <ScreenLoadingState
          title="ARISE"
          subtitle="Sincronizando progreso global..."
          icon="cloud-download-outline"
          accent="#E8460A"
          reducedMotion={reducedMotion}
          hints={[
            'Validando sesion',
            'Cargando perfil',
            'Preparando rutas',
          ]}
        />
      </View>
    );
  }

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

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#05050A',
    justifyContent: 'center',
  },
});

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

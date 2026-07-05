import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LogBox } from 'react-native';
import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';
import { AppProvider } from '../src/context/AppContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ONBOARDING_KEY } from './onboarding';
import { initErrorTracking, trackError } from '../src/services/errorTracking';
import { initAnalytics } from '../src/services/analytics';

// Expo Go no incluye el módulo nativo de Sentry: inicializarlo ahí crashea la app.
// En Expo Go salteamos la telemetría remota; los servicios degradan solos a
// consola + ring-buffer (nada se pierde). En builds reales (EAS) sí se activa.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

if (!isExpoGo) {
  // ── Telemetría remota (Sentry) ──────────────────────────────────────────────
  const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !!SENTRY_DSN,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  });

  initErrorTracking({
    captureException: (error, hint) => Sentry.captureException(error, hint as any),
    captureMessage: (message, hint) => Sentry.captureMessage(message, hint as any),
  });

  // ── Analíticas de producto (PostHog) ────────────────────────────────────────
  const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

  if (POSTHOG_KEY) {
    const posthog = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST });
    initAnalytics({
      capture: (event, properties) => posthog.capture(event, properties as any),
      identify: (userId, traits) => posthog.identify(userId, traits as any),
    });
  }
}

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
    // Crash de árbol de React → telemetría remota (severidad fatal).
    trackError(error, { scope: 'ErrorBoundary', severity: 'fatal' });
  }

  handleReset = async () => {
    // Clear all cached data so the app can restart cleanly
    try {
      await AsyncStorage.multiRemove(['arise_data_v1', 'arise_welcome_date']);
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
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inLogin = segments[0] === 'login';
    const inOnboarding = segments[0] === 'onboarding';
    const inWelcome = segments[0] === 'welcome';

    if (!isAuthenticated && !inLogin) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && (inLogin || (!inOnboarding && !inWelcome))) {
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
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

function hasValidSupabaseHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

export const SUPABASE_CONFIG_ERROR =
  !hasValidSupabaseHost(SUPABASE_URL)
    ? 'EXPO_PUBLIC_SUPABASE_URL no es valido. Debe ser https://<project-ref>.supabase.co'
    : !SUPABASE_ANON_KEY
      ? 'EXPO_PUBLIC_SUPABASE_ANON_KEY no esta configurado.'
      : null;

if (SUPABASE_CONFIG_ERROR) {
  console.warn(`[Supabase] ${SUPABASE_CONFIG_ERROR}`);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

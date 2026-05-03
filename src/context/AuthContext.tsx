import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, SUPABASE_CONFIG_ERROR } from '../lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  session: Session | null;
  userName: string;
  userEmail: string;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function isNetworkError(error: unknown): boolean {
  const msg = String((error as any)?.message ?? error ?? '').toLowerCase();
  return msg.includes('network request failed') || msg.includes('fetch failed');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (SUPABASE_CONFIG_ERROR) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch((error) => {
        if (!isNetworkError(error)) {
          console.warn('[Auth] getSession failed', error);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function register(name: string, email: string, password: string): Promise<string | null> {
    if (SUPABASE_CONFIG_ERROR) return SUPABASE_CONFIG_ERROR;
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      return error ? error.message : null;
    } catch (error) {
      if (isNetworkError(error)) return 'No hay conexion con el servidor.';
      return 'No se pudo crear la cuenta.';
    }
  }

  async function login(email: string, password: string): Promise<string | null> {
    if (SUPABASE_CONFIG_ERROR) return SUPABASE_CONFIG_ERROR;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? error.message : null;
    } catch (error) {
      if (isNetworkError(error)) return 'No hay conexion con el servidor.';
      return 'No se pudo iniciar sesion.';
    }
  }

  async function logout() {
    if (SUPABASE_CONFIG_ERROR) return;
    try {
      await supabase.auth.signOut();
    } catch (error) {
      if (!isNetworkError(error)) {
        console.warn('[Auth] logout failed', error);
      }
    }
  }

  async function resetPassword(email: string): Promise<string | null> {
    if (SUPABASE_CONFIG_ERROR) return SUPABASE_CONFIG_ERROR;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return error ? error.message : null;
    } catch (error) {
      if (isNetworkError(error)) return 'No hay conexion con el servidor.';
      return 'No se pudo enviar el email de recuperacion.';
    }
  }

  const userName = session?.user?.user_metadata?.name ?? '';
  const userEmail = session?.user?.email ?? '';

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!session,
      loading,
      session,
      userName,
      userEmail,
      register,
      login,
      logout,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

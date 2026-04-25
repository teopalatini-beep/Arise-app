import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = 'arise_auth_v1';
const SESSION_KEY = 'arise_session_v1';

interface AuthData {
  name: string;
  passwordHash: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  userName: string;
  register: (name: string, password: string) => Promise<void>;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasAccount: boolean;
}

function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authData, setAuthData] = useState<AuthData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [rawAuth, session] = await Promise.all([
          AsyncStorage.getItem(AUTH_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ]);
        if (rawAuth) {
          const parsed: AuthData = JSON.parse(rawAuth);
          setAuthData(parsed);
          if (session === 'active') {
            setIsAuthenticated(true);
          }
        }
      } catch (e) {
        console.error('Auth load error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function register(name: string, password: string) {
    const data: AuthData = { name: name.trim(), passwordHash: simpleHash(password) };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data));
    await AsyncStorage.setItem(SESSION_KEY, 'active');
    setAuthData(data);
    setIsAuthenticated(true);
  }

  async function login(password: string): Promise<boolean> {
    if (!authData) return false;
    const match = simpleHash(password) === authData.passwordHash;
    if (match) {
      await AsyncStorage.setItem(SESSION_KEY, 'active');
      setIsAuthenticated(true);
    }
    return match;
  }

  async function logout() {
    await AsyncStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      loading,
      userName: authData?.name ?? '',
      register,
      login,
      logout,
      hasAccount: authData !== null,
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

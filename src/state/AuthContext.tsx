import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadAuth, saveAuth, clearAuth, type StoredAuth } from '../api/tokenStore';
import * as authApi from '../api/auth';
import * as playersApi from '../api/players';
import type { PlayerProfile } from '../types/api';
import { ApiError } from '../api/client';

interface AuthContextValue {
  /** Full profile (includes rush_balance, is_guest, etc). Null until first load resolves. */
  profile: PlayerProfile | null;
  isAuthed: boolean;
  isGuest: boolean;
  initializing: boolean;
  /** Guarantees a session exists (guest or real) and returns the fresh profile. Used by PLAY NOW. */
  ensureSession: () => Promise<PlayerProfile>;
  refreshProfile: () => Promise<void>;
  upgradeGuest: (input: { username?: string; email: string; password: string }) => Promise<void>;
  login: (input: { usernameOrEmail: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  const refreshProfile = useCallback(async () => {
    const stored = loadAuth();
    if (!stored) {
      setProfile(null);
      return;
    }
    try {
      const p = await playersApi.getMe();
      setProfile(p);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuth();
        setProfile(null);
      } else {
        // Network hiccup etc — keep whatever we had, don't wipe a valid session.
        throw err;
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshProfile();
      } catch {
        // swallow — screens handle their own loading/error states
      } finally {
        setInitializing(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureSession = useCallback(async (): Promise<PlayerProfile> => {
    const stored = loadAuth();
    if (stored) {
      try {
        const p = await playersApi.getMe();
        setProfile(p);
        return p;
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 401)) throw err;
        // token dead beyond repair — fall through and create a fresh guest
        clearAuth();
      }
    }
    const result = await authApi.createGuest();
    saveAuth(result as StoredAuth);
    const p = await playersApi.getMe();
    setProfile(p);
    return p;
  }, []);

  const upgradeGuest = useCallback(async (input: { username?: string; email: string; password: string }) => {
    const result = await authApi.upgradeGuest(input);
    saveAuth(result as StoredAuth);
    await refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async (input: { usernameOrEmail: string; password: string }) => {
    const result = await authApi.login(input);
    saveAuth(result as StoredAuth);
    await refreshProfile();
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    const stored = loadAuth();
    if (stored) {
      try {
        await authApi.logout(stored.refreshToken);
      } catch {
        // best-effort
      }
    }
    clearAuth();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      isAuthed: !!profile,
      isGuest: !!profile?.is_guest,
      initializing,
      ensureSession,
      refreshProfile,
      upgradeGuest,
      login,
      logout,
    }),
    [profile, initializing, ensureSession, refreshProfile, upgradeGuest, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

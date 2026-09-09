import type { PublicUser } from '../types/api';

const STORAGE_KEY = 'neon_rush_auth';

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

/**
 * This is the ONLY thing persisted client-side for a guest: an identifier
 * (via the JWT) to restore the session on this device. No game economy data
 * (RUSH, scores, rewards) is ever trusted from or stored in localStorage —
 * that all lives server-side and is re-fetched on load.
 */
export function loadAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
}

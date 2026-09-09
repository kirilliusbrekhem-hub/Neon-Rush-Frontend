import { loadAuth, saveAuth, clearAuth } from './tokenStore';
import type { ApiErrorBody } from '../types/api';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, details?: unknown) {
    super(code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean; // attach Authorization header (default true)
  idempotencyKey?: string;
  /** internal: prevents infinite refresh loops */
  _isRetry?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const auth = loadAuth();
  if (!auth) return null;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: auth.refreshToken }),
        });
        if (!res.ok) {
          clearAuth();
          return null;
        }
        const data = await res.json();
        saveAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
        return data.accessToken as string;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, idempotencyKey, _isRetry = false } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const stored = loadAuth();
    if (stored) headers.Authorization = `Bearer ${stored.accessToken}`;
  }
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(0, 'network_error', err);
  }

  if (res.status === 401 && auth && !_isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest<T>(path, { ...options, _isRetry: true });
    }
  }

  if (res.status === 204) return undefined as T;

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const errBody = (payload ?? { error: 'unknown_error' }) as ApiErrorBody;
    throw new ApiError(res.status, errBody.error, errBody.details);
  }

  return payload as T;
}

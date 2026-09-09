import { apiRequest } from './client';
import type { AuthResponse } from '../types/api';

export function createGuest() {
  return apiRequest<AuthResponse>('/api/auth/guest', { method: 'POST', auth: false });
}

export function register(input: { username: string; email: string; password: string; displayName?: string }) {
  return apiRequest<AuthResponse>('/api/auth/register', { method: 'POST', body: input, auth: false });
}

export function login(input: { usernameOrEmail: string; password: string }) {
  return apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: input, auth: false });
}

export function upgradeGuest(input: { username?: string; email: string; password: string }) {
  return apiRequest<AuthResponse>('/api/auth/upgrade', { method: 'POST', body: input });
}

export function logout(refreshToken: string) {
  return apiRequest<void>('/api/auth/logout', { method: 'POST', body: { refreshToken } });
}

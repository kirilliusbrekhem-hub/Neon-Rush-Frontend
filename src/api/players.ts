import { apiRequest } from './client';
import type { PlayerProfile, BalanceResponse } from '../types/api';

export function getMe() {
  return apiRequest<PlayerProfile>('/api/players/me');
}

export function updateMe(input: { displayName?: string; avatarUrl?: string }) {
  return apiRequest<{ user_id: string; display_name: string; avatar_url: string | null }>('/api/players/me', {
    method: 'PATCH',
    body: input,
  });
}

export function getBalance() {
  return apiRequest<BalanceResponse>('/api/players/me/balance');
}

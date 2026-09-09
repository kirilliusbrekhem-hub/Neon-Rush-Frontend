import { apiRequest } from './client';
import type { Season, LeaderboardResponse, RewardEstimate } from '../types/api';

export function getCurrentSeason() {
  return apiRequest<Season>('/api/seasons/current', { auth: false });
}

export function getSeason(id: string) {
  return apiRequest<Season>(`/api/seasons/${id}`, { auth: false });
}

export function getLeaderboard(seasonId: string, limit = 100) {
  return apiRequest<LeaderboardResponse>(`/api/seasons/${seasonId}/leaderboard?limit=${limit}`, { auth: false });
}

export function getRewardEstimate(seasonId: string) {
  return apiRequest<RewardEstimate>(`/api/seasons/${seasonId}/reward-estimate`);
}

import { apiRequest } from './client';
import type { GameSession, GameResult } from '../types/api';

export function startSession() {
  return apiRequest<GameSession>('/api/sessions/start', { method: 'POST' });
}

export function endSession(sessionId: string, score: number, idempotencyKey: string) {
  return apiRequest<GameResult>(`/api/sessions/${sessionId}/end`, {
    method: 'POST',
    body: { score },
    idempotencyKey,
  });
}

export function getSession(sessionId: string) {
  return apiRequest<GameSession>(`/api/sessions/${sessionId}`);
}

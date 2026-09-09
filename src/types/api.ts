export interface PublicUser {
  id: string;
  username: string;
  email: string | null;
  role: 'player' | 'admin';
  isGuest: boolean;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  email: string | null;
  role: 'player' | 'admin';
  rush_balance: number;
  is_guest: boolean;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
}

export interface BalanceResponse {
  rushBalance: number;
}

export type SeasonStatus = 'upcoming' | 'active' | 'closed';

export interface Season {
  id: string;
  name: string;
  status: SeasonStatus;
  starts_at: string;
  ends_at: string | null;
  reward_pool_oops: number;
  max_oops_per_player: number;
  total_season_rush: number;
  created_at: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  rushEarned: number;
  rank: number;
}

export interface LeaderboardResponse {
  seasonId: string;
  entries: LeaderboardEntry[];
}

export interface RewardEstimate {
  seasonId: string;
  playerRush: number;
  totalSeasonRush: number;
  rewardPoolOops: number;
  maxOopsPerPlayer: number;
  oopsEstimated: number;
}

export interface GameSession {
  id: string;
  user_id: string;
  season_id: string;
  status: 'active' | 'completed' | 'invalidated';
  started_at: string;
  ended_at: string | null;
}

export interface GameResult {
  id: string;
  session_id: string;
  event_id: string;
  raw_client_score: { score: number };
  rush_awarded: number;
  validated: boolean;
  validation_notes: Record<string, unknown>;
  created_at: string;
}

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

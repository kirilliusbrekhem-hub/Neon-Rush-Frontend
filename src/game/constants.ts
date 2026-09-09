// Tuned to comfortably stay under the backend's server-side plausibility caps
// (MAX_SCORE_PER_SECOND=50, MIN_SESSION_SECONDS=5) — see neon-rush-backend
// src/modules/sessions/validation.ts. Client values here are for feel only;
// the server never trusts them as-is.
export const ROUND_SECONDS = 20;
export const ORB_MIN_TTL_MS = 850;
export const ORB_MAX_TTL_MS = 1400;
export const SPAWN_INTERVAL_MS = 550;
export const MAX_CONCURRENT_ORBS = 4;

# Neon Rush — Frontend (MVP)

React + TypeScript + Vite + Tailwind v4. Talks to the existing `neon-rush-backend`
(created separately) over REST — this project does not implement or duplicate any
economy logic. RUSH/OOPS values shown here are always what the server returned,
never computed client-side.

## Quick start

```bash
cp .env.example .env      # set VITE_API_URL to your backend, default http://localhost:3000
npm install
npm run dev
```

The backend must be running with an **active season** for `/play` to work
(`POST /api/admin/seasons`, then `POST /api/admin/seasons/:id/activate` — see the
backend README for how to create an admin user).

## Guest-first flow

1. Landing page loads public data only (`/api/seasons/current`, leaderboard preview) —
   no auth required, no forms.
2. **PLAY NOW** calls `ensureSession()`: if no local token exists, it calls
   `POST /api/auth/guest` (no form, no email/password) and stores the returned
   token pair. If a token already exists, it's reused as-is.
3. The game session is started (`POST /api/sessions/start`), the round plays
   entirely client-side for feel, and on game over the score is submitted to
   `POST /api/sessions/:id/end` with a fresh `Idempotency-Key`. The RUSH shown
   to the player is exactly what the server returned in the response — never a
   locally computed number.
4. After a couple of rounds as a guest, a "Save Your Progress" modal offers
   to upgrade the guest to a real account (`POST /api/auth/upgrade`), which
   updates the *same* user id server-side — RUSH balance and season stats
   carry over with no client-side merge logic needed.
5. Returning guests are recognized automatically: the access/refresh token pair
   is the only thing persisted in `localStorage` (key `neon_rush_auth`), used
   solely to restore the identity of this device's session — never to store or
   trust economy data locally.

## Project structure

```
src/
  api/        typed REST client (client.ts handles auth headers + 401 refresh-retry),
              one module per backend resource (auth, players, sessions, seasons)
  state/      AuthContext — guest-first session lifecycle
  hooks/      small local-only helpers (e.g. "games played" counter for the save-progress nudge)
  game/       the actual playable round (orb-tap reflex game) — produces a score,
              nothing more; the server decides how much RUSH that's worth
  components/ Button, NeonCard, Nav, Loader, ErrorBanner, CountdownTimer, ProgressBar,
              SaveProgressModal
  screens/    HomeScreen, PlayScreen, LeaderboardScreen, SeasonScreen, RewardsScreen, ProfileScreen
  types/api.ts  shared response types matching the backend's contracts
```

## What's real vs. placeholder

**Real, working against the live backend:**
- Guest creation, guest -> account upgrade with progress preserved
- Login for returning registered users
- Full game round -> server-validated RUSH accrual -> balance update
- Leaderboard, season info, per-player OOPS reward estimate (all server-computed)
- 401 handling with automatic refresh-token retry

**Placeholder, intentionally not implemented yet (as scoped):**
- "Connect Wallet" button on the Rewards screen — disabled, no TON Connect wiring
- OOPS "Claim" — always shows "Not available yet"; no on-chain transfer exists anywhere in this codebase

## Security notes

- No private keys or seed phrases are stored or handled anywhere in this app.
- `localStorage` holds only the JWT pair, used to restore identity, never RUSH/OOPS
  values or any economy figure — those are always re-fetched from the server.
- `VITE_API_URL` is the only environment-configurable value; no production URLs are hardcoded.

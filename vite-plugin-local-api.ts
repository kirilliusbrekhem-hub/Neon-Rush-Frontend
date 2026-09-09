import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

type User = {
  id: string;
  username: string;
  email: string | null;
  password: string | null;
  role: 'player' | 'admin';
  isGuest: boolean;
  rushBalance: number;
  createdAt: string;
  displayName: string;
  avatarUrl: string | null;
};

type Session = {
  id: string;
  user_id: string;
  season_id: string;
  status: 'active' | 'completed' | 'invalidated';
  started_at: string;
  ended_at: string | null;
};

const SCORE_TO_RUSH_RATE = 0.1;
const MAX_RUSH_PER_SESSION = 500;
const MIN_SESSION_SECONDS = 5;
const MAX_SESSION_SECONDS = 60 * 30;
const MAX_SCORE_PER_SECOND = 50;

const season = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Season 1',
  status: 'active' as const,
  starts_at: new Date().toISOString(),
  ends_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  reward_pool_oops: 10000,
  max_oops_per_player: 500,
  total_season_rush: 0,
  created_at: new Date().toISOString(),
};

const users = new Map<string, User>();
const tokens = new Map<string, string>();
const sessions = new Map<string, Session>();
const seasonRush = new Map<string, number>();
const resultsByEvent = new Map<string, unknown>();

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(body === undefined ? '' : JSON.stringify(body));
}

function error(res: ServerResponse, status: number, code: string) {
  json(res, status, { error: code });
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function authResponse(user: User, accessToken: string, refreshToken: string) {
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isGuest: user.isGuest,
    },
    accessToken,
    refreshToken,
  };
}

function profile(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    rush_balance: user.rushBalance,
    is_guest: user.isGuest,
    created_at: user.createdAt,
    display_name: user.displayName,
    avatar_url: user.avatarUrl,
  };
}

function issueTokens(user: User) {
  const accessToken = crypto.randomUUID();
  const refreshToken = crypto.randomUUID();
  tokens.set(accessToken, user.id);
  tokens.set(refreshToken, user.id);
  return { accessToken, refreshToken };
}

function userFromReq(req: IncomingMessage): User | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const userId = tokens.get(header.slice(7));
  if (!userId) return null;
  return users.get(userId) ?? null;
}

function leaderboard(limit: number) {
  const entries = [...seasonRush.entries()]
    .map(([userId, rushEarned]) => {
      const user = users.get(userId);
      return {
        userId,
        username: user?.username ?? 'unknown',
        displayName: user?.displayName ?? 'Unknown',
        rushEarned,
      };
    })
    .sort((a, b) => b.rushEarned - a.rushEarned)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
  return { seasonId: season.id, entries };
}

export function localApiPlugin(): Plugin {
  return {
    name: 'neon-rush-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/') && url !== '/health') return next();

        const path = url.split('?')[0];
        const method = req.method ?? 'GET';

        try {
          if (path === '/health' && method === 'GET') {
            return json(res, 200, { status: 'ok', mode: 'local' });
          }

          if (path === '/api/seasons/current' && method === 'GET') {
            return json(res, 200, season);
          }

          if (path === `/api/seasons/${season.id}` && method === 'GET') {
            return json(res, 200, season);
          }

          const lbMatch = path.match(/^\/api\/seasons\/([^/]+)\/leaderboard$/);
          if (lbMatch && method === 'GET') {
            const query = new URL(url, 'http://localhost').searchParams;
            const limit = Math.min(Number(query.get('limit') ?? 100), 1000);
            return json(res, 200, leaderboard(limit));
          }

          const rewardMatch = path.match(/^\/api\/seasons\/([^/]+)\/reward-estimate$/);
          if (rewardMatch && method === 'GET') {
            const user = userFromReq(req);
            if (!user) return error(res, 401, 'unauthorized');
            const playerRush = seasonRush.get(user.id) ?? 0;
            const oopsEstimated =
              season.total_season_rush <= 0
                ? 0
                : Math.min(
                    (playerRush / season.total_season_rush) * season.reward_pool_oops,
                    season.max_oops_per_player,
                  );
            return json(res, 200, {
              seasonId: season.id,
              playerRush,
              totalSeasonRush: season.total_season_rush,
              rewardPoolOops: season.reward_pool_oops,
              maxOopsPerPlayer: season.max_oops_per_player,
              oopsEstimated,
            });
          }

          if (path === '/api/auth/guest' && method === 'POST') {
            const id = crypto.randomUUID();
            const user: User = {
              id,
              username: `guest_${id.replace(/-/g, '').slice(0, 10)}`,
              email: null,
              password: null,
              role: 'player',
              isGuest: true,
              rushBalance: 0,
              createdAt: new Date().toISOString(),
              displayName: 'Guest',
              avatarUrl: null,
            };
            users.set(id, user);
            const issued = issueTokens(user);
            return json(res, 201, authResponse(user, issued.accessToken, issued.refreshToken));
          }

          if (path === '/api/auth/register' && method === 'POST') {
            const body = await readBody(req);
            const username = String(body.username ?? '');
            const email = String(body.email ?? '');
            const password = String(body.password ?? '');
            if (!username || !email || !password) return error(res, 400, 'invalid_input');
            if ([...users.values()].some((u) => u.username === username || u.email === email)) {
              return error(res, 409, 'username_or_email_taken');
            }
            const id = crypto.randomUUID();
            const user: User = {
              id,
              username,
              email,
              password,
              role: 'player',
              isGuest: false,
              rushBalance: 0,
              createdAt: new Date().toISOString(),
              displayName: String(body.displayName ?? username),
              avatarUrl: null,
            };
            users.set(id, user);
            const issued = issueTokens(user);
            return json(res, 201, authResponse(user, issued.accessToken, issued.refreshToken));
          }

          if (path === '/api/auth/login' && method === 'POST') {
            const body = await readBody(req);
            const usernameOrEmail = String(body.usernameOrEmail ?? '');
            const password = String(body.password ?? '');
            const user = [...users.values()].find(
              (u) =>
                !u.isGuest &&
                u.password === password &&
                (u.username === usernameOrEmail || u.email === usernameOrEmail),
            );
            if (!user) return error(res, 401, 'invalid_credentials');
            const issued = issueTokens(user);
            return json(res, 200, authResponse(user, issued.accessToken, issued.refreshToken));
          }

          if (path === '/api/auth/upgrade' && method === 'POST') {
            const user = userFromReq(req);
            if (!user) return error(res, 401, 'unauthorized');
            if (!user.isGuest) return error(res, 409, 'not_a_guest');
            const body = await readBody(req);
            user.email = String(body.email ?? '');
            user.password = String(body.password ?? '');
            if (body.username) user.username = String(body.username);
            user.isGuest = false;
            user.displayName = user.username;
            const issued = issueTokens(user);
            return json(res, 200, authResponse(user, issued.accessToken, issued.refreshToken));
          }

          if (path === '/api/auth/refresh' && method === 'POST') {
            const body = await readBody(req);
            const userId = tokens.get(String(body.refreshToken ?? ''));
            const user = userId ? users.get(userId) : undefined;
            if (!user) return error(res, 401, 'invalid_refresh_token');
            const issued = issueTokens(user);
            return json(res, 200, authResponse(user, issued.accessToken, issued.refreshToken));
          }

          if (path === '/api/auth/logout' && method === 'POST') {
            return json(res, 204, undefined);
          }

          if (path === '/api/players/me' && method === 'GET') {
            const user = userFromReq(req);
            if (!user) return error(res, 401, 'unauthorized');
            return json(res, 200, profile(user));
          }

          if (path === '/api/players/me' && method === 'PATCH') {
            const user = userFromReq(req);
            if (!user) return error(res, 401, 'unauthorized');
            const body = await readBody(req);
            if (body.displayName) user.displayName = String(body.displayName);
            if (body.avatarUrl !== undefined) user.avatarUrl = body.avatarUrl ? String(body.avatarUrl) : null;
            return json(res, 200, {
              user_id: user.id,
              display_name: user.displayName,
              avatar_url: user.avatarUrl,
            });
          }

          if (path === '/api/players/me/balance' && method === 'GET') {
            const user = userFromReq(req);
            if (!user) return error(res, 401, 'unauthorized');
            return json(res, 200, { rushBalance: user.rushBalance });
          }

          if (path === '/api/sessions/start' && method === 'POST') {
            const user = userFromReq(req);
            if (!user) return error(res, 401, 'unauthorized');
            const session: Session = {
              id: crypto.randomUUID(),
              user_id: user.id,
              season_id: season.id,
              status: 'active',
              started_at: new Date().toISOString(),
              ended_at: null,
            };
            sessions.set(session.id, session);
            return json(res, 201, session);
          }

          const endMatch = path.match(/^\/api\/sessions\/([^/]+)\/end$/);
          if (endMatch && method === 'POST') {
            const user = userFromReq(req);
            if (!user) return error(res, 401, 'unauthorized');
            const eventId = String(req.headers['idempotency-key'] ?? '');
            if (eventId && resultsByEvent.has(eventId)) {
              return json(res, 200, resultsByEvent.get(eventId));
            }
            const session = sessions.get(endMatch[1]);
            if (!session || session.user_id !== user.id) return error(res, 404, 'session_not_found');
            if (session.status !== 'active') return error(res, 409, 'session_not_active');
            const body = await readBody(req);
            const score = Number(body.score ?? 0);
            const startedAt = new Date(session.started_at);
            const endedAt = new Date();
            const durationSeconds = (endedAt.getTime() - startedAt.getTime()) / 1000;
            const notes: Record<string, unknown> = { durationSeconds, clientReportedScore: score };
            let rushAwarded = 0;
            let valid = true;
            if (!Number.isFinite(score) || score < 0) {
              valid = false;
              notes.reason = 'invalid_score_value';
            } else if (durationSeconds < MIN_SESSION_SECONDS) {
              valid = false;
              notes.reason = 'session_too_short';
            } else if (durationSeconds > MAX_SESSION_SECONDS) {
              valid = false;
              notes.reason = 'session_too_long';
            } else {
              const maxPlausibleScore = durationSeconds * MAX_SCORE_PER_SECOND;
              const trustedScore = Math.min(score, maxPlausibleScore);
              if (trustedScore < score) {
                notes.clamped = true;
                notes.maxPlausibleScore = maxPlausibleScore;
              }
              rushAwarded = Math.min(Math.floor(trustedScore * SCORE_TO_RUSH_RATE), MAX_RUSH_PER_SESSION);
            }
            session.status = 'completed';
            session.ended_at = endedAt.toISOString();
            if (valid && rushAwarded > 0) {
              user.rushBalance += rushAwarded;
              season.total_season_rush += rushAwarded;
              seasonRush.set(user.id, (seasonRush.get(user.id) ?? 0) + rushAwarded);
            }
            const result = {
              id: crypto.randomUUID(),
              session_id: session.id,
              event_id: eventId || crypto.randomUUID(),
              raw_client_score: { score },
              rush_awarded: rushAwarded,
              validated: valid,
              validation_notes: notes,
              created_at: endedAt.toISOString(),
            };
            if (eventId) resultsByEvent.set(eventId, result);
            return json(res, 201, result);
          }

          const getSession = path.match(/^\/api\/sessions\/([^/]+)$/);
          if (getSession && method === 'GET') {
            const user = userFromReq(req);
            if (!user) return error(res, 401, 'unauthorized');
            const session = sessions.get(getSession[1]);
            if (!session || session.user_id !== user.id) return error(res, 404, 'session_not_found');
            return json(res, 200, session);
          }

          return error(res, 404, 'not_found');
        } catch (err) {
          console.error(err);
          return error(res, 500, 'internal_server_error');
        }
      });
    },
  };
}

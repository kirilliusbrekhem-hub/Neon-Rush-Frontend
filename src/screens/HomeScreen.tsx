import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { NeonCard } from '../components/NeonCard';
import { Loader } from '../components/Loader';
import { useAuth } from '../state/AuthContext';
import * as seasonsApi from '../api/seasons';
import type { Season, LeaderboardEntry } from '../types/api';
import { ApiError } from '../api/client';

export function HomeScreen() {
  const navigate = useNavigate();
  const { profile, isGuest, ensureSession } = useAuth();
  const [season, setSeason] = useState<Season | null>(null);
  const [preview, setPreview] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await seasonsApi.getCurrentSeason();
        setSeason(s);
        const lb = await seasonsApi.getLeaderboard(s.id, 5);
        setPreview(lb.entries);
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) {
          // swallow other errors — the landing page should still render without a season
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handlePlayNow() {
    setStarting(true);
    try {
      await ensureSession();
      navigate('/play');
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 md:pt-24 pb-28">
      <div className="text-center mb-10">
        <h1 className="font-display text-5xl md:text-7xl font-black tracking-widest text-neon-cyan text-glow-cyan">
          NEON RUSH
        </h1>
        <p className="text-text-dim mt-3 font-display uppercase tracking-widest text-sm md:text-base">
          Tap fast. Earn RUSH. Climb the leaderboard.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 mb-10">
        <Button size="lg" onClick={handlePlayNow} disabled={starting} className="w-full max-w-xs">
          {starting ? 'Loading...' : '▶ Play Now'}
        </Button>
        {profile && (
          <p className="text-text-dim text-xs font-display uppercase tracking-widest">
            {isGuest ? 'Playing as guest' : `Welcome back, ${profile.display_name}`} · {profile.rush_balance} RUSH
          </p>
        )}
      </div>

      {loading ? (
        <Loader label="Loading season" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <NeonCard glow="cyan" className="p-5">
            <h2 className="font-display text-xs uppercase tracking-widest text-text-dim mb-2">Current Season</h2>
            {season ? (
              <>
                <p className="font-display text-lg font-bold text-text">{season.name}</p>
                <p className="text-text-dim text-sm mt-1">
                  Reward pool: <span className="text-neon-cyan">{season.reward_pool_oops} OOPS</span>
                </p>
              </>
            ) : (
              <p className="text-text-dim text-sm">No active season right now.</p>
            )}
          </NeonCard>

          <NeonCard glow="pink" className="p-5">
            <h2 className="font-display text-xs uppercase tracking-widest text-text-dim mb-2">Top Players</h2>
            {preview.length > 0 ? (
              <ol className="flex flex-col gap-1.5">
                {preview.map((e) => (
                  <li key={e.userId} className="flex justify-between text-sm">
                    <span className="text-text-dim">
                      #{e.rank} {e.displayName}
                    </span>
                    <span className="text-neon-pink font-semibold">{e.rushEarned} RUSH</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-text-dim text-sm">Be the first on the board.</p>
            )}
          </NeonCard>
        </div>
      )}
    </div>
  );
}

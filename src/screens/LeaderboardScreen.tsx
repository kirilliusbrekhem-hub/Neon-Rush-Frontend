import { useEffect, useState } from 'react';
import { NeonCard } from '../components/NeonCard';
import { Loader } from '../components/Loader';
import { ErrorBanner } from '../components/ErrorBanner';
import { useAuth } from '../state/AuthContext';
import * as seasonsApi from '../api/seasons';
import type { Season, LeaderboardEntry } from '../types/api';
import { ApiError } from '../api/client';

export function LeaderboardScreen() {
  const { profile } = useAuth();
  const [season, setSeason] = useState<Season | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const s = await seasonsApi.getCurrentSeason();
      setSeason(s);
      const lb = await seasonsApi.getLeaderboard(s.id, 50);
      setEntries(lb.entries);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setSeason(null);
      } else {
        setError('Could not load the leaderboard.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const myRank = entries.find((e) => e.userId === profile?.id);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 md:pt-24 pb-28">
      <h1 className="font-display text-2xl font-black uppercase tracking-widest text-neon-cyan text-glow-cyan mb-1">
        Leaderboard
      </h1>
      {season && <p className="text-text-dim text-sm mb-5">{season.name}</p>}

      {loading && <Loader label="Loading rankings" />}
      {error && <ErrorBanner message={error} onRetry={load} />}

      {!loading && !error && !season && (
        <NeonCard className="p-6 text-center text-text-dim">No active season right now.</NeonCard>
      )}

      {!loading && !error && season && (
        <>
          {profile && (
            <NeonCard glow="pink" className="p-4 mb-4 flex items-center justify-between">
              <span className="font-display text-sm uppercase tracking-widest text-text-dim">Your rank</span>
              <span className="font-display font-bold text-neon-pink">
                {myRank ? `#${myRank.rank} · ${myRank.rushEarned} RUSH` : 'Not ranked yet'}
              </span>
            </NeonCard>
          )}
          <NeonCard className="divide-y divide-white/5">
            {entries.length === 0 && <p className="p-6 text-center text-text-dim">No plays yet this season.</p>}
            {entries.map((e) => {
              const isMe = e.userId === profile?.id;
              return (
                <div
                  key={e.userId}
                  className={`flex items-center justify-between px-5 py-3 ${isMe ? 'bg-neon-cyan/5' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-display font-black w-8 text-right ${
                        e.rank === 1
                          ? 'text-neon-yellow'
                          : e.rank === 2
                          ? 'text-text'
                          : e.rank === 3
                          ? 'text-neon-pink'
                          : 'text-text-dim'
                      }`}
                    >
                      {e.rank}
                    </span>
                    <span className={isMe ? 'text-neon-cyan font-semibold' : 'text-text'}>{e.displayName}</span>
                  </div>
                  <span className="font-display font-semibold text-neon-cyan">{e.rushEarned}</span>
                </div>
              );
            })}
          </NeonCard>
        </>
      )}
    </div>
  );
}

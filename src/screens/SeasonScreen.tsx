import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NeonCard } from '../components/NeonCard';
import { Loader } from '../components/Loader';
import { ErrorBanner } from '../components/ErrorBanner';
import { CountdownTimer } from '../components/CountdownTimer';
import { ProgressBar } from '../components/ProgressBar';
import { useAuth } from '../state/AuthContext';
import * as seasonsApi from '../api/seasons';
import type { Season, RewardEstimate } from '../types/api';
import { ApiError } from '../api/client';

export function SeasonScreen() {
  const { profile, isAuthed } = useAuth();
  const [season, setSeason] = useState<Season | null>(null);
  const [estimate, setEstimate] = useState<RewardEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const s = await seasonsApi.getCurrentSeason();
      setSeason(s);
      if (isAuthed) {
        try {
          const est = await seasonsApi.getRewardEstimate(s.id);
          setEstimate(est);
        } catch {
          setEstimate(null);
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setSeason(null);
      } else {
        setError('Could not load season info.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 md:pt-24 pb-28">
      <h1 className="font-display text-2xl font-black uppercase tracking-widest text-neon-cyan text-glow-cyan mb-5">
        Season
      </h1>

      {loading && <Loader label="Loading season" />}
      {error && <ErrorBanner message={error} onRetry={load} />}

      {!loading && !error && !season && (
        <NeonCard className="p-6 text-center text-text-dim">
          No active season right now. Check back soon —{' '}
          <Link to="/" className="text-neon-cyan underline underline-offset-2">
            go home
          </Link>
          .
        </NeonCard>
      )}

      {!loading && !error && season && (
        <div className="flex flex-col gap-4">
          <NeonCard glow="cyan" className="p-6">
            <p className="font-display text-xs uppercase tracking-widest text-text-dim mb-1">{season.status}</p>
            <p className="font-display text-2xl font-black text-text mb-3">{season.name}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-dim">Ends in</span>
              <CountdownTimer endsAt={season.ends_at} />
            </div>
          </NeonCard>

          <NeonCard glow="pink" className="p-6">
            <p className="font-display text-xs uppercase tracking-widest text-text-dim mb-1">Reward Pool</p>
            <p className="font-display text-3xl font-black text-neon-pink text-glow-pink">
              {season.reward_pool_oops} <span className="text-lg">OOPS</span>
            </p>
            <p className="text-text-dim text-xs mt-1">Max per player: {season.max_oops_per_player} OOPS</p>
          </NeonCard>

          {isAuthed && estimate && (
            <NeonCard className="p-6">
              <p className="font-display text-xs uppercase tracking-widest text-text-dim mb-3">Your Progress</p>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-dim">Your RUSH this season</span>
                <span className="text-text font-semibold">{estimate.playerRush}</span>
              </div>
              <ProgressBar value={estimate.playerRush} max={Math.max(estimate.totalSeasonRush, 1)} />
              <div className="flex justify-between text-sm mt-4">
                <span className="text-text-dim">Estimated OOPS reward</span>
                <span className="text-neon-cyan font-semibold">{estimate.oopsEstimated.toFixed(2)}</span>
              </div>
              <p className="text-text-dim text-[11px] mt-2">
                Preliminary estimate, recalculated as the season progresses. Not a final or claimable amount yet.
              </p>
            </NeonCard>
          )}

          {profile && (
            <p className="text-text-dim text-xs text-center">Season total RUSH earned by all players: {season.total_season_rush}</p>
          )}
        </div>
      )}
    </div>
  );
}

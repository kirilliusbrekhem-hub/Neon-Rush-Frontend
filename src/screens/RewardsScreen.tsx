import { useEffect, useState } from 'react';
import { NeonCard } from '../components/NeonCard';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { ErrorBanner } from '../components/ErrorBanner';
import { useAuth } from '../state/AuthContext';
import * as seasonsApi from '../api/seasons';
import type { Season, RewardEstimate } from '../types/api';
import { ApiError } from '../api/client';

export function RewardsScreen() {
  const { isAuthed, ensureSession } = useAuth();
  const [season, setSeason] = useState<Season | null>(null);
  const [estimate, setEstimate] = useState<RewardEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (!isAuthed) await ensureSession();
      const s = await seasonsApi.getCurrentSeason();
      setSeason(s);
      const est = await seasonsApi.getRewardEstimate(s.id);
      setEstimate(est);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setSeason(null);
      } else {
        setError('Could not load rewards.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 md:pt-24 pb-28">
      <h1 className="font-display text-2xl font-black uppercase tracking-widest text-neon-cyan text-glow-cyan mb-5">
        Rewards
      </h1>

      {loading && <Loader label="Loading rewards" />}
      {error && <ErrorBanner message={error} onRetry={load} />}

      {!loading && !error && !season && (
        <NeonCard className="p-6 text-center text-text-dim">No active season right now.</NeonCard>
      )}

      {!loading && !error && season && (
        <div className="flex flex-col gap-4">
          <NeonCard glow="cyan" className="p-6 text-center">
            <p className="font-display text-xs uppercase tracking-widest text-text-dim mb-2">Estimated OOPS</p>
            <p className="font-display text-5xl font-black text-neon-cyan text-glow-cyan">
              {estimate ? estimate.oopsEstimated.toFixed(2) : '0.00'}
            </p>
            <p className="text-text-dim text-xs mt-3">
              player_rush ÷ total_season_rush × reward_pool, capped per player. Recalculated live — not final until
              the season closes.
            </p>
          </NeonCard>

          <NeonCard className="p-5 flex items-center justify-between">
            <div>
              <p className="font-display text-sm uppercase tracking-widest text-text">Season Status</p>
              <p className="text-text-dim text-xs mt-0.5">{season.status}</p>
            </div>
          </NeonCard>

          <NeonCard className="p-5 flex items-center justify-between">
            <div>
              <p className="font-display text-sm uppercase tracking-widest text-text">Claim Status</p>
              <p className="text-text-dim text-xs mt-0.5">Not available yet</p>
            </div>
          </NeonCard>

          <NeonCard glow="pink" className="p-5">
            <p className="font-display text-sm uppercase tracking-widest text-text mb-1">Wallet</p>
            <p className="text-text-dim text-xs mb-4">
              OOPS payouts go on-chain in a later phase, after the game economy has been tested. Nothing to connect
              yet.
            </p>
            <Button variant="secondary" disabled className="w-full">
              Connect Wallet (coming soon)
            </Button>
          </NeonCard>
        </div>
      )}
    </div>
  );
}

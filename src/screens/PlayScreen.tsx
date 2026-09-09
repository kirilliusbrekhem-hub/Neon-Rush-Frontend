import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { NeonRushGame } from '../game/NeonRushGame';
import { Button } from '../components/Button';
import { NeonCard } from '../components/NeonCard';
import { Loader } from '../components/Loader';
import { ErrorBanner } from '../components/ErrorBanner';
import { SaveProgressModal } from '../components/SaveProgressModal';
import { useAuth } from '../state/AuthContext';
import { useGuestPromptCounter } from '../hooks/useGuestPromptCounter';
import * as sessionsApi from '../api/sessions';
import type { GameResult } from '../types/api';
import { ApiError } from '../api/client';

type Phase = 'starting' | 'playing' | 'submitting' | 'result' | 'error';

export function PlayScreen() {
  const navigate = useNavigate();
  const { ensureSession, isGuest, refreshProfile } = useAuth();
  const { increment, shouldPrompt } = useGuestPromptCounter();

  const [phase, setPhase] = useState<Phase>('starting');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  async function startRound() {
    setPhase('starting');
    setError(null);
    try {
      await ensureSession();
      const session = await sessionsApi.startSession();
      setSessionId(session.id);
      setPhase('playing');
    } catch (err) {
      setError(err instanceof ApiError ? humanizeError(err) : 'Could not connect to the server.');
      setPhase('error');
    }
  }

  useEffect(() => {
    startRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGameOver(score: number) {
    if (!sessionId) return;
    setPhase('submitting');
    try {
      const res = await sessionsApi.endSession(sessionId, score, uuidv4());
      setResult(res);
      await refreshProfile();
      setPhase('result');

      const count = increment();
      if (isGuest && shouldPrompt(count)) {
        setShowSaveModal(true);
      }
    } catch (err) {
      setError(err instanceof ApiError ? humanizeError(err) : 'Could not submit your score.');
      setPhase('error');
    }
  }

  function humanizeError(err: ApiError): string {
    if (err.code === 'no_active_season') return 'No season is running right now — check back soon.';
    if (err.code === 'rate_limit_exceeded') return "You're playing a bit too fast — take a short breather.";
    return 'Something went wrong. Please try again.';
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 md:pt-24 pb-28">
      {phase === 'starting' && <Loader label="Starting round" />}

      {phase === 'error' && (
        <div className="flex flex-col gap-4">
          <ErrorBanner message={error ?? 'Something went wrong.'} onRetry={startRound} />
          <Button variant="ghost" onClick={() => navigate('/')}>
            Back home
          </Button>
        </div>
      )}

      {phase === 'playing' && <NeonRushGame onGameOver={handleGameOver} />}

      {phase === 'submitting' && <Loader label="Submitting score" />}

      {phase === 'result' && result && (
        <NeonCard glow={result.validated ? 'cyan' : 'pink'} className="p-8 text-center">
          <p className="font-display text-xs uppercase tracking-widest text-text-dim mb-2">Round Complete</p>
          <p className="font-display text-5xl font-black text-neon-cyan text-glow-cyan mb-1">
            +{result.rush_awarded} RUSH
          </p>
          {!result.validated && (
            <p className="text-neon-pink text-xs mt-1">This round didn't validate — no RUSH awarded.</p>
          )}
          <div className="flex flex-col gap-3 mt-6">
            <Button onClick={startRound}>Play Again</Button>
            <Button variant="secondary" onClick={() => navigate('/leaderboard')}>
              View Leaderboard
            </Button>
          </div>
        </NeonCard>
      )}

      {showSaveModal && <SaveProgressModal onClose={() => setShowSaveModal(false)} />}
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { ROUND_SECONDS, ORB_MIN_TTL_MS, ORB_MAX_TTL_MS, SPAWN_INTERVAL_MS, MAX_CONCURRENT_ORBS } from './constants';

interface Orb {
  id: number;
  x: number; // percent within playfield
  y: number;
  ttl: number;
  kind: 'cyan' | 'pink' | 'violet';
}

interface NeonRushGameProps {
  onGameOver: (score: number) => void;
}

let orbSeq = 0;

export function NeonRushGame({ onGameOver }: NeonRushGameProps) {
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [ended, setEnded] = useState(false);
  const scoreRef = useRef(0);
  const endedRef = useRef(false);

  const spawnOrb = useCallback(() => {
    setOrbs((prev) => {
      if (prev.length >= MAX_CONCURRENT_ORBS) return prev;
      const id = orbSeq++;
      const ttl = ORB_MIN_TTL_MS + Math.random() * (ORB_MAX_TTL_MS - ORB_MIN_TTL_MS);
      const kinds: Orb['kind'][] = ['cyan', 'pink', 'violet'];
      const orb: Orb = {
        id,
        x: 8 + Math.random() * 84,
        y: 10 + Math.random() * 72,
        ttl,
        kind: kinds[Math.floor(Math.random() * kinds.length)],
      };
      // schedule expiry (miss)
      window.setTimeout(() => {
        setOrbs((cur) => cur.filter((o) => o.id !== id));
        setCombo(0);
      }, ttl);
      return [...prev, orb];
    });
  }, []);

  const hitOrb = useCallback((id: number) => {
    setOrbs((prev) => prev.filter((o) => o.id !== id));
    setCombo((c) => {
      const next = c + 1;
      const gain = 1 + Math.floor(next / 5); // small combo bonus every 5 in a row
      setScore((s) => {
        const updated = s + gain;
        scoreRef.current = updated;
        return updated;
      });
      return next;
    });
  }, []);

  useEffect(() => {
    const spawnId = window.setInterval(spawnOrb, SPAWN_INTERVAL_MS);
    return () => window.clearInterval(spawnId);
  }, [spawnOrb]);

  useEffect(() => {
    const tickId = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(tickId);
          if (!endedRef.current) {
            endedRef.current = true;
            setEnded(true);
            onGameOver(scoreRef.current);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(tickId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kindClass: Record<Orb['kind'], string> = {
    cyan: 'bg-neon-cyan shadow-[0_0_18px_6px_rgba(57,255,214,0.55)]',
    pink: 'bg-neon-pink shadow-[0_0_18px_6px_rgba(255,63,176,0.55)]',
    violet: 'bg-neon-violet shadow-[0_0_18px_6px_rgba(154,92,255,0.55)]',
  };

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="font-display">
          <span className="text-text-dim text-xs uppercase tracking-widest">Score</span>
          <div className="text-3xl font-black text-neon-cyan text-glow-cyan leading-none">{score}</div>
        </div>
        {combo > 2 && (
          <div className="font-display text-neon-pink text-glow-pink text-sm uppercase tracking-widest animate-pulse-glow">
            {combo}x combo
          </div>
        )}
        <div className="font-display text-right">
          <span className="text-text-dim text-xs uppercase tracking-widest">Time</span>
          <div className={`text-3xl font-black leading-none ${secondsLeft <= 5 ? 'text-neon-pink text-glow-pink' : 'text-text'}`}>
            {secondsLeft}
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[4/3] md:aspect-video rounded-2xl overflow-hidden bg-surface glow-border-cyan">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(57,255,214,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,214,0.15) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {!ended &&
          orbs.map((orb) => (
            <button
              key={orb.id}
              onPointerDown={() => hitOrb(orb.id)}
              className={`absolute w-12 h-12 md:w-14 md:h-14 rounded-full ${kindClass[orb.kind]}`}
              style={{
                left: `${orb.x}%`,
                top: `${orb.y}%`,
                animation: `orb-pop ${orb.ttl}ms ease-out forwards`,
              }}
              aria-label="Tap the orb"
            />
          ))}
        {ended && (
          <div className="absolute inset-0 flex items-center justify-center bg-void/70">
            <span className="font-display text-xl uppercase tracking-widest text-text-dim animate-pulse-glow">
              Wrapping up...
            </span>
          </div>
        )}
      </div>
      <p className="text-center text-text-dim text-xs mt-3 font-display uppercase tracking-widest">
        Tap the orbs before they fade
      </p>
    </div>
  );
}

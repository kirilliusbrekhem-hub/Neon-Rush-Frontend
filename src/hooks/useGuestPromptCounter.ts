import { useCallback } from 'react';

// Purely a UX nicety: "how many rounds has this guest played on this device"
// so we know when to nudge them to save progress. Not economy data — the
// server never reads this. Fine to lose on a cleared browser.
const KEY = 'neon_rush_games_played';
const PROMPT_AFTER = 2;

export function useGuestPromptCounter() {
  const increment = useCallback((): number => {
    const current = parseInt(localStorage.getItem(KEY) ?? '0', 10);
    const next = current + 1;
    localStorage.setItem(KEY, String(next));
    return next;
  }, []);

  const shouldPrompt = useCallback((count: number) => count >= PROMPT_AFTER, []);

  return { increment, shouldPrompt };
}

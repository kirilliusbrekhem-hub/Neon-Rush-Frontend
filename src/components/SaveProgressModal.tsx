import { useState, type FormEvent } from 'react';
import { Button } from './Button';
import { NeonCard } from './NeonCard';
import { useAuth } from '../state/AuthContext';
import { ApiError } from '../api/client';

export function SaveProgressModal({ onClose }: { onClose: () => void }) {
  const { upgradeGuest, profile } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await upgradeGuest({ username: username || undefined, email, password });
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.code === 'username_or_email_taken'
            ? 'That username or email is already taken.'
            : 'Something went wrong. Try again.',
        );
      } else {
        setError('Network error. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-void/80 backdrop-blur-sm p-4">
      <NeonCard glow="pink" className="w-full max-w-sm p-6">
        <h2 className="font-display text-xl font-black uppercase text-neon-pink text-glow-pink mb-1">
          Save Your Progress
        </h2>
        <p className="text-text-dim text-sm mb-5">
          You've earned <span className="text-text font-semibold">{profile?.rush_balance ?? 0} RUSH</span> as a guest.
          Create an account so it's never lost.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="bg-void border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neon-cyan"
            placeholder="Username (optional, keep current)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            className="bg-void border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neon-cyan"
            placeholder="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="bg-void border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neon-cyan"
            placeholder="Password (min 8 characters)"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          {error && <p className="text-neon-pink text-xs">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting ? 'Saving...' : 'Save Progress'}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-text-dim text-xs uppercase tracking-widest font-display mt-1"
          >
            Maybe later
          </button>
        </form>
      </NeonCard>
    </div>
  );
}

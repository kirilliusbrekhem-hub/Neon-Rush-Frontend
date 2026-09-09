import { useState, type FormEvent } from 'react';
import { NeonCard } from '../components/NeonCard';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { SaveProgressModal } from '../components/SaveProgressModal';
import { useAuth } from '../state/AuthContext';
import * as playersApi from '../api/players';
import { ApiError } from '../api/client';

export function ProfileScreen() {
  const { profile, isGuest, initializing, ensureSession, logout, refreshProfile } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  if (initializing) return <Loader label="Loading profile" />;

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 pt-10 md:pt-24 pb-28 text-center">
        <p className="text-text-dim mb-4">No active session yet.</p>
        <Button onClick={() => ensureSession()}>Start Playing</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 md:pt-24 pb-28 flex flex-col gap-4">
      <h1 className="font-display text-2xl font-black uppercase tracking-widest text-neon-cyan text-glow-cyan mb-1">
        Profile
      </h1>

      <NeonCard glow="cyan" className="p-6">
        <p className="font-display text-xl font-bold text-text">{profile.display_name}</p>
        <p className="text-text-dim text-sm">@{profile.username}</p>
        {isGuest && (
          <span className="inline-block mt-2 text-[10px] font-display uppercase tracking-widest text-neon-pink border border-neon-pink/40 rounded-full px-2 py-0.5">
            Guest account
          </span>
        )}
        <div className="mt-4 flex justify-between text-sm">
          <span className="text-text-dim">RUSH balance</span>
          <span className="text-neon-cyan font-semibold">{profile.rush_balance}</span>
        </div>
      </NeonCard>

      <DisplayNameEditor currentName={profile.display_name} onSaved={refreshProfile} />

      {isGuest ? (
        <NeonCard glow="pink" className="p-5">
          <p className="font-display text-sm uppercase tracking-widest text-text mb-1">Keep your progress</p>
          <p className="text-text-dim text-xs mb-3">
            Create an account so your RUSH and rank survive across devices and browser resets.
          </p>
          <Button onClick={() => setShowUpgrade(true)} className="w-full">
            Save Progress
          </Button>
        </NeonCard>
      ) : (
        <Button variant="ghost" onClick={logout}>
          Log Out
        </Button>
      )}

      {isGuest && (
        <button
          onClick={() => setShowLogin((v) => !v)}
          className="text-text-dim text-xs font-display uppercase tracking-widest underline underline-offset-2 self-center"
        >
          Already have an account? Log in
        </button>
      )}
      {showLogin && <LoginForm onLoggedIn={() => setShowLogin(false)} />}

      {showUpgrade && <SaveProgressModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}

function DisplayNameEditor({ currentName, onSaved }: { currentName: string; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!name.trim() || name === currentName) return;
    setSaving(true);
    try {
      await playersApi.updateMe({ displayName: name.trim() });
      await onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <NeonCard className="p-5">
      <p className="font-display text-xs uppercase tracking-widest text-text-dim mb-2">Display Name</p>
      <div className="flex gap-2">
        <input
          className="flex-1 bg-void border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan"
          value={name}
          maxLength={64}
          onChange={(e) => setName(e.target.value)}
        />
        <Button size="md" variant="secondary" onClick={handleSave} disabled={saving || !name.trim() || name === currentName}>
          {saved ? 'Saved' : 'Save'}
        </Button>
      </div>
    </NeonCard>
  );
}

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ usernameOrEmail, password });
      onLoggedIn();
    } catch (err) {
      setError(err instanceof ApiError ? 'Invalid credentials.' : 'Network error.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <NeonCard className="p-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="bg-void border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan"
          placeholder="Username or email"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
        />
        <input
          className="bg-void border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-neon-pink text-xs">{error}</p>}
        <Button type="submit" variant="secondary" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log In'}
        </Button>
      </form>
    </NeonCard>
  );
}

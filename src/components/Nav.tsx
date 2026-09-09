import { NavLink } from 'react-router-dom';

const links = [
  { to: '/leaderboard', label: 'Rank', icon: '\u25B2' },
  { to: '/season', label: 'Season', icon: '\u25C9' },
  { to: '/rewards', label: 'Rewards', icon: '\u2726' },
  { to: '/profile', label: 'Profile', icon: '\u25CF' },
];

const linkBase =
  'flex flex-col items-center justify-center gap-1 text-[11px] font-display uppercase tracking-wide transition-colors';
const linkIdle = 'text-text-dim hover:text-text';
const linkActive = 'text-neon-cyan text-glow-cyan';

export function Nav() {
  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-void-2/95 backdrop-blur border-t border-white/10 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 items-center h-16">
          {links.slice(0, 2).map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
              <span className="text-base">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
          <NavLink
            to="/play"
            className="flex items-center justify-center -mt-6"
            aria-label="Play"
          >
            {({ isActive }) => (
              <span
                className={`w-14 h-14 rounded-full flex items-center justify-center font-display font-black text-void bg-neon-cyan shadow-[0_0_28px_rgba(57,255,214,0.7)] ${
                  isActive ? '' : 'animate-pulse-glow'
                }`}
              >
                ▶
              </span>
            )}
          </NavLink>
          {links.slice(2).map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
              <span className="text-base">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop top nav */}
      <nav className="hidden md:flex fixed top-0 inset-x-0 z-40 bg-void-2/80 backdrop-blur border-b border-white/10">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-6 h-16">
          <NavLink to="/" className="font-display font-black text-lg tracking-widest text-neon-cyan text-glow-cyan">
            NEON RUSH
          </NavLink>
          <div className="flex items-center gap-6">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => `font-display text-xs uppercase tracking-widest transition-colors ${isActive ? 'text-neon-cyan text-glow-cyan' : 'text-text-dim hover:text-text'}`}
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink
              to="/play"
              className="font-display font-bold text-xs uppercase tracking-widest px-5 py-2 rounded-lg bg-neon-cyan text-void shadow-[0_0_20px_rgba(57,255,214,0.55)] hover:shadow-[0_0_28px_rgba(57,255,214,0.8)]"
            >
              ▶ Play
            </NavLink>
          </div>
        </div>
      </nav>
    </>
  );
}

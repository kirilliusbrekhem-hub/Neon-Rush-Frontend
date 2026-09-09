export function ProgressBar({ value, max, color = 'cyan' }: { value: number; max: number; color?: 'cyan' | 'pink' }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const barColor = color === 'cyan' ? 'bg-neon-cyan' : 'bg-neon-pink';
  return (
    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
      <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}

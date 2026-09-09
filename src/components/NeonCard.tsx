import type { ReactNode } from 'react';

export function NeonCard({
  children,
  glow = 'cyan',
  className = '',
}: {
  children: ReactNode;
  glow?: 'cyan' | 'pink' | 'none';
  className?: string;
}) {
  const glowClass = glow === 'cyan' ? 'glow-border-cyan' : glow === 'pink' ? 'glow-border-pink' : 'border border-white/10';
  return (
    <div className={`bg-surface/80 backdrop-blur rounded-2xl ${glowClass} ${className}`}>
      {children}
    </div>
  );
}

import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
  children: ReactNode;
}

const base =
  'font-display font-bold uppercase tracking-wide rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none';

const variants: Record<string, string> = {
  primary:
    'bg-neon-cyan text-void shadow-[0_0_24px_rgba(57,255,214,0.55)] hover:shadow-[0_0_36px_rgba(57,255,214,0.8)] hover:brightness-110',
  secondary:
    'bg-surface-hi text-text border border-neon-violet/50 hover:border-neon-violet hover:shadow-[0_0_18px_rgba(154,92,255,0.4)]',
  ghost: 'bg-transparent text-text-dim hover:text-text border border-white/10 hover:border-white/25',
};

const sizes: Record<string, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-4 text-lg',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

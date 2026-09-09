export function Loader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-text-dim">
      <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
      <span className="font-display text-xs tracking-widest uppercase">{label}</span>
    </div>
  );
}

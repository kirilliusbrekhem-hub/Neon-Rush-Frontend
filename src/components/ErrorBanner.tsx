export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-neon-pink/50 bg-neon-pink/10 px-4 py-3 text-sm text-neon-pink flex items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-display text-xs uppercase underline underline-offset-2 shrink-0">
          Retry
        </button>
      )}
    </div>
  );
}

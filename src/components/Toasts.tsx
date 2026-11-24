import { useEffect } from 'react';
import { useGame } from '../store/useGame';
import { cx } from './ui';

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  const dismiss = useGame((s) => s.dismissToast);
  useEffect(() => {
    const timers = toasts.map((t) => window.setTimeout(() => dismiss(t.id), t.tone === 'bad' ? 5200 : 3600));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-3 pt-[max(.75rem,env(safe-area-inset-top))]" aria-live="polite">
      {toasts.map((t) => (
        <button key={t.id} onClick={() => dismiss(t.id)}
          className={cx('card-solid anim-pop pointer-events-auto flex max-w-md items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium shadow-2xl',
            t.tone === 'good' && 'border-good/40', t.tone === 'bad' && 'border-bad/50', t.tone === 'info' && 'border-info/40')}>
          <span className="text-lg" aria-hidden>{t.icon ?? (t.tone === 'good' ? '✅' : t.tone === 'bad' ? '⚠️' : 'ℹ️')}</span>
          <span>{t.text}</span>
        </button>
      ))}
    </div>
  );
}

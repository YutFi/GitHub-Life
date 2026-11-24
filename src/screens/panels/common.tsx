import type { ReactNode } from 'react';
import { useGame } from '../../store/useGame';
import { Chip, cx } from '../../components/ui';
import type { ActionResult, GameState } from '../../engine/types';

/** Run an engine action on a clone of the game and commit the result. */
export function useDo() {
  const act = useGame((s) => s.act);
  return <T extends ActionResult>(fn: (g: GameState) => T, opts?: { quiet?: boolean; outcome?: boolean }) => act(fn, opts);
}
export const useConfirmSetting = () => useGame((s) => s.meta.settings.confirmDestructive);

export function Row({ icon, title, sub, right, children, className, dim }: { icon?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode; children?: ReactNode; className?: string; dim?: boolean }) {
  return (
    <div className={cx('card flex flex-col gap-2 p-3', dim && 'opacity-70', className)}>
      <div className="flex items-center gap-3">
        {icon !== undefined && <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black/15 text-xl" aria-hidden>{icon}</div>}
        <div className="min-w-0 flex-1"><div className="truncate font-semibold">{title}</div>{sub && <div className="text-xs text-muted">{sub}</div>}</div>
        {right && <div className="flex shrink-0 items-center gap-1.5">{right}</div>}
      </div>
      {children}
    </div>
  );
}

export function ChanceChip({ chance }: { chance: number }) {
  const pct = Math.round(chance * 100);
  return <Chip tone={pct >= 60 ? 'good' : pct >= 30 ? 'info' : 'bad'}>{pct}% chance</Chip>;
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'bad' | 'good' }) {
  const c = tone === 'bad' ? 'border-bad/40 bg-bad/10' : tone === 'good' ? 'border-good/40 bg-good/10' : 'border-info/30 bg-info/10';
  return <div className={cx('rounded-2xl border p-3 text-sm', c)}>{children}</div>;
}

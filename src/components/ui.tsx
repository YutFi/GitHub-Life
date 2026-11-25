import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { fmtMoney, currencySymbol, toLocal, toUSD } from '../engine/format';
import type { StatKey, Tone } from '../engine/types';

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

export function Card({ children, className, solid, ...rest }: { children: ReactNode; className?: string; solid?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx(solid ? 'card-solid' : 'card', 'p-4', className)}>{children}</div>;
}

export function SectionTitle({ children, icon, right }: { children: ReactNode; icon?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 mt-1 flex items-center justify-between gap-2">
      <h3 className="h-display flex items-center gap-2 text-[0.95rem] font-semibold tracking-tight">{icon}{children}</h3>
      {right}
    </div>
  );
}

export function PageHeader({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="h-display text-2xl font-bold tracking-tight">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

const toneText: Record<Tone, string> = { good: 'text-good', bad: 'text-bad', neutral: 'text-muted', info: 'text-info' };
export const toneClass = (t: Tone) => toneText[t];

export function Chip({ children, tone = 'neutral', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  const c = tone === 'good' ? 'text-good border-good/30 bg-good/10' : tone === 'bad' ? 'text-bad border-bad/30 bg-bad/10' : tone === 'info' ? 'text-info border-info/30 bg-info/10' : '';
  return <span className={cx('chip', c, className)}>{children}</span>;
}

const STAT_META: Record<StatKey, { label: string; icon: string; color: string }> = {
  health: { label: 'Health', icon: '❤️', color: '#fb7185' },
  happiness: { label: 'Happiness', icon: '😊', color: '#fbbf24' },
  intelligence: { label: 'Smarts', icon: '🧠', color: '#60a5fa' },
  appearance: { label: 'Looks', icon: '✨', color: '#f472b6' },
  confidence: { label: 'Confidence', icon: '🦁', color: '#fb923c' },
  discipline: { label: 'Discipline', icon: '🎯', color: '#a78bfa' },
  social: { label: 'Social', icon: '🫂', color: '#34d399' },
};
export const statMeta = (k: StatKey) => STAT_META[k];

export function StatBar({ stat, value, compact }: { stat: StatKey; value: number; compact?: boolean }) {
  const m = STAT_META[stat];
  const v = Math.round(value);
  return (
    <div className="min-w-0" title={`${m.label}: ${v}`}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 font-medium text-muted"><span aria-hidden>{m.icon}</span>{m.label}</span>
        <span className="font-semibold tabular-nums">{v}</span>
      </div>
      <div className={cx('overflow-hidden rounded-full bg-black/20', compact ? 'h-1.5' : 'h-2')} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={m.label}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, v)}%`, background: `linear-gradient(90deg, ${m.color}, color-mix(in srgb, ${m.color} 60%, white))` }} />
      </div>
    </div>
  );
}

export function Meter({ value, max = 100, color = 'var(--brand)', label, height = 8 }: { value: number; max?: number; color?: string; label?: string; height?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="overflow-hidden rounded-full bg-black/20" style={{ height }} role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemax={max}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function Money({ usd, country, compact, className, signed }: { usd: number; country: string; compact?: boolean; className?: string; signed?: boolean }) {
  const neg = usd < 0;
  return <span className={cx('tabular-nums', className)}>{signed && !neg && usd > 0 ? '+' : ''}{fmtMoney(usd, country, compact)}</span>;
}

export function Empty({ icon = '🫥', children }: { icon?: string; children: ReactNode }) {
  return <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted"><div className="text-3xl" aria-hidden>{icon}</div>{children}</div>;
}

/** Bottom sheet on mobile, centred dialog on larger screens. */
export function Modal({ open, onClose, title, children, wide, dismissible = true, footer }: { open: boolean; onClose?: () => void; title?: ReactNode; children: ReactNode; wide?: boolean; dismissible?: boolean; footer?: ReactNode }) {
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && dismissible) onClose?.(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose, dismissible]);
  if (!open) return null;
  // Portal to <body>: an ancestor with backdrop-filter/transform would otherwise become the containing block of `fixed`.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby={title ? id : undefined}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismissible ? onClose : undefined} />
      <div className={cx('card-solid anim-sheet relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-b-none sm:rounded-b-[1.25rem]', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')} style={{ boxShadow: '0 -20px 60px -20px rgba(0,0,0,.6)' }}>
        {(title || dismissible) && (
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 id={id} className="h-display text-lg font-semibold">{title}</h2>
            {dismissible && <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>}
          </div>
        )}
        <div className="overflow-y-auto p-4">{children}</div>
        {footer && <div className="safe-b border-t border-line p-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Segmented<T extends string | number>({ value, options, onChange, size = 'md' }: { value: T; options: { value: T; label: ReactNode; title?: string }[]; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className={cx('inline-flex w-full gap-1 rounded-2xl border border-line bg-black/10 p-1', options.length > 4 ? 'scroll-row overflow-x-auto' : 'flex-wrap')} role="radiogroup">
      {options.map((o) => (
        <button key={String(o.value)} role="radio" aria-checked={o.value === value} title={o.title} onClick={() => onChange(o.value)}
          className={cx('flex-1 shrink-0 whitespace-nowrap rounded-xl px-3 font-semibold transition', size === 'sm' ? 'py-1.5 text-xs' : 'py-2 text-sm', o.value === value ? 'bg-brand text-white shadow' : 'text-muted hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-2xl p-2 text-left hover:bg-surface">
      <span><span className="block text-sm font-semibold">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
      <span className={cx('relative h-7 w-12 shrink-0 rounded-full transition', checked ? 'bg-brand' : 'bg-black/30')}>
        <span className={cx('absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
    </button>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, format }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  const id = useId();
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm"><label htmlFor={id} className="font-semibold">{label}</label><span className="tabular-nums text-muted">{format ? format(value) : value}</span></div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--brand)]" />
    </div>
  );
}

/** Numeric input in the player's local currency; reports a base-USD amount. */
export function AmountInput({ country, usd, onChange, label, quick }: { country: string; usd: number; onChange: (usd: number) => void; label?: string; quick?: number[] }) {
  const [text, setText] = useState(() => (usd ? String(Math.round(toLocal(usd, country))) : ''));
  useEffect(() => { setText(usd ? String(Math.round(toLocal(usd, country))) : ''); }, [country]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      {label && <label className="mb-1 block text-xs font-semibold text-muted">{label}</label>}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{currencySymbol(country)}</span>
          <input inputMode="numeric" className="input pl-9" value={text} placeholder="0"
            onChange={(e) => { const t = e.target.value.replace(/[^0-9.]/g, ''); setText(t); onChange(toUSD(Number(t) || 0, country)); }} />
        </div>
        {quick?.map((q) => (
          <button key={q} type="button" className="btn btn-sm" onClick={() => { setText(String(Math.round(toLocal(q, country)))); onChange(q); }}>{fmtMoney(q, country, true)}</button>
        ))}
      </div>
    </div>
  );
}

export function Confirm({ open, title, body, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: { open: boolean; title: string; body: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} footer={
      <div className="flex gap-2"><button className="btn flex-1" onClick={onCancel}>Cancel</button><button className={cx('btn flex-1', danger ? 'btn-danger' : 'btn-primary')} onClick={onConfirm}>{confirmLabel}</button></div>
    }>
      <div className="text-sm text-muted">{body}</div>
    </Modal>
  );
}

/** Button that asks for confirmation first (respecting the "confirm destructive actions" setting). */
export function ConfirmButton({ children, title, body, confirmLabel, danger = true, skip, onConfirm, className, disabled }: { children: ReactNode; title: string; body: ReactNode; confirmLabel?: string; danger?: boolean; skip?: boolean; onConfirm: () => void; className?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={className ?? 'btn btn-sm'} disabled={disabled} onClick={() => (skip ? onConfirm() : setOpen(true))}>{children}</button>
      <Confirm open={open} title={title} body={body} confirmLabel={confirmLabel} danger={danger} onCancel={() => setOpen(false)} onConfirm={() => { setOpen(false); onConfirm(); }} />
    </>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: ReactNode; icon?: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="scroll-row -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={t.id === value} onClick={() => onChange(t.id)} ref={(el) => { if (el && t.id === value) el.scrollIntoView({ inline: 'center', block: 'nearest' }); }}
          className={cx('flex shrink-0 items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-sm font-semibold transition', t.id === value ? 'border-transparent bg-brand text-white shadow-lg' : 'border-line bg-surface text-muted hover:text-ink')}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

export const Divider = () => <hr className="my-3 border-line" />;

export function KV({ k, v, className }: { k: ReactNode; v: ReactNode; className?: string }) {
  return <div className={cx('flex items-baseline justify-between gap-3 py-1 text-sm', className)}><span className="text-muted">{k}</span><span className="text-right font-semibold">{v}</span></div>;
}

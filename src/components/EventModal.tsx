import { useEffect } from 'react';
import { useGame } from '../store/useGame';
import { sfx } from '../lib/sound';
import { Modal, Chip, statMeta } from './ui';
import { fmtMoney } from '../engine/format';
import type { StatKey } from '../engine/types';

const CAT_LABEL: Record<string, string> = {};
const catLabel = (c: string) => CAT_LABEL[c] ?? c.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

/** The active life event. It must be answered — there is no dismiss button by design. */
export function EventModal() {
  const g = useGame((s) => s.game);
  const outcome = useGame((s) => s.outcome);
  const choose = useGame((s) => s.choose);
  const ev = g?.pending;
  const evKey = ev ? `${ev.id}:${g?.player.age}` : '';
  useEffect(() => { if (evKey) sfx(ev?.category === 'prison' || ev?.id.startsWith('jus_') ? 'alarm' : 'event'); }, [evKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!g || !ev || outcome || g.phase === 'dead') return null;
  const p = g.player;
  const left = g.queue.length;
  return (
    <Modal open dismissible={false} title={<span className="flex items-center gap-2"><span className="text-2xl" aria-hidden>{ev.icon}</span>{ev.title}</span>} wide>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Chip>{catLabel(ev.category)}</Chip>
        <Chip>Age {p.age}</Chip>
        {left > 0 && <Chip tone="info">{left} more this year</Chip>}
      </div>
      <p className="mb-4 whitespace-pre-line text-[0.97rem] leading-relaxed">{ev.text}</p>
      <div className="flex flex-col gap-2">
        {ev.choices.map((c, i) => (
          <button key={i} disabled={!!c.disabled} onClick={() => choose(i)} className="btn !justify-between !rounded-2xl !px-4 !py-3 !text-left" data-testid={`choice-${i}`}>
            <span className="min-w-0">
              <span className="block font-semibold">{c.label}</span>
              {(c.hint || c.disabled) && <span className={`mt-0.5 block text-xs font-normal ${c.disabled ? 'text-bad' : 'text-muted'}`}>{c.disabled ?? c.hint}</span>}
            </span>
            {c.cost ? <Chip tone="bad" className="shrink-0">−{fmtMoney(c.cost, p.countryId, true)}</Chip> : null}
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function StatDeltas({ stats }: { stats: Partial<Record<StatKey, number>> }) {
  const items = (Object.entries(stats) as [StatKey, number][]).filter(([, v]) => Math.abs(v) >= 0.5);
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(([k, v]) => (
        <Chip key={k} tone={v > 0 ? 'good' : 'bad'}>{statMeta(k).icon} {statMeta(k).label} {v > 0 ? '+' : ''}{Math.round(v)}</Chip>
      ))}
    </div>
  );
}

export function OutcomeModal() {
  const outcome = useGame((s) => s.outcome);
  const close = useGame((s) => s.closeOutcome);
  const g = useGame((s) => s.game);
  if (!outcome || !g) return null;
  const s = outcome.summary;
  const border = outcome.tone === 'good' ? 'border-good/40' : outcome.tone === 'bad' ? 'border-bad/40' : 'border-line';
  return (
    <Modal open onClose={close} title={<span className="flex items-center gap-2"><span className="text-2xl" aria-hidden>{outcome.icon}</span>{outcome.title}</span>}
      footer={<button className="btn btn-primary w-full" onClick={close} autoFocus>Continue</button>}>
      {outcome.choice && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">You chose: {outcome.choice}</p>}
      <div className={`mb-3 rounded-2xl border bg-surface p-3.5 text-[0.97rem] leading-relaxed ${border}`}>{outcome.text}</div>
      {s && (
        <div className="flex flex-col gap-2">
          <StatDeltas stats={s.stats} />
          {Math.abs(s.money) >= 1 && <div><Chip tone={s.money > 0 ? 'good' : 'bad'}>💵 {s.money > 0 ? '+' : '−'}{fmtMoney(Math.abs(s.money), g.player.countryId, true)}</Chip></div>}
          {s.notes.length > 0 && <ul className="mt-1 list-disc pl-5 text-sm text-muted">{s.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
        </div>
      )}
    </Modal>
  );
}

import { useMemo, useState } from 'react';
import { useGame } from '../../store/useGame';
import { ChanceChip, useDo } from './common';
import { Card, Chip, Money } from '../../components/ui';
import { applyForJob, jobBoard } from '../../engine/career';
import { CAREER_TREE } from '../../engine/data/careerTree';
import { careerById } from '../../engine/data/careers';

/** A tiered "tree" of career paths. Each node shows whether you qualify and lets you apply. */
export function CareerTree() {
  const g = useGame((s) => s.game)!;
  const run = useDo();
  const p = g.player;
  const [pathId, setPathId] = useState(CAREER_TREE[0].id);
  const board = useMemo(() => new Map(jobBoard(g).map((b) => [b.def.id, b])), [g]);
  const path = CAREER_TREE.find((x) => x.id === pathId) ?? CAREER_TREE[0];
  const cur = p.career.job?.careerId;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Career paths">
        {CAREER_TREE.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === pathId} className={`btn btn-sm ${x.id === pathId ? '!border-brand !bg-brand/20' : ''}`} onClick={() => setPathId(x.id)}>{x.icon} {x.name}</button>
        ))}
      </div>
      <p className="text-sm text-muted">{path.blurb}</p>
      <div className="space-y-3">
        {path.tiers.map((t, ti) => (
          <div key={t.label}>
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"><span className="grid h-5 w-5 place-items-center rounded-full bg-brand/20 text-[0.65rem] text-brand">{ti + 1}</span>{t.label}{ti < path.tiers.length - 1 && <span aria-hidden>↓</span>}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {t.ids.map((id) => {
                const b = board.get(id); const def = careerById(id);
                if (!b || !def) return null;
                const here = cur === id;
                return (
                  <Card key={id} className={`!p-3 ${b.eligible ? '' : 'opacity-70'} ${here ? '!border-brand ring-1 ring-brand/40' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden>{def.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{def.title}</div>
                        <div className="text-xs text-muted">from <Money usd={b.startSalary} country={p.countryId} compact />/yr{def.partTime ? ' · part-time' : def.freelance ? ' · freelance' : ''}</div>
                      </div>
                      {here ? <Chip tone="good">Your job</Chip> : b.eligible ? <><ChanceChip chance={b.chance} /><button className="btn btn-primary btn-sm" onClick={() => run((x) => applyForJob(x, id))}>Apply</button></> : <Chip>Locked</Chip>}
                    </div>
                    {!b.eligible && <div className="mt-1.5 text-xs text-bad">{b.reasons.join(' · ')}</div>}
                    {b.eligible && def.ladder && <div className="mt-1.5 text-[0.7rem] text-muted">{def.ladder.join(' → ')}</div>}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

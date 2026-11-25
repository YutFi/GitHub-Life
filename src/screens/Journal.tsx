import { useMemo, useState } from 'react';
import { useGame } from '../store/useGame';
import { Empty, PageHeader, Tabs, cx, toneClass } from '../components/ui';
import type { JournalKind } from '../engine/types';

const FILTERS: { id: 'all' | JournalKind; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'event', label: 'Events' }, { id: 'decision', label: 'Decisions' }, { id: 'career', label: 'Career' }, { id: 'education', label: 'School' },
  { id: 'family', label: 'Family' }, { id: 'finance', label: 'Money' }, { id: 'health', label: 'Health' }, { id: 'milestone', label: 'Milestones' }, { id: 'achievement', label: 'Awards' }, { id: 'world', label: 'World' }, { id: 'crime', label: 'Law' },
];

export function Journal() {
  const g = useGame((s) => s.game)!;
  const [f, setF] = useState<'all' | JournalKind>('all');
  const [q, setQ] = useState('');
  const entries = g.player.journal;
  const groups = useMemo(() => {
    const m = new Map<number, typeof entries>();
    for (const e of entries) {
      if (f !== 'all' && e.kind !== f) continue;
      if (q && !e.text.toLowerCase().includes(q.toLowerCase())) continue;
      m.set(e.age, [...(m.get(e.age) ?? []), e]);
    }
    return [...m.entries()].sort((a, b) => b[0] - a[0]);
  }, [entries, f, q]);
  return (
    <div>
      <PageHeader title="Journal" sub={`${entries.length} moments in the life of ${g.player.firstName}`} />
      <input className="input mb-3" placeholder="Search your story…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search journal" />
      <Tabs tabs={FILTERS} value={f} onChange={setF} />
      {groups.length === 0 ? <Empty icon="📖">{entries.length ? 'Nothing matches that filter.' : 'Nothing has happened yet. Age up to begin your story.'}</Empty> : (
        <div className="space-y-4">
          {groups.map(([age, list]) => (
            <section key={age} className="flex gap-3">
              <div className="w-12 shrink-0 pt-1 text-right"><div className="text-xl font-extrabold leading-none tabular-nums">{age}</div><div className="text-[0.65rem] uppercase text-muted">{list[0].year}</div></div>
              <div className="min-w-0 flex-1 space-y-1.5 border-l-2 border-line pl-3">
                {list.map((e) => (
                  <div key={e.id} className={cx('card p-2.5 text-sm', e.tone === 'good' && 'border-good/30', e.tone === 'bad' && 'border-bad/30')}>
                    <span className={cx(toneClass(e.tone), e.tone === 'neutral' && '!text-ink')}>{e.text}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

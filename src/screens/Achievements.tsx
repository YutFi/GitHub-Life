import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGame } from '../store/useGame';
import { ACHIEVEMENTS } from '../engine/achievements';
import { Meter, PageHeader, Segmented, cx } from '../components/ui';

const TIER_STYLE = { bronze: '#cd7f32', silver: '#cbd5e1', gold: '#fbbf24', legendary: '#c084fc' } as const;

export function Achievements() {
  const nav = useNavigate();
  const meta = useGame((s) => s.meta);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const total = ACHIEVEMENTS.length;
  const done = ACHIEVEMENTS.filter((a) => meta.unlocked[a.id]).length;
  const list = useMemo(() => ACHIEVEMENTS.filter((a) => filter === 'all' || (filter === 'unlocked') === !!meta.unlocked[a.id]), [filter, meta.unlocked]);
  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 pb-10 pt-5">
      <button className="btn btn-ghost btn-sm mb-2" onClick={() => nav(-1)}><ArrowLeft size={16} /> Back</button>
      <PageHeader title="Achievements" sub={`${done} of ${total} unlocked across every life you've lived`} />
      <div className="card mb-4 p-4"><Meter value={done} max={total} color="linear-gradient(90deg,var(--brand),var(--brand2))" label="Achievement progress" height={10} /></div>
      <div className="mb-4"><Segmented value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'unlocked', label: 'Unlocked' }, { value: 'locked', label: 'Locked' }]} /></div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {list.map((a) => {
          const u = meta.unlocked[a.id];
          return (
            <div key={a.id} className={cx('card flex items-center gap-3 p-3', !u && 'opacity-60')} style={u ? { borderColor: TIER_STYLE[a.tier] + '88' } : undefined}>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: u ? TIER_STYLE[a.tier] + '33' : 'rgba(0,0,0,.2)' }} aria-hidden>{u ? a.icon : '🔒'}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2"><span className="truncate font-bold">{a.name}</span><span className="rounded-full px-1.5 text-[0.6rem] font-bold uppercase" style={{ background: TIER_STYLE[a.tier] + '33', color: TIER_STYLE[a.tier] }}>{a.tier}</span></div>
                <div className="text-xs text-muted">{a.desc}</div>
                {u && <div className="mt-0.5 text-[0.7rem] text-muted">Unlocked by {u.who} at age {u.age}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

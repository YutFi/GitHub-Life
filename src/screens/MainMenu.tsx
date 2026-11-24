import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, FolderOpen, Play, Plus, Settings as Cog } from 'lucide-react';
import { useGame } from '../store/useGame';
import { listSlots } from '../engine/save';
import { ACHIEVEMENTS } from '../engine/achievements';
import { Avatar } from '../components/Avatar';
import { Money } from '../components/ui';

export function MainMenu() {
  const nav = useNavigate();
  const meta = useGame((s) => s.meta);
  const loadSlot = useGame((s) => s.loadSlot);
  const toast = useGame((s) => s.toast);
  const slots = useMemo(() => listSlots(), []);
  const playable = slots.filter((s) => !s.empty && !s.corrupted);
  const latest = [...playable].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))[0];
  const unlocked = Object.keys(meta.unlocked).length;

  const cont = () => {
    if (!latest) return;
    const r = loadSlot(latest.slot);
    if (!r.ok) { toast(r.error ?? 'Could not load that save.', 'bad'); return; }
    nav(useGame.getState().game?.phase === 'dead' ? '/death' : '/play');
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="anim-float mx-auto mb-4 grid h-24 w-24 place-items-center rounded-[2rem] text-5xl shadow-2xl" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand2))', boxShadow: 'var(--glow)' }} aria-hidden>🌍</div>
        <h1 className="h-display text-gradient text-5xl font-extrabold tracking-tight">LifeVerse</h1>
        <p className="mt-2 text-sm font-medium text-muted">Your Life. Your Decisions. Your Consequences.</p>
      </div>

      {latest && (
        <button onClick={cont} className="card anim-up mb-3 flex items-center gap-3 p-3 text-left transition hover:brightness-110" data-testid="continue">
          <Avatar seed={`slot${latest.slot}${latest.name}`} age={latest.age} size={52} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Continue</div>
            <div className="truncate font-bold">{latest.name}</div>
            <div className="truncate text-xs text-muted">{latest.flag} Age {latest.age} · {latest.year} · <Money usd={latest.netWorth ?? 0} country={latest.countryId ?? 'us'} compact />{latest.alive ? '' : ' · Deceased'}</div>
          </div>
          <span className="btn btn-primary !rounded-2xl !p-3"><Play size={18} /></span>
        </button>
      )}

      <div className="flex flex-col gap-2.5">
        <button className={`btn ${latest ? '' : 'btn-primary'} !rounded-2xl !py-3.5 !text-base`} onClick={() => nav('/new')} data-testid="new-life"><Plus size={18} /> New Life</button>
        <button className="btn !rounded-2xl !py-3.5 !text-base" onClick={() => nav('/saves')}><FolderOpen size={18} /> Load Game{playable.length ? ` (${playable.length})` : ''}</button>
        <div className="grid grid-cols-2 gap-2.5">
          <button className="btn !rounded-2xl !py-3" onClick={() => nav('/achievements')}><Award size={18} /> Achievements <span className="text-xs text-muted">{unlocked}/{ACHIEVEMENTS.length}</span></button>
          <button className="btn !rounded-2xl !py-3" onClick={() => nav('/settings')}><Cog size={18} /> Settings</button>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-muted">{meta.livesLived > 0 ? `${meta.livesLived} generation${meta.livesLived === 1 ? '' : 's'} continued · ` : ''}Saved locally in your browser · No account needed</p>
    </div>
  );
}

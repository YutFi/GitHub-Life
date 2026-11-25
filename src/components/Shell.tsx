import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Award, BarChart3, BookOpen, Home, LogOut, Menu, Save, Settings as Cog, Users, Zap, FolderOpen, ChevronsRight } from 'lucide-react';
import { useGame } from '../store/useGame';
import { Avatar } from './Avatar';
import { Modal, cx } from './ui';
import { fmtMoney } from '../engine/format';
import { getCountry } from '../engine/data/countries';
import { netWorth } from '../engine/util';
import { STAGE_NAME, stageOf } from '../engine/util';

const NAV = [
  { to: '/play', label: 'Life', icon: Home, end: true },
  { to: '/play/actions', label: 'Actions', icon: Zap },
  { to: '/play/journal', label: 'Journal', icon: BookOpen },
  { to: '/play/stats', label: 'Stats', icon: BarChart3 },
  { to: '/play/family', label: 'Family', icon: Users },
];

export function AgeButton({ big }: { big?: boolean }) {
  const g = useGame((s) => s.game)!;
  const age = useGame((s) => s.age);
  const outcome = useGame((s) => s.outcome);
  const blocked = !!g.pending || !!outcome || g.phase === 'dead';
  return (
    <button className={cx('btn btn-primary', big ? '!rounded-3xl !px-8 !py-4 !text-lg anim-glow w-full' : 'btn-sm')} disabled={blocked} onClick={age} data-testid="age-up">
      <ChevronsRight size={big ? 22 : 16} /> {big ? `Age up to ${g.player.age + 1}` : 'Age up'}
    </button>
  );
}

export function Shell() {
  const g = useGame((s) => s.game)!;
  const saveNow = useGame((s) => s.saveNow);
  const leave = useGame((s) => s.leave);
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const p = g.player;
  const c = getCountry(p.countryId);
  const nw = netWorth(g);
  const items = (
    <>
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cx('flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition max-md:flex-col max-md:gap-0.5 max-md:px-1 max-md:py-1.5 max-md:text-[0.68rem]', isActive ? 'bg-brand text-white shadow-lg' : 'text-muted hover:bg-surface hover:text-ink')}>
          <n.icon size={20} /> {n.label}
        </NavLink>
      ))}
    </>
  );
  const go = (to: string) => { setMenu(false); nav(to); };
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl gap-5 px-3 pb-28 pt-3 md:px-5 md:pb-6">
      <aside className="sticky top-3 hidden h-[calc(100dvh-1.5rem)] w-56 shrink-0 flex-col gap-1 md:flex">
        <div className="card mb-2 flex items-center gap-3 p-3">
          <Avatar seed={p.id} gender={p.gender} age={p.age} size={48} dead={!p.alive} />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{p.firstName} {p.lastName}</div>
            <div className="text-xs text-muted">Age {p.age} · {c.flag}</div>
          </div>
        </div>
        {items}
        <div className="mt-auto flex flex-col gap-1">
          <button className="btn btn-sm !justify-start" onClick={() => saveNow()}><Save size={15} /> Save now</button>
          <button className="btn btn-sm !justify-start" onClick={() => setMenu(true)}><Menu size={15} /> More</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="topwrap md:hidden"><header className="topbar flex items-center gap-3 p-2.5 pr-3">
          <Avatar seed={p.id} gender={p.gender} age={p.age} size={40} dead={!p.alive} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-bold">{p.firstName} {p.lastName}</div>
            <div className="truncate text-xs text-muted">Age {p.age} · {c.flag} · {fmtMoney(nw, p.countryId, true)}</div>
          </div>
          <AgeButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setMenu(true)} aria-label="Menu"><Menu size={18} /></button>
        </header></div>
        <div className="mb-4 hidden items-center justify-between md:flex">
          <div className="text-sm text-muted">{STAGE_NAME[stageOf(p.age)]} · {p.city}, {c.name} · {g.year} · Net worth <b className="text-ink">{fmtMoney(nw, p.countryId, true)}</b>{p.generation > 1 ? ` · Generation ${p.generation}` : ''}</div>
          <AgeButton />
        </div>
        <main className="anim-up"><Outlet /></main>
      </div>

      <nav className="navbar safe-b fixed inset-x-2 bottom-2 z-30 grid grid-cols-5 gap-1 p-1.5 md:hidden" aria-label="Main">{items}</nav>

      <Modal open={menu} onClose={() => setMenu(false)} title="Menu">
        <div className="flex flex-col gap-2">
          <button className="btn !justify-start" onClick={() => { saveNow(); setMenu(false); }}><Save size={17} /> Save now</button>
          <button className="btn !justify-start" onClick={() => go('/saves')}><FolderOpen size={17} /> Save slots, export & import</button>
          <button className="btn !justify-start" onClick={() => go('/achievements')}><Award size={17} /> Achievements</button>
          <button className="btn !justify-start" onClick={() => go('/settings')}><Cog size={17} /> Settings</button>
          <button className="btn !justify-start" onClick={() => { setMenu(false); leave(); nav('/'); }}><LogOut size={17} /> Save & quit to menu</button>
        </div>
      </Modal>
    </div>
  );
}

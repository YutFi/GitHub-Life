import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useGame } from './store/useGame';
import { Toasts } from './components/Toasts';
import { EventModal, OutcomeModal } from './components/EventModal';
import { Shell } from './components/Shell';
import { MainMenu } from './screens/MainMenu';
import { NewLife } from './screens/NewLife';
import { Saves } from './screens/Saves';
import { Achievements } from './screens/Achievements';
import { Settings } from './screens/Settings';
import { Dashboard } from './screens/Dashboard';
import { Actions } from './screens/Actions';
import { Journal } from './screens/Journal';
import { Stats } from './screens/Stats';
import { Family } from './screens/Family';
import { Death } from './screens/Death';
import { Splash } from './components/Splash';
import { sfx, unlockAudio } from './lib/sound';

/** Keeps the URL in step with the game phase and restores the last session after a page refresh. */
function Guard({ children }: { children: React.ReactNode }) {
  const g = useGame((s) => s.game);
  const meta = useGame((s) => s.meta);
  const loadSlot = useGame((s) => s.loadSlot);
  const outcome = useGame((s) => s.outcome);
  const loc = useLocation();
  const nav = useNavigate();
  const needsGame = loc.pathname.startsWith('/play') || loc.pathname.startsWith('/death');

  useEffect(() => {
    if (!g && needsGame) {
      const ok = meta.activeSlot ? loadSlot(meta.activeSlot).ok : false;
      if (!ok) nav('/', { replace: true });
    }
  }, [g, needsGame]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!g || outcome) return;
    if (g.phase === 'dead' && loc.pathname.startsWith('/play')) nav('/death', { replace: true });
    if (g.phase === 'alive' && loc.pathname.startsWith('/death')) nav('/play', { replace: true });
  }, [g, g?.phase, outcome, loc.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { window.scrollTo({ top: 0 }); }, [loc.pathname]);

  if (needsGame && !g) return <div className="grid min-h-dvh place-items-center text-muted">Loading your life…</div>;
  return <>{children}</>;
}

let splashShown = false;

export default function App() {
  const [splash, setSplash] = useState(!splashShown);
  const done = useCallback(() => { splashShown = true; setSplash(false); }, []);
  useEffect(() => {
    // Browsers only allow sound after a gesture, so unlock on the first touch and tap-sound every button after.
    const down = (e: Event) => {
      unlockAudio();
      const el = (e.target as HTMLElement | null)?.closest?.('button, a, [role="button"], summary');
      if (el && !(el as HTMLButtonElement).disabled && !el.closest('.splash')) sfx('tap');
    };
    document.addEventListener('pointerdown', down, { passive: true });
    return () => document.removeEventListener('pointerdown', down);
  }, []);
  return (
    <>
    {splash && <Splash onDone={done} />}
    <Guard>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/new" element={<NewLife />} />
        <Route path="/saves" element={<Saves />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/play" element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="actions" element={<Actions />} />
          <Route path="actions/:panel" element={<Actions />} />
          <Route path="journal" element={<Journal />} />
          <Route path="stats" element={<Stats />} />
          <Route path="family" element={<Family />} />
        </Route>
        <Route path="/death" element={<Death />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <EventModal />
      <OutcomeModal />
      <Toasts />
    </Guard>
    </>
  );
}

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useGame } from '../store/useGame';
import { DEFAULT_TUNING } from '../engine/config';
import type { Difficulty } from '../engine/types';
import { Card, ConfirmButton, PageHeader, Segmented, SectionTitle, Slider, Toggle } from '../components/ui';
import { GAME_VERSION } from '../engine/character';
import { sfx } from '../lib/sound';
import { InstallBox } from '../components/InstallBox';

export function Settings() {
  const nav = useNavigate();
  const meta = useGame((s) => s.meta);
  const game = useGame((s) => s.game);
  const setSettings = useGame((s) => s.setSettings);
  const setTuning = useGame((s) => s.setTuning);
  const reset = useGame((s) => s.resetEverything);
  const s = meta.settings;
  const t = { ...DEFAULT_TUNING, ...(game?.tuning ?? {}) };
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-10 pt-5">
      <button className="btn btn-ghost btn-sm mb-2" onClick={() => nav(-1)}><ArrowLeft size={16} /> Back</button>
      <PageHeader title="Settings" sub="Saved automatically on this device." />

      <SectionTitle>Appearance</SectionTitle>
      <Card className="mb-4 space-y-3">
        <div><div className="mb-1 text-sm font-semibold">Theme</div>
          <Segmented value={s.theme} onChange={(theme) => setSettings({ theme })} options={[{ value: 'dark', label: '🌙 Dark' }, { value: 'light', label: '☀️ Light' }, { value: 'system', label: '💻 System' }]} /></div>
        <Toggle checked={s.reduceMotion} onChange={(reduceMotion) => setSettings({ reduceMotion })} label="Reduce motion" hint="Turns off animations and transitions." />
      </Card>

      <SectionTitle>Sound</SectionTitle>
      <Card className="mb-4 space-y-3">
        <Toggle checked={s.sound} onChange={(sound) => { setSettings({ sound }); if (sound) setTimeout(() => sfx('good'), 60); }} label="Sound effects" hint="Taps, events, achievements, money and prison sounds." />
        {s.sound && <Slider label="Volume" value={s.soundVolume} min={0} max={1} step={0.05} onChange={(v) => setSettings({ soundVolume: v })} format={(v) => `${Math.round(v * 100)}%`} />}
      </Card>

      <SectionTitle>App</SectionTitle>
      <Card className="mb-4 space-y-2">
        <InstallBox />
      </Card>

      <SectionTitle>Game</SectionTitle>
      <Card className="mb-4 space-y-3">
        <Toggle checked={s.autosave} onChange={(autosave) => setSettings({ autosave })} label="Autosave" hint="Save after every action and every year." />
        <Toggle checked={s.confirmDestructive} onChange={(confirmDestructive) => setSettings({ confirmDestructive })} label="Confirm risky actions" hint="Ask before quitting a job, divorcing, selling or declaring bankruptcy." />
        <div><div className="mb-1 text-sm font-semibold">Default difficulty for new lives</div>
          <Segmented value={s.defaultDifficulty} onChange={(defaultDifficulty: Difficulty) => setSettings({ defaultDifficulty })} options={[{ value: 'easy', label: 'Easy' }, { value: 'normal', label: 'Normal' }, { value: 'hard', label: 'Hard' }]} /></div>
      </Card>

      <SectionTitle>Balance tuning</SectionTitle>
      <Card className="mb-4 space-y-4">
        {game ? (
          <>
            <p className="text-xs text-muted">These multipliers apply to the current life ({game.player.firstName}) only. 100% is the default balance.</p>
            <Slider label="Mortality" value={t.mortality} min={0.25} max={2.5} step={0.05} onChange={(v) => setTuning({ mortality: v })} format={pct} />
            <Slider label="Income" value={t.income} min={0.5} max={2} step={0.05} onChange={(v) => setTuning({ income: v })} format={pct} />
            <Slider label="Expenses" value={t.expenses} min={0.5} max={2} step={0.05} onChange={(v) => setTuning({ expenses: v })} format={pct} />
            <Slider label="Event frequency" value={t.eventRate} min={0.4} max={2} step={0.05} onChange={(v) => setTuning({ eventRate: v })} format={pct} />
            <Slider label="Market volatility" value={t.volatility} min={0.3} max={2.5} step={0.05} onChange={(v) => setTuning({ volatility: v })} format={pct} />
            <button className="btn btn-sm" onClick={() => setTuning({ ...DEFAULT_TUNING })}>Reset to defaults</button>
          </>
        ) : <p className="text-sm text-muted">Start or load a life to adjust its balance.</p>}
      </Card>

      <SectionTitle>Data</SectionTitle>
      <Card className="mb-4 space-y-3">
        <button className="btn btn-sm w-full" onClick={() => nav('/saves')}>Manage saves, export & import</button>
        <ConfirmButton className="btn btn-danger btn-sm w-full" title="Erase everything?" confirmLabel="Erase all data" body="This deletes every save slot, your achievements and your settings from this browser. It cannot be undone. Export your games first if you want to keep them." onConfirm={() => { reset(); nav('/'); }}>
          <Trash2 size={15} /> Reset all data
        </ConfirmButton>
      </Card>
      <p className="text-center text-xs text-muted">LifeVerse · save format v{GAME_VERSION} · everything is stored locally in your browser</p>
    </div>
  );
}

import { create } from 'zustand';
import { checkAchievements } from '../engine/achievements';
import { ageUp } from '../engine/aging';
import { snapshot } from '../engine/character';
import { DEFAULT_TUNING } from '../engine/config';
import { continueAsChild } from '../engine/family';
import { popNextEvent, resolveChoice } from '../engine/events';
import type { EffectSummary } from '../engine/events';
import { exportFileName, exportGame, importGame as importGameText, loadGame, loadMeta, resetAllData, saveGame, saveMeta } from '../engine/save';
import { startNewGame } from '../engine/game';
import type { ActionResult, GameState, MetaState, NewGameOptions, SettingsState, Tone, Tuning } from '../engine/types';

export interface Toast { id: number; text: string; tone: Tone; icon?: string }
export interface Outcome { title: string; icon: string; choice: string; text: string; tone: Tone; summary: EffectSummary | null }

interface Store {
  game: GameState | null;
  meta: MetaState;
  outcome: Outcome | null;
  toasts: Toast[];
  busy: boolean;
  // lifecycle
  startNew: (o: NewGameOptions) => void;
  loadSlot: (slot: number) => { ok: boolean; error?: string };
  leave: () => void;
  // gameplay
  age: () => void;
  choose: (index: number) => void;
  act: <T extends ActionResult>(fn: (g: GameState) => T, opts?: { quiet?: boolean; outcome?: boolean }) => T;
  closeOutcome: () => void;
  nextGeneration: (childId: string) => void;
  // persistence
  saveNow: (quiet?: boolean) => boolean;
  exportJson: () => { name: string; text: string } | null;
  importJson: (text: string, slot: number) => { ok: boolean; error?: string };
  resetEverything: () => void;
  // settings
  setSettings: (s: Partial<SettingsState>) => void;
  setTuning: (t: Partial<Tuning>) => void;
  toast: (text: string, tone?: Tone, icon?: string) => void;
  dismissToast: (id: number) => void;
}

let toastId = 1;

export function applyTheme(s: SettingsState) {
  if (typeof document === 'undefined') return;
  const dark = s.theme === 'dark' || (s.theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.classList.toggle('reduce-motion', s.reduceMotion);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a0f20' : '#f2f4ff');
}

const clone = <T,>(v: T): T => structuredClone(v);

export const useGame = create<Store>((set, get) => {
  const meta0 = loadMeta();
  applyTheme(meta0.settings);

  const toast = (text: string, tone: Tone = 'info', icon?: string) => {
    const t: Toast = { id: toastId++, text, tone, icon };
    set((s) => ({ toasts: [...s.toasts.slice(-3), t] }));
  };

  /** Persist after a state change and surface newly unlocked achievements. */
  const commit = (g: GameState, quietAch = false) => {
    snapshot(g);
    const { meta } = get();
    const unlocked = checkAchievements(g, meta);
    if (!quietAch) for (const a of unlocked) toast(`${a.name} — ${a.desc}`, 'good', a.icon);
    if (unlocked.length) saveMeta(meta);
    set({ game: g, meta: { ...meta } });
    if (meta.settings.autosave) {
      const r = saveGame(g);
      if (!r.ok) toast(r.msg, 'bad', '⚠️');
    }
  };

  const toOutcome = (r: ActionResult): Outcome | null => {
    const d = r.data as { outcomeText?: string; summary?: EffectSummary; title?: string; icon?: string; choice?: string } | undefined;
    if (!d || !d.outcomeText || !d.title) return null;
    return { title: d.title, icon: d.icon ?? '✨', choice: d.choice ?? '', text: d.outcomeText, tone: r.tone ?? 'neutral', summary: d.summary ?? null };
  };

  return {
    game: null,
    meta: meta0,
    outcome: null,
    toasts: [],
    busy: false,

    startNew: (o) => {
      const meta = get().meta;
      const g = startNewGame(o, meta);
      meta.activeSlot = o.slot;
      saveMeta(meta);
      saveGame(g);
      set({ game: g, meta: { ...meta }, outcome: null });
      commit(g);
    },

    loadSlot: (slot) => {
      const r = loadGame(slot);
      if (!r.ok || !r.game) return { ok: false, error: r.error };
      const meta = get().meta;
      meta.activeSlot = slot;
      saveMeta(meta);
      set({ game: r.game, meta: { ...meta }, outcome: null });
      if (r.recovered) toast('Your latest save was damaged, so the previous backup was loaded.', 'bad', '🛟');
      return { ok: true };
    },

    leave: () => {
      const g = get().game;
      if (g) saveGame(g);
      set({ game: null, outcome: null });
    },

    age: () => {
      const cur = get().game;
      if (!cur || get().outcome) return;
      const g = clone(cur);
      const r = ageUp(g);
      if (!r.ok) { toast(r.msg, 'bad'); return; }
      commit(g);
    },

    choose: (index) => {
      const cur = get().game;
      if (!cur || !cur.pending) return;
      const g = clone(cur);
      const r = resolveChoice(g, index);
      if (!r.ok) { toast(r.msg, 'bad'); return; }
      if (!g.pending) popNextEvent(g);
      commit(g);
      const oc = toOutcome(r);
      if (oc) set({ outcome: oc });
    },

    act: (fn, opts = {}) => {
      const cur = get().game;
      if (!cur) return { ok: false, msg: 'No game loaded.' } as never;
      const g = clone(cur);
      const r = fn(g);
      if (r.ok) {
        commit(g);
        const oc = opts.outcome !== false ? toOutcome(r) : null;
        if (oc) set({ outcome: oc });
        else if (!opts.quiet) toast(r.msg, r.tone ?? 'good');
      } else {
        // failed actions may still change state (spent energy, failed application) — keep the clone if it differs
        if (JSON.stringify(g) !== JSON.stringify(cur)) commit(g);
        if (!opts.quiet) toast(r.msg, r.tone ?? 'bad');
      }
      return r;
    },

    closeOutcome: () => set({ outcome: null }),

    nextGeneration: (childId) => {
      const cur = get().game;
      if (!cur) return;
      const g = clone(cur);
      const r = continueAsChild(g, childId);
      if (!r.ok) { toast(r.msg, 'bad'); return; }
      const meta = get().meta;
      meta.livesLived++;
      saveMeta(meta);
      commit(g);
      toast(r.msg, 'good', '🌱');
    },

    saveNow: (quiet = false) => {
      const g = get().game;
      if (!g) return false;
      const r = saveGame(g);
      saveMeta(get().meta);
      if (!quiet) toast(r.ok ? 'Game saved.' : r.msg, r.ok ? 'good' : 'bad', r.ok ? '💾' : '⚠️');
      return r.ok;
    },

    exportJson: () => {
      const g = get().game;
      return g ? { name: exportFileName(g), text: exportGame(g) } : null;
    },

    importJson: (text, slot) => {
      const r = importGameText(text, slot);
      if (!r.ok) return { ok: false, error: r.error };
      return { ok: true };
    },

    resetEverything: () => {
      resetAllData();
      const meta = loadMeta();
      applyTheme(meta.settings);
      set({ game: null, meta, outcome: null });
      toast('All saved data was erased.', 'info', '🧹');
    },

    setSettings: (s) => {
      const meta = get().meta;
      meta.settings = { ...meta.settings, ...s };
      applyTheme(meta.settings);
      saveMeta(meta);
      set({ meta: { ...meta } });
    },

    setTuning: (t) => {
      const cur = get().game;
      if (!cur) return;
      const g = clone(cur);
      g.tuning = { ...DEFAULT_TUNING, ...g.tuning, ...t };
      commit(g, true);
    },

    toast,
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  };
});

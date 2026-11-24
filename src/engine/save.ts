// LocalStorage persistence: slots, backups, validation/migration, JSON import/export.
import { GAME_VERSION, emptyCareer, emptyEdu, emptyFinances, emptySkills } from './character';
import { BALANCE, DEFAULT_TUNING } from './config';
import { fullName, netWorth } from './util';
import { getCountry } from './data/countries';
import type { ActionResult, GameState, MetaState, SettingsState } from './types';

export const SLOT_COUNT = 5;
const NS = 'lifeverse:v1:';
const META_KEY = `${NS}meta`;
const slotKey = (n: number) => `${NS}slot:${n}`;
const backupKey = (n: number) => `${NS}slot:${n}:bak`;

export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }

class MemoryStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

function detectStorage(): StorageLike {
  try {
    const ls = (globalThis as { localStorage?: StorageLike }).localStorage;
    if (ls) { const t = `${NS}probe`; ls.setItem(t, '1'); ls.removeItem(t); return ls; }
  } catch { /* private mode / disabled */ }
  return new MemoryStorage();
}
let store: StorageLike = detectStorage();
/** Swap the storage backend (used by tests; `null` restores the browser default). */
export function setStorage(s: StorageLike | null) { store = s ?? detectStorage(); }
export const usingMemoryStorage = () => store instanceof MemoryStorage;

// ------------------------------------------------------------------ meta & settings
export const defaultSettings = (): SettingsState => ({ theme: 'dark', autosave: true, reduceMotion: false, defaultDifficulty: 'normal', confirmDestructive: true });
export const defaultMeta = (): MetaState => ({ version: 1, activeSlot: null, unlocked: {}, settings: defaultSettings(), livesLived: 0 });

export function loadMeta(): MetaState {
  try {
    const raw = store.getItem(META_KEY);
    if (!raw) return defaultMeta();
    const m = JSON.parse(raw) as Partial<MetaState>;
    const d = defaultMeta();
    return {
      version: 1,
      activeSlot: typeof m.activeSlot === 'number' ? m.activeSlot : null,
      unlocked: m.unlocked && typeof m.unlocked === 'object' ? m.unlocked : {},
      settings: { ...d.settings, ...(m.settings ?? {}) },
      livesLived: Number(m.livesLived) || 0,
    };
  } catch { return defaultMeta(); }
}
export function saveMeta(meta: MetaState): boolean {
  try { store.setItem(META_KEY, JSON.stringify(meta)); return true; } catch { return false; }
}

// ------------------------------------------------------------------ validation & migration
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Replace NaN / Infinity anywhere in the tree (defence against corrupted or hand-edited saves). */
function sanitize<T>(v: T): T {
  if (typeof v === 'number') return (Number.isFinite(v) ? v : 0) as T;
  if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = sanitize(v[i]); return v; }
  if (isObj(v)) { for (const k of Object.keys(v)) (v as Record<string, unknown>)[k] = sanitize((v as Record<string, unknown>)[k]); return v; }
  return v;
}

export interface LoadResult { ok: boolean; game?: GameState; error?: string; recovered?: boolean }

/** Check a parsed object looks like a LifeVerse game and fill anything missing. */
export function normalizeGame(raw: unknown): LoadResult {
  if (!isObj(raw)) return { ok: false, error: 'The save file is not a valid game.' };
  const g = raw as unknown as GameState;
  if (typeof g.version !== 'number') return { ok: false, error: 'The save has no version information.' };
  if (g.version > GAME_VERSION) return { ok: false, error: 'This save was created by a newer version of LifeVerse.' };
  const p = g.player as unknown;
  if (!isObj(p) || !isObj(p.stats) || typeof p.age !== 'number' || typeof p.birthYear !== 'number' || !isObj(g.world)) {
    return { ok: false, error: 'The save is missing essential data.' };
  }
  if (typeof (p as { countryId?: unknown }).countryId !== 'string') return { ok: false, error: 'The save is missing the character\'s country.' };
  try {
    sanitize(g);
    const c = g.player;
    c.edu = { ...emptyEdu(), ...(c.edu ?? {}) };
    c.career = { ...emptyCareer(), ...(c.career ?? {}) };
    c.fin = { ...emptyFinances(c.background?.wealthTier ?? 3), ...(c.fin ?? {}) };
    c.fin.card = Object.assign({ balance: 0, limit: 0 }, c.fin.card ?? {});
    c.skills = { ...emptySkills(), ...(c.skills ?? {}) };
    for (const k of ['conditions', 'traits', 'people', 'actions', 'visited', 'journal', 'history', 'achievements'] as const) if (!Array.isArray(c[k])) (c[k] as unknown[]) = [];
    for (const k of ['holdings', 'loans', 'properties', 'vehicles'] as const) if (!Array.isArray(c.fin[k])) (c.fin[k] as unknown[]) = [];
    if (!isObj(c.flags)) c.flags = {};
    c.background = c.background ?? { wealthTier: 3, household: 'two-parent', label: 'Middle class' };
    for (const k of ['health', 'happiness', 'intelligence', 'appearance', 'confidence', 'discipline', 'social'] as const) {
      const v = Number(c.stats[k]);
      c.stats[k] = Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 50;
    }
    c.energy = Number.isFinite(c.energy) ? c.energy : BALANCE.energyPerYear;
    c.generation = c.generation || 1;
    c.willCharity = c.willCharity ?? 0; c.willMode = c.willMode ?? 'equal';
    if (!getCountry(c.countryId)) c.countryId = 'us';
    g.tuning = { ...DEFAULT_TUNING, ...(g.tuning ?? {}) };
    g.queue = Array.isArray(g.queue) ? g.queue : [];
    g.scheduled = Array.isArray(g.scheduled) ? g.scheduled : [];
    g.eventLog = isObj(g.eventLog) ? g.eventLog : {};
    g.lastCategories = Array.isArray(g.lastCategories) ? g.lastCategories : [];
    g.estateShares = Array.isArray(g.estateShares) ? g.estateShares : [];
    g.pending = g.pending ?? null;
    g.candidate = g.candidate ?? null;
    g.deathSummary = g.deathSummary ?? null;
    g.phase = g.phase === 'dead' ? 'dead' : 'alive';
    g.difficulty = (['easy', 'normal', 'hard'] as const).includes(g.difficulty) ? g.difficulty : 'normal';
    g.dynasty = Object.assign({ members: [], generation: c.generation, surname: c.lastName, startedYear: g.year }, isObj(g.dynasty) ? g.dynasty : {});
    g.world = Object.assign({ events: [], history: [] }, g.world) as GameState['world'];
    if (!(g.world.priceIndex > 0)) g.world.priceIndex = 1;
    if (g.phase === 'dead' && !g.deathSummary) return { ok: false, error: 'The save is in an inconsistent state (dead without a summary).' };
    g.version = GAME_VERSION; // migrations above are idempotent: version 1→3 only add fields
    return { ok: true, game: g };
  } catch (e) {
    return { ok: false, error: `The save could not be read (${(e as Error).message}).` };
  }
}

export function parseGame(text: string): LoadResult {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { ok: false, error: 'The file is not valid JSON.' }; }
  // accept both raw games and export envelopes
  if (isObj(data) && data.app === 'lifeverse' && isObj(data.game)) data = data.game;
  return normalizeGame(data);
}

// ------------------------------------------------------------------ slots
export interface SlotInfo {
  slot: number; empty: boolean; corrupted: boolean; name?: string; age?: number; year?: number; country?: string; flag?: string;
  netWorth?: number; generation?: number; alive?: boolean; updatedAt?: string; countryId?: string; recoverable?: boolean;
}

export function saveGame(g: GameState): ActionResult {
  try {
    g.updatedAt = new Date().toISOString();
    const key = slotKey(g.slot);
    const prev = store.getItem(key);
    const text = JSON.stringify(g);
    store.setItem(key, text);
    if (prev) { try { store.setItem(backupKey(g.slot), prev); } catch { /* backup is best-effort */ } }
    return { ok: true, msg: 'Saved.', tone: 'info' };
  } catch (e) {
    return { ok: false, msg: `Could not save (${(e as Error).name === 'QuotaExceededError' ? 'storage is full' : 'storage unavailable'}). Export your game to keep it safe.`, tone: 'bad' };
  }
}

export function loadGame(slot: number): LoadResult {
  const raw = store.getItem(slotKey(slot));
  if (!raw) return { ok: false, error: 'This slot is empty.' };
  const first = parseGame(raw);
  if (first.ok) return first;
  const bak = store.getItem(backupKey(slot));
  if (bak) {
    const second = parseGame(bak);
    if (second.ok) return { ...second, recovered: true };
  }
  return { ok: false, error: `${first.error ?? 'The save is corrupted.'} No usable backup was found.` };
}

export function listSlots(): SlotInfo[] {
  const out: SlotInfo[] = [];
  for (let slot = 1; slot <= SLOT_COUNT; slot++) {
    const raw = store.getItem(slotKey(slot));
    if (!raw) { out.push({ slot, empty: true, corrupted: false }); continue; }
    const r = parseGame(raw);
    if (!r.ok || !r.game) {
      const bak = store.getItem(backupKey(slot));
      out.push({ slot, empty: false, corrupted: true, recoverable: !!bak && parseGame(bak).ok });
      continue;
    }
    const g = r.game; const p = g.player;
    out.push({
      slot, empty: false, corrupted: false, name: fullName(p), age: p.age, year: g.year, country: getCountry(p.countryId).name, flag: getCountry(p.countryId).flag,
      countryId: p.countryId, netWorth: Math.round(netWorth(g)), generation: p.generation, alive: g.phase === 'alive', updatedAt: g.updatedAt,
    });
  }
  return out;
}

export const firstFreeSlot = (): number | null => listSlots().find((s) => s.empty)?.slot ?? null;
export function deleteSlot(slot: number) { try { store.removeItem(slotKey(slot)); store.removeItem(backupKey(slot)); } catch { /* ignore */ } }
export function resetAllData() {
  for (let i = 1; i <= SLOT_COUNT; i++) deleteSlot(i);
  try { store.removeItem(META_KEY); } catch { /* ignore */ }
}

// ------------------------------------------------------------------ export / import
export function exportGame(g: GameState): string {
  return JSON.stringify({ app: 'lifeverse', format: 1, exportedAt: new Date().toISOString(), game: g }, null, 1);
}
export function exportFileName(g: GameState): string {
  const p = g.player;
  return `lifeverse-${p.firstName}-${p.lastName}-age${p.age}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-') + '.json';
}
/** Import JSON text into a slot. Returns the loaded game on success (also written to the slot). */
export function importGame(text: string, slot: number): LoadResult {
  const r = parseGame(text);
  if (!r.ok || !r.game) return r;
  r.game.slot = slot;
  const s = saveGame(r.game);
  if (!s.ok) return { ok: false, error: s.msg };
  return r;
}

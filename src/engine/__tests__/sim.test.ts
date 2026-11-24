import { beforeAll, describe, expect, it } from 'vitest';
import { newGame, randomNewLifeOptions } from '../character';
import { EVENTS } from '../data/events';
import { CAREERS } from '../data/careers';
import { seedRng } from '../rng';
import { playDynasty, playLife } from '../sim';
import { exportGame, importGame, listSlots, loadGame, saveGame, setStorage } from '../save';
import type { GameState } from '../types';

const finite = (v: unknown, path = 'root'): string | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? null : path;
  if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) { const r = finite(v[i], `${path}[${i}]`); if (r) return r; } return null; }
  if (v && typeof v === 'object') { for (const [k, x] of Object.entries(v)) { const r = finite(x, `${path}.${k}`); if (r) return r; } }
  return null;
};

beforeAll(() => setStorage(null));

describe('content', () => {
  it('has 300+ unique event templates', () => {
    const ids = new Set(EVENTS.map((e) => e.id));
    expect(ids.size).toBe(EVENTS.length);
    expect(EVENTS.length).toBeGreaterThanOrEqual(300);
  });
  it('every event has valid choices', () => {
    for (const e of EVENTS) {
      expect(e.choices.length, e.id).toBeGreaterThan(0);
      for (const c of e.choices) expect(c.outcomes.length, `${e.id}:${c.label}`).toBeGreaterThan(0);
      expect(e.ages[0], e.id).toBeLessThanOrEqual(e.ages[1]);
    }
  });
  it('has 30+ careers', () => expect(CAREERS.length).toBeGreaterThanOrEqual(30));
});

describe('headless simulation', () => {
  it('plays 80 seeded lives without crashing or NaN', () => {
    const ages: number[] = [];
    const worth: number[] = [];
    let infant = 0;
    for (let i = 0; i < 80; i++) {
      seedRng(1000 + i);
      const g: GameState = newGame(randomNewLifeOptions());
      const s = playLife(g);
      expect(finite(g), `life ${i}`).toBeNull();
      expect(g.phase).toBe('dead');
      ages.push(s.deathAge);
      worth.push(s.peakNetWorth / g.world.priceIndex);
      if (s.deathAge < 3) infant++;
    }
    const mean = ages.reduce((a, b) => a + b, 0) / ages.length;
    worth.sort((a, b) => a - b);
    // eslint-disable-next-line no-console
    console.log(`mean death age ${mean.toFixed(1)} · min ${Math.min(...ages)} · max ${Math.max(...ages)} · infant ${infant} · median peak NW ${Math.round(worth[40])} · p90 ${Math.round(worth[72])}`);
    expect(mean).toBeGreaterThan(62);
    expect(mean).toBeLessThan(92);
    expect(infant).toBeLessThan(6);
  });

  it('plays multi-generation dynasties', () => {
    for (let i = 0; i < 6; i++) {
      seedRng(77 + i);
      const g = newGame(randomNewLifeOptions({ wealthTier: 4 }));
      const lives = playDynasty(g, 3);
      expect(lives.length).toBeGreaterThanOrEqual(1);
      expect(finite(g)).toBeNull();
      expect(g.dynasty.members.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('saves', () => {
  it('round-trips, exports/imports and recovers from corruption', () => {
    const store = new Map<string, string>();
    setStorage({ getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v), removeItem: (k) => void store.delete(k) });
    seedRng(5);
    const g = newGame(randomNewLifeOptions({ slot: 2 }));
    for (let i = 0; i < 12; i++) playLife(g, { maxAge: g.player.age + 1 });
    expect(saveGame(g).ok).toBe(true);
    const back = loadGame(2);
    expect(back.ok).toBe(true);
    expect(back.game?.player.age).toBe(g.player.age);
    expect(JSON.stringify(back.game?.player.fin)).toBe(JSON.stringify(g.player.fin));
    // export -> import into another slot
    const imp = importGame(exportGame(g), 4);
    expect(imp.ok).toBe(true);
    expect(listSlots()[3].empty).toBe(false);
    // second save creates a backup; corrupting the primary falls back to it
    saveGame(g);
    const key = [...store.keys()].find((k) => k.includes('2') && !k.includes('bak') && !k.includes('backup') && k !== 'x');
    if (key) store.set(key, '{not json');
    const rec = loadGame(2);
    expect(rec.ok).toBe(true);
    expect(rec.recovered).toBe(true);
    // garbage import is rejected cleanly
    expect(importGame('not json at all', 1).ok).toBe(false);
    setStorage(null);
  });
});

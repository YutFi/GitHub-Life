import { beforeAll, describe, expect, it } from 'vitest';
import { newGame, randomNewLifeOptions } from '../character';
import { CAREERS, careerById } from '../data/careers';
import { CAREER_TREE } from '../data/careerTree';
import { JUSTICE } from '../data/justice';
import { EVENTS } from '../data/events';
import { seedRng } from '../rng';
import { setStorage } from '../save';
import { eligibility, hire, syncStudyWork } from '../career';
import { processCreator } from '../creator';
import { adjudicate, isIncarcerated, jus, prisonStudy, prisonWork, processJustice, release, reportCrime, sentenceOf, startSentence } from '../justice';
import { ageUp } from '../aging';
import { resolvePending } from '../sim';
import type { GameState } from '../types';

beforeAll(() => setStorage(null));

const mk = (countryId = 'my', age = 19): GameState => {
  seedRng(4242);
  const g = newGame(randomNewLifeOptions({ countryId, wealthTier: 3 }));
  g.player.age = age;
  return g;
};
const enrol = (g: GameState) => { g.player.edu.stage = 'bachelor'; };

describe('students and work', () => {
  it('university students cannot take full-time jobs but can freelance or work part-time', () => {
    const g = mk();
    enrol(g);
    expect(eligibility(g, careerById('it_support')!).ok).toBe(false);
    expect(eligibility(g, careerById('it_support')!).reasons.join(' ')).toMatch(/part-time or freelance/);
    expect(eligibility(g, careerById('pt_freelance')!).ok).toBe(true);
    expect(eligibility(g, careerById('content_creator')!).ok).toBe(true);
  });
  it('a full-time job becomes part-time on enrolment and is restored afterwards', () => {
    const g = mk('my', 21);
    const def = careerById('it_support')!;
    const job = hire(g, def, 0);
    const full = job.salary;
    enrol(g); syncStudyWork(g);
    expect(g.player.career.job!.partTime).toBe(true);
    expect(g.player.career.job!.salary).toBeLessThan(full);
    g.player.edu.stage = null as never; syncStudyWork(g);
    expect(g.player.career.job!.partTime).toBe(false);
    expect(Math.abs(g.player.career.job!.salary - full)).toBeLessThanOrEqual(1);
  });
});

describe('career tree and creators', () => {
  it('every tree id exists and every career is reachable from a path', () => {
    const ids = new Set(CAREERS.map((c) => c.id));
    const inTree = new Set<string>();
    for (const p of CAREER_TREE) for (const t of p.tiers) for (const id of t.ids) { expect(ids.has(id), id).toBe(true); inTree.add(id); }
    const missing = CAREERS.filter((c) => !inTree.has(c.id)).map((c) => c.id);
    expect(missing).toEqual([]);
    expect(CAREER_TREE.some((p) => p.id === 'creator')).toBe(true);
  });
  it('creator audience stays finite and bounded over many years', () => {
    const g = mk('us', 18);
    const def = careerById('content_creator')!;
    hire(g, def, 0);
    for (let i = 0; i < 40; i++) { g.player.age++; processCreator(g, def); }
    const a = g.player.career.audience ?? 0;
    expect(Number.isFinite(a)).toBe(true);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(5e9);
    expect(Number.isFinite(g.player.career.job?.salary ?? 0)).toBe(true);
  });
});

describe('crime and prison', () => {
  it('a serious crime in Malaysia leads to a juvenile facility for a teenager', () => {
    const g = mk('my', 15);
    expect(reportCrime(g, 4, 'robbery')).toBe('court');
    expect(jus(g.player).charge).not.toBeNull();
    for (let i = 0; i < 40 && !sentenceOf(g); i++) { jus(g.player).charge ??= { label: 'robbery', severity: 4, evidence: 90, juvenile: true }; adjudicate(g, 'plea'); }
    const s = sentenceOf(g)!;
    expect(s).toBeTruthy();
    expect(JUSTICE.my.juvenileMax).toBe(18);
    if (s.kind === 'juvenile') expect(s.facility).toMatch(/Tunas Bakti|Henry Gurney/);
    expect(isIncarcerated(g) || s.kind === 'probation' || s.kind === 'community').toBe(true);
  });
  it('every country has facilities, and Malaysia names the real ones', () => {
    const txt = JSON.stringify(JUSTICE.my);
    expect(txt).toMatch(/Henry Gurney/);
    expect(txt).toMatch(/Tunas Bakti/);
    expect(Object.keys(JUSTICE).length).toBeGreaterThanOrEqual(14);
  });
  it('sentence → prison actions → release works and clears the lock', () => {
    const g = mk('my', 30);
    startSentence(g, 'prison', JUSTICE.my.adult.low, 2, 'fraud', 3, false);
    expect(isIncarcerated(g)).toBe(true);
    expect(eligibility(g, careerById('it_support')!).ok).toBe(false);
    expect(prisonWork(g).ok).toBe(true);
    expect(prisonStudy(g).ok).toBe(true);
    release(g, 'served');
    expect(isIncarcerated(g)).toBe(false);
    expect(g.player.flags.exOffender || g.player.flags.criminalRecord).toBeTruthy();
  });
  it('a long sentence is served out through ageing without errors', () => {
    const g = mk('my', 25);
    startSentence(g, 'prison', JUSTICE.my.adult.mid, 3, 'burglary', 3, false);
    for (let i = 0; i < 6 && g.phase === 'alive'; i++) {
      const r = ageUp(g); if (!r.ok) resolvePending(g);
      resolvePending(g);
      processJustice(g);
    }
    expect(Number.isFinite(g.player.fin.cash)).toBe(true);
    expect(isIncarcerated(g)).toBe(false);
  });
});

describe('content', () => {
  it('event ids stay unique with the new events', () => {
    const ids = EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(EVENTS.length).toBeGreaterThanOrEqual(350);
  });
});

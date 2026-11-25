// A simple autoplay "bot" used by the headless tests and balance tuning. It plays a reasonable,
// slightly randomised life through the same public engine API the UI uses.
import { ageUp } from './aging';
import { listActivities, doActivity } from './activities';
import { applyForJob, jobBoard, retire, canRetire } from './career';
import { applyToDegree, availableDegrees } from './education';
import { resolveChoice, popNextEvent } from './events';
import { continueAsChild, eligibleHeirs } from './family';
import { buyProperty, buyVehicle, deposit, invest, repayLoan, payCard, setContribution } from './finance';
import { isIncarcerated, paroleEligible, prisonAppeal, prisonCounselling, prisonExercise, prisonParole, prisonStudy, prisonWork, prisonWriteHome } from './justice';
import { acceptCandidate, growFamily, proposeMarriage, scoutRomance, makeFriend } from './relationships';
import { chance, pick, rnd } from './rng';
import { partnerOf, livingChildren } from './util';
import type { GameState } from './types';

export interface BotOptions { ambition?: number; maxAge?: number }

export function resolvePending(g: GameState) {
  let guard = 0;
  popNextEvent(g);
  while (g.pending && guard++ < 40) {
    const n = g.pending.choices.length;
    const open = g.pending.choices.map((c, i) => (c.disabled ? -1 : i)).filter((i) => i >= 0);
    const idx = open.length ? pick(open) : 0;
    const r = resolveChoice(g, idx);
    if (!r.ok) { g.pending = null; }
    void n;
    popNextEvent(g);
  }
}

/** Take a handful of reasonable yearly decisions. */
export function botYear(g: GameState, o: BotOptions = {}) {
  const p = g.player;
  if (isIncarcerated(g)) {
    for (const f of [prisonWork, prisonStudy, prisonCounselling, prisonExercise, prisonWriteHome]) if (chance(0.7)) f(g);
    if (chance(0.3)) prisonAppeal(g);
    if (paroleEligible(g)) prisonParole(g);
    return;
  }
  const ambition = o.ambition ?? 0.6;
  // education
  if (p.age >= 17 && !p.edu.stage && p.edu.level === 'secondary' && p.edu.degrees.length < 1 && chance(0.5 * ambition + 0.15)) {
    const opts = availableDegrees(g).filter((d) => d.ok && d.def.level === 'bachelor');
    if (opts.length) applyToDegree(g, pick(opts).def.id);
  }
  // job
  if (!p.career.job && !p.career.retired && !p.edu.stage && p.age >= 16 && p.age < 66) {
    const board = jobBoard(g).filter((j) => j.eligible && !j.def.special && j.def.id !== 'entrepreneur' && j.chance > 0.12);
    const picks = [...board].sort(() => rnd() - 0.5).slice(0, 4);
    for (const j of picks) { if (applyForJob(g, j.def.id).ok) break; }
  }
  // finances
  const f = p.fin;
  if (p.age >= 18) {
    if (f.card.balance > 0) payCard(g, 'all');
    const keep = 3000 * g.world.priceIndex;
    if (f.cash > keep * 3) { const sur = f.cash - keep * 2; if (p.age < 55 && chance(0.6)) invest(g, 'index', sur * 0.5); deposit(g, sur * 0.3); }
    if (f.loans.length && f.cash > keep * 6) repayLoan(g, f.loans[0].id, 'all');
    if (p.career.job && f.contrib < 8) setContribution(g, 8);
    if (!f.properties.length && p.age >= 28 && p.career.job && chance(0.15)) buyProperty(g, 1, true, true);
    if (!f.vehicles.length && p.age >= 20 && p.career.job && chance(0.2)) buyVehicle(g, 0, true);
  }
  // love & family
  if (p.age >= 18 && !partnerOf(p) && chance(0.35)) { const r = scoutRomance(g); if (r.ok) acceptCandidate(g); }
  const partner = p.people.find((x) => x.relation === 'partner' && x.alive);
  if (partner && !partner.youth && partner.closeness > 60 && p.age >= 24 && chance(0.25)) proposeMarriage(g, 'courthouse', false);
  if (partnerOf(p)?.relation === 'spouse' && p.age >= 25 && p.age <= 40 && livingChildren(p).length < 2 && chance(0.4)) growFamily(g, 'natural');
  if (p.age >= 6 && chance(0.3)) makeFriend(g);
  // activities
  const acts = listActivities(g).filter((a) => a.available && a.def.group !== 'Risky');
  for (let i = 0; i < 2 && acts.length; i++) { const a = pick(acts); if (a.available) doActivity(g, a.def.id); }
  // retirement
  if (!p.career.retired && p.age >= 62 && canRetire(g).ok && chance(0.5)) retire(g);
}

export interface LifeSummary {
  deathAge: number; peakNetWorth: number; netWorth: number; generation: number; kids: number; degrees: number; events: number; crashed?: string;
}

/** Play one life from the current state until death (or maxAge). */
export function playLife(g: GameState, o: BotOptions = {}): LifeSummary {
  let events = 0;
  const maxAge = o.maxAge ?? 125;
  while (g.phase === 'alive' && g.player.age < maxAge) {
    const before = g.player.journal.length;
    botYear(g, o);
    const r = ageUp(g);
    if (!r.ok) { resolvePending(g); continue; }
    if ((g.phase as string) === 'dead') break;
    events += g.queue.length + (g.pending ? 1 : 0);
    resolvePending(g);
    void before;
  }
  const p = g.player;
  return {
    deathAge: p.age, peakNetWorth: p.fin.peakNetWorth, netWorth: g.deathSummary?.netWorth ?? 0, generation: p.generation,
    kids: p.people.filter((x) => x.relation === 'child').length, degrees: p.edu.degrees.length, events,
  };
}

/** Play a whole dynasty, continuing as the richest/eldest child each time. */
export function playDynasty(g: GameState, generations: number, o: BotOptions = {}): LifeSummary[] {
  const out: LifeSummary[] = [];
  for (let i = 0; i < generations; i++) {
    out.push(playLife(g, o));
    if (g.phase !== 'dead') break;
    const heirs = eligibleHeirs(g);
    if (!heirs.length) break;
    heirs.sort((a, b) => b.inheritance - a.inheritance);
    if (!continueAsChild(g, heirs[0].id).ok) break;
  }
  return out;
}
void rnd;

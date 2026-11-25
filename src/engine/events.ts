import { BALANCE } from './config';
import { EVENTS } from './data/events';
import { fmtMoney } from './format';
import { canAfford, creditLimit, payFromAssets } from './finance';
import { fireFromJob, promote, quitJob } from './career';
import { finalizeDeath } from './family';
import { addSibling, newFriend } from './relationships';
import { genPerson } from './people';
import { chance, clamp, gauss, pick, rint, weightedPick } from './rng';
import {
  addStat, countryOf, diff, econScale, incFlag, log, no, ok, setFlag, wageScale,
} from './util';
import { getCountry } from './data/countries';
import type {
  ActionResult, ActiveEvent, Effects, EventCtx, EventTemplate, GameState, Outcome, Person, StatKey,
} from './types';

const byId = new Map<string, EventTemplate>();
export const templateById = (id: string) => {
  let t = byId.get(id);
  if (!t || !EVENTS.includes(t)) { t = EVENTS.find((x) => x.id === id); if (t) byId.set(id, t); }
  return t;
};

export const makeCtx = (g: GameState, targets: Record<string, string> = {}): EventCtx => ({ g, p: g.player, age: g.player.age, country: countryOf(g), targets });

const RELS = ['friend', 'partner', 'mother', 'father', 'sibling', 'child', 'boss', 'coworker', 'spouse'] as const;
export function pickPerson(g: GameState, key: string, targets: Record<string, string> = {}): Person | undefined {
  const p = g.player;
  if (targets[key]) { const t = p.people.find((x) => x.id === targets[key]); if (t) return t; }
  const rel = key === 'partner' ? ['partner', 'spouse'] : key === 'spouse' ? ['spouse'] : key === 'bestfriend' ? ['friend'] : [key];
  const pool = p.people.filter((x) => rel.includes(x.relation) && x.alive);
  if (!pool.length) return undefined;
  return key === 'bestfriend' ? [...pool].sort((a, b) => b.closeness - a.closeness)[0] : pick(pool);
}

export function tokenize(g: GameState, text: string, targets: Record<string, string>, tokens: Record<string, string> = {}): string {
  const p = g.player;
  const c = countryOf(g);
  return text.replace(/\{([^}]+)\}/g, (_, raw: string) => {
    const k = raw.trim();
    if (k.startsWith('$')) return fmtMoney(parseFloat(k.slice(1)) * econScale(g), p.countryId, true);
    if (tokens[k]) return tokens[k];
    switch (k) {
      case 'name': return p.firstName;
      case 'city': return p.city;
      case 'country': return c.name;
      case 'company': return p.career.job?.company ?? 'your company';
      case 'job': return p.career.job?.title ?? 'your job';
      case 'school': return p.edu.schoolName || 'school';
      case 'degree': return p.edu.degreeName ?? 'your degree';
      case 'teacher': return tokens.teacher ?? 'your teacher';
      case 'year': return String(g.year);
      default: {
        const per = pickPerson(g, k, targets);
        return per ? per.name.split(' ')[0] : k === 'friend' ? 'a friend' : k === 'partner' ? 'your partner' : `your ${k}`;
      }
    }
  });
}

function neededTargets(t: EventTemplate): string[] {
  const s = new Set<string>();
  const scan = (txt: string) => { for (const m of txt.matchAll(/\{([^}$]+)\}/g)) if ((RELS as readonly string[]).includes(m[1]) || m[1] === 'bestfriend') s.add(m[1]); };
  scan(t.text);
  for (const c of t.choices) for (const oc of c.outcomes) {
    scan(oc.text);
    const r = oc.fx?.rel; if (r) (Array.isArray(r[0]) ? (r as [string, number, number?][]) : [r as [string, number, number?]]).forEach((x) => s.add(x[0]));
  }
  return [...s];
}

export function buildActive(g: GameState, t: EventTemplate): ActiveEvent {
  const targets: Record<string, string> = {};
  for (const k of neededTargets(t)) { const per = pickPerson(g, k); if (per) targets[k] = per.id; }
  const tokens: Record<string, string> = { teacher: pick(['Ms. Alvarez', 'Mr. Okoye', 'Mrs. Tan', 'Mr. Becker', 'Ms. Haddad', 'Mr. Fernandez', 'Dr. Kim']) };
  const bound = t.prep?.(g);
  if (bound) { Object.assign(targets, bound.targets); Object.assign(tokens, bound.tokens); }
  const ctx = makeCtx(g, targets);
  const sc = econScale(g);
  return {
    id: t.id, title: t.title, icon: t.icon, category: t.category, targets, tokens,
    text: tokenize(g, t.text, targets, tokens),
    choices: t.choices.map((c) => {
      const cost = c.cost ? Math.round(c.cost * sc) : 0;
      let disabled: string | undefined;
      if (c.when && !c.when(ctx)) disabled = c.disabledReason ?? 'Not available';
      else if (cost > 0 && !canAfford(g, cost)) disabled = `You can't afford ${fmtMoney(cost, g.player.countryId, true)}`;
      return { label: tokenize(g, c.label, targets, tokens), hint: c.hint, cost: cost || undefined, disabled };
    }),
  };
}

function isEligible(g: GameState, t: EventTemplate, scheduled = false): boolean {
  const p = g.player;
  const age = p.age;
  const rec = g.eventLog[t.id];
  const ctx = makeCtx(g);
  if (!scheduled) {
    if (age < t.ages[0] || age > t.ages[1]) return false;
    if (t.yearMin && g.year < t.yearMin) return false;
    if (t.yearMax && g.year > t.yearMax) return false;
    const cool = t.cooldown ?? BALANCE.events.defaultCooldown;
    if (rec && age - rec.last < cool) return false;
  }
  const max = t.max ?? (t.force ? 1 : BALANCE.events.defaultMax);
  if (rec && rec.count >= max) return false;
  if (t.when && !t.when(ctx)) return false;
  return true;
}

function queueTemplate(g: GameState, t: EventTemplate, front = false) {
  const active = buildActive(g, t);
  const rec = g.eventLog[t.id] ?? { count: 0, last: -99 };
  rec.count++; rec.last = g.player.age;
  g.eventLog[t.id] = rec;
  if (front) g.queue.unshift(active); else g.queue.push(active);
}

/** Choose this year's interactive events. */
export function rollYearEvents(g: GameState) {
  const p = g.player;
  const age = p.age;
  // follow-ups scheduled by earlier decisions
  const due = g.scheduled.filter((s) => s.dueAge <= age);
  g.scheduled = g.scheduled.filter((s) => s.dueAge > age);
  for (const s of due) {
    const t = templateById(s.id);
    if (t && chance(s.chance) && isEligible(g, t, true)) queueTemplate(g, t, true);
  }
  // milestone events
  for (const t of EVENTS) if (t.force && age >= t.ages[0] && age <= t.ages[1] && isEligible(g, t)) queueTemplate(g, t);

  const expected = BALANCE.events.perYear(age) * g.tuning.eventRate;
  let n = 0;
  if (chance(Math.min(0.97, expected))) { n = 1; if (age >= 6 && chance(BALANCE.events.secondEventChance * Math.min(1, expected))) n = 2; }
  const used = new Set<string>(g.queue.map((q) => q.id));
  for (let i = 0; i < n; i++) {
    const pool = EVENTS.filter((t) => !t.force && !used.has(t.id) && isEligible(g, t));
    const ctx = makeCtx(g);
    const t = weightedPick(pool, (x) => {
      let w = typeof x.weight === 'function' ? x.weight(ctx) : x.weight;
      if (g.lastCategories.includes(x.category)) w *= BALANCE.events.categoryRepeatPenalty;
      return w;
    });
    if (!t) break;
    used.add(t.id);
    queueTemplate(g, t);
    g.lastCategories = [t.category, ...g.lastCategories].slice(0, 2);
  }
}

export function popNextEvent(g: GameState): ActiveEvent | null {
  if (g.pending) return g.pending;
  g.pending = g.queue.shift() ?? null;
  return g.pending;
}

function chooseOutcome(ctx: EventCtx, outcomes: Outcome[]): Outcome {
  return weightedPick(outcomes, (x) => (typeof x.w === 'function' ? x.w(ctx) : x.w ?? 1)) ?? outcomes[0];
}

export interface EffectSummary { stats: Partial<Record<StatKey, number>>; money: number; notes: string[] }

const STAT_KEYS: StatKey[] = ['health', 'happiness', 'intelligence', 'appearance', 'confidence', 'discipline', 'social'];

export function applyEffects(g: GameState, fx: Effects, ctx: EventCtx): EffectSummary {
  const p = g.player;
  const before = { ...p.stats };
  const f = p.fin;
  const liqBefore = f.cash + f.savings - f.card.balance;
  const notes: string[] = [];
  const harsh = diff(g).eventHarshness;
  for (const k of STAT_KEYS) {
    const d = fx[k];
    if (d) addStat(p, k, d < 0 ? d * harsh : d);
  }
  if (fx.money) {
    const scaled = Math.round(fx.money * econScale(g) * (fx.money > 0 ? g.tuning.income : g.tuning.expenses * harsh));
    if (scaled >= 0) f.cash += scaled; else payFromAssets(g, -scaled);
  }
  if (fx.rawMoney) { if (fx.rawMoney >= 0) f.cash += fx.rawMoney; else payFromAssets(g, -fx.rawMoney); }
  if (fx.debt) f.card.balance += Math.round(fx.debt * econScale(g));
  if (fx.skill) for (const k of Object.keys(fx.skill) as (keyof typeof p.skills)[]) p.skills[k] = clamp(p.skills[k] + (fx.skill[k] ?? 0), 0, 100);
  if (fx.rel) {
    const list = (Array.isArray(fx.rel[0]) ? fx.rel : [fx.rel]) as [string, number, number?][];
    for (const [who, d, tr] of list) {
      const targets = who === 'family' ? p.people.filter((x) => ['mother', 'father', 'sibling', 'guardian'].includes(x.relation) && x.alive)
        : who === 'parents' ? p.people.filter((x) => ['mother', 'father', 'guardian'].includes(x.relation) && x.alive)
        : who === 'everyone' ? p.people.filter((x) => x.alive && !['exPartner', 'exSpouse'].includes(x.relation))
        : [pickPerson(g, who, ctx.targets)].filter(Boolean) as Person[];
      for (const per of targets) { per.closeness = clamp(per.closeness + d, 0, 100); if (tr) per.trust = clamp(per.trust + tr, 0, 100); }
    }
  }
  if (fx.flag) for (const [k, v] of Object.entries(fx.flag)) p.flags[k] = v;
  if (fx.inc) for (const [k, v] of Object.entries(fx.inc)) incFlag(p, k, v);
  if (fx.sched) {
    const list = (Array.isArray(fx.sched[0]) ? fx.sched : [fx.sched]) as [string, number, number, number?][];
    for (const [id, a, b, c] of list) g.scheduled.push({ id, dueAge: p.age + rint(a, b), chance: c ?? 1 });
  }
  if (fx.scholarship && p.edu.stage) p.edu.scholarship = { name: 'Special Scholarship', pct: fx.scholarship };
  if (fx.grades) { p.edu.grades = clamp(p.edu.grades + fx.grades, 0, 100); p.edu.avg = clamp(p.edu.avg + fx.grades * 0.5, 0, 100); }
  if (fx.expel && p.edu.stage) { p.edu.stage = null; p.edu.dropouts++; notes.push('You were expelled from school.'); }
  if (fx.cond && !p.conditions.includes(fx.cond)) { p.conditions.push(fx.cond); notes.push(`New health condition: ${fx.cond}`); }
  if (fx.cure) p.conditions = p.conditions.filter((x) => x !== fx.cure);
  if (fx.crime) { incFlag(p, 'crimes', fx.crime); if (fx.crime >= 2 && p.age >= 18) { setFlag(p, 'criminalRecord', true); p.career.reputation = clamp(p.career.reputation - 8 * fx.crime, 0, 100); notes.push('You now have a criminal record.'); } }
  if (fx.salaryPct && p.career.job) p.career.job.salary = Math.round(p.career.job.salary * (1 + fx.salaryPct));
  if (fx.job) {
    const j = p.career.job;
    if (fx.job === 'fire' && j) fireFromJob(g, 'fired');
    else if (fx.job === 'layoff' && j) fireFromJob(g, 'laid off');
    else if (fx.job === 'promote' && j) { if (promote(g)) notes.push('Promoted!'); }
    else if (fx.job === 'raise' && j) { j.salary = Math.round(j.salary * 1.08); notes.push('Salary +8%'); }
    else if (fx.job === 'bonus' && j) { const b = Math.round(j.salary * 0.12); f.cash += b; }
    else if (fx.job === 'quit' && j) quitJob(g);
  }
  if (fx.add) {
    const a = fx.add;
    if (a.rel === 'friend') { const fr = newFriend(g, 5); p.people.push(fr); notes.push(`New friend: ${fr.name}`); }
    else if (a.rel === 'sibling') { const s = addSibling(g); if (s) notes.push(`New sibling: ${s.name}`); }
    else if (a.rel === 'partner' && !p.people.some((x) => (x.relation === 'partner' || x.relation === 'spouse') && x.alive) && p.age >= 14) {
      const age = p.age < 18 ? clamp(p.age + rint(-1, 1), 14, 17) : clamp(p.age + rint(-6, 8), 18, 90);
      const per = genPerson({ relation: 'partner', age, year: g.year, culture: countryOf(g).names, closeness: a.closeness ?? 55, tier: pick([2, 3, 3, 4]), wageScale: wageScale(g), metAge: p.age });
      per.youth = p.age < 18;
      p.people.push(per); setFlag(p, 'hadPartner', true); notes.push(`You are now dating ${per.name}`);
    } else if (a.rel === 'coworker') p.people.push(genPerson({ relation: 'coworker', age: rint(23, 55), year: g.year, culture: countryOf(g).names, closeness: 45, tier: 3, wageScale: wageScale(g), metAge: p.age }));
  }
  if (fx.end) {
    const per = pickPerson(g, fx.end, ctx.targets);
    if (per) { per.relation = per.relation === 'spouse' ? 'exSpouse' : per.relation === 'friend' ? 'exPartner' : per.relation === 'partner' ? 'exPartner' : per.relation; per.endedAge = p.age; if (per.relation === 'exPartner' && fx.end === 'friend') { p.people = p.people.filter((x) => x.id !== per.id); } }
  }
  if (fx.ach) setFlag(p, `ach_${fx.ach}`, true);
  if (fx.run) { const msg = fx.run(ctx); if (msg) notes.push(msg); }
  if (fx.death) finalizeDeath(g, fx.death);
  const stats: Partial<Record<StatKey, number>> = {};
  for (const k of STAT_KEYS) { const d = Math.round((p.stats[k] - before[k]) * 10) / 10; if (Math.abs(d) >= 0.5) stats[k] = Math.round(d); }
  return { stats, money: Math.round(f.cash + f.savings - f.card.balance - liqBefore), notes };
}

export interface EventResult extends ActionResult { data: { outcomeText: string; summary: EffectSummary; title: string; icon: string; choice: string } }

export function resolveChoice(g: GameState, index: number): ActionResult {
  const ev = g.pending;
  if (!ev) return no('There is no event to resolve.');
  const t = templateById(ev.id);
  if (!t) { g.pending = null; return no('This event no longer exists.'); }
  const choice = t.choices[index];
  const meta = ev.choices[index];
  if (!choice || !meta) return no('Invalid choice.');
  if (meta.disabled) return no(meta.disabled);
  const cost = meta.cost ?? 0;
  if (cost > 0 && !canAfford(g, cost)) return no('You cannot afford that.');
  const ctx = makeCtx(g, ev.targets);
  if (cost > 0) payFromAssets(g, cost);
  const outcome = chooseOutcome(ctx, choice.outcomes);
  const text = tokenize(g, outcome.text, ev.targets, ev.tokens);
  const before = g.player.fin.cash + g.player.fin.savings - g.player.fin.card.balance;
  const summary = applyEffects(g, outcome.fx ?? {}, ctx);
  if (cost > 0) summary.money -= cost;
  void before;
  g.pending = null;
  const net = Object.values(summary.stats).reduce((s, v) => s + (v ?? 0), 0);
  const tone = net > 2 || summary.money > 0 && net >= 0 ? 'good' : net < -2 || (summary.money < 0 && net <= 0 && Math.abs(summary.money) > 300 * econScale(g)) ? 'bad' : 'neutral';
  if (g.phase === 'alive') {
    log(g, 'decision', `${ev.icon} ${ev.title}: ${tokenize(g, choice.label, ev.targets, ev.tokens)}`, 'neutral');
    log(g, 'event', text, tone);
  }
  return { ok: true, msg: text, tone, data: { outcomeText: text, summary, title: ev.title, icon: ev.icon, choice: tokenize(g, choice.label, ev.targets, ev.tokens) } };
}

void creditLimit; void gauss; void getCountry;

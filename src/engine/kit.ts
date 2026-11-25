// Authoring helpers for events and activities: keeps content definitions compact and declarative.
import { econScale, flagNum, livingChildren, netWorth, partnerOf } from './util';
import type { Economy, EventChoice, EventCtx, EventTemplate, Effects, Outcome } from './types';

export const o = (text: string, fx: Effects = {}, w: Outcome['w'] = 1): Outcome => ({ text, fx, w });
export const ch = (label: string, outcomes: Outcome[], extra: Partial<EventChoice> = {}): EventChoice => ({ label, outcomes, ...extra });
export const ev = (
  id: string, category: string, ages: [number, number], icon: string, title: string, text: string, choices: EventChoice[],
  extra: Partial<EventTemplate> = {},
): EventTemplate => ({ id, title, icon, category, text, ages, weight: 1, choices, ...extra });
/** a one-button story beat */
export const story = (id: string, category: string, ages: [number, number], icon: string, title: string, text: string, result: string, fx: Effects = {}, extra: Partial<EventTemplate> = {}) =>
  ev(id, category, ages, icon, title, text, [ch('Take it in', [o(result, fx)])], extra);

const liq = (c: EventCtx) => c.p.fin.cash + c.p.fin.savings;
const sentOf = (c: EventCtx) => c.p.justice?.sentence ?? null;
export const P = {
  prison: (c: EventCtx) => { const s = sentOf(c); return !!s && (s.kind === 'prison' || s.kind === 'juvenile' || s.kind === 'rehab'); },
  juvenileInside: (c: EventCtx) => { const s = sentOf(c); return !!s && s.kind === 'juvenile'; },
  probation: (c: EventCtx) => { const s = sentOf(c); return !!s && (s.kind === 'probation' || s.kind === 'community'); },
  exOffender: (c: EventCtx) => !!c.p.flags.exOffender && !sentOf(c),
  free: (c: EventCtx) => { const s = sentOf(c); return !s || s.kind === 'probation' || s.kind === 'community'; },
  employed: (c: EventCtx) => !!c.p.career.job && !c.p.career.job.partTime,
  working: (c: EventCtx) => !!c.p.career.job,
  jobless: (c: EventCtx) => !c.p.career.job && !c.p.career.retired && c.p.age >= 18 && !c.p.edu.stage,
  retired: (c: EventCtx) => c.p.career.retired,
  student: (c: EventCtx) => !!c.p.edu.stage,
  uni: (c: EventCtx) => ['bachelor', 'master', 'doctorate', 'vocational'].includes(c.p.edu.stage ?? ''),
  inSchool: (c: EventCtx) => ['primary', 'secondary', 'kindergarten'].includes(c.p.edu.stage ?? ''),
  partner: (c: EventCtx) => !!c.p.people.find((x) => x.relation === 'partner' && x.alive),
  spouse: (c: EventCtx) => !!c.p.people.find((x) => x.relation === 'spouse' && x.alive),
  attached: (c: EventCtx) => !!partnerOf(c.p),
  single: (c: EventCtx) => !partnerOf(c.p),
  kids: (c: EventCtx) => livingChildren(c.p).length > 0,
  minorKids: (c: EventCtx) => livingChildren(c.p).some((k) => c.g.year - k.birthYear < 18),
  friend: (c: EventCtx) => c.p.people.some((x) => x.relation === 'friend' && x.alive),
  sibling: (c: EventCtx) => c.p.people.some((x) => x.relation === 'sibling' && x.alive),
  mother: (c: EventCtx) => c.p.people.some((x) => x.relation === 'mother' && x.alive),
  father: (c: EventCtx) => c.p.people.some((x) => x.relation === 'father' && x.alive),
  parent: (c: EventCtx) => c.p.people.some((x) => (x.relation === 'mother' || x.relation === 'father') && x.alive),
  boss: (c: EventCtx) => c.p.people.some((x) => x.relation === 'boss' && x.alive),
  coworker: (c: EventCtx) => c.p.people.some((x) => x.relation === 'coworker' && x.alive),
  cash: (n: number) => (c: EventCtx) => liq(c) >= n * econScale(c.g),
  netWorthOver: (n: number) => (c: EventCtx) => netWorth(c.g) >= n * c.g.world.priceIndex,
  poor: (c: EventCtx) => netWorth(c.g) < 8000 * econScale(c.g),
  inDebt: (c: EventCtx) => c.p.fin.card.balance + c.p.fin.loans.filter((l) => l.kind !== 'mortgage').reduce((s, l) => s + l.balance, 0) > 1000 * econScale(c.g),
  owner: (c: EventCtx) => c.p.fin.properties.length > 0,
  car: (c: EventCtx) => c.p.fin.vehicles.length > 0,
  investor: (c: EventCtx) => c.p.fin.holdings.length > 0,
  country: (...ids: string[]) => (c: EventCtx) => ids.includes(c.p.countryId),
  econ: (e: Economy) => (c: EventCtx) => c.g.world.economy === e,
  flag: (k: string) => (c: EventCtx) => !!c.p.flags[k],
  noFlag: (k: string) => (c: EventCtx) => !c.p.flags[k],
  flagMin: (k: string, n: number) => (c: EventCtx) => flagNum(c.p, k) >= n,
  stat: (k: keyof EventCtx['p']['stats'], min: number) => (c: EventCtx) => c.p.stats[k] >= min,
  statBelow: (k: keyof EventCtx['p']['stats'], max: number) => (c: EventCtx) => c.p.stats[k] <= max,
  trait: (t: string) => (c: EventCtx) => c.p.traits.includes(t),
  industry: (...ids: string[]) => (c: EventCtx) => !!c.p.career.job && ids.includes(c.p.career.job.careerId),
  degree: (...fields: string[]) => (c: EventCtx) => c.p.edu.degrees.some((d) => fields.includes(d.field)),
  educated: (c: EventCtx) => c.p.edu.degrees.some((d) => d.level === 'bachelor' || d.level === 'master' || d.level === 'doctorate'),
  business: (c: EventCtx) => !!c.p.career.business,
  condition: (name: string) => (c: EventCtx) => c.p.conditions.includes(name),
  noCondition: (name: string) => (c: EventCtx) => !c.p.conditions.includes(name),
  year: (min: number, max = 9999) => (c: EventCtx) => c.g.year >= min && c.g.year <= max,
};
export const all = (...fs: ((c: EventCtx) => boolean)[]) => (c: EventCtx) => fs.every((f) => f(c));
export const any = (...fs: ((c: EventCtx) => boolean)[]) => (c: EventCtx) => fs.some((f) => f(c));
export const not = (f: (c: EventCtx) => boolean) => (c: EventCtx) => !f(c);

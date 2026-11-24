import { BALANCE } from './config';
import { clamp, uid } from './rng';
import { getCountry } from './data/countries';
import type {
  ActionResult, Character, Country, GameState, JournalKind, LifeStage, Person, StatKey, Tone,
} from './types';

export const countryOf = (g: GameState): Country => getCountry(g.player.countryId);
export const diff = (g: GameState) => BALANCE.difficulty[g.difficulty];

/** price level × country wage level – scales salaries, windfalls and costs that track earnings */
export const wageScale = (g: GameState) => countryOf(g).wageIndex * g.world.priceIndex;
/** price level × cost-of-living – scales everyday expenses */
export const costScale = (g: GameState) => countryOf(g).costIndex * g.world.priceIndex;
/** blended scale used for event money so a "$500 surprise" feels right everywhere */
export const econScale = (g: GameState) => (countryOf(g).wageIndex * 0.55 + countryOf(g).costIndex * 0.45) * g.world.priceIndex;

export const stageOf = (age: number): LifeStage =>
  age <= 2 ? 'baby' : age <= 12 ? 'child' : age <= 17 ? 'teen' : age <= 25 ? 'youngAdult' : age <= 59 ? 'adult' : 'senior';

export const STAGE_NAME: Record<LifeStage, string> = {
  baby: 'Baby', child: 'Childhood', teen: 'Teenage years', youngAdult: 'Young adult', adult: 'Adult', senior: 'Senior',
};

export const addStat = (p: Character, k: StatKey, d: number) => {
  p.stats[k] = clamp(p.stats[k] + d, 0, 100);
};

export const flagNum = (p: Character, k: string): number => {
  const v = p.flags[k];
  return typeof v === 'number' ? v : v === true ? 1 : 0;
};

export function log(g: GameState, kind: JournalKind, text: string, tone: Tone = 'neutral') {
  const p = g.player;
  p.journal.push({ id: uid('j'), age: p.age, year: g.year, kind, text, tone });
  if (p.journal.length > BALANCE.maxJournal) p.journal.splice(0, p.journal.length - BALANCE.maxJournal);
}

export const ok = (msg: string, tone: Tone = 'good', data?: unknown): ActionResult => ({ ok: true, msg, tone, data });
export const no = (msg: string): ActionResult => ({ ok: false, msg, tone: 'bad' });

export function personAge(g: GameState, per: Person): number {
  const end = per.alive ? g.year : per.deathYear ?? g.year;
  return end - per.birthYear;
}

export const alive = (p: Character, rel: Person['relation']) => p.people.filter((x) => x.relation === rel && x.alive);
export const findRel = (p: Character, rel: Person['relation']) => p.people.find((x) => x.relation === rel && x.alive);
export const partnerOf = (p: Character) => findRel(p, 'spouse') ?? findRel(p, 'partner');
export const childrenOf = (p: Character) => p.people.filter((x) => x.relation === 'child');
export const livingChildren = (p: Character) => childrenOf(p).filter((c) => c.alive);

export const fullName = (p: Character) => `${p.firstName} ${p.lastName}`;

export function netWorth(g: GameState): number {
  const f = g.player.fin;
  let n = f.cash + f.savings + f.retirement + f.trust;
  n += f.holdings.reduce((s, h) => s + h.value, 0);
  n += f.properties.reduce((s, h) => s + h.value, 0);
  n += f.vehicles.reduce((s, h) => s + h.value, 0);
  n -= f.loans.reduce((s, l) => s + l.balance, 0);
  n -= f.card.balance;
  const b = g.player.career.business;
  if (b) n += Math.max(0, b.capital + b.profit * 2);
  return n;
}

/** net worth in 2025 dollars (comparable across eras) */
export const realNetWorth = (g: GameState) => netWorth(g) / g.world.priceIndex;
export const liquid = (g: GameState) => {
  const f = g.player.fin;
  return f.cash + f.savings + f.holdings.reduce((s, h) => s + h.value, 0);
};

export function currentIncome(g: GameState): number {
  const p = g.player;
  const r = p.fin.lastReport;
  if (r) return r.income.salary + r.income.business + r.income.pension + r.income.rental + r.income.partner;
  return p.career.job?.salary ?? 0;
}

export const hasKnownFlag = (p: Character, k: string) => !!p.flags[k];
export const setFlag = (p: Character, k: string, v: number | boolean | string = true) => {
  p.flags[k] = v;
};
export const incFlag = (p: Character, k: string, d = 1) => {
  p.flags[k] = flagNum(p, k) + d;
};

export const monthly = (annual: number) => annual / 12;

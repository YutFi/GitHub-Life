import { BALANCE, DEFAULT_TUNING } from './config';
import { getCountry } from './data/countries';
import { randomFirstName, randomSurname } from './data/names';
import { traitById } from './data/traits';
import { genPerson, randomTraits, TIER_INCOME, TIER_NAME } from './people';
import { newWorld } from './world';
import { chance, clamp, gauss, pick, rint, uid } from './rng';
import type {
  Background, CareerState, Character, EducationState, Finances, GameState, Gender, NewGameOptions, Person, SkillKey, Skills, Stats,
} from './types';

export const GAME_VERSION = 3;

export const emptySkills = (): Skills => ({ tech: 0, business: 0, creative: 0, medical: 0, trades: 0, communication: 0, leadership: 0, athletic: 0 });

export function emptyEdu(): EducationState {
  return {
    level: 'none', stage: null, yearInStage: 0, stageYears: 0, grades: 60, avg: 60, secondaryAvg: 60, admission: 0, degrees: [],
    effort: 'normal', scholarship: null, failedYears: 0, dropouts: 0, schoolName: '', appliedThisYear: false, tuitionDue: 0, history: [],
  };
}
export function emptyCareer(): CareerState {
  return {
    job: null, history: [], experience: {}, totalYears: 0, unemployedYears: 0, retired: false, effort: 'normal', reputation: 50,
    lastReview: null, appsThisYear: 0, pension: 0, salaryHistory: [], business: null, lastSalary: 0,
  };
}
export function emptyFinances(tier: number): Finances {
  return {
    cash: 0, savings: 0, holdings: [], retirement: 0, contrib: 4, loans: [], card: { balance: 0, limit: 0 }, creditScore: 650,
    properties: [], vehicles: [], housing: { kind: 'family', quality: clamp(tier - 1, 1, 4) }, lifestyle: 'normal', trust: 0, lastReport: null,
    bankruptcies: 0, donated: 0, peakNetWorth: 0, totalInherited: 0, lottery: 0,
  };
}

export function rollStats(traits: string[], tier: number, age = 0): Stats {
  const t = (tier - 3) * 1.4;
  const s: Stats = {
    health: gauss(74 + t, 9), happiness: gauss(72, 9), intelligence: gauss(50 + t * 0.8, 16), appearance: gauss(50, 16),
    confidence: gauss(age < 5 ? 50 : 46, 12), discipline: gauss(age < 5 ? 35 : 40, 12), social: gauss(50, 14),
  };
  for (const id of traits) {
    const mods = traitById(id)?.stats;
    if (mods) for (const k of Object.keys(mods) as (keyof Stats)[]) s[k] += mods[k] ?? 0;
  }
  for (const k of Object.keys(s) as (keyof Stats)[]) s[k] = Math.round(clamp(s[k], 4, 98));
  return s;
}

export const BACKGROUND_LABELS: Record<Background['household'], string> = {
  'two-parent': 'Two-parent household', 'single-mother': 'Raised by a single mother', 'single-father': 'Raised by a single father',
  guardian: 'Raised by a grandparent',
};

export function randomCity(countryId: string) {
  return pick(getCountry(countryId).cities);
}

export function makeFamily(p: Character, g: Pick<GameState, 'year' | 'difficulty'>, priceAtBirth: number) {
  const c = getCountry(p.birthCountry);
  const culture = c.names;
  const tier = p.background.wealthTier;
  const ws = c.wageIndex * priceAtBirth * BALANCE.difficulty[g.difficulty].startWealth;
  const sur = p.lastName;
  const hh = p.background.household;
  const mAge = rint(22, 37);
  const fAge = mAge + rint(-3, 6);
  const mom = genPerson({ relation: 'mother', age: mAge, year: g.year, culture, gender: 'female', surname: sur, closeness: gauss(78, 10), tier, wageScale: ws, metAge: 0 });
  const dad = genPerson({ relation: 'father', age: fAge, year: g.year, culture, gender: 'male', surname: sur, closeness: gauss(70, 12), tier, wageScale: ws, metAge: 0 });
  mom.genes = { intelligence: gauss(50, 14), appearance: gauss(50, 15), health: gauss(70, 10), confidence: gauss(45, 12), discipline: gauss(40, 12), social: gauss(50, 12) };
  dad.genes = { intelligence: gauss(50, 14), appearance: gauss(50, 15), health: gauss(70, 10), confidence: gauss(45, 12), discipline: gauss(40, 12), social: gauss(50, 12) };
  const people: Person[] = [mom, dad];
  if (hh === 'single-mother') { dad.absent = true; dad.closeness = clamp(gauss(30, 14), 5, 60); dad.income = Math.round(dad.income * 0.7); mom.income = Math.round(mom.income * 0.75); }
  if (hh === 'single-father') { mom.absent = true; mom.closeness = clamp(gauss(30, 14), 5, 60); mom.income = Math.round(mom.income * 0.7); dad.income = Math.round(dad.income * 0.8); }
  if (hh === 'guardian') {
    mom.absent = true; dad.absent = true; mom.closeness = 35; dad.closeness = 25;
    const gm = genPerson({ relation: 'guardian', age: rint(55, 72), year: g.year, culture, gender: pick<Gender>(['male', 'female']), surname: sur, closeness: gauss(85, 8), tier, wageScale: ws, metAge: 0 });
    people.push(gm);
  }
  // elder siblings
  const sibCount = pick([0, 0, 1, 1, 1, 2, 2, 3]);
  for (let i = 0; i < sibCount; i++) {
    const sib = genPerson({ relation: 'sibling', age: rint(1, 11), year: g.year, culture, surname: sur, closeness: gauss(62, 14), tier, wageScale: ws });
    sib.income = 0; sib.wealth = 0; sib.job = undefined;
    people.push(sib);
  }
  p.people = people;
  void TIER_INCOME;
}

/** Build a brand-new character plus family. */
export function createCharacter(o: NewGameOptions, difficulty: GameState['difficulty'], priceAtBirth: number): Character {
  const country = getCountry(o.countryId);
  const stats = o.stats ?? rollStats(o.traits, o.wealthTier);
  const p: Character = {
    id: uid('c'), firstName: o.firstName, lastName: o.lastName, gender: o.gender, birthYear: o.birthYear,
    birthCountry: o.countryId, birthCity: o.city, countryId: o.countryId, city: o.city, age: 0, alive: true,
    stats, skills: emptySkills(), traits: o.traits, conditions: [],
    background: { wealthTier: o.wealthTier, household: o.household, label: `${TIER_NAME[o.wealthTier]} · ${BACKGROUND_LABELS[o.household]}` },
    edu: emptyEdu(), career: emptyCareer(), fin: emptyFinances(o.wealthTier), people: [], flags: {}, energy: BALANCE.energyPerYear, actions: [],
    visited: [o.countryId], journal: [], history: [], achievements: [], generation: 1, willCharity: 0, willMode: 'equal',
  };
  makeFamily(p, { year: o.birthYear, difficulty }, priceAtBirth);
  void country;
  return p;
}

export function newGame(o: NewGameOptions): GameState {
  const country = getCountry(o.countryId);
  const world = newWorld(o.birthYear, country, o.difficulty === 'hard');
  const p = createCharacter(o, o.difficulty, world.priceIndex);
  const now = new Date().toISOString();
  const g: GameState = {
    version: GAME_VERSION, id: uid('g'), slot: o.slot, createdAt: now, updatedAt: now, year: o.birthYear, difficulty: o.difficulty,
    tuning: { ...DEFAULT_TUNING }, player: p, world, queue: [], pending: null, scheduled: [], eventLog: {}, lastCategories: [],
    candidate: null, dynasty: { surname: o.lastName, generation: 1, members: [], startedYear: o.birthYear }, deathSummary: null,
    phase: 'alive', estateShares: [],
  };
  const mom = p.people.find((x) => x.relation === 'mother');
  p.journal.push({
    id: uid('j'), age: 0, year: o.birthYear, kind: 'milestone', tone: 'good',
    text: `👶 ${o.firstName} ${o.lastName} was born in ${o.city}, ${country.name}. ${mom ? `Your mother, ${mom.name}, holds you close.` : ''}`,
  });
  snapshot(g);
  return g;
}

/** Record this year's stats for the charts. */
export function snapshot(g: GameState) {
  const p = g.player;
  const f = p.fin;
  const nw = f.cash + f.savings + f.retirement + f.trust + f.holdings.reduce((s, h) => s + h.value, 0) + f.properties.reduce((s, h) => s + h.value, 0)
    + f.vehicles.reduce((s, h) => s + h.value, 0) - f.loans.reduce((s, l) => s + l.balance, 0) - f.card.balance;
  const r = f.lastReport;
  const income = r ? r.income.salary + r.income.business + r.income.pension + r.income.rental + r.income.partner + r.income.benefits : 0;
  const idx = p.history.findIndex((h) => h.age === p.age);
  const pt = { age: p.age, year: g.year, health: Math.round(p.stats.health), happiness: Math.round(p.stats.happiness), intelligence: Math.round(p.stats.intelligence), netWorth: Math.round(nw), income: Math.round(income) };
  if (idx >= 0) p.history[idx] = pt; else p.history.push(pt);
}

export const SKILL_NAMES: Record<SkillKey, string> = {
  tech: 'Technology', business: 'Business', creative: 'Creativity', medical: 'Medical', trades: 'Technical trades',
  communication: 'Communication', leadership: 'Leadership', athletic: 'Athleticism',
};

export function randomNewLifeOptions(overrides: Partial<NewGameOptions> = {}): NewGameOptions {
  const countryId = overrides.countryId ?? pick(['us', 'uk', 'ca', 'au', 'de', 'jp', 'in', 'br', 'my', 'sg', 'fr', 'mx', 'ng', 'kr']);
  const c = getCountry(countryId);
  const gender: Gender = overrides.gender ?? (chance(0.5) ? 'male' : 'female');
  const traits = overrides.traits ?? randomTraits(3);
  const wealthTier = (overrides.wealthTier ?? pick([1, 2, 2, 3, 3, 3, 4, 4, 5])) as 1 | 2 | 3 | 4 | 5;
  return {
    firstName: randomFirstName(c.names, gender), lastName: randomSurname(c.names), gender, countryId, city: pick(c.cities),
    birthYear: rint(1985, 2008), wealthTier, household: pick(['two-parent', 'two-parent', 'two-parent', 'single-mother', 'single-father', 'guardian']),
    traits, difficulty: 'normal', slot: 1, ...overrides,
  };
}

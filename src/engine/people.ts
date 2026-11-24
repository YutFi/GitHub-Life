import { chance, clamp, gauss, pick, rint, rnd, uid } from './rng';
import { randomFirstName, randomSurname } from './data/names';
import { traitById, TRAITS } from './data/traits';
import type { Gender, Genes, Person, Relation } from './types';

export const TIER_INCOME = [0, 18000, 34000, 62000, 140000, 380000];
export const TIER_WEALTH = [0, 3000, 25000, 150000, 700000, 3500000];
export const TIER_NAME = ['', 'Struggling', 'Working class', 'Middle class', 'Affluent', 'Wealthy elite'];

const JOBS_BY_TIER: string[][] = [
  [],
  ['Cleaner', 'Warehouse worker', 'Shop assistant', 'Day labourer', 'Taxi driver', 'Casual worker'],
  ['Factory worker', 'Bus driver', 'Cashier', 'Mechanic', 'Care assistant', 'Electrician', 'Farmer'],
  ['Teacher', 'Accountant', 'Nurse', 'Office manager', 'Engineer', 'Civil servant', 'Shop owner'],
  ['Doctor', 'Lawyer', 'Software architect', 'Company director', 'Surgeon', 'Professor'],
  ['Business owner', 'Investment banker', 'Hospital executive', 'Property developer', 'Media mogul'],
];
export const jobFor = (tier: number) => pick(JOBS_BY_TIER[clamp(Math.round(tier), 1, 5)]);

export function randomTraits(n: number): string[] {
  const out: string[] = [];
  const pool = [...TRAITS];
  let guard = 0;
  while (out.length < n && guard++ < 60) {
    const t = pick(pool);
    if (out.includes(t.id)) continue;
    if (out.some((o) => traitById(o)?.conflicts?.includes(t.id) || t.conflicts?.includes(o))) continue;
    out.push(t.id);
  }
  return out;
}

export interface PersonOpts {
  relation: Relation;
  age: number; // age in years at `year`
  year: number;
  culture: string;
  gender?: Gender;
  surname?: string;
  closeness?: number;
  tier?: number; // wealth tier 1..5
  wageScale?: number; // wageIndex * priceIndex at `year`
  metAge?: number;
  traits?: string[];
  name?: string;
}

export function genPerson(o: PersonOpts): Person {
  const gender: Gender = o.gender ?? (chance(0.5) ? 'male' : 'female');
  const tier = o.tier ?? pick([2, 3, 3, 3, 4]);
  const ws = o.wageScale ?? 1;
  const ageFactor = o.age < 18 ? 0 : o.age > 66 ? 0.55 : o.age < 25 ? 0.6 : 1;
  const income = Math.round(TIER_INCOME[tier] * ws * ageFactor * clamp(gauss(1, 0.22), 0.5, 1.9));
  const wealth = Math.round(TIER_WEALTH[tier] * ws * clamp(gauss(1, 0.4), 0.2, 3) * clamp(o.age / 45, 0.05, 1.6));
  return {
    id: uid('p'),
    name: o.name ?? `${randomFirstName(o.culture, gender)} ${o.surname ?? randomSurname(o.culture)}`,
    gender,
    birthYear: o.year - o.age,
    alive: true,
    relation: o.relation,
    closeness: clamp(o.closeness ?? gauss(60, 14), 5, 100),
    trust: clamp(gauss(60, 15), 5, 100),
    compatibility: Math.round(clamp(gauss(62, 16), 15, 98)),
    wealth,
    income,
    job: o.age >= 18 ? jobFor(tier) : undefined,
    traits: o.traits ?? randomTraits(2),
    history: [],
    metAge: o.metAge ?? 0,
    surname: o.surname,
  };
}

/** Child's genetic potential: average of the parents' tendencies with mutation. */
export function inheritGenes(a: Partial<Genes> | undefined, b: Partial<Genes> | undefined): Genes {
  const mix = (k: keyof Genes, base = 50) => clamp(((a?.[k] ?? base) + (b?.[k] ?? base)) / 2 + gauss(0, 11), 8, 98);
  return {
    intelligence: mix('intelligence'), appearance: mix('appearance'), health: mix('health', 70),
    confidence: mix('confidence', 45), discipline: mix('discipline', 40), social: mix('social'),
  };
}

export const RANDOM_HOBBIES = ['gardening', 'painting', 'football', 'chess', 'cooking', 'cycling', 'photography', 'board games', 'hiking', 'guitar'];
void rnd; void rint;

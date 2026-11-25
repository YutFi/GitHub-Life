// Death, inheritance and dynasty (generational play).
import { BALANCE } from './config';
import { getCountry } from './data/countries';
import { traitById } from './data/traits';
import { causeOfDeath } from './mortality';
import { emptyCareer, emptyEdu, emptyFinances, emptySkills, rollStats, snapshot, BACKGROUND_LABELS } from './character';
import { highestDegreeName, initEducationForAge } from './education';
import { genPerson, TIER_NAME } from './people';
import { newFriend } from './relationships';
import { clamp, chance, gauss, pick, rint, uid } from './rng';
import {
  childrenOf, countryOf, fullName, livingChildren, log, no, ok, partnerOf, personAge, realNetWorth, wageScale,
} from './util';
import { fmtMoney } from './format';
import type {
  ActionResult, Character, DeathSummary, EstateShare, GameState, Gender, JobRecord, LifeRecord, Person, Stats,
} from './types';

const money = (g: GameState, v: number) => fmtMoney(v, g.player.countryId, true);

// ------------------------------------------------------------------ estate
export interface Estate { gross: number; debts: number; tax: number; charity: number; net: number; shares: EstateShare[] }

/** What the character's assets are worth when settled, and who receives them. */
export function computeEstate(g: GameState): Estate {
  const p = g.player;
  const f = p.fin;
  const c = countryOf(g);
  let gross = f.cash + f.savings + f.retirement + f.trust;
  gross += f.holdings.reduce((s, h) => s + h.value, 0);
  gross += f.properties.reduce((s, h) => s + h.value * (1 - BALANCE.finance.sellingCost), 0);
  gross += f.vehicles.reduce((s, h) => s + h.value, 0);
  if (p.career.business) gross += Math.max(0, p.career.business.capital);
  const debts = f.loans.reduce((s, l) => s + l.balance, 0) + f.card.balance;
  const net = Math.max(0, gross - debts);
  const exemption = 150000 * wageScale(g);
  const tax = Math.round(Math.max(0, net - exemption) * c.inheritanceTax);
  const charityRate = BALANCE.finance.estateCharity[clamp(p.willCharity ?? 0, 0, BALANCE.finance.estateCharity.length - 1)];
  const charity = Math.round((net - tax) * charityRate);
  const pool = Math.max(0, net - tax - charity);
  const shares: EstateShare[] = [];
  const spouse = p.people.find((x) => x.relation === 'spouse' && x.alive);
  const kids = livingChildren(p).sort((a, b) => a.birthYear - b.birthYear);
  const push = (per: Person, amount: number) => { if (amount > 0) shares.push({ id: per.id, name: per.name, amount: Math.round(amount), relation: per.relation }); };
  if (pool > 0) {
    if (spouse && kids.length) {
      push(spouse, pool * 0.4);
      splitKids(kids, pool * 0.6, p.willMode, push);
    } else if (spouse) push(spouse, pool);
    else if (kids.length) splitKids(kids, pool, p.willMode, push);
    else {
      const sibs = p.people.filter((x) => x.relation === 'sibling' && x.alive);
      const parents = p.people.filter((x) => ['mother', 'father', 'guardian'].includes(x.relation) && x.alive);
      const rel = sibs.length ? sibs : parents;
      for (const r of rel) push(r, pool / rel.length);
    }
  }
  return { gross: Math.round(gross), debts: Math.round(debts), tax, charity, net: Math.round(net), shares };
}

function splitKids(kids: Person[], amount: number, mode: 'equal' | 'eldest', push: (p: Person, a: number) => void) {
  if (mode === 'eldest' && kids.length > 1) {
    push(kids[0], amount * 0.6);
    for (const k of kids.slice(1)) push(k, (amount * 0.4) / (kids.length - 1));
  } else for (const k of kids) push(k, amount / kids.length);
}

// ------------------------------------------------------------------ legacy
export function legacyScore(g: GameState): number {
  const p = g.player;
  const c = countryOf(g);
  const hist = p.history;
  const avgHappy = hist.length ? hist.reduce((s, h) => s + h.happiness, 0) / hist.length : p.stats.happiness;
  const life = Math.min(18, (p.age / Math.max(60, c.lifeExpectancy + 5)) * 18);
  const wealth = clamp(Math.log10(Math.max(1, realNetWorth(g)) / 10000) * 5.5, 0, 16);
  const peak = clamp(Math.log10(Math.max(1, p.fin.peakNetWorth / g.world.priceIndex) / 10000) * 2, 0, 5);
  const career = Math.min(14, (p.career.history.length ? Math.max(...p.career.history.map((h) => h.level)) * 2 : 0) + Math.min(6, p.career.totalYears / 6));
  const family = Math.min(14, livingChildren(p).length * 3 + (childrenOf(p).length ? 2 : 0) + (partnerOf(p) ? 3 : 0) + (p.flags.grandparent ? 2 : 0));
  const edu = Math.min(10, ['none', 'primary', 'secondary', 'vocational', 'bachelor', 'master', 'doctorate'].indexOf(p.edu.level) * 1.6);
  const ach = Math.min(8, p.achievements.length * 0.8);
  const give = Math.min(6, Math.log10(Math.max(1, p.fin.donated / g.world.priceIndex)) * 1.2);
  const happy = (avgHappy / 100) * 9;
  return Math.round(clamp(life + wealth + peak + career + family + edu + ach + give + happy, 0, 100));
}

const legacyText = (s: number) =>
  s >= 85 ? 'A towering legacy. Your story will be told for generations.'
    : s >= 70 ? 'A remarkable life, rich in achievement and love.'
      : s >= 55 ? 'A good, full life that left people better off.'
        : s >= 40 ? 'An ordinary life with its share of joys and regrets.'
          : s >= 25 ? 'A quiet, difficult life — but you endured.'
            : 'A short or struggling life, remembered by few.';

// ------------------------------------------------------------------ death
export function finalizeDeath(g: GameState, cause?: string) {
  if (g.phase === 'dead') return;
  const p = g.player;
  p.alive = false;
  p.deathYear = g.year;
  p.deathCause = cause ?? causeOfDeath(p.age);
  g.pending = null;
  g.queue = [];
  g.scheduled = [];
  g.phase = 'dead';

  // close the current job in the record
  if (p.career.job) {
    const j = p.career.job;
    const rec: JobRecord = { careerId: j.careerId, title: j.title, company: j.company, startAge: j.startAge, endAge: p.age, endReason: 'died', salary: j.salary, level: j.level };
    p.career.history.push(rec);
  }

  const estate = computeEstate(g);
  g.estateShares = estate.shares;
  const spouse = p.people.find((x) => x.relation === 'spouse' && x.alive);
  const hist = p.history;
  const avgHappiness = Math.round(hist.length ? hist.reduce((s, h) => s + h.happiness, 0) / hist.length : p.stats.happiness);
  const score = legacyScore(g);
  const nw = Math.round(estate.net);
  const summary: DeathSummary = {
    name: fullName(p), age: p.age, birthYear: p.birthYear, deathYear: g.year, cause: p.deathCause, netWorth: nw,
    peakNetWorth: Math.round(p.fin.peakNetWorth), careerHistory: p.career.history, achievements: [...p.achievements],
    spouse: spouse?.name, highestEdu: highestDegreeName(p), countries: new Set(p.visited).size,
    children: childrenOf(p).map((k) => ({ id: k.id, name: k.name, age: personAge(g, k), alive: k.alive, gender: k.gender })),
    estate: { gross: estate.gross, debts: estate.debts, tax: estate.tax, charity: estate.charity, shares: estate.shares },
    legacyScore: score, legacyText: legacyText(score), avgHappiness, generation: p.generation, countryId: p.countryId,
  };
  g.deathSummary = summary;
  if (estate.charity > 0) p.fin.donated += estate.charity;

  const last = p.career.history[p.career.history.length - 1];
  const rec: LifeRecord = {
    id: p.id, name: fullName(p), gender: p.gender, generation: p.generation, birthYear: p.birthYear, deathYear: g.year,
    ageAtDeath: p.age, cause: p.deathCause, netWorth: nw, occupation: p.career.retired ? `Retired ${last?.title ?? ''}`.trim() : last?.title ?? (p.age < 18 ? 'Student' : 'No career'),
    spouse: spouse?.name, children: childrenOf(p).map((k) => k.name), achievements: p.achievements.length, country: p.countryId,
    inherited: Math.round(p.fin.totalInherited),
  };
  g.dynasty.members.push(rec);
  log(g, 'milestone', `🕯️ ${fullName(p)} died at ${p.age} of ${p.deathCause}.`, 'bad');
  snapshot(g);
}

// ------------------------------------------------------------------ heirs
export interface Heir { id: string; name: string; age: number; gender: Gender; inheritance: number; relation: string; note: string }

export function eligibleHeirs(g: GameState): Heir[] {
  if (g.phase !== 'dead') return [];
  return livingChildren(g.player).map((k) => {
    const share = g.estateShares.find((s) => s.id === k.id)?.amount ?? 0;
    const age = personAge(g, k);
    return {
      id: k.id, name: k.name, age, gender: k.gender, inheritance: share + (k.fund ?? 0), relation: k.adopted ? 'Adopted child' : 'Child',
      note: age < 18 ? 'Minor — inheritance held in trust until 18' : `Age ${age}`,
    };
  });
}

const kidRelation = (gender: Gender, fallback: 'mother' | 'father'): 'mother' | 'father' => (gender === 'female' ? 'mother' : gender === 'male' ? 'father' : fallback);

/** Begin the next generation, playing as one of the previous character's children. */
export function continueAsChild(g: GameState, childId: string): ActionResult {
  if (g.phase !== 'dead') return no('Your current life is still going.');
  const old = g.player;
  const kid = old.people.find((x) => x.id === childId && x.relation === 'child' && x.alive);
  if (!kid) return no('That heir is not available.');
  const age = Math.max(0, g.year - kid.birthYear);
  const share = (g.estateShares.find((s) => s.id === kid.id)?.amount ?? 0) + (kid.fund ?? 0);
  const country = getCountry(old.countryId);
  const nwReal = Math.max(0, g.deathSummary?.netWorth ?? 0) / g.world.priceIndex;
  const tier = (nwReal < 15000 ? 1 : nwReal < 80000 ? 2 : nwReal < 400000 ? 3 : nwReal < 2000000 ? 4 : 5) as 1 | 2 | 3 | 4 | 5;
  const nameParts = kid.name.split(' ');
  const firstName = nameParts[0];
  const lastName = kid.surname ?? nameParts.slice(1).join(' ') ?? old.lastName;
  const traits = (kid.traits.length ? kid.traits : []).filter((t) => traitById(t)).slice(0, 3);

  // stats: inherited genes + upbringing
  const genes = kid.genes;
  const nurture = kid.nurture ?? 20;
  const rolled = rollStats(traits, tier, age);
  const stats: Stats = { ...rolled };
  if (genes) {
    const mix = (g0: number, r: number) => Math.round(clamp(0.6 * g0 + 0.4 * r + (nurture - 20) * 0.1 + gauss(0, 3), 4, 98));
    stats.intelligence = mix(genes.intelligence, rolled.intelligence);
    stats.appearance = mix(genes.appearance, rolled.appearance);
    stats.health = mix(genes.health, rolled.health);
    stats.confidence = mix(genes.confidence, rolled.confidence);
    stats.discipline = mix(genes.discipline, rolled.discipline);
    stats.social = mix(genes.social, rolled.social);
  }
  stats.happiness = Math.round(clamp(gauss(62, 8) - (age < 25 ? 6 : 3), 20, 90));

  // family
  const otherId = kid.otherParentId;
  const other = (otherId ? old.people.find((x) => x.id === otherId) : undefined) ?? partnerOf(old) ?? old.people.find((x) => x.relation === 'exSpouse' || x.relation === 'exPartner');
  const people: Person[] = [];
  const dead = { ...genPerson({ relation: kidRelation(old.gender, 'mother'), age: old.age, year: g.year, culture: country.names, gender: old.gender === 'nonbinary' ? 'female' : old.gender, surname: old.lastName, closeness: 72, tier, wageScale: 1 }), name: fullName(old), birthYear: old.birthYear, alive: false, deathYear: g.year, deathCause: old.deathCause, income: 0, wealth: 0, job: undefined as string | undefined };
  dead.id = uid('p');
  people.push(dead);
  if (other) {
    const rel = kidRelation(other.gender, dead.relation === 'mother' ? 'father' : 'mother');
    const ended = other.relation === 'exSpouse' || other.relation === 'exPartner';
    people.push({ ...other, id: uid('p'), relation: rel === dead.relation ? (rel === 'mother' ? 'father' : 'mother') : rel, closeness: ended ? 35 : Math.max(60, other.closeness), absent: ended, history: [], interacted: false });
  }
  for (const s of livingChildren(old)) {
    if (s.id === kid.id) continue;
    people.push({ ...s, id: uid('p'), relation: 'sibling', closeness: clamp(s.closeness - 15, 40, 85), history: [], interacted: false });
  }
  const kidAge = age;
  const newP: Character = {
    id: uid('c'), firstName, lastName, gender: kid.gender, birthYear: kid.birthYear, birthCountry: old.countryId, birthCity: old.city,
    countryId: old.countryId, city: old.city, age: kidAge, alive: true, stats, skills: emptySkills(), traits, conditions: [],
    background: { wealthTier: tier, household: other && !(other.relation === 'exSpouse') ? 'two-parent' : 'single-mother', label: `${TIER_NAME[tier]} · ${BACKGROUND_LABELS[other && !(other.relation === 'exSpouse') ? 'two-parent' : 'single-mother']}` },
    edu: emptyEdu(), career: emptyCareer(), fin: emptyFinances(tier), people, flags: {}, energy: BALANCE.energyPerYear, actions: [], visited: [old.countryId],
    journal: [], history: [], achievements: [], generation: old.generation + 1, willCharity: 0, willMode: 'equal',
  };
  if (!other || other.relation === 'exSpouse') newP.background.household = other ? 'single-mother' : 'guardian';
  newP.fin.housing = kidAge < 18 ? { kind: 'family', quality: clamp(tier - 1, 1, 4) } : { kind: 'rent', quality: clamp(tier - 1, 1, 3) };
  if (kidAge < 18) newP.fin.trust = Math.round(share); else newP.fin.cash = Math.round(share);
  newP.fin.totalInherited = share / g.world.priceIndex;
  newP.fin.peakNetWorth = share;
  newP.skills[pick(['tech', 'business', 'creative', 'communication', 'trades', 'athletic', 'leadership', 'medical'] as const)] = rint(0, 8);

  // swap the active character
  g.player = newP;
  g.phase = 'alive';
  g.pending = null; g.queue = []; g.scheduled = []; g.eventLog = {}; g.lastCategories = []; g.candidate = null;
  g.deathSummary = null; g.estateShares = [];
  g.dynasty.generation = newP.generation;
  initEducationForAge(g, newP, kidAge, tier);
  for (const gk of kid.kids ?? []) {
    const kp = genPerson({ relation: 'child', age: Math.max(0, g.year - gk.birthYear), year: g.year, culture: country.names, gender: gk.gender, surname: lastName, closeness: 85, tier, wageScale: wageScale(g) });
    kp.name = `${gk.name} ${lastName}`; kp.birthYear = gk.birthYear; kp.income = 0; kp.wealth = 0; kp.job = undefined; kp.genes = undefined; kp.nurture = 20; kp.fund = 0;
    newP.people.push(kp);
    newP.flags.hasChild = true;
  }
  const nFriends = kidAge < 6 ? 0 : kidAge < 14 ? 2 : 3;
  for (let i = 0; i < nFriends; i++) newP.people.push(newFriend(g, kidAge < 18 ? 2 : 5));
  const mt = kid.match;
  if (mt) {
    const sp = genPerson({ relation: mt.status === 'married' ? 'spouse' : 'partner', age: Math.max(18, g.year - mt.birthYear), year: g.year, culture: country.names, gender: mt.gender, closeness: kid.estranged ? 45 : 72, tier, wageScale: wageScale(g), metAge: Math.max(16, kidAge - 3) });
    sp.name = mt.name; sp.birthYear = mt.birthYear; sp.job = mt.job; sp.wealth = mt.wealth;
    if (mt.status === 'married') sp.marriedAge = kidAge;
    newP.people.push(sp); newP.flags.hadPartner = true;
  } else if (kidAge >= 25 && chance(0.4)) {
    const pa = genPerson({ relation: 'partner', age: clamp(kidAge + rint(-5, 6), 18, 80), year: g.year, culture: country.names, closeness: 62, tier: pick([2, 3, 3, 4]), wageScale: wageScale(g), metAge: kidAge - 1 });
    newP.people.push(pa); newP.flags.hadPartner = true;
  }
  newP.journal.push({
    id: uid('j'), age: kidAge, year: g.year, kind: 'milestone', tone: 'info',
    text: `🌱 Generation ${newP.generation}: you are now ${firstName} ${lastName}, age ${kidAge}, child of ${old.firstName} ${old.lastName}. ${share > 0 ? `You ${kidAge < 18 ? 'will receive' : 'inherited'} ${money(g, share)}${kidAge < 18 ? ' at 18' : ''}.` : 'You inherited nothing but a name.'}`,
  });
  newP.history = [];
  snapshot(g);
  return ok(`You are now ${firstName} ${lastName} (generation ${newP.generation}).`, 'good', { generation: newP.generation, inherited: share });
}

// ------------------------------------------------------------------ family tree
export interface TreeNode {
  id: string; name: string; gender: Gender; birthYear: number; deathYear?: number; alive: boolean; relation: string; note?: string; kids?: TreeNode[];
}
export interface FamilyTree {
  ancestors: LifeRecord[];
  self: TreeNode;
  parents: TreeNode[];
  siblings: TreeNode[];
  spouse?: TreeNode;
  exes: TreeNode[];
  children: TreeNode[];
}

const node = (p: Person, label?: string): TreeNode => ({
  id: p.id, name: p.name, gender: p.gender, birthYear: p.birthYear, deathYear: p.deathYear, alive: p.alive, relation: label ?? p.relation,
  note: p.job,
});

export function buildFamilyTree(g: GameState): FamilyTree {
  const p = g.player;
  const kids = childrenOf(p).map((k) => ({
    ...node(k, k.adopted ? 'adopted child' : 'child'),
    note: k.match ? `${k.match.status === 'married' ? '💍 Married to' : '💞 Dating'} ${k.match.name}` : k.job,
    kids: (k.kids ?? []).map((gk): TreeNode => ({ id: `${k.id}:${gk.name}`, name: gk.name, gender: gk.gender, birthYear: gk.birthYear, alive: true, relation: 'grandchild' })),
  }));
  const spouse = p.people.find((x) => x.relation === 'spouse') ?? p.people.find((x) => x.relation === 'partner');
  return {
    ancestors: g.dynasty.members.filter((m) => m.id !== p.id),
    self: { id: p.id, name: fullName(p), gender: p.gender, birthYear: p.birthYear, deathYear: p.deathYear, alive: p.alive, relation: 'you' },
    parents: p.people.filter((x) => ['mother', 'father', 'guardian'].includes(x.relation)).map((x) => node(x)),
    siblings: p.people.filter((x) => x.relation === 'sibling').map((x) => node(x)),
    spouse: spouse ? node(spouse) : undefined,
    exes: p.people.filter((x) => x.relation === 'exSpouse' || x.relation === 'exPartner').map((x) => node(x)),
    children: kids,
  };
}

/** Total wealth the dynasty has passed on (real dollars). */
export const dynastyWealth = (g: GameState) => g.dynasty.members.reduce((s, m) => s + m.netWorth, 0);

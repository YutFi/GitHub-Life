import { genPerson } from './people';
import { chance, clamp, pick, rint, weightedPick } from './rng';
import { addStat, countryOf, livingChildren, log, personAge, setFlag, wageScale } from './util';
import type { ChildMatch, GameState, Person } from './types';

/**
 * Adult children and their love lives.
 * A child starts dating, later asks for the parent's blessing (an event), and — depending on that answer —
 * marries, waits, breaks up, or marries anyway and drifts away. The partner's character is hidden unless the
 * parent is perceptive or investigates, so the decision has real stakes.
 */

const first = (name: string) => name.split(' ')[0];
export const kidFirst = (k: Person) => first(k.name);

export function pendingProposal(g: GameState): Person | undefined {
  const p = g.player;
  return livingChildren(p).find((k) => k.match?.status === 'dating' && p.age >= k.match.askAge && !k.estranged);
}

/** the most recently married child (for the wedding day) */
export function newlywed(g: GameState): Person | undefined {
  const p = g.player;
  return livingChildren(p).filter((k) => k.match?.status === 'married' && k.match.marriedAge !== undefined && personAge(g, k) - k.match.marriedAge <= 1 && !k.estranged)
    .sort((a, b) => (b.match!.marriedAge ?? 0) - (a.match!.marriedAge ?? 0))[0];
}

export function createMatch(g: GameState, kid: Person): ChildMatch {
  const p = g.player;
  const a = personAge(g, kid);
  const gender = chance(0.07) ? kid.gender : kid.gender === 'male' ? 'female' : kid.gender === 'female' ? 'male' : pick(['male', 'female'] as const);
  const q = weightedPick(['great', 'good', 'risky'] as const, (x) => (x === 'great' ? 3 : x === 'good' ? 5 : 2))!;
  const tier = clamp(p.background.wealthTier + rint(-1, 1), 1, 5);
  const pr = genPerson({ relation: 'partner', age: clamp(a + rint(-3, 4), 20, 55), year: g.year, culture: countryOf(g).names, gender, tier, wageScale: wageScale(g), closeness: 60 });
  return {
    name: pr.name, gender: pr.gender, birthYear: pr.birthYear, job: pr.job, quality: q,
    wealth: Math.round(pr.wealth * (q === 'risky' ? 0.2 : q === 'great' ? 1.2 : 1)),
    status: 'dating', askAge: p.age + rint(1, 2), deferred: 0,
  };
}

/** What the parent senses about the partner. */
export function vibeText(g: GameState, kid: Person): string {
  const m = kid.match;
  if (!m) return '';
  const n = first(m.name), k = kidFirst(kid);
  const sharp = g.player.stats.intelligence + g.player.stats.social >= 125 || g.player.traits.includes('empathetic');
  if (m.revealed) {
    return m.quality === 'great' ? `You know from your own enquiries that ${n} is honest, hardworking and devoted to ${k}.`
      : m.quality === 'good' ? `Your enquiries found nothing worrying: ${n} is decent and hardworking.`
      : `Your enquiries turned up debts, a string of broken relationships and a habit of borrowing from ${k}.`;
  }
  if (sharp) {
    return m.quality === 'great' ? `You've watched them together: ${n} is warm, steady and clearly devoted to ${k}.`
      : m.quality === 'good' ? `${n} comes across as pleasant and hardworking.`
      : `Something about ${n} makes you uneasy: a lot of talk about money and vague answers about the past.`;
  }
  return `${n} seems nice enough, though you only know them a little.`;
}

export interface MarryOpts { defied?: boolean }
export function marryChild(g: GameState, kid: Person, o: MarryOpts = {}): string {
  const m = kid.match;
  if (!m) return '';
  m.status = 'married';
  m.marriedAge = personAge(g, kid);
  kid.wealth += m.wealth;
  kid.income = Math.round(kid.income * 1.3);
  if (o.defied) { kid.estranged = true; kid.closeness = clamp(kid.closeness, 0, 28); kid.trust = clamp(kid.trust, 0, 22); }
  setFlag(g.player, 'childMarried', true);
  log(g, 'family', o.defied
    ? `💍 ${kidFirst(kid)} married ${m.name} without your blessing. You were not invited.`
    : `💍 ${kidFirst(kid)} married ${m.name}. You have a new family member!`, o.defied ? 'bad' : 'good');
  return `${kidFirst(kid)} and ${m.name} are now married.`;
}

/** Yearly life of grown-up children. Called from the aging pipeline. */
export function processAdultChildren(g: GameState) {
  const p = g.player;
  for (const k of livingChildren(p)) {
    const a = personAge(g, k);
    const m = k.match;
    if (!m) {
      if (a >= 21 && a <= 40 && !k.estranged && chance(a < 25 ? 0.07 : 0.13)) {
        k.match = createMatch(g, k);
        log(g, 'family', `💞 ${kidFirst(k)} is seeing someone special: ${k.match.name}.`, 'good');
      }
      continue;
    }
    if (m.status === 'dating') {
      // a relationship may simply run its course
      if (chance(0.05) && p.age < m.askAge) { k.match = undefined; log(g, 'family', `💔 ${kidFirst(k)} and ${m.name} broke up.`, 'neutral'); }
    } else if (m.status === 'married') {
      if (m.quality === 'risky' && chance(0.07)) {
        k.match = undefined;
        k.closeness = clamp(k.closeness + 4, 0, 100);
        setFlag(p, 'divorcedKid', k.id);
        g.scheduled.push({ id: 'fam_child_heartbreak', dueAge: p.age + 1, chance: 1 });
        log(g, 'family', `💔 ${kidFirst(k)}'s marriage to ${m.name} fell apart.`, 'bad');
        addStat(p, 'happiness', -3);
      } else if (m.quality === 'great' && chance(0.18)) {
        k.closeness = clamp(k.closeness + 2, 0, 100);
      }
    }
  }
}

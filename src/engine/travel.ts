// Travel (holidays) and relocation (emigration).
import { DESTINATIONS, COUNTRIES, getCountry } from './data/countries';
import { applyEffects, makeCtx } from './events';
import { quitJob } from './career';
import { canAfford, payFromAssets } from './finance';
import { newFriend } from './relationships';
import { fmtMoney } from './format';
import { chance, clamp, pick, rint } from './rng';
import { EDU_RANK } from './data/careers';
import { addStat, countryOf, econScale, log, no, ok, partnerOf } from './util';
import type { ActionResult, Effects, GameState } from './types';

export type TripStyle = 'budget' | 'standard' | 'luxury';
export const TRIP_STYLES: Record<TripStyle, { label: string; mult: number; joy: number }> = {
  budget: { label: 'Budget backpacking', mult: 0.55, joy: 0 },
  standard: { label: 'Comfortable holiday', mult: 1, joy: 2 },
  luxury: { label: 'Luxury getaway', mult: 2.4, joy: 4 },
};
const TIER_COST = [0, 1500, 2800, 5200];

export const destinationList = () => DESTINATIONS;

export function tripCost(g: GameState, destId: string, style: TripStyle): number {
  const d = DESTINATIONS.find((x) => x.id === destId);
  if (!d) return 0;
  const p = g.player;
  const base = TIER_COST[d.tier] * TRIP_STYLES[style].mult * (d.id === p.countryId ? 0.4 : 1);
  return Math.round(base * econScale(g));
}

export function travel(g: GameState, destId: string, style: TripStyle): ActionResult {
  const p = g.player;
  const d = DESTINATIONS.find((x) => x.id === destId);
  if (!d) return no('Unknown destination.');
  if (p.age < 5) return no('You are too young to travel without your family.');
  if (p.energy < 1) return no('You are out of energy this year.');
  if (p.actions.includes(`trip_${destId}`)) return no('You already went there this year.');
  const minor = p.age < 18;
  const cost = minor ? 0 : tripCost(g, destId, style);
  if (cost > 0 && !canAfford(g, cost)) return no(`This trip costs ${fmtMoney(cost, p.countryId, true)}.`);
  if (cost > 0) payFromAssets(g, cost);
  p.energy -= 1;
  p.actions.push(`trip_${destId}`);
  const first = !p.visited.includes(destId);
  if (first) p.visited.push(destId);
  const joy = 3 + d.tier + TRIP_STYLES[style].joy + (first ? 2 : 0) + (minor ? -1 : 0);
  const fx: Effects = { happiness: joy, intelligence: first ? 0.8 : 0.2, social: first ? 0.6 : 0, health: style === 'budget' ? 0 : 0.5 };
  let text = `${minor ? 'Your family took you' : 'You took a trip'} to ${d.name} ${d.flag}${first ? ' for the first time' : ''}. ${TRIP_STYLES[style].label}.`;
  if (chance(0.1)) { fx.health = -4; fx.happiness = Math.max(1, joy - 4); text += ' A stomach bug cut things short.'; }
  else if (chance(0.08) && !minor) { fx.money = -250; text += ' Your wallet was pickpocketed.'; }
  else if (chance(0.12) && !minor && p.age < 60) { text += ' You made a new friend on the way.'; p.people.push(newFriend(g, 6)); }
  else if (chance(0.1)) { fx.skill = { communication: 2 }; text += ' You picked up some of the local language.'; }
  const summary = applyEffects(g, fx, makeCtx(g));
  summary.money -= cost;
  log(g, 'event', `✈️ ${text}`, 'good');
  return ok(text, 'good', { outcomeText: text, summary, title: `Trip to ${d.name}`, icon: '✈️', choice: TRIP_STYLES[style].label });
}

// ------------------------------------------------------------------ relocation
export const relocationOptions = () => COUNTRIES;

export function relocationCost(g: GameState, destId: string): number {
  const dest = getCountry(destId);
  const base = 4200 + 5500 * Math.max(0, dest.wageIndex - 0.3);
  return Math.round(base * econScale(g));
}

export function visaChance(g: GameState, destId: string): number {
  const p = g.player;
  const dest = getCountry(destId);
  let c = 0.3 + EDU_RANK[p.edu.level] * 0.07 + (p.career.job ? 0.1 : 0) + (p.skills.tech + p.skills.medical) * 0.002 + (p.stats.intelligence - 50) * 0.003;
  if (dest.wageIndex > 0.9) c -= 0.08;
  if (partnerOf(p)?.relation === 'spouse') c += 0.1;
  if (p.flags.criminalRecord) c -= 0.25;
  return clamp(c, 0.08, 0.92);
}

/** Direct (no checks) country change used by events and by relocate(). */
export function moveCountry(g: GameState, destId: string, forWork = false): string {
  const p = g.player;
  const dest = getCountry(destId);
  p.countryId = dest.id;
  p.city = pick(dest.cities);
  if (!p.visited.includes(dest.id)) p.visited.push(dest.id);
  p.fin.housing = { kind: 'rent', quality: clamp(p.fin.housing.quality, 1, 2) };
  for (const x of p.people) {
    if (['friend', 'mother', 'father', 'guardian', 'sibling'].includes(x.relation)) x.closeness = clamp(x.closeness - (x.relation === 'friend' ? 14 : 8), 0, 100);
  }
  log(g, 'milestone', `🛬 You ${forWork ? 'relocated for work' : 'emigrated'} to ${p.city}, ${dest.name} ${dest.flag}.`, 'info');
  return `You moved to ${p.city}, ${dest.name}.`;
}

export function relocate(g: GameState, destId: string): ActionResult {
  const p = g.player;
  if (p.age < 18) return no('You can only emigrate as an adult.');
  if (destId === p.countryId) return no('You already live there.');
  if (p.fin.properties.some((x) => x.home)) return no('Sell the home you live in before emigrating.');
  if (p.energy < 1) return no('You are out of energy this year.');
  const cost = relocationCost(g, destId);
  if (!canAfford(g, cost)) return no(`Relocating costs about ${fmtMoney(cost, p.countryId, true)} (visa, flights, deposit).`);
  payFromAssets(g, cost);
  p.energy -= 1;
  if (!chance(visaChance(g, destId))) {
    addStat(p, 'happiness', -4);
    log(g, 'milestone', `🛂 Your visa application for ${getCountry(destId).name} was rejected. The fees were not refunded.`, 'bad');
    return { ok: false, msg: 'Your visa application was rejected.', tone: 'bad' };
  }
  if (p.career.job) quitJob(g);
  const msg = moveCountry(g, destId);
  addStat(p, 'confidence', 2); addStat(p, 'happiness', rint(-2, 4));
  void countryOf;
  return ok(msg, 'good');
}

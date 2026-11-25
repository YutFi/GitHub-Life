// The yearly "Age Up" orchestrator: runs every engine in order and rolls the next year's events.
import { BALANCE } from './config';
import { processEducation } from './education';
import { processCareer } from './career';
import { processJustice } from './justice';
import { processFinances } from './finance';
import { processRelationships } from './relationships';
import { processAdultChildren } from './kids';
import { rollYearEvents, popNextEvent } from './events';
import { finalizeDeath } from './family';
import { snapshot } from './character';
import { advanceWorld } from './world';
import { causeOfDeath, deathChance, rollDeath } from './mortality';
import { traitSum } from './data/traits';
import { clamp, gauss } from './rng';
import { addStat, countryOf, diff, flagNum, log, no, ok, partnerOf, setFlag, stageOf, netWorth } from './util';
import type { ActionResult, GameState } from './types';

export const MAX_AGE = 118;

/** Natural yearly drift of health, happiness and the other stats. */
function driftStats(g: GameState) {
  const p = g.player;
  const s = p.stats;
  const age = p.age;
  const f = p.fin;

  // ---- health
  let dh = BALANCE.health.driftByAge(age);
  dh -= p.conditions.length * 0.9;
  if (p.flags.smoker) dh -= 1.6;
  if (flagNum(p, 'fitYear') > 0) { dh += 1.8; setFlag(p, 'fitYear', flagNum(p, 'fitYear') - 1); }
  if (p.flags.heavyDrinker) dh -= 1.2;
  if (f.lifestyle === 'luxury') dh += 0.4; else if (f.lifestyle === 'frugal') dh -= 0.3;
  if (p.energy > 0 && p.actions.length === 0) dh -= 0.0;
  dh += (s.discipline - 50) * 0.012;
  dh += p.skills.athletic * 0.008;
  if (p.skills.medical > 40) dh += 0.3;
  if (s.health > 88) dh -= 1.2; // there is only one way from the top
  if (s.health < 45 && age < 65) dh += 1.2; // the body repairs itself somewhat
  if (age < 6) dh += 1;
  if (s.happiness < 25) dh -= 1;
  s.health = clamp(s.health + dh + gauss(0, 1.1), 0, 100);

  // ---- happiness: mean-reverts toward a target set by circumstances
  const partner = partnerOf(p);
  const friends = p.people.filter((x) => x.relation === 'friend' && x.alive && x.closeness > 40).length;
  const fam = p.people.filter((x) => ['mother', 'father', 'guardian', 'sibling', 'child'].includes(x.relation) && x.alive && x.closeness > 55).length;
  const real = netWorth(g) / g.world.priceIndex / countryOf(g).wageIndex;
  let target = 52;
  target += (s.health - 60) * 0.18;
  target += Math.min(8, friends * 2) + Math.min(6, fam * 1.5);
  target += partner ? 5 + (partner.closeness - 55) * 0.06 : age >= 25 && age < 55 ? -2 : 0;
  target += clamp(Math.log10(Math.max(real, 1000) / 20000) * 3.5, -4, 8);
  target += BALANCE.finance.lifestyle[f.lifestyle].happy;
  target += traitSum(p.traits, 'luck') * 3;
  const job = p.career.job;
  if (job) target += (job.satisfaction - 55) * 0.1;
  else if (age >= 22 && age < 60 && !p.edu.stage && !p.career.retired) target -= 6;
  if (p.career.retired) target += 3;
  if (f.card.balance > f.card.limit * 0.8 && f.card.limit > 0) target -= 3;
  if (p.conditions.length) target -= Math.min(8, p.conditions.length * 2);
  const grief = flagNum(p, 'griefYears');
  if (grief > 0) { target -= 8; setFlag(p, 'griefYears', grief - 1); }
  s.happiness = clamp(s.happiness + (target - s.happiness) * BALANCE.happiness.pull + gauss(0, 2.2), 0, 100);

  // ---- other stats
  if (age > 35) s.appearance = clamp(s.appearance - (age > 60 ? 0.9 : 0.35) + (s.discipline > 60 ? 0.15 : 0), 0, 100);
  if (age > 70) s.intelligence = clamp(s.intelligence - 0.5, 0, 100);
  if (age < 22 && age >= 4 && !p.edu.stage) s.intelligence = clamp(s.intelligence + 0.2, 0, 100);
  s.confidence = clamp(s.confidence + (50 - s.confidence) * 0.02 + (age < 25 ? 0.4 : 0) + gauss(0, 0.8), 0, 100);
  s.social = clamp(s.social + (friends >= 3 ? 0.4 : -0.4) + (partner ? 0.1 : 0) - (age > 65 ? 0.4 : 0), 0, 100);
  s.discipline = clamp(s.discipline + (age < 25 ? 0.5 : age < 55 ? 0.1 : 0) + gauss(0, 0.5), 0, 100);
}

function checkDeath(g: GameState): boolean {
  const p = g.player;
  const c = countryOf(g);
  let ch = deathChance(p.age, p.stats.health, c, g.tuning.mortality, diff(g).mortality, p.conditions.length);
  if (p.flags.smoker && p.age > 40) ch *= 1.3;
  if (p.age >= MAX_AGE) ch = 1;
  if (p.stats.health <= 0) ch = Math.max(ch, 0.55);
  if (rollDeath(ch)) {
    finalizeDeath(g, p.stats.health <= 3 && p.age < 60 ? 'a long illness' : causeOfDeath(p.age));
    return true;
  }
  return false;
}

/** Age up one year. The caller should afterwards present `g.pending` events (see popNextEvent). */
export function ageUp(g: GameState): ActionResult {
  if (g.phase === 'dead') return no('This life has ended.');
  if (g.pending || g.queue.length) return no('Resolve your pending events first.');
  const p = g.player;

  p.age++;
  g.year++;
  p.energy = BALANCE.energyPerYear;
  p.actions = [];
  p.career.appsThisYear = 0;
  p.edu.appliedThisYear = false;
  for (const per of p.people) per.interacted = false;
  g.candidate = null;

  advanceWorld(g);
  processEducation(g);
  processJustice(g);
  processCareer(g);
  processFinances(g);
  processRelationships(g);
  processAdultChildren(g);
  driftStats(g);

  const stage = stageOf(p.age);
  const prev = stageOf(p.age - 1);
  if (stage !== prev) {
    const label = { baby: 'a baby', child: 'a child', teen: 'a teenager', youngAdult: 'a young adult', adult: 'an adult', senior: 'a senior' }[stage];
    log(g, 'milestone', `🎂 You turned ${p.age} and became ${label}.`, 'info');
  } else if (p.age % 10 === 0) log(g, 'milestone', `🎂 You turned ${p.age}.`, 'info');

  if (checkDeath(g)) return ok(`You died at ${p.age}.`, 'bad', { died: true });

  rollYearEvents(g);
  snapshot(g);
  popNextEvent(g);
  return ok(`You are now ${p.age}.`, 'neutral', { age: p.age, events: g.queue.length + (g.pending ? 1 : 0) });
}

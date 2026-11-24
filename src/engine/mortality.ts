import { BALANCE } from './config';
import { clamp, pick, rnd } from './rng';
import type { Country } from './types';

function baseRate(age: number): number {
  const c = BALANCE.mortality.curve;
  if (age <= c[0][0]) return c[0][1];
  for (let i = 1; i < c.length; i++) {
    if (age <= c[i][0]) {
      const [a0, r0] = c[i - 1];
      const [a1, r1] = c[i];
      const t = (age - a0) / (a1 - a0);
      // log-linear interpolation (mortality grows exponentially)
      return Math.exp(Math.log(r0) + t * (Math.log(r1) - Math.log(r0)));
    }
  }
  return c[c.length - 1][1];
}

/**
 * Annual probability of death for a person.
 * Healthy under-12s and healthy young adults are almost never killed by "random" causes.
 */
export function deathChance(age: number, health: number, country: Country, tuning = 1, difficulty = 1, conditions = 0): number {
  let r = baseRate(age);
  // life expectancy shifts the curve (a country with 55y expectancy sees earlier mortality)
  const le = clamp((79 - country.lifeExpectancy) / 79, -0.1, 0.4);
  r *= 1 + le * (age < 60 ? 4 : 2.2);
  r *= BALANCE.mortality.healthFactor(health);
  r *= 1 + conditions * 0.12;
  r *= tuning * difficulty;
  if (age >= BALANCE.mortality.safeAge && age < 45 && health >= 55) r *= 0.6;
  return clamp(r, 0, 0.95);
}

const CAUSES: [number, number, string[]][] = [
  [0, 1, ['complications shortly after birth', 'a congenital condition']],
  [1, 12, ['a childhood illness', 'a tragic accident', 'a severe infection']],
  [13, 29, ['a car accident', 'an unexpected illness', 'an accident', 'a rare heart condition']],
  [30, 49, ['a heart attack', 'cancer', 'a car accident', 'an aggressive illness', 'a stroke']],
  [50, 69, ['a heart attack', 'cancer', 'a stroke', 'liver failure', 'lung disease', 'diabetes complications']],
  [70, 85, ['heart failure', 'a stroke', 'cancer', 'pneumonia', 'kidney failure', 'natural causes']],
  [86, 130, ['natural causes', 'old age', 'heart failure', 'pneumonia', 'dementia complications']],
];
export function causeOfDeath(age: number): string {
  const band = CAUSES.find(([a, b]) => age >= a && age <= b) ?? CAUSES[CAUSES.length - 1];
  return pick(band[2]);
}

export const rollDeath = (chance: number) => rnd() < chance;

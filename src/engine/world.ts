import { BALANCE } from './config';
import { chance, clamp, gauss, pick, rnd } from './rng';
import { addStat, countryOf, diff, log } from './util';
import type { Country, Economy, GameState, World } from './types';

interface WorldEventDef {
  id: string; title: string; desc: string; chance: number; duration: [number, number];
  econ?: Economy; inflation?: number; unemployment?: number; stock?: number; housing?: number;
  happy?: number; health?: number; social?: number; yearMin?: number; yearMax?: number;
}

export const WORLD_EVENTS: WorldEventDef[] = [
  { id: 'gfc', title: 'Global Financial Crisis', desc: 'Banks wobble, credit freezes and markets plunge worldwide.', chance: 1, duration: [2, 3], econ: 'recession', unemployment: 0.03, stock: -0.18, housing: -0.1, happy: -1 },
  { id: 'pandemic', title: 'Global Pandemic', desc: 'A fast-spreading virus closes borders, schools and offices.', chance: 0.8, duration: [2, 3], econ: 'recession', unemployment: 0.025, stock: -0.1, happy: -3, social: -3, health: -1.5, yearMin: 1960 },
  { id: 'tech_boom', title: 'Technology Boom', desc: 'A wave of innovation lifts markets and tech salaries.', chance: 1, duration: [3, 4], econ: 'boom', stock: 0.1, unemployment: -0.01, happy: 1 },
  { id: 'housing_crash', title: 'Housing Market Crash', desc: 'Property prices tumble as a bubble bursts.', chance: 0.9, duration: [2, 2], housing: -0.14, stock: -0.04, unemployment: 0.01 },
  { id: 'energy_crisis', title: 'Energy Price Shock', desc: 'Fuel and power costs surge, pushing prices up.', chance: 0.9, duration: [2, 3], inflation: 0.05, unemployment: 0.01, happy: -1 },
  { id: 'peace_dividend', title: 'Era of Prosperity', desc: 'Trade flourishes and optimism is in the air.', chance: 1, duration: [3, 5], econ: 'boom', stock: 0.05, happy: 1.5 },
  { id: 'disaster', title: 'Regional Natural Disaster', desc: 'Storms and floods hit the region, straining services.', chance: 1.2, duration: [1, 1], unemployment: 0.005, happy: -2, health: -0.5 },
  { id: 'trade_war', title: 'Trade Tensions', desc: 'Tariffs and uncertainty slow investment.', chance: 0.8, duration: [2, 3], stock: -0.05, inflation: 0.012, unemployment: 0.008 },
];

export function newWorld(startYear: number, country: Country, difficultyHard: boolean): World {
  const priceIndex = Math.pow(1 + BALANCE.inflation.historicalDrift, startYear - BALANCE.baseYear);
  return {
    priceIndex, inflation: 0.025 + country.inflationBias, economy: difficultyHard && chance(0.2) ? 'recession' : 'normal', econYears: 0,
    unemployment: BALANCE.economy.unemployment.normal + country.unemploymentBias, stockReturn: 0.07, housingGrowth: 0.03, housingReal: 1, interest: 0.04,
    events: [], history: [],
  };
}

function nextEconomy(w: World, hard: boolean): Economy {
  const t = BALANCE.economy[w.economy];
  let pBoom = t.boom, pNormal = t.normal, pRec = t.recession;
  if (hard) { pRec += 0.03; pNormal -= 0.03; }
  // recessions last at least one year; long booms eventually cool
  if (w.economy === 'boom' && w.econYears >= 5) { pNormal += 0.2; pBoom -= 0.2; }
  const r = rnd() * (pBoom + pNormal + pRec);
  if (r < pBoom) return 'boom';
  if (r < pBoom + pNormal) return 'normal';
  return 'recession';
}

/** Advance the global economy by one year and apply world events to the player. */
export function advanceWorld(g: GameState) {
  const w = g.world;
  const c = countryOf(g);
  const vol = g.tuning.volatility;
  const hard = g.difficulty === 'hard';
  const prev = w.economy;
  w.economy = nextEconomy(w, hard);
  w.econYears = w.economy === prev ? w.econYears + 1 : 0;

  // active world events push the economy around
  let evUnemp = 0, evStock = 0, evHousing = 0, evInfl = 0;
  for (const e of w.events) {
    const d = WORLD_EVENTS.find((x) => x.id === e.id);
    if (!d) continue;
    evUnemp += d.unemployment ?? 0; evStock += d.stock ?? 0; evHousing += d.housing ?? 0; evInfl += d.inflation ?? 0;
    if (d.econ === 'recession' && e.yearsLeft > 0 && w.economy !== 'recession') w.economy = 'recession';
    if (d.econ === 'boom' && w.economy === 'recession') w.economy = 'normal';
    if (g.player.age >= 0) {
      if (d.happy) addStat(g.player, 'happiness', d.happy);
      if (d.health) addStat(g.player, 'health', d.health);
      if (d.social) addStat(g.player, 'social', d.social);
    }
  }

  let infl = BALANCE.inflation.base + c.inflationBias * 0.2 + gauss(0, 0.009 * vol) + evInfl;
  if (chance(BALANCE.inflation.shockChance * vol)) infl += BALANCE.inflation.shockSize * rnd();
  if (w.economy === 'recession') infl -= 0.01;
  w.inflation = clamp(infl, -0.015, 0.4);
  w.priceIndex *= 1 + w.inflation;
  w.unemployment = clamp(BALANCE.economy.unemployment[w.economy] + c.unemploymentBias + evUnemp + gauss(0, 0.004), 0.008, 0.4);
  w.stockReturn = clamp(0.07 + BALANCE.economy.stockShift[w.economy] + evStock * 0.5 + gauss(0, 0.14 * vol), -0.55, 0.6);
  w.housingGrowth = clamp(w.inflation + BALANCE.economy.housingShift[w.economy] + evHousing * 0.5 + gauss(0, 0.02), -0.3, 0.3);
  w.housingReal *= (1 + w.housingGrowth) / (1 + w.inflation);
  w.interest = clamp(w.inflation + 0.015 + (w.economy === 'recession' ? -0.01 : 0), 0.004, 0.45);

  // expire / roll events
  for (const e of w.events) e.yearsLeft--;
  const ended = w.events.filter((e) => e.yearsLeft < 0);
  w.events = w.events.filter((e) => e.yearsLeft >= 0);
  for (const e of ended) log(g, 'world', `🌍 ${e.title} has finally eased.`, 'info');

  if (chance(BALANCE.economy.worldEventChance * vol)) {
    const pool = WORLD_EVENTS.filter(
      (d) => (!d.yearMin || g.year >= d.yearMin) && (!d.yearMax || g.year <= d.yearMax) && !w.events.some((e) => e.id === d.id),
    );
    const d = pick(pool);
    if (d && chance(Math.min(1, d.chance))) {
      const yrs = d.duration[0] + Math.floor(rnd() * (d.duration[1] - d.duration[0] + 1));
      w.events.push({ id: d.id, title: d.title, desc: d.desc, startYear: g.year, yearsLeft: yrs - 1 });
      if (d.econ) w.economy = d.econ;
      log(g, 'world', `🌍 ${d.title}: ${d.desc}`, d.happy && d.happy < 0 ? 'bad' : 'info');
    }
  }

  w.history.push({ year: g.year, economy: w.economy, inflation: w.inflation, unemployment: w.unemployment });
  if (w.history.length > 130) w.history.shift();
  void diff;
}

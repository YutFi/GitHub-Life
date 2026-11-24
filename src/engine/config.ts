// =====================================================================================
// LifeVerse balance configuration.
// Everything that tunes the simulation lives here (or in /data) so balancing never
// requires touching engine logic. Players can also scale a few knobs live (Settings → Tuning).
// All money values are expressed in "2025 US dollars" and scaled by country & price level.
// =====================================================================================
import type { Difficulty, Lifestyle } from './types';

export const BALANCE = {
  baseYear: 2025,
  medianIncomeUSD: 52000,
  energyPerYear: 5,
  maxJournal: 1500,

  startYearMin: 1940,
  startYearMax: 2026,

  inflation: { base: 0.025, shockChance: 0.04, shockSize: 0.06, historicalDrift: 0.03 },
  economy: {
    // Markov transition table: [stay, boom, normal, recession]
    boom: { boom: 0.55, normal: 0.35, recession: 0.1 },
    normal: { boom: 0.15, normal: 0.75, recession: 0.1 },
    recession: { boom: 0.05, normal: 0.5, recession: 0.45 },
    unemployment: { boom: 0.035, normal: 0.05, recession: 0.095 },
    stockShift: { boom: 0.07, normal: 0, recession: -0.17 },
    housingShift: { boom: 0.03, normal: 0.005, recession: -0.06 },
    worldEventChance: 0.07,
  },

  mortality: {
    // annual death probability anchors by age (linear interpolation) for an average health stat
    curve: [
      [0, 0.004], [1, 0.0006], [5, 0.0002], [12, 0.0002], [18, 0.0005], [30, 0.0008], [40, 0.0014],
      [50, 0.0034], [60, 0.0085], [70, 0.022], [80, 0.06], [90, 0.16], [100, 0.32], [110, 0.6],
    ] as [number, number][],
    healthFactor: (health: number) => {
      if (health >= 80) return 0.55;
      if (health >= 60) return 0.8;
      if (health >= 40) return 1.15;
      if (health >= 20) return 2.6;
      return 6;
    },
    // Healthy people under this age never die from random causes; only from critical health
    safeAge: 12,
  },

  health: {
    // yearly natural drift of the health stat by age band
    driftByAge: (age: number) => (age < 30 ? 0.6 : age < 45 ? -0.3 : age < 60 ? -1.1 : age < 75 ? -2 : -3),
    recoveryTarget: 78,
  },

  happiness: { pull: 0.35 },

  events: {
    // interactive events per year
    perYear: (age: number) => (age < 3 ? 0.55 : age < 6 ? 0.8 : 1.15),
    secondEventChance: 0.3,
    defaultCooldown: 9,
    defaultMax: 3,
    categoryRepeatPenalty: 0.55,
  },

  education: {
    startKindergarten: 4,
    startPrimary: 6,
    startSecondary: 12,
    finishSecondaryAge: 18,
    tuition: {
      vocational: 7000, bachelor: 14000, master: 18000, doctorate: 16000, medicine: 38000, law: 32000,
    } as Record<string, number>,
    parentSupportByTier: [0, 0.0, 0.2, 0.5, 0.8, 1.0], // index = wealth tier
    loanRate: 0.05,
    effort: { low: -9, normal: 0, high: 9 },
  },

  career: {
    levelMult: [1, 1.25, 1.55, 1.95, 2.5],
    partTimeFactor: 0.42,
    baseLayoff: 0.028,
    promotionBase: 0.09,
    retireMinAge: 55,
    mustRetireAge: 72,
    maxHireAge: 66,
    severanceMonths: 2,
  },

  finance: {
    savingsRealRate: 0.004,
    cardRate: 0.21,
    cardLimitFactor: 0.4,
    personalLoanSpread: 0.045,
    mortgageSpread: 0.015,
    mortgageYears: 25,
    propertyCostRate: 0.015,
    rentYield: 0.045,
    sellingCost: 0.05,
    lifestyleCreep: 0.42, // share of income above the median that drifts into everyday spending
    subsistence: 5200, // minimum yearly living that society/family guarantees (USD base)
    lifestyle: {
      frugal: { cost: 0.72, happy: -2 },
      normal: { cost: 1, happy: 0 },
      comfortable: { cost: 1.35, happy: 2 },
      luxury: { cost: 2.1, happy: 4 },
    } as Record<Lifestyle, { cost: number; happy: number }>,
    base: {
      living: 3600, food: 4300, transit: 1300, carRunning: [2600, 3600, 4600, 7200, 9500],
      childCost: 5600, healthcare: { public: 380, mixed: 1500, private: 3700 },
    },
    rent: [6200, 9800, 15500, 29000],
    homePrice: [95000, 190000, 350000, 1100000],
    carPrice: [9000, 28000, 44000, 88000, 125000],
    investments: {
      index: { mu: 0.075, sd: 0.15, beta: 1 },
      stocks: { mu: 0.085, sd: 0.3, beta: 1.25 },
      bonds: { mu: 0.036, sd: 0.05, beta: 0.1 },
      crypto: { mu: 0.12, sd: 0.75, beta: 1.8 },
    } as Record<string, { mu: number; sd: number; beta: number }>,
    retirement: { employerMatch: 0.5, matchCap: 0.04, equityShare: 0.6, withdrawRate: 0.04, earlyPenalty: 0.1 },
    estateCharity: [0, 0.1, 0.25, 0.5],
  },

  relationships: {
    friendDecay: 3.5,
    familyDecay: 1.2,
    partnerDecay: 3,
    divorceBase: 0.004,
    breakupBase: 0.07,
    fertileMaxFemale: 45,
    babyChance: [0.55, 0.45, 0.35, 0.22, 0.1, 0.03],
  },

  difficulty: {
    easy: { startWealth: 1.4, eventHarshness: 0.8, mortality: 0.8, income: 1.1, hardshipFloor: 1.4 },
    normal: { startWealth: 1, eventHarshness: 1, mortality: 1, income: 1, hardshipFloor: 1 },
    hard: { startWealth: 0.65, eventHarshness: 1.25, mortality: 1.2, income: 0.92, hardshipFloor: 0.8 },
  } as Record<Difficulty, { startWealth: number; eventHarshness: number; mortality: number; income: number; hardshipFloor: number }>,
};

export const DEFAULT_TUNING = { mortality: 1, income: 1, expenses: 1, eventRate: 1, volatility: 1 };

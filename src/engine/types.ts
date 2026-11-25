// Core type definitions for the LifeVerse simulation. Pure data — no React in here.

export type Gender = 'male' | 'female' | 'nonbinary';
export type StatKey = 'health' | 'happiness' | 'intelligence' | 'appearance' | 'confidence' | 'discipline' | 'social';
export type Stats = Record<StatKey, number>;
export type SkillKey = 'tech' | 'business' | 'creative' | 'medical' | 'trades' | 'communication' | 'leadership' | 'athletic';
export type Skills = Record<SkillKey, number>;
export type Difficulty = 'easy' | 'normal' | 'hard';
export type EduLevel = 'none' | 'primary' | 'secondary' | 'vocational' | 'bachelor' | 'master' | 'doctorate';
export type EduStage = 'kindergarten' | 'primary' | 'secondary' | 'vocational' | 'bachelor' | 'master' | 'doctorate';
export type Effort = 'low' | 'normal' | 'high';
export type Lifestyle = 'frugal' | 'normal' | 'comfortable' | 'luxury';
export type Tone = 'good' | 'bad' | 'neutral' | 'info';
export type LifeStage = 'baby' | 'child' | 'teen' | 'youngAdult' | 'adult' | 'senior';
export type Relation =
  | 'mother' | 'father' | 'guardian' | 'sibling' | 'friend' | 'partner' | 'spouse'
  | 'exPartner' | 'exSpouse' | 'child' | 'coworker' | 'boss';
export type JournalKind =
  | 'event' | 'decision' | 'career' | 'education' | 'family' | 'finance' | 'health' | 'achievement' | 'world' | 'milestone';
export type Economy = 'boom' | 'normal' | 'recession';

export interface Tuning {
  mortality: number;
  income: number;
  expenses: number;
  eventRate: number;
  volatility: number;
}

// ------------------------------------------------------------------ static content defs
export interface Country {
  id: string;
  name: string;
  flag: string;
  currency: string;
  fx: number; // units of local currency per 1 USD
  locale: string;
  wageIndex: number; // salary level relative to USA = 1
  costIndex: number; // cost-of-living relative to USA = 1
  housingIndex: number;
  tax: { rates: [number, number, number, number]; payroll: number };
  healthcare: 'public' | 'mixed' | 'private';
  tuitionIndex: number;
  lifeExpectancy: number;
  welfare: number; // 0..1 generosity of unemployment & social support
  inflationBias: number;
  retirementAge: number;
  pensionRate: number; // fraction of average salary paid as state pension
  unemploymentBias: number;
  inheritanceTax: number;
  cities: string[];
  names: string; // key into NAME_POOLS
}

export interface CareerDef {
  id: string;
  title: string;
  industry: string;
  icon: string;
  minEdu: EduLevel;
  fields?: string[]; // acceptable degree fields (if the education level is bachelor+)
  anyDegree?: boolean;
  minAge: number;
  maxAge?: number;
  salary: number; // starting annual salary, 2025 USD, USA
  skill: SkillKey;
  skillMin: number;
  prestige: number; // 0..25 — interview difficulty
  stress: number; // 0..10
  layoffRisk: number; // multiplier
  ladder?: string[];
  volatile?: boolean; // creative/athletic income swings
  partTime?: boolean;
  special?: 'business' | 'politician' | 'ceo' | 'athlete';
  stats?: Partial<Record<StatKey, number>>; // minimums
  desc: string;
}

export interface DegreeDef {
  id: string;
  name: string;
  field: string;
  level: 'bachelor' | 'master' | 'doctorate' | 'vocational';
  years: number;
  difficulty: number; // 0..30 admission/graded difficulty
  cost: number;
  skill?: SkillKey;
  requires?: string; // prerequisite field (e.g. master's in same field)
}

export interface ActivityDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  minAge: number;
  maxAge?: number;
  energy: number;
  cost?: number; // base-USD, scaled
  when?: (c: EventCtx) => boolean;
  disabledReason?: (c: EventCtx) => string | null;
  outcomes: Outcome[];
  group: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'legendary';
  check: (g: GameState, meta: MetaState) => boolean;
}

// ------------------------------------------------------------------ events
export type RelFx = [who: string, closeness: number, trust?: number];
export type Sched = [id: string, minYears: number, maxYears: number, chance?: number];
export type FlagVal = number | boolean | string;

export interface AddPerson {
  rel: Relation;
  age?: number | [number, number];
  closeness?: number;
  gender?: Gender;
  note?: string;
}

export interface Effects extends Partial<Record<StatKey, number>> {
  money?: number; // base USD, scaled by economy/country
  rawMoney?: number; // nominal USD, unscaled
  skill?: Partial<Skills>;
  rel?: RelFx | RelFx[];
  flag?: Record<string, FlagVal>;
  inc?: Record<string, number>;
  sched?: Sched | Sched[];
  job?: 'fire' | 'promote' | 'raise' | 'layoff' | 'quit' | 'bonus';
  death?: string;
  add?: AddPerson;
  end?: string;
  ach?: string;
  grades?: number;
  scholarship?: number;
  expel?: boolean;
  cond?: string;
  cure?: string;
  debt?: number;
  crime?: number;
  salaryPct?: number;
  econ?: Economy;
  run?: (c: EventCtx) => string | void;
}

export interface Outcome {
  text: string;
  fx?: Effects;
  w?: number | ((c: EventCtx) => number);
}

export interface EventChoice {
  label: string;
  hint?: string;
  cost?: number; // base USD
  when?: (c: EventCtx) => boolean;
  disabledReason?: string;
  outcomes: Outcome[];
}

export interface EventTemplate {
  id: string;
  title: string;
  icon: string;
  category: string;
  text: string;
  ages: [number, number];
  weight: number | ((c: EventCtx) => number);
  when?: (c: EventCtx) => boolean;
  cooldown?: number;
  max?: number;
  yearMin?: number;
  yearMax?: number;
  force?: boolean;
  choices: EventChoice[];
  tags?: string[];
  /** Binds event-specific people/words when the event is queued (e.g. which child is asking). */
  prep?: (g: GameState) => { targets?: Record<string, string>; tokens?: Record<string, string> } | null;
}

export interface ActiveEvent {
  id: string;
  title: string;
  icon: string;
  category: string;
  text: string;
  choices: { label: string; hint?: string; cost?: number; disabled?: string }[];
  targets: Record<string, string>;
  tokens: Record<string, string>;
}

export interface EventCtx {
  g: GameState;
  p: Character;
  age: number;
  country: Country;
  targets: Record<string, string>;
}

// ------------------------------------------------------------------ people
export interface Genes {
  intelligence: number; appearance: number; health: number; confidence: number; discipline: number; social: number;
}

/** Someone an adult child is dating, engaged to or married to. */
export interface ChildMatch {
  name: string;
  gender: Gender;
  birthYear: number;
  job?: string;
  wealth: number;
  quality: 'great' | 'good' | 'risky';
  status: 'dating' | 'married';
  /** the parent's age at which the child asks for a blessing */
  askAge: number;
  deferred: number;
  revealed?: boolean;
  marriedAge?: number;
}

export interface Person {
  id: string;
  name: string;
  gender: Gender;
  birthYear: number;
  alive: boolean;
  deathYear?: number;
  deathCause?: string;
  relation: Relation;
  closeness: number;
  trust: number;
  compatibility: number;
  wealth: number;
  income: number;
  job?: string;
  traits: string[];
  history: { age: number; text: string }[];
  metAge: number;
  interacted?: boolean;
  marriedAge?: number;
  endedAge?: number;
  genes?: Genes;
  nurture?: number;
  fund?: number;
  otherParentId?: string;
  kids?: { name: string; gender: Gender; birthYear: number }[];
  youth?: boolean;
  absent?: boolean;
  adopted?: boolean;
  surname?: string;
  schoolTier?: number;
  match?: ChildMatch;
  estranged?: boolean;
}

export interface JournalEntry {
  id: string;
  age: number;
  year: number;
  kind: JournalKind;
  text: string;
  tone: Tone;
}

// ------------------------------------------------------------------ education
export interface DegreeRecord {
  id: string; name: string; field: string; level: EduLevel; age: number; gpa: number; honors?: boolean;
}

export interface EducationState {
  level: EduLevel;
  stage: EduStage | null;
  yearInStage: number;
  stageYears: number;
  degreeId?: string;
  degreeName?: string;
  field?: string;
  grades: number; // current-year performance 0..100
  avg: number; // running average in the current programme
  secondaryAvg: number;
  admission: number; // exam score used for university admission
  degrees: DegreeRecord[];
  effort: Effort;
  scholarship: { name: string; pct: number } | null;
  failedYears: number;
  dropouts: number;
  schoolName: string;
  appliedThisYear: boolean;
  tuitionDue: number;
  history: { age: number; text: string }[];
}

// ------------------------------------------------------------------ career
export interface JobState {
  careerId: string;
  title: string;
  level: number;
  company: string;
  salary: number; // nominal annual (already includes price level)
  startAge: number;
  years: number;
  performance: number;
  satisfaction: number;
  partTime: boolean;
  warnings: number;
}

export interface JobRecord {
  careerId: string; title: string; company: string; startAge: number; endAge: number | null;
  endReason?: string; salary: number; level: number;
}

export interface Business {
  name: string; sector: string; invested: number; capital: number; revenue: number; profit: number;
  employees: number; age: number; peakRevenue: number;
}

export interface CareerState {
  job: JobState | null;
  history: JobRecord[];
  experience: Record<string, number>;
  totalYears: number;
  unemployedYears: number;
  retired: boolean;
  retiredAge?: number;
  effort: Effort;
  reputation: number;
  lastReview: { age: number; rating: number; text: string } | null;
  appsThisYear: number;
  pension: number;
  salaryHistory: number[];
  business: Business | null;
  lastSalary: number;
}

// ------------------------------------------------------------------ finance
export interface Holding { id: string; kind: 'index' | 'stocks' | 'bonds' | 'crypto'; value: number; basis: number }
export interface Loan {
  id: string; kind: 'personal' | 'student' | 'mortgage' | 'auto'; name: string; balance: number; rate: number; payment: number; assetId?: string;
}
export interface Property {
  id: string; name: string; tier: number; city: string; value: number; bought: number; boughtAge: number; rented: boolean; home: boolean;
}
export interface Vehicle { id: string; name: string; tier: number; value: number; bought: number; boughtAge: number }

export interface YearReport {
  age: number;
  income: { salary: number; pension: number; benefits: number; partner: number; rental: number; interest: number; business: number; other: number };
  tax: number;
  retirementIn: number;
  expenses: { living: number; food: number; housing: number; transport: number; education: number; healthcare: number; children: number; debt: number };
  investment: number;
  net: number;
  hardship: boolean;
}

export interface Finances {
  cash: number;
  savings: number;
  holdings: Holding[];
  retirement: number;
  contrib: number; // % of salary
  loans: Loan[];
  card: { balance: number; limit: number };
  creditScore: number;
  properties: Property[];
  vehicles: Vehicle[];
  housing: { kind: 'family' | 'rent' | 'own'; quality: number; propertyId?: string };
  lifestyle: Lifestyle;
  trust: number; // inherited trust fund waiting for age 18
  lastReport: YearReport | null;
  bankruptcies: number;
  donated: number;
  peakNetWorth: number;
  totalInherited: number;
  lottery: number;
}

// ------------------------------------------------------------------ character
export interface StatPoint {
  age: number; year: number; health: number; happiness: number; netWorth: number; income: number; intelligence: number;
}

export interface Background {
  wealthTier: 1 | 2 | 3 | 4 | 5;
  household: 'two-parent' | 'single-mother' | 'single-father' | 'guardian';
  label: string;
}

export interface Character {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthYear: number;
  birthCountry: string;
  birthCity: string;
  countryId: string;
  city: string;
  age: number;
  alive: boolean;
  deathYear?: number;
  deathCause?: string;
  stats: Stats;
  skills: Skills;
  traits: string[];
  conditions: string[];
  background: Background;
  edu: EducationState;
  career: CareerState;
  fin: Finances;
  people: Person[];
  flags: Record<string, FlagVal>;
  energy: number;
  actions: string[]; // activity ids used this year
  visited: string[];
  journal: JournalEntry[];
  history: StatPoint[];
  achievements: string[];
  generation: number;
  willCharity: number; // index into BALANCE.finance.estateCharity
  willMode: 'equal' | 'eldest';
  weddingYear?: number;
}

// ------------------------------------------------------------------ world
export interface WorldEventInst { id: string; title: string; desc: string; startYear: number; yearsLeft: number }

export interface World {
  priceIndex: number;
  inflation: number;
  economy: Economy;
  econYears: number;
  unemployment: number;
  stockReturn: number; // last year's equity return
  housingGrowth: number;
  housingReal: number;
  interest: number;
  events: WorldEventInst[];
  history: { year: number; economy: Economy; inflation: number; unemployment: number }[];
}

// ------------------------------------------------------------------ dynasty / death
export interface LifeRecord {
  id: string; name: string; gender: Gender; generation: number; birthYear: number; deathYear: number; ageAtDeath: number;
  cause: string; netWorth: number; occupation: string; spouse?: string; children: string[]; achievements: number; country: string;
  inherited: number;
}
export interface Dynasty {
  surname: string;
  generation: number;
  members: LifeRecord[];
  startedYear: number;
}

export interface EstateShare { id: string; name: string; amount: number; relation: string }
export interface DeathSummary {
  name: string; age: number; birthYear: number; deathYear: number; cause: string; netWorth: number; peakNetWorth: number;
  careerHistory: JobRecord[]; achievements: string[]; spouse?: string; highestEdu: string; countries: number;
  children: { id: string; name: string; age: number; alive: boolean; gender: Gender }[];
  estate: { gross: number; debts: number; tax: number; charity: number; shares: EstateShare[] };
  legacyScore: number; legacyText: string; avgHappiness: number; generation: number; countryId: string;
}

export interface GameState {
  version: number;
  id: string;
  slot: number;
  createdAt: string;
  updatedAt: string;
  year: number;
  difficulty: Difficulty;
  tuning: Tuning;
  player: Character;
  world: World;
  queue: ActiveEvent[];
  pending: ActiveEvent | null;
  scheduled: { id: string; dueAge: number; chance: number }[];
  eventLog: Record<string, { count: number; last: number }>;
  lastCategories: string[];
  candidate: Person | null;
  dynasty: Dynasty;
  deathSummary: DeathSummary | null;
  phase: 'alive' | 'dead';
  estateShares: EstateShare[];
}

// ------------------------------------------------------------------ meta / settings
export interface SettingsState {
  theme: 'dark' | 'light' | 'system';
  autosave: boolean;
  reduceMotion: boolean;
  defaultDifficulty: Difficulty;
  confirmDestructive: boolean;
}
export interface MetaState {
  version: number;
  activeSlot: number | null;
  unlocked: Record<string, { at: string; who: string; age: number }>;
  settings: SettingsState;
  livesLived: number;
}

export interface ActionResult {
  ok: boolean;
  msg: string;
  tone?: Tone;
  data?: unknown;
}

export interface NewGameOptions {
  firstName: string;
  lastName: string;
  gender: Gender;
  countryId: string;
  city: string;
  birthYear: number;
  wealthTier: 1 | 2 | 3 | 4 | 5;
  household: Background['household'];
  traits: string[];
  difficulty: Difficulty;
  slot: number;
  stats?: Stats;
}

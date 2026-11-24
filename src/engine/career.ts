import { BALANCE } from './config';
import { CAREERS, careerById, COMPANY_A, COMPANY_B, EDU_RANK } from './data/careers';
import { traitSum } from './data/traits';
import { genPerson } from './people';
import { chance, clamp, gauss, pick, rint, rnd } from './rng';
import { hasField } from './education';
import { addStat, countryOf, diff, incFlag, log, netWorth, no, ok, partnerOf, setFlag, wageScale } from './util';
import type { ActionResult, CareerDef, CareerState, GameState, JobState } from './types';

const PREFIX = ['Junior ', '', 'Senior ', 'Lead ', 'Principal '];
export const titleFor = (def: CareerDef, level: number) => (def.ladder ? def.ladder[Math.min(level, def.ladder.length - 1)] : `${PREFIX[level]}${def.title}`);
export const randomCompany = () => `${pick(COMPANY_A)} ${pick(COMPANY_B)}`;

export interface JobListing {
  def: CareerDef; eligible: boolean; reasons: string[]; chance: number; startSalary: number;
}

// ------------------------------------------------------------------ eligibility
export function eligibility(g: GameState, def: CareerDef): { ok: boolean; reasons: string[] } {
  const p = g.player;
  const e = p.edu;
  const c = p.career;
  const r: string[] = [];
  if (p.age < def.minAge) r.push(`Minimum age ${def.minAge}`);
  if (def.maxAge && p.age > def.maxAge) r.push(`Maximum age ${def.maxAge}`);
  if (p.age > BALANCE.career.maxHireAge && !def.partTime && def.special !== 'business') r.push('Too late in life for full-time hiring');
  if (c.retired && !def.partTime && def.special !== 'business') r.push('You are retired (part-time work only)');
  if (e.stage && !def.partTime && p.age < 22) r.push('Finish your studies first (or take a part-time job)');
  else if (e.stage && !def.partTime && (e.stage === 'bachelor' || e.stage === 'master' || e.stage === 'doctorate' || e.stage === 'vocational')) r.push('Finish your studies first (or take a part-time job)');
  if (p.age < 16 && !def.partTime) r.push('Too young for full-time work');
  const need = EDU_RANK[def.minEdu];
  if (def.fields) {
    const okField = p.edu.degrees.some((d) => def.fields!.includes(d.field) && EDU_RANK[d.level] >= need);
    if (!okField) r.push(need >= EDU_RANK.bachelor ? `Needs a ${def.minEdu} in a relevant field` : 'Needs relevant vocational training');
  } else if (EDU_RANK[e.level] < need) {
    r.push(`Needs ${def.minEdu === 'secondary' ? 'a secondary diploma' : def.minEdu === 'bachelor' ? "a bachelor's degree" : def.minEdu}`);
  }
  if (def.stats) for (const k of Object.keys(def.stats) as (keyof typeof p.stats)[]) if (p.stats[k] < (def.stats[k] ?? 0)) r.push(`${k} ≥ ${def.stats[k]}`);
  if (def.special === 'athlete' && !(p.skills.athletic >= 25 || p.traits.includes('athletic'))) r.push('Needs athletic ability (train in Activities)');
  if (def.special === 'ceo') {
    const isBusinessy = c.history.some((h) => h.level >= 3) || (c.business != null && c.business.revenue > 500000 * wageScale(g));
    if (!(c.totalYears >= 14 && p.skills.leadership >= 45) && !isBusinessy) r.push('Needs 14+ years experience, leadership, or a top-level role');
  }
  if (def.special === 'politician' && c.reputation < 40) r.push('Needs a decent reputation');
  return { ok: r.length === 0, reasons: r };
}

export function hireChance(g: GameState, def: CareerDef): number {
  const p = g.player;
  const c = p.career;
  const exp = c.experience[def.industry] ?? 0;
  const eff = p.skills[def.skill] + p.stats.intelligence * 0.2;
  let ch = 0.38;
  ch += Math.min(0.2, exp * 0.025);
  ch += (eff - def.skillMin) * 0.006;
  ch += ((p.stats.social + p.stats.confidence) / 2 - 50) * 0.003;
  ch += (p.stats.intelligence - 50) * 0.002;
  ch += (c.reputation - 50) * 0.002;
  if (def.fields && hasField(p, def.fields)) ch += 0.1;
  if (EDU_RANK[p.edu.level] > EDU_RANK[def.minEdu]) ch += 0.05 * (EDU_RANK[p.edu.level] - EDU_RANK[def.minEdu]);
  ch -= def.prestige * 0.009;
  ch *= g.world.economy === 'boom' ? 1.12 : g.world.economy === 'recession' ? 0.78 : 1;
  ch -= g.world.unemployment * 0.5;
  ch -= c.appsThisYear * 0.02;
  if (def.special === 'athlete') ch = 0.08 + (p.skills.athletic - 25) * 0.008 + (p.stats.health - 60) * 0.004;
  if (def.special === 'politician') ch = 0.1 + (p.stats.social - 55) * 0.006 + (p.stats.confidence - 50) * 0.004 + (c.reputation - 40) * 0.003;
  if (def.partTime) ch = Math.max(ch, 0.55);
  return clamp(ch, 0.03, 0.92);
}

export function startingLevel(g: GameState, def: CareerDef): number {
  if (def.partTime || def.special === 'business') return 0;
  const exp = g.player.career.experience[def.industry] ?? 0;
  if (def.special === 'ceo') return 0;
  return exp >= 10 ? 2 : exp >= 4 ? 1 : 0;
}

export function salaryFor(g: GameState, def: CareerDef, level: number): number {
  const p = g.player;
  const exp = p.career.experience[def.industry] ?? 0;
  const over = Math.max(0, EDU_RANK[p.edu.level] - EDU_RANK[def.minEdu]);
  let s = def.salary * wageScale(g) * BALANCE.career.levelMult[level] * (1 + 0.02 * Math.min(exp, 15)) * (1 + 0.03 * over);
  if (def.partTime) s *= BALANCE.career.partTimeFactor;
  s *= gauss(1, 0.06) * g.tuning.income * diff(g).income;
  return Math.round(s);
}

export function jobBoard(g: GameState): JobListing[] {
  return CAREERS.map((def) => {
    const el = eligibility(g, def);
    return { def, eligible: el.ok, reasons: el.reasons, chance: el.ok ? hireChance(g, def) : 0, startSalary: Math.round(def.salary * wageScale(g) * (def.partTime ? BALANCE.career.partTimeFactor : 1) * BALANCE.career.levelMult[startingLevel(g, def)]) };
  });
}

// ------------------------------------------------------------------ hiring / leaving
function closeJob(g: GameState, reason: string) {
  const c = g.player.career;
  if (!c.job) return;
  const last = c.history[c.history.length - 1];
  if (last && last.endAge === null) { last.endAge = g.player.age; last.endReason = reason; last.salary = c.job.salary; last.level = c.job.level; last.title = c.job.title; }
  c.lastSalary = 0;
  c.job = null;
  // coworkers fade out
  for (const x of g.player.people) if ((x.relation === 'boss' || x.relation === 'coworker') && x.closeness >= 62) x.relation = 'friend';
  g.player.people = g.player.people.filter((x) => x.relation !== 'boss' && x.relation !== 'coworker');
}

export function hire(g: GameState, def: CareerDef, level?: number): JobState {
  const p = g.player;
  const c = p.career;
  if (c.job) closeJob(g, 'switched jobs');
  const lv = level ?? startingLevel(g, def);
  const salary = salaryFor(g, def, lv);
  const company = def.special === 'business' ? (c.business?.name ?? randomCompany()) : randomCompany();
  const job: JobState = {
    careerId: def.id, title: titleFor(def, lv), level: lv, company, salary, startAge: p.age, years: 0, performance: 60, satisfaction: 62, partTime: !!def.partTime, warnings: 0,
  };
  c.job = job;
  c.unemployedYears = 0;
  c.history.push({ careerId: def.id, title: job.title, company, startAge: p.age, endAge: null, salary, level: lv });
  c.lastSalary = salary;
  if (def.special !== 'business' && !def.partTime) {
    const culture = countryOf(g).names;
    const boss = genPerson({ relation: 'boss', age: rint(34, 58), year: g.year, culture, closeness: gauss(45, 12), tier: 4, wageScale: wageScale(g), metAge: p.age });
    boss.job = `${def.title} manager`;
    p.people.push(boss);
    for (let i = 0; i < 2; i++) p.people.push(genPerson({ relation: 'coworker', age: rint(22, 52), year: g.year, culture, closeness: gauss(42, 12), tier: 3, wageScale: wageScale(g), metAge: p.age }));
  }
  if (c.history.length === 1) setFlag(p, 'firstJob', p.age);
  return job;
}

export function applyForJob(g: GameState, careerId: string): ActionResult {
  const p = g.player;
  const def = careerById(careerId);
  if (!def) return no('That job does not exist.');
  if (def.special === 'business') return no('Use “Start a business” to become an entrepreneur.');
  const el = eligibility(g, def);
  if (!el.ok) return no(`You don't qualify: ${el.reasons[0]}.`);
  if (p.energy < 1) return no('You have no energy left this year to job-hunt.');
  if (p.career.job?.careerId === def.id) return no('You already work in this role.');
  p.energy -= 1;
  const ch = hireChance(g, def);
  p.career.appsThisYear++;
  const screen = chance(Math.min(0.97, ch + 0.28));
  if (!screen) {
    addStat(p, 'confidence', -1.5);
    log(g, 'career', `📭 Your application for ${def.title} was rejected before the interview stage.`, 'bad');
    return { ok: false, msg: `Application rejected for ${def.title}. Build experience or skills and try again.`, tone: 'bad' };
  }
  const score = p.stats.confidence * 0.33 + p.stats.social * 0.28 + p.stats.intelligence * 0.27 + p.stats.appearance * 0.12 + gauss(0, 12);
  const need = 38 + def.prestige * 1.1;
  const interviewOk = score >= need - (ch - 0.5) * 30 && chance(Math.min(0.97, ch / 0.45 + 0.3));
  if (!interviewOk) {
    addStat(p, 'confidence', -1);
    const why = p.stats.confidence < 45 ? 'You were too nervous in the room.' : p.stats.social < 45 ? 'You struggled to connect with the interviewers.' : 'Another candidate was more experienced.';
    log(g, 'career', `🤝 You interviewed for ${def.title} but didn't get the offer. ${why}`, 'bad');
    return { ok: false, msg: `Interview unsuccessful. ${why}`, tone: 'bad' };
  }
  const prev = p.career.job;
  const job = hire(g, def);
  addStat(p, 'happiness', prev ? 4 : 8); addStat(p, 'confidence', 3);
  log(g, 'career', `${prev ? '🔄 You switched careers: ' : '💼 You got a job: '}${job.title} at ${job.company} — ${money(g, job.salary)}/year.`, 'good');
  if (def.special === 'politician') log(g, 'career', '🗳️ You won your first election and took office.', 'good');
  return ok(`Hired! ${job.title} at ${job.company}.`, 'good');
}

import { fmtMoney } from './format';
const money = (g: GameState, v: number) => fmtMoney(v, g.player.countryId, true);

export function quitJob(g: GameState): ActionResult {
  const c = g.player.career;
  if (!c.job) return no('You have no job to quit.');
  const t = c.job.title;
  const co = c.job.company;
  if (c.business) { c.business = null; log(g, 'career', `📦 You closed your business ${co}.`, 'neutral'); }
  closeJob(g, 'resigned');
  addStat(g.player, 'happiness', -1);
  log(g, 'career', `👋 You resigned from your role as ${t} at ${co}.`, 'neutral');
  return ok(`You resigned as ${t}.`, 'info');
}

export function fireFromJob(g: GameState, reason: 'fired' | 'laid off', extra = '') {
  const c = g.player.career;
  if (!c.job) return;
  const sev = Math.round(c.job.salary / 12 * BALANCE.career.severanceMonths * (reason === 'laid off' ? 1 : 0));
  const t = c.job.title; const co = c.job.company;
  closeJob(g, reason);
  c.unemployedYears = 0;
  c.reputation = clamp(c.reputation - (reason === 'fired' ? 10 : 2), 0, 100);
  if (sev > 0) g.player.fin.cash += sev;
  addStat(g.player, 'happiness', -9); addStat(g.player, 'confidence', -5);
  log(g, 'career', `${reason === 'fired' ? '🔥 You were fired from' : '📉 You were laid off from'} your role as ${t} at ${co}.${sev ? ` Severance: ${money(g, sev)}.` : ''} ${extra}`, 'bad');
}

// ------------------------------------------------------------------ retirement
export function passiveIncomeCoversExpenses(g: GameState): boolean {
  const f = g.player.fin;
  const assets = f.savings + f.holdings.reduce((s, h) => s + h.value, 0) + f.retirement + f.properties.filter((x) => !x.home).reduce((s, h) => s + h.value * 0.6, 0);
  const exp = f.lastReport ? Object.values(f.lastReport.expenses).reduce((a, b) => a + b, 0) : 0;
  return exp > 0 && assets * BALANCE.finance.retirement.withdrawRate >= exp * 1.05;
}
export function canRetire(g: GameState): { ok: boolean; early: boolean; reason?: string } {
  const p = g.player;
  if (p.career.retired) return { ok: false, early: false, reason: 'Already retired' };
  if (p.age >= BALANCE.career.retireMinAge) return { ok: true, early: false };
  if (p.age >= 35 && passiveIncomeCoversExpenses(g)) return { ok: true, early: true };
  return { ok: false, early: false, reason: `You can retire at ${BALANCE.career.retireMinAge}, or earlier if your investments cover your expenses` };
}

export function retire(g: GameState, forced = false): ActionResult {
  const p = g.player;
  const c = p.career;
  const chk = canRetire(g);
  if (!forced && !chk.ok) return no(chk.reason ?? 'You cannot retire yet.');
  if (c.job) closeJob(g, 'retired');
  if (c.business) { c.business = null; }
  c.retired = true; c.retiredAge = p.age;
  addStat(p, 'happiness', 4); addStat(p, 'health', 1);
  log(g, 'career', `🏖️ You retired at ${p.age}${chk.early ? ' — financially independent!' : '.'}`, 'good');
  if (chk.early && p.age < 55) setFlag(p, 'earlyRetire', p.age);
  return ok(`You retired at ${p.age}. Enjoy it!`, 'good');
}

// ------------------------------------------------------------------ improving your standing
export function setWorkEffort(g: GameState, e: 'low' | 'normal' | 'high'): ActionResult {
  g.player.career.effort = e;
  return ok(`Work effort set to ${e}.`, 'info');
}

export function askRaise(g: GameState): ActionResult {
  const p = g.player; const job = p.career.job;
  if (!job) return no('You need a job first.');
  if (job.partTime && p.age < 18) return no('You are too new for that.');
  if (p.energy < 1) return no('No energy left this year.');
  if (p.actions.includes('raise')) return no('You already asked for a raise this year.');
  p.energy -= 1; p.actions.push('raise');
  const boss = p.people.find((x) => x.relation === 'boss');
  const ch = clamp(0.12 + (job.performance - 50) * 0.008 + (p.stats.confidence - 50) * 0.003 + ((boss?.closeness ?? 40) - 40) * 0.003 - (g.world.economy === 'recession' ? 0.15 : 0), 0.03, 0.75);
  if (chance(ch)) {
    const pct = rint(4, 11) / 100;
    job.salary = Math.round(job.salary * (1 + pct));
    log(g, 'career', `💰 Your boss agreed to a ${Math.round(pct * 100)}% raise. New salary: ${money(g, job.salary)}.`, 'good');
    addStat(p, 'happiness', 4); addStat(p, 'confidence', 2);
    return ok(`Raise approved: +${Math.round(pct * 100)}%.`, 'good');
  }
  if (boss) { boss.trust = clamp(boss.trust - 4, 0, 100); }
  addStat(p, 'confidence', -1);
  if (job.performance < 40) job.warnings++;
  log(g, 'career', '🙅 Your boss turned down your request for a raise.', 'bad');
  return { ok: false, msg: 'Your raise request was denied.', tone: 'bad' };
}

export function maxLevelFor(def: CareerDef) { return def.partTime ? 0 : 4; }

export function promote(g: GameState, announce = true): boolean {
  const p = g.player; const job = p.career.job;
  if (!job) return false;
  const def = careerById(job.careerId);
  if (!def || job.level >= maxLevelFor(def)) return false;
  const old = job.salary;
  job.level++;
  job.title = titleFor(def, job.level);
  job.salary = Math.round(old * (BALANCE.career.levelMult[job.level] / BALANCE.career.levelMult[job.level - 1]) * gauss(1, 0.02));
  job.years = Math.min(job.years, 1);
  const last = p.career.history[p.career.history.length - 1];
  if (last) { last.title = job.title; last.level = job.level; last.salary = job.salary; }
  p.career.reputation = clamp(p.career.reputation + 5, 0, 100);
  addStat(p, 'happiness', 7); addStat(p, 'confidence', 3);
  if (announce) log(g, 'career', def.special === 'politician' ? `🗳️ You won election and became ${job.title}! Salary ${money(g, job.salary)}.` : `🎉 You were promoted to ${job.title}! Salary ${money(g, job.salary)}.`, 'good');
  return true;
}

export function askPromotion(g: GameState): ActionResult {
  const p = g.player; const job = p.career.job;
  if (!job) return no('You need a job first.');
  const def = careerById(job.careerId)!;
  if (job.level >= maxLevelFor(def)) return no('You are already at the top of this ladder.');
  if (p.energy < 1) return no('No energy left this year.');
  if (p.actions.includes('promo')) return no('You already pushed for a promotion this year.');
  if (job.years < 2) return no('You need at least 2 years in your current role.');
  p.energy -= 1; p.actions.push('promo');
  const ch = clamp(0.08 + (job.performance - 55) * 0.01 + (p.career.reputation - 50) * 0.003 + job.years * 0.01 - (g.world.economy === 'recession' ? 0.12 : 0), 0.02, 0.7);
  if (chance(ch)) { promote(g); return ok(`Promoted to ${p.career.job?.title}!`, 'good'); }
  addStat(p, 'confidence', -1);
  log(g, 'career', '🙅 You asked for a promotion but were told to wait.', 'bad');
  return { ok: false, msg: 'Not this time — keep performing and try again next year.', tone: 'bad' };
}

// ------------------------------------------------------------------ entrepreneurship
export const BUSINESS_SECTORS: Record<string, { mu: number; sd: number; margin: number; skill: 'tech' | 'business' | 'creative' | 'trades' | 'communication' }> = {
  'Café': { mu: 0.05, sd: 0.2, margin: 0.09, skill: 'communication' },
  'Online store': { mu: 0.12, sd: 0.3, margin: 0.12, skill: 'business' },
  'Consulting firm': { mu: 0.08, sd: 0.18, margin: 0.2, skill: 'business' },
  'Tech startup': { mu: 0.2, sd: 0.55, margin: 0.14, skill: 'tech' },
  'Restaurant': { mu: 0.04, sd: 0.24, margin: 0.07, skill: 'communication' },
  'Construction company': { mu: 0.06, sd: 0.2, margin: 0.1, skill: 'trades' },
  'Design agency': { mu: 0.09, sd: 0.25, margin: 0.17, skill: 'creative' },
  'Fitness studio': { mu: 0.06, sd: 0.22, margin: 0.11, skill: 'communication' },
};
export const BUSINESS_TIERS = [{ name: 'Small', invest: 8000 }, { name: 'Medium', invest: 40000 }, { name: 'Large', invest: 150000 }];

export function startBusiness(g: GameState, sector: string, tier: number, name: string): ActionResult {
  const p = g.player; const c = p.career;
  if (c.business) return no('You already run a business.');
  if (p.age < 18) return no('You must be 18 to start a company.');
  if (p.edu.stage && p.age < 22) return no('Finish your studies first.');
  const t = BUSINESS_TIERS[tier];
  const cost = Math.round(t.invest * wageScale(g));
  if (p.fin.cash < cost) return no(`You need ${money(g, cost)} in cash to launch a ${t.name.toLowerCase()} business.`);
  if (p.energy < 2) return no('Starting a company takes 2 energy.');
  p.energy -= 2; p.fin.cash -= cost;
  const sec = BUSINESS_SECTORS[sector];
  c.business = { name: name || `${pick(COMPANY_A)} ${sector}`, sector, invested: cost, capital: cost * 0.4, revenue: Math.round(cost * rnd() * 0.8 + cost * 0.9), profit: 0, employees: tier + 1, age: 0, peakRevenue: 0 };
  c.business.peakRevenue = c.business.revenue;
  const def = careerById('entrepreneur')!;
  hire(g, def, 0);
  if (c.job) { c.job.company = c.business.name; c.history[c.history.length - 1].company = c.business.name; }
  addStat(p, 'happiness', 6); addStat(p, 'confidence', 3);
  setFlag(p, 'foundedBusiness', p.age);
  log(g, 'career', `🚀 You founded ${c.business.name} (${sector}) with ${money(g, cost)} of your own money.`, 'good');
  void sec;
  return ok(`${c.business.name} is open for business!`, 'good');
}

export function sellBusiness(g: GameState): ActionResult {
  const c = g.player.career; const b = c.business;
  if (!b) return no('You have no business to sell.');
  const value = Math.max(0, Math.round(b.capital + b.profit * 3 + b.revenue * 0.4 * Math.min(1, b.age / 5)));
  g.player.fin.cash += value;
  closeJob(g, 'sold business');
  c.business = null;
  log(g, 'career', `🤝 You sold ${b.name} for ${money(g, value)}.`, value > b.invested ? 'good' : 'neutral');
  if (value / g.world.priceIndex >= 1_000_000) setFlag(g.player, 'soldBusinessBig', true);
  return ok(`Sold ${b.name} for ${money(g, value)}.`, value > b.invested ? 'good' : 'neutral');
}

function processBusiness(g: GameState) {
  const p = g.player; const c = p.career; const b = c.business;
  if (!b || !c.job) return;
  const sec = BUSINESS_SECTORS[b.sector] ?? BUSINESS_SECTORS['Online store'];
  const econ = g.world.economy === 'boom' ? 0.06 : g.world.economy === 'recession' ? -0.12 : 0;
  const skill = (p.skills[sec.skill] - 30) * 0.0018 + (p.skills.business - 30) * 0.0012 + (p.stats.intelligence - 50) * 0.0008;
  const eff = c.effort === 'high' ? 0.05 : c.effort === 'low' ? -0.05 : 0;
  const ramp = b.age < 3 ? 0.14 : 0;
  const growth = gauss(sec.mu + econ + skill + eff + ramp - b.age * 0.002, sec.sd * g.tuning.volatility) + traitSum(p.traits, 'risk') * 0.01;
  b.age++;
  b.revenue = Math.max(0, Math.round(b.revenue * (1 + clamp(growth, -0.7, 1.2))));
  b.peakRevenue = Math.max(b.peakRevenue, b.revenue);
  const margin = sec.margin + (b.age > 3 ? 0.03 : -0.02) + skill * 0.5 + gauss(0, 0.04);
  b.profit = Math.round(b.revenue * margin);
  const pay = Math.max(0, Math.round(Math.min(b.profit * 0.55, b.revenue * 0.12)));
  b.capital += b.profit - pay;
  b.employees = Math.max(1, Math.round(b.revenue / (90000 * wageScale(g))));
  c.job.salary = pay;
  c.lastSalary = pay;
  c.job.years++;
  const thresholds = [0, 0.6e6, 2.5e6, 12e6, 60e6].map((x) => x * wageScale(g));
  let lvl = 0; thresholds.forEach((t, i) => { if (b.revenue >= t) lvl = i; });
  if (lvl > c.job.level) { c.job.level = lvl; c.job.title = titleFor(careerById('entrepreneur')!, lvl); log(g, 'career', `📈 ${b.name} grew to ${money(g, b.revenue)} in revenue — you're now "${c.job.title}".`, 'good'); addStat(p, 'happiness', 5); }
  if (b.capital < -b.invested * 0.35 || (b.revenue === 0)) {
    log(g, 'career', `💥 ${b.name} ran out of cash and had to close down. You lost your investment of ${money(g, b.invested)}.`, 'bad');
    addStat(p, 'happiness', -12); addStat(p, 'confidence', -6);
    incFlag(p, 'failedBusinesses');
    c.business = null; closeJob(g, 'business failed');
    return;
  }
  log(g, 'career', `🏢 ${b.name}: revenue ${money(g, b.revenue)}, profit ${money(g, b.profit)}, ${b.employees} employee${b.employees > 1 ? 's' : ''}.`, b.profit >= 0 ? 'neutral' : 'bad');
  if (b.profit < 0) addStat(p, 'happiness', -4);
  if (b.revenue / g.world.priceIndex >= 1_000_000 && b.age >= 3) setFlag(p, 'successfulBusiness', true);
}

// ------------------------------------------------------------------ yearly
export function processCareer(g: GameState) {
  const p = g.player; const c = p.career; const w = g.world;
  c.appsThisYear = 0;
  c.lastSalary = 0;
  if (c.retired) {
    if (p.age >= 65 && rnd() < 0.0) c.retired = true;
    return;
  }
  const job = c.job;
  if (!job) {
    const studying = !!p.edu.stage;
    if (p.age >= 18 && !studying) {
      c.unemployedYears++;
      c.reputation = clamp(c.reputation - 1.5, 0, 100);
    }
    // forced retirement of the unemployed elderly
    if (p.age >= BALANCE.career.mustRetireAge && !c.retired) retire(g, true);
    return;
  }
  const def = careerById(job.careerId)!;
  job.years++;
  const yearWeight = job.partTime ? 0.4 : 1;
  c.totalYears += yearWeight;
  c.experience[def.industry] = (c.experience[def.industry] ?? 0) + yearWeight;
  p.skills[def.skill] = clamp(p.skills[def.skill] + 2.2 * yearWeight, 0, 100);
  if (def.special !== 'business' && p.skills.leadership < 100 && job.level >= 2) p.skills.leadership = clamp(p.skills.leadership + 2, 0, 100);

  // athletes and old workers
  if (def.maxAge && p.age > def.maxAge) {
    log(g, 'career', `🏁 At ${p.age} you aged out of your career as ${def.title}.`, 'neutral');
    closeJob(g, 'aged out'); setFlag(p, `former_${def.id}`, true);
    return;
  }
  if (p.age >= BALANCE.career.mustRetireAge) { retire(g, true); return; }
  if (p.age >= countryOf(g).retirementAge + 3 && chance(0.18) && !job.partTime) { log(g, 'career', '🪑 You decided it was time to hang up your hat.', 'info'); retire(g, true); return; }

  if (def.special === 'business') { processBusiness(g); if (!p.career.job) return; }
  else {
    const boss = p.people.find((x) => x.relation === 'boss');
    const sk = p.skills[def.skill] + p.stats.intelligence * 0.2;
    const effortB = c.effort === 'high' ? 9 : c.effort === 'low' ? -10 : 0;
    let perf = 30 + p.stats.intelligence * 0.16 + p.stats.discipline * 0.2 + (sk - def.skillMin) * 0.15 + effortB + traitSum(p.traits, 'work') * 1.5 + (job.satisfaction - 50) * 0.12 + ((boss?.closeness ?? 45) - 45) * 0.08 + gauss(0, 8);
    if (def.special === 'athlete') perf += (p.skills.athletic - 40) * 0.2 + (p.stats.health - 60) * 0.2;
    job.performance = Math.round(clamp(perf, 5, 100));
    const rating = job.performance < 35 ? 1 : job.performance < 50 ? 2 : job.performance < 68 ? 3 : job.performance < 82 ? 4 : 5;
    const txt = ['Needs improvement', 'Below expectations', 'Meets expectations', 'Exceeds expectations', 'Outstanding'][rating - 1];
    c.lastReview = { age: p.age, rating, text: txt };
    c.reputation = clamp(c.reputation + (rating - 3) * 2.2, 0, 100);
    const target = 62 - def.stress * 2.2 + (rating - 3) * 5 + job.level * 2.5 - (c.effort === 'high' ? 5 : 0) + (c.effort === 'low' ? 3 : 0);
    job.satisfaction = Math.round(clamp(job.satisfaction + (target - job.satisfaction) * 0.4, 5, 100));
    if (c.effort === 'high') { addStat(p, 'health', -1); addStat(p, 'discipline', 0.5); }
    addStat(p, 'health', -def.stress * 0.08);
    if (def.stress >= 8) addStat(p, 'happiness', -1);
    if (job.partTime) { /* simple */ } else log(g, 'career', `📋 Performance review as ${job.title}: ${txt} (${rating}/5).`, rating >= 4 ? 'good' : rating <= 2 ? 'bad' : 'neutral');

    // warnings / dismissal
    if (rating === 1) {
      job.warnings++;
      if (job.warnings >= 2) { fireFromJob(g, 'fired', 'Your performance had been poor for too long.'); return; }
      log(g, 'career', '⚠️ Your manager issued you a formal warning about your performance.', 'bad');
    } else if (rating >= 3) job.warnings = 0;

    // layoffs
    const lay = BALANCE.career.baseLayoff * def.layoffRisk * (1 + w.unemployment * 8) * (w.economy === 'recession' ? 2.2 : w.economy === 'boom' ? 0.6 : 1) * (rating <= 2 ? 2 : rating === 5 ? 0.4 : 1) * diff(g).eventHarshness * (job.years > 8 ? 0.7 : 1);
    if (!job.partTime && chance(lay)) { fireFromJob(g, 'laid off', g.world.economy === 'recession' ? 'The recession is hitting hard.' : 'Your company restructured.'); return; }

    // raise (yearly COLA + merit)
    if (!def.volatile) {
      let raise = w.inflation + (rating - 3) * 0.012 + (rating >= 4 ? 0.008 : 0);
      if (w.economy === 'recession' && rating <= 3) raise = Math.min(raise, 0);
      raise = Math.max(0, raise);
      job.salary = Math.round(job.salary * (1 + raise));
    } else {
      job.salary = Math.round(job.salary * (1 + Math.max(0, w.inflation * 0.8)));
    }

    // promotion
    const perfF = [0, 0, 0.25, 0.85, 1.6, 2.3][rating];
    const topGate = job.level >= 2 && !def.partTime && EDU_RANK[p.edu.level] < EDU_RANK.bachelor && !['trades', 'creative', 'athletic'].includes(def.skill) && def.special !== 'politician' && !def.ladder ? 0.5 : 1;
    const pc = BALANCE.career.promotionBase * perfF * (job.years >= 2 ? 1 : 0.3) * (w.economy === 'recession' ? 0.5 : w.economy === 'boom' ? 1.25 : 1) * topGate * (1 + (p.traits.includes('ambitious') ? 0.25 : 0)) * (def.special === 'politician' ? 0.75 : 1);
    if (!job.partTime && chance(pc)) promote(g);

    // volatile industries: yearly income noise and breakout chances
    if (def.volatile && def.special !== 'athlete') {
      if (chance(0.015 + (p.skills[def.skill] - 40) * 0.0006) && job.level < 4 && rating >= 4) {
        promote(g, false);
        log(g, 'career', `🌟 Breakthrough! Your career as ${def.title} took off — you're now "${job.title}".`, 'good');
      }
    }
    if (def.special === 'athlete') {
      const injury = chance(0.05 + (100 - p.stats.health) * 0.001 + Math.max(0, p.age - 31) * 0.01);
      if (injury) { addStat(p, 'health', -rint(6, 14)); log(g, 'health', '🤕 A serious injury kept you out for much of the season.', 'bad'); job.performance -= 10; }
      if (p.age >= 36 && chance(0.25 + (p.age - 36) * 0.1)) { log(g, 'career', `🏁 You retired from professional sport at ${p.age}.`, 'neutral'); setFlag(p, 'formerAthlete', p.age); closeJob(g, 'retired from sport'); return; }
    }
  }

  // this year's income
  const j = p.career.job;
  if (j) {
    const d = careerById(j.careerId)!;
    let inc = j.salary;
    if (d.volatile && d.special !== 'business') inc = Math.round(j.salary * clamp(Math.exp(gauss(-0.1, 0.5 * g.tuning.volatility)), 0.25, 4));
    if (d.special !== 'business') c.lastSalary = inc;
    c.salaryHistory.push(c.lastSalary);
    if (c.salaryHistory.length > 12) c.salaryHistory.shift();
  }
  void netWorth; void partnerOf;
}

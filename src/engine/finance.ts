import { BALANCE } from './config';
import { traitSum } from './data/traits';
import { chance, clamp, gauss, pick, rnd, uid } from './rng';
import { fmtMoney } from './format';
import {
  addStat, costScale, countryOf, diff, flagNum, incFlag, livingChildren, log, netWorth, no, ok, partnerOf, setFlag, wageScale,
} from './util';
import type { ActionResult, Character, GameState, Holding, Loan, Lifestyle, Property, YearReport } from './types';

const money = (g: GameState, v: number) => fmtMoney(v, g.player.countryId, true);
export const PROPERTY_NAMES = ['Studio condo', 'Townhouse', 'Family house', 'Luxury villa'];
export const CAR_NAMES = ['Used economy car', 'New sedan', 'Family SUV', 'Luxury car', 'Sports car'];
export const RENT_NAMES = ['Shared flat', 'Small apartment', 'Comfortable apartment', 'Luxury penthouse'];

export const emptyReport = (age: number): YearReport => ({
  age, income: { salary: 0, pension: 0, benefits: 0, partner: 0, rental: 0, interest: 0, business: 0, other: 0 }, tax: 0, retirementIn: 0,
  expenses: { living: 0, food: 0, housing: 0, transport: 0, education: 0, healthcare: 0, children: 0, debt: 0 }, investment: 0, net: 0, hardship: false,
});

// ------------------------------------------------------------------ pricing helpers
export const medianIncome = (g: GameState) => BALANCE.medianIncomeUSD * wageScale(g);

export function taxOn(g: GameState, earned: number): { income: number; payroll: number } {
  const c = countryOf(g);
  const med = medianIncome(g);
  const th = [0.5 * med, 1.5 * med, 4 * med];
  const r = c.tax.rates;
  let tax = 0;
  const slice = (lo: number, hi: number, rate: number) => { if (earned > lo) tax += (Math.min(earned, hi) - lo) * rate; };
  slice(0, th[0], r[0]); slice(th[0], th[1], r[1]); slice(th[1], th[2], r[2]); slice(th[2], Infinity, r[3]);
  return { income: tax, payroll: earned * c.tax.payroll * (earned > 12 * med ? 0.3 : 1) };
}

export const rentPrice = (g: GameState, q: number) => Math.round(BALANCE.finance.rent[q - 1] * countryOf(g).housingIndex * g.world.priceIndex * g.world.housingReal);
export const homePrice = (g: GameState, tier: number) => Math.round(BALANCE.finance.homePrice[tier] * countryOf(g).housingIndex * g.world.priceIndex * g.world.housingReal);
export const carPrice = (g: GameState, tier: number) => Math.round(BALANCE.finance.carPrice[tier] * (0.4 + 0.6 * countryOf(g).wageIndex) * g.world.priceIndex);

export function creditAdj(g: GameState) {
  return clamp((700 - g.player.fin.creditScore) / 100 * 0.025, -0.01, 0.1);
}

export function loanRate(g: GameState, kind: 'personal' | 'mortgage' | 'auto' | 'student') {
  const w = g.world;
  const spread = kind === 'personal' ? BALANCE.finance.personalLoanSpread : kind === 'mortgage' ? BALANCE.finance.mortgageSpread : kind === 'auto' ? 0.03 : 0.02;
  return clamp(w.interest + spread + creditAdj(g), 0.01, 0.5);
}

function amortised(balance: number, rate: number, years: number) {
  if (rate <= 0.0001) return balance / years;
  return (balance * rate) / (1 - Math.pow(1 + rate, -years));
}

export function annualIncomeEstimate(g: GameState): number {
  const p = g.player;
  const r = p.fin.lastReport;
  const base = p.career.job?.salary ?? 0;
  const partner = partnerOf(p);
  const sp = partner?.relation === 'spouse' ? partner.income * 0.6 : 0;
  return Math.max(base, r ? r.income.salary + r.income.business + r.income.pension : 0) + sp;
}

export function creditLimit(g: GameState) {
  const p = g.player;
  if (p.age < 18) return 0;
  const raw = annualIncomeEstimate(g) * BALANCE.finance.cardLimitFactor + p.fin.savings * 0.1;
  const floor = 800 * wageScale(g);
  const scoreF = clamp((p.fin.creditScore - 300) / 450, 0.2, 1.1);
  return Math.round(clamp(raw * scoreF, floor, 60000 * wageScale(g)));
}

export function maxPersonalLoan(g: GameState) {
  const f = g.player.fin;
  const inc = annualIncomeEstimate(g);
  const debt = f.loans.filter((l) => l.kind !== 'mortgage').reduce((s, l) => s + l.balance, 0);
  return Math.max(0, Math.round(inc * 1.8 + f.savings * 0.3 + f.holdings.reduce((s, h) => s + h.value, 0) * 0.3 - debt) * clamp((f.creditScore - 380) / 320, 0.1, 1));
}

// ------------------------------------------------------------------ yearly expenses
export function expenseBreakdown(g: GameState): YearReport['expenses'] {
  const p = g.player;
  const f = p.fin;
  const c = countryOf(g);
  const cs = costScale(g);
  const tun = g.tuning.expenses;
  const L = BALANCE.finance.lifestyle[f.lifestyle].cost * (1 + traitSum(p.traits, 'spend')) * tun;
  const B = BALANCE.finance.base;
  const partner = partnerOf(p);
  const household = partner && partner.relation === 'spouse' ? 1.45 : 1;
  const e: YearReport['expenses'] = { living: 0, food: 0, housing: 0, transport: 0, education: 0, healthcare: 0, children: 0, debt: 0 };
  const age = p.age;
  if (age < 18 && f.housing.kind === 'family') {
    e.healthcare = 0; // parents/guardians cover minors
  } else {
    const family = f.housing.kind === 'family';
    e.living = Math.round(B.living * cs * L * household * (family ? 0.55 : 1));
    e.food = Math.round(B.food * cs * L * household * (family ? 0.45 : 1));
    if (f.housing.kind === 'rent') e.housing = rentPrice(g, f.housing.quality) * (partner && partner.relation === 'spouse' ? 1 : 1);
    else if (f.housing.kind === 'own') { const prop = f.properties.find((x) => x.id === f.housing.propertyId); e.housing = prop ? Math.round(prop.value * BALANCE.finance.propertyCostRate) : 0; }
    else if (age >= 22 && p.career.lastSalary > 0) e.housing = Math.round(rentPrice(g, 1) * 0.18);
    for (const pr of f.properties) if (!(f.housing.kind === 'own' && f.housing.propertyId === pr.id)) e.housing += Math.round(pr.value * BALANCE.finance.propertyCostRate * (pr.rented ? 0.7 : 1));
    const cars = f.vehicles;
    e.transport = cars.length ? cars.reduce((s, v) => s + B.carRunning[v.tier] * cs, 0) : B.transit * cs;
    e.transport = Math.round(e.transport * tun);
    const ageM = age < 5 ? 0.8 : age < 40 ? 1 : age < 60 ? 1.5 : 2.4;
    e.healthcare = Math.round(B.healthcare[c.healthcare] * cs * ageM * (1 + p.conditions.length * 0.5) * tun);
  }
  if (age >= 18) e.children = Math.round(livingChildren(p).filter((k) => g.year - k.birthYear < 18).length * B.childCost * cs * L * 0.9);
  // lifestyle creep: the more you earn, the more you tend to spend
  const earnedNow = p.career.lastSalary + (partner?.relation === 'spouse' ? partner.income * 0.4 : 0);
  const aboveMedian = Math.max(0, earnedNow - BALANCE.medianIncomeUSD * wageScale(g) * 0.9);
  if (aboveMedian > 0 && age >= 18) e.living += Math.round(aboveMedian * BALANCE.finance.lifestyleCreep * (f.lifestyle === 'frugal' ? 0.6 : f.lifestyle === 'luxury' ? 1.4 : 1) * tun);
  return e;
}

// ------------------------------------------------------------------ the big yearly step
export function processFinances(g: GameState) {
  const p = g.player;
  const f = p.fin;
  const w = g.world;
  const c = countryOf(g);
  const age = p.age;
  const rep = emptyReport(age);
  const cs = costScale(g);
  const sub = BALANCE.finance.subsistence * cs * diff(g).hardshipFloor;

  // trust fund arrives at 18
  if (age === 18 && f.trust > 0) {
    f.cash += f.trust;
    log(g, 'finance', `🏦 Your trust fund of ${money(g, f.trust)} was released to you on your 18th birthday.`, 'good');
    f.trust = 0;
  } else if (f.trust > 0) f.trust *= 1 + Math.max(0, w.interest * 0.7);

  // ---- income
  const job = p.career.job;
  if (job && !p.career.retired && job.careerId !== 'entrepreneur') rep.income.salary = p.career.lastSalary;
  if (job && job.careerId === 'entrepreneur') rep.income.business = p.career.lastSalary;
  const partner = partnerOf(p);
  if (partner?.relation === 'spouse' && partner.alive) { partner.income = Math.round(partner.income * (1 + w.inflation * 0.9)); rep.income.partner = Math.round(partner.income * 0.5 * (1 - c.tax.rates[1])); }
  if (!job && age >= 18 && !p.edu.stage && !p.career.retired && age < c.retirementAge) {
    const prev = p.career.salaryHistory.length ? p.career.salaryHistory[p.career.salaryHistory.length - 1] : 0;
    const yrs = p.career.unemployedYears;
    rep.income.benefits = Math.round(Math.max(yrs <= 2 ? c.welfare * 0.45 * prev : 0, c.welfare * 0.55 * sub));
  }
  if (age >= c.retirementAge && !job) {
    const hist = p.career.salaryHistory;
    const avg = hist.length ? hist.reduce((a, b) => a + b, 0) / hist.length : 0;
    const stateLine = c.pensionRate * Math.max(avg, p.career.lastSalary) * clamp(p.career.totalYears / 35, 0.15, 1);
    rep.income.pension = Math.round(Math.max(stateLine, c.welfare * 0.9 * sub, sub * 0.5));
    p.career.pension = rep.income.pension;
  }
  for (const pr of f.properties) {
    if (pr.rented && !pr.home) rep.income.rental += Math.round(pr.value * BALANCE.finance.rentYield * 0.92);
  }
  // interest on savings
  const sRate = Math.max(0, w.interest * 0.6);
  rep.income.interest = Math.round(f.savings * sRate);
  f.savings += rep.income.interest;
  rep.income.interest = Math.round(rep.income.interest);

  // ---- investments
  const m = w.stockReturn;
  let gains = 0;
  let cgTax = 0;
  for (const h of f.holdings) {
    const spec = BALANCE.finance.investments[h.kind];
    const idio = h.kind === 'index' ? 0.02 : h.kind === 'bonds' ? 0.015 : spec.sd * 0.6;
    let r = spec.mu + spec.beta * (m - 0.055) + gauss(0, idio * g.tuning.volatility) * (h.kind === 'bonds' ? 0.6 : 1);
    if (h.kind === 'bonds') r = spec.mu - w.inflation * 0.3 + gauss(0, 0.02) + (w.economy === 'recession' ? 0.01 : 0);
    if (h.kind === 'stocks') r += (p.skills.business - 30) * 0.0006;
    if (h.kind === 'crypto') r = clamp(spec.mu + (m - 0.07) * spec.beta * 1.4 + gauss(0, spec.sd * g.tuning.volatility), -0.9, 3.5);
    r = clamp(r, -0.8, 3);
    const gain = h.value * r;
    h.value = Math.max(0, h.value + gain);
    gains += gain;
    if (gain > 0) cgTax += gain * 0.1;
  }
  f.holdings = f.holdings.filter((h) => h.value > 1);
  rep.investment = Math.round(gains);
  // retirement fund
  if (f.retirement > 0 || (job && rep.income.salary > 0)) {
    const R = BALANCE.finance.retirement;
    const eq = clamp(0.85 - age * 0.007, 0.25, 0.85);
    const rr = eq * (m + 0.015) + (1 - eq) * (0.035 - w.inflation * 0.2);
    const before = f.retirement;
    f.retirement = Math.max(0, f.retirement * (1 + clamp(rr, -0.4, 0.45)));
    rep.investment += Math.round(f.retirement - before);
    if (job && rep.income.salary > 0 && !p.career.retired) {
      const mine = rep.income.salary * (f.contrib / 100);
      const match = Math.min(rep.income.salary * R.matchCap, mine) * R.employerMatch + (job.partTime ? 0 : 0);
      f.retirement += mine + match;
      rep.retirementIn = Math.round(mine);
    }
  }
  // retirees drawing down
  if (p.career.retired && f.retirement > 0 && age >= 59) {
    const draw = f.retirement * BALANCE.finance.retirement.withdrawRate;
    f.retirement -= draw; rep.income.other += Math.round(draw);
  }
  // property values
  for (const pr of f.properties) {
    pr.value = Math.max(0, Math.round(pr.value * (1 + w.housingGrowth + gauss(0, 0.012))));
  }
  for (const v of f.vehicles) v.value = Math.round(v.value * 0.87);

  // ---- tax
  const earned = rep.income.salary + rep.income.business + rep.income.pension * 0.8 + rep.income.rental * 0.7 + rep.income.other * 0.4;
  const t = taxOn(g, Math.max(0, earned - rep.retirementIn * 0.8));
  rep.tax = Math.round(t.income + (rep.income.salary + rep.income.business) * c.tax.payroll * (earned > 12 * medianIncome(g) ? 0.3 : 1) + cgTax);

  // ---- expenses
  const ex = expenseBreakdown(g);
  if (p.edu.tuitionDue > 0 && age >= 17) {
    const tier = p.background.wealthTier;
    const par = p.people.filter((x) => (x.relation === 'mother' || x.relation === 'father' || x.relation === 'guardian') && x.alive).length;
    const support = par > 0 && age < 27 ? BALANCE.education.parentSupportByTier[tier] * (g.player.fin.housing.kind === 'family' ? 1 : 0.8) : 0;
    ex.education = Math.round(p.edu.tuitionDue * (1 - support));
    // student loan covers what cash cannot
    const need = ex.education;
    if (need > f.cash + rep.income.salary * 0.5 && need > 0) {
      const borrow = Math.round(need * 0.7);
      ex.education -= borrow;
      addLoan(g, 'student', 'Student loan', borrow, 0, 15);
      log(g, 'finance', `🎓 You took out a student loan of ${money(g, borrow)} to cover tuition.`, 'neutral');
    }
  }
  p.edu.tuitionDue = 0;

  // ---- loans
  let debtPaid = 0;
  const student = !!p.edu.stage && ['bachelor', 'master', 'doctorate', 'vocational'].includes(p.edu.stage);
  for (const l of f.loans) {
    l.balance += l.balance * l.rate;
    if (l.kind === 'student') l.payment = student ? 0 : Math.max(Math.min(l.balance, l.balance * 0.12), 0);
    const pay = Math.min(l.payment, l.balance);
    l.balance -= pay;
    debtPaid += pay;
  }
  const done = f.loans.filter((l) => l.balance < 1);
  f.loans = f.loans.filter((l) => l.balance >= 1);
  for (const l of done) log(g, 'finance', `✅ You paid off your ${l.name.toLowerCase()}.`, 'good');
  if (f.card.balance > 0) {
    f.card.balance *= 1 + BALANCE.finance.cardRate;
    const pay = Math.min(f.card.balance, f.card.balance * 0.14);
    f.card.balance -= pay; debtPaid += pay;
  }
  ex.debt = Math.round(debtPaid);

  rep.expenses = ex;
  const outflow = ex.living + ex.food + ex.housing + ex.transport + ex.education + ex.healthcare + ex.children + ex.debt;
  const gross = rep.income.salary + rep.income.business + rep.income.pension + rep.income.benefits + rep.income.partner + rep.income.rental + rep.income.interest + rep.income.other;
  rep.net = Math.round(gross - rep.tax - rep.retirementIn - outflow);
  f.cash += rep.net - rep.income.interest; // interest already added to savings

  // ---- shortfall: savings → card → holdings → retirement → hardship support
  if (f.cash < 0) {
    let need = -f.cash;
    const take = (avail: number) => { const x = Math.min(avail, need); need -= x; return x; };
    const s = take(f.savings); f.savings -= s;
    if (need > 0) { const lim = creditLimit(g) - f.card.balance; if (lim > 0) { const x = take(lim); f.card.balance += x; if (x > 0) log(g, 'finance', `💳 You covered a shortfall of ${money(g, x)} with your credit card.`, 'bad'); } }
    for (const h of [...f.holdings].sort((a, b) => b.value - a.value)) { if (need <= 0) break; const x = take(h.value); h.value -= x; }
    f.holdings = f.holdings.filter((h) => h.value > 1);
    if (need > 0 && f.retirement > 0 && (age >= 59 || need > sub)) { const gross = Math.min(f.retirement, need / (age >= 59 ? 1 : 1 - BALANCE.finance.retirement.earlyPenalty)); need -= gross * (age >= 59 ? 1 : 1 - BALANCE.finance.retirement.earlyPenalty); f.retirement -= gross; }
    f.cash = -Math.max(0, need);
    if (f.cash < -1) {
      // hardship: family and the state step in — never an unwinnable death spiral, but it hurts
      const support = -f.cash;
      f.cash = 0;
      rep.hardship = true;
      addStat(p, 'happiness', -7); addStat(p, 'health', -2);
      f.creditScore = clamp(f.creditScore - 22, 300, 850);
      incFlag(p, 'hardshipYears');
      const who = p.people.find((x) => (x.relation === 'mother' || x.relation === 'father' || x.relation === 'guardian') && x.alive && x.wealth > support) ? 'Family helped out' : 'Social support covered the gap';
      log(g, 'finance', `🆘 Financial hardship: you ran out of money this year. ${who} (${money(g, support)}), but it was a stressful, uncomfortable year.`, 'bad');
    }
  }

  // ---- credit score
  const util = f.card.limit > 0 ? f.card.balance / Math.max(1, f.card.limit) : 0;
  if (!rep.hardship) f.creditScore = clamp(f.creditScore + (util < 0.3 ? 8 : util > 0.7 ? -8 : 2) + (f.loans.length > 0 ? 2 : 0), 300, 850);
  f.card.limit = creditLimit(g);

  f.lastReport = rep;
  const nw = netWorth(g);
  f.peakNetWorth = Math.max(f.peakNetWorth, nw);
  if (age >= 18 && rep.net > 0 && !rep.hardship && age % 5 === 0) log(g, 'finance', `💵 This year you earned ${money(g, gross)} and kept ${money(g, rep.net)} after tax and expenses.`, 'neutral');
}

// ------------------------------------------------------------------ account actions
export function addLoan(g: GameState, kind: Loan['kind'], name: string, amount: number, rateOverride: number, years: number, assetId?: string): Loan {
  const rate = rateOverride > 0 ? rateOverride : loanRate(g, kind === 'student' ? 'student' : kind);
  const l: Loan = { id: uid('l'), kind, name, balance: amount, rate, payment: kind === 'student' ? 0 : amortised(amount, rate, years), assetId };
  g.player.fin.loans.push(l);
  return l;
}

/** Pay an unexpected cost from cash → savings → credit card; any remainder spills into negative cash (resolved at year end). */
export function payFromAssets(g: GameState, amount: number) {
  const f = g.player.fin;
  if (amount <= 0) { f.cash -= amount; return; }
  let need = amount;
  const a = Math.min(f.cash, need); f.cash -= a; need -= a;
  if (need > 0) { const b = Math.min(f.savings, need); f.savings -= b; need -= b; }
  if (need > 0 && g.player.age >= 18) { const lim = Math.max(0, creditLimit(g) - f.card.balance); const c = Math.min(lim, need); f.card.balance += c; need -= c; }
  if (need > 0) f.cash -= need;
}
export const canAfford = (g: GameState, amount: number) => {
  const f = g.player.fin;
  return f.cash + f.savings + (g.player.age >= 18 ? Math.max(0, creditLimit(g) - f.card.balance) * 0.5 : 0) >= amount;
};

const adultOnly = (g: GameState) => (g.player.age < 18 ? no('You must be 18 or older to manage money independently.') : null);

export function deposit(g: GameState, amount: number): ActionResult {
  const f = g.player.fin;
  if (amount <= 0) return no('Enter an amount greater than zero.');
  if (amount > f.cash) return no('You do not have that much cash.');
  f.cash -= amount; f.savings += amount;
  return ok(`Moved ${money(g, amount)} into savings.`, 'good');
}
export function withdraw(g: GameState, amount: number): ActionResult {
  const f = g.player.fin;
  if (amount <= 0) return no('Enter an amount greater than zero.');
  if (amount > f.savings) return no('Savings balance too low.');
  f.savings -= amount; f.cash += amount;
  return ok(`Withdrew ${money(g, amount)} from savings.`, 'good');
}

export function invest(g: GameState, kind: Holding['kind'], amount: number): ActionResult {
  const a = adultOnly(g); if (a) return a;
  const f = g.player.fin;
  if (amount <= 0) return no('Enter an amount greater than zero.');
  if (amount > f.cash) return no('Not enough cash. Withdraw from savings first.');
  f.cash -= amount;
  const h = f.holdings.find((x) => x.kind === kind);
  if (h) { h.value += amount; h.basis += amount; } else f.holdings.push({ id: uid('h'), kind, value: amount, basis: amount });
  log(g, 'finance', `📈 You invested ${money(g, amount)} in ${kind === 'index' ? 'an index fund' : kind}.`, 'neutral');
  return ok(`Invested ${money(g, amount)}.`, 'good');
}
export function sellHolding(g: GameState, id: string, amount: number | 'all'): ActionResult {
  const f = g.player.fin;
  const h = f.holdings.find((x) => x.id === id);
  if (!h) return no('Holding not found.');
  const amt = amount === 'all' ? h.value : Math.min(amount, h.value);
  if (amt <= 0) return no('Enter an amount greater than zero.');
  const frac = amt / h.value;
  const gain = Math.max(0, amt - h.basis * frac);
  const tax = gain * 0.1;
  h.value -= amt; h.basis -= h.basis * frac;
  f.cash += amt - tax;
  if (h.value < 1) f.holdings = f.holdings.filter((x) => x.id !== id);
  return ok(`Sold ${money(g, amt)} of ${h.kind}${tax > 0 ? ` (tax ${money(g, tax)})` : ''}.`, 'good');
}

export function takeLoan(g: GameState, amount: number, years: number): ActionResult {
  const a = adultOnly(g); if (a) return a;
  const max = maxPersonalLoan(g);
  if (amount <= 0) return no('Enter an amount greater than zero.');
  if (amount > max) return no(`The bank will lend you at most ${money(g, max)}.`);
  const l = addLoan(g, 'personal', 'Personal loan', amount, 0, years);
  g.player.fin.cash += amount;
  log(g, 'finance', `🏦 You borrowed ${money(g, amount)} over ${years} years at ${(l.rate * 100).toFixed(1)}%.`, 'neutral');
  return ok(`Loan approved: ${money(g, amount)} at ${(l.rate * 100).toFixed(1)}%.`, 'info');
}
export function repayLoan(g: GameState, id: string, amount: number | 'all'): ActionResult {
  const f = g.player.fin;
  const l = f.loans.find((x) => x.id === id);
  if (!l) return no('Loan not found.');
  const amt = amount === 'all' ? l.balance : Math.min(amount, l.balance);
  if (amt <= 0) return no('Enter an amount greater than zero.');
  if (amt > f.cash) return no('Not enough cash.');
  f.cash -= amt; l.balance -= amt;
  if (l.balance < 1) { f.loans = f.loans.filter((x) => x.id !== id); log(g, 'finance', `✅ You paid off your ${l.name.toLowerCase()}.`, 'good'); }
  return ok(`Paid ${money(g, amt)} toward ${l.name.toLowerCase()}.`, 'good');
}
export function payCard(g: GameState, amount: number | 'all'): ActionResult {
  const f = g.player.fin;
  const amt = amount === 'all' ? f.card.balance : Math.min(amount, f.card.balance);
  if (amt <= 0) return no('Nothing to pay.');
  if (amt > f.cash) return no('Not enough cash.');
  f.cash -= amt; f.card.balance -= amt;
  return ok(`Paid ${money(g, amt)} off your credit card.`, 'good');
}
export function cashAdvance(g: GameState, amount: number): ActionResult {
  const a = adultOnly(g); if (a) return a;
  const f = g.player.fin;
  const lim = creditLimit(g) - f.card.balance;
  if (amount <= 0 || amount > lim) return no(`You can borrow up to ${money(g, Math.max(0, lim))} on your card.`);
  f.card.balance += amount; f.cash += amount;
  return ok(`Drew ${money(g, amount)} on your credit card (${Math.round(BALANCE.finance.cardRate * 100)}% APR).`, 'info');
}
export function setContribution(g: GameState, pct: number): ActionResult {
  g.player.fin.contrib = clamp(pct, 0, 20);
  return ok(`Retirement contribution set to ${g.player.fin.contrib}% of salary.`, 'info');
}
export function setLifestyle(g: GameState, l: Lifestyle): ActionResult {
  g.player.fin.lifestyle = l;
  return ok(`Lifestyle set to ${l}.`, 'info');
}
export function donate(g: GameState, amount: number): ActionResult {
  const p = g.player; const f = p.fin;
  if (amount <= 0 || amount > f.cash) return no('Not enough cash.');
  f.cash -= amount; f.donated += amount / g.world.priceIndex;
  addStat(p, 'happiness', clamp(2 + amount / (3000 * wageScale(g)), 2, 9)); addStat(p, 'social', 0.5);
  log(g, 'finance', `🎗️ You donated ${money(g, amount)} to charity.`, 'good');
  return ok(`Thank you — ${money(g, amount)} donated.`, 'good');
}
export function setWill(g: GameState, charity: number, mode: 'equal' | 'eldest'): ActionResult {
  g.player.willCharity = charity; g.player.willMode = mode;
  return ok('Your will has been updated.', 'info');
}
export function playLottery(g: GameState): ActionResult {
  const p = g.player; const f = p.fin;
  if (p.age < 18) return no('You must be 18 to play.');
  const cost = Math.round(10 * wageScale(g) + 2);
  if (f.cash < cost) return no('Not enough cash.');
  f.cash -= cost; f.lottery++;
  const r = rnd();
  if (r < 0.0000005 * 100) { const win = Math.round(5_000_000 * wageScale(g)); f.cash += win; log(g, 'finance', `🎰 JACKPOT! Your ticket won ${money(g, win)}!`, 'good'); addStat(p, 'happiness', 20); setFlag(p, 'jackpot'); return ok(`JACKPOT! You won ${money(g, win)}!`, 'good'); }
  if (r < 0.01) { const win = Math.round(cost * 40); f.cash += win; return ok(`You won ${money(g, win)}!`, 'good'); }
  if (r < 0.12) { f.cash += cost * 2; return ok('Small win — you doubled your ticket.', 'good'); }
  return { ok: true, msg: 'No luck this time.', tone: 'neutral' };
}

// ------------------------------------------------------------------ housing
export function rentHome(g: GameState, quality: number): ActionResult {
  const p = g.player; const f = p.fin;
  if (p.age < 18) return no('You must be 18 to rent a home.');
  if (f.housing.kind === 'own') return no('You currently live in a home you own. Sell it or rent it out first.');
  const price = rentPrice(g, quality);
  if (f.cash < price * 0.25 && f.savings < price * 0.25) return no(`You need at least ${money(g, price * 0.25)} saved as a deposit.`);
  f.housing = { kind: 'rent', quality };
  log(g, 'finance', `🔑 You moved into a ${RENT_NAMES[quality - 1].toLowerCase()} in ${p.city} (${money(g, price)}/year).`, 'neutral');
  addStat(p, 'happiness', quality >= 3 ? 3 : 1); addStat(p, 'confidence', 1);
  setFlag(p, 'movedOut', p.age);
  return ok(`You moved into a ${RENT_NAMES[quality - 1].toLowerCase()}.`, 'good');
}
export function moveHome(g: GameState): ActionResult {
  const p = g.player; const f = p.fin;
  if (f.housing.kind === 'family') return no('You already live with family.');
  if (f.housing.kind === 'own') return no('Sell or rent out your home first.');
  if (!p.people.some((x) => (x.relation === 'mother' || x.relation === 'father' || x.relation === 'guardian') && x.alive && x.closeness >= 35)) return no('No one at home can take you in.');
  f.housing = { kind: 'family', quality: 1 };
  addStat(p, 'happiness', -2); log(g, 'finance', '🏠 You moved back in with your family.', 'neutral');
  return ok('You moved back in with family.', 'info');
}

export function buyProperty(g: GameState, tier: number, mortgage: boolean, asHome: boolean): ActionResult {
  const p = g.player; const f = p.fin;
  if (p.age < 18) return no('You must be 18 to buy property.');
  const price = homePrice(g, tier);
  const closing = Math.round(price * 0.03);
  const downPct = mortgage ? 0.2 : 1;
  const down = Math.round(price * downPct);
  const cashAvail = f.cash + f.savings;
  if (cashAvail < down + closing) return no(`You need ${money(g, down + closing)} (down payment + fees); you have ${money(g, cashAvail)}.`);
  const loanAmt = price - down;
  if (mortgage && loanAmt > annualIncomeEstimate(g) * 4.5) return no(`The bank declined your mortgage — ${money(g, loanAmt)} is too large for your income.`);
  if (mortgage && f.creditScore < 520) return no('Your credit score is too low for a mortgage.');
  let pay = down + closing;
  const fromCash = Math.min(f.cash, pay); f.cash -= fromCash; pay -= fromCash; f.savings -= pay;
  const prop: Property = { id: uid('pr'), name: PROPERTY_NAMES[tier], tier, city: p.city, value: price, bought: price, boughtAge: p.age, rented: !asHome, home: asHome };
  if (asHome) for (const o of f.properties) o.home = false;
  f.properties.push(prop);
  if (mortgage) addLoan(g, 'mortgage', `Mortgage (${prop.name})`, loanAmt, 0, BALANCE.finance.mortgageYears, prop.id);
  if (asHome) { f.housing = { kind: 'own', quality: tier + 1, propertyId: prop.id }; prop.rented = false; }
  setFlag(p, 'ownedHome', true);
  addStat(p, 'happiness', asHome ? 8 : 4); addStat(p, 'confidence', 2);
  log(g, 'finance', `🏡 You bought a ${prop.name.toLowerCase()} in ${p.city} for ${money(g, price)}${mortgage ? ` with a mortgage of ${money(g, loanAmt)}` : ' in cash'}.`, 'good');
  return ok(`You bought a ${prop.name.toLowerCase()}!`, 'good');
}

export function sellProperty(g: GameState, id: string): ActionResult {
  const p = g.player; const f = p.fin;
  const pr = f.properties.find((x) => x.id === id);
  if (!pr) return no('Property not found.');
  const proceeds = Math.round(pr.value * (1 - BALANCE.finance.sellingCost));
  const loan = f.loans.find((l) => l.assetId === id);
  const owed = loan?.balance ?? 0;
  f.cash += proceeds - owed;
  if (loan) f.loans = f.loans.filter((l) => l !== loan);
  f.properties = f.properties.filter((x) => x.id !== id);
  if (f.housing.propertyId === id) f.housing = { kind: 'rent', quality: Math.max(1, pr.tier) };
  log(g, 'finance', `💼 You sold your ${pr.name.toLowerCase()} for ${money(g, pr.value)}${owed ? ` and cleared the mortgage (${money(g, owed)})` : ''}.`, 'neutral');
  if (f.cash < 0) { f.card.balance += -f.cash; f.cash = 0; }
  return ok(`Sold for ${money(g, proceeds)} after fees.`, 'good');
}

export function toggleRentOut(g: GameState, id: string): ActionResult {
  const pr = g.player.fin.properties.find((x) => x.id === id);
  if (!pr) return no('Property not found.');
  if (pr.home) return no('You live here.');
  pr.rented = !pr.rented;
  return ok(pr.rented ? 'You rented out the property.' : 'You stopped renting it out.', 'info');
}

export function buyVehicle(g: GameState, tier: number, finance: boolean): ActionResult {
  const p = g.player; const f = p.fin;
  if (p.age < 18) return no('You must be 18 to buy a vehicle.');
  const price = carPrice(g, tier);
  if (f.vehicles.length >= 3) return no('You already own three vehicles.');
  const down = finance ? Math.round(price * 0.15) : price;
  if (f.cash + f.savings < down) return no(`You need ${money(g, down)}.`);
  let pay = down; const fc = Math.min(f.cash, pay); f.cash -= fc; pay -= fc; f.savings -= pay;
  f.vehicles.push({ id: uid('v'), name: CAR_NAMES[tier], tier, value: price, bought: price, boughtAge: p.age });
  if (finance) addLoan(g, 'auto', `Car loan (${CAR_NAMES[tier]})`, price - down, 0, 5);
  addStat(p, 'happiness', 3 + tier); addStat(p, 'appearance', tier >= 3 ? 1 : 0);
  log(g, 'finance', `🚗 You bought a ${CAR_NAMES[tier].toLowerCase()} for ${money(g, price)}.`, 'good');
  return ok(`You bought a ${CAR_NAMES[tier].toLowerCase()}.`, 'good');
}
export function sellVehicle(g: GameState, id: string): ActionResult {
  const f = g.player.fin;
  const v = f.vehicles.find((x) => x.id === id);
  if (!v) return no('Vehicle not found.');
  f.cash += Math.round(v.value * 0.95);
  f.vehicles = f.vehicles.filter((x) => x.id !== id);
  const loan = f.loans.find((l) => l.kind === 'auto' && l.name.includes(v.name));
  if (loan) { const pay = Math.min(loan.balance, f.cash); f.cash -= pay; loan.balance -= pay; if (loan.balance < 1) f.loans = f.loans.filter((l) => l !== loan); }
  return ok(`Sold your ${v.name.toLowerCase()}.`, 'neutral');
}

export function declareBankruptcy(g: GameState): ActionResult {
  const p = g.player; const f = p.fin;
  const unsecured = f.card.balance + f.loans.filter((l) => l.kind === 'personal').reduce((s, l) => s + l.balance, 0);
  if (unsecured <= 0) return no('You have no unsecured debt to discharge.');
  if (unsecured < Math.max(1000 * wageScale(g), annualIncomeEstimate(g) * 0.25)) return no('Your debts are too small to qualify for bankruptcy. Pay them down instead.');
  const seized = f.savings + f.holdings.reduce((s, h) => s + h.value, 0);
  f.card.balance = 0; f.loans = f.loans.filter((l) => l.kind !== 'personal'); f.savings = 0; f.holdings = [];
  f.vehicles = f.vehicles.slice(0, 1); f.creditScore = 420; f.bankruptcies++;
  addStat(p, 'happiness', -10); addStat(p, 'confidence', -6);
  setFlag(p, 'bankrupt', true);
  log(g, 'finance', `⚖️ You declared bankruptcy. ${money(g, unsecured)} of debt was discharged, and ${money(g, seized)} in savings and investments were seized. Your credit is severely damaged.`, 'bad');
  return ok('Bankruptcy filed. A painful reset — but a fresh start.', 'bad');
}

export const totalAssets = (c: Character) =>
  c.fin.cash + c.fin.savings + c.fin.retirement + c.fin.holdings.reduce((s, h) => s + h.value, 0) + c.fin.properties.reduce((s, h) => s + h.value, 0) + c.fin.vehicles.reduce((s, h) => s + h.value, 0);

void flagNum; void chance; void pick; void incFlag;

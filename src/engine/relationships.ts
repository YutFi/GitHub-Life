import { BALANCE } from './config';
import { traitById } from './data/traits';
import { genPerson, inheritGenes, randomTraits } from './people';
import { randomFirstName } from './data/names';
import { causeOfDeath, deathChance, rollDeath } from './mortality';
import { chance, clamp, gauss, pick, rint, rnd, uid } from './rng';
import { fmtMoney } from './format';
import {
  addStat, countryOf, diff, econScale, fullName, livingChildren, log, netWorth, no, ok, partnerOf, personAge, setFlag, wageScale,
} from './util';
import type { ActionResult, Character, GameState, Gender, Genes, Person } from './types';

const money = (g: GameState, v: number) => fmtMoney(v, g.player.countryId, true);

export const REL_LABEL: Record<Person['relation'], string> = {
  mother: 'Mother', father: 'Father', guardian: 'Guardian', sibling: 'Sibling', friend: 'Friend', partner: 'Partner', spouse: 'Spouse',
  exPartner: 'Ex', exSpouse: 'Ex-spouse', child: 'Child', coworker: 'Coworker', boss: 'Boss',
};

export const byId = (g: GameState, id: string) => g.player.people.find((x) => x.id === id);

export function playerGenes(p: Character): Genes {
  return { intelligence: p.stats.intelligence, appearance: p.stats.appearance, health: p.stats.health, confidence: p.stats.confidence, discipline: p.stats.discipline, social: p.stats.social };
}

function receive(g: GameState, amount: number, who: string) {
  const p = g.player;
  if (amount <= 0) return;
  const tax = amount * countryOf(g).inheritanceTax * (amount > 400000 * wageScale(g) ? 1 : 0.4);
  const net = Math.round(amount - tax);
  if (p.age < 18) p.fin.trust += net; else p.fin.cash += net;
  p.fin.totalInherited += net / g.world.priceIndex;
  log(g, 'finance', `💰 You inherited ${money(g, net)} from ${who}${p.age < 18 ? ' (held in trust until you turn 18)' : ''}.`, 'good');
  addStat(p, 'happiness', 2);
}

function mourn(g: GameState, per: Person) {
  const p = g.player;
  const rel = REL_LABEL[per.relation].toLowerCase();
  const hit = per.closeness > 70 ? 14 : per.closeness > 45 ? 9 : 4;
  addStat(p, 'happiness', -hit);
  setFlag(p, 'griefYears', 2);
  log(g, 'family', `🕊️ Your ${rel}, ${per.name}, died at ${personAge(g, per)} of ${per.deathCause}.`, 'bad');
  if (per.relation === 'mother' || per.relation === 'father' || per.relation === 'guardian') {
    const heirs = 1 + p.people.filter((x) => x.relation === 'sibling' && x.alive).length;
    const spouse = p.people.find((x) => (x.relation === 'mother' || x.relation === 'father') && x.alive && x.id !== per.id);
    const pool = per.wealth * (spouse ? 0.4 : 0.95);
    receive(g, pool / heirs, per.name);
    if (spouse) spouse.wealth += per.wealth * 0.6;
  } else if (per.relation === 'spouse') {
    receive(g, per.wealth * 0.5 + per.income * 0.5, per.name);
  }
}

// ------------------------------------------------------------------ yearly
export function processRelationships(g: GameState) {
  const p = g.player;
  const c = countryOf(g);
  const age = p.age;
  const tuning = g.tuning.mortality * diff(g).mortality;

  // teen sweethearts at 18
  const partner0 = p.people.find((x) => x.relation === 'partner' && x.youth && x.alive);
  if (partner0 && age >= 18) {
    if (chance(0.6)) { partner0.relation = 'exPartner'; partner0.endedAge = age; log(g, 'family', `💔 You and ${partner0.name} grew apart as school ended and you broke up.`, 'bad'); addStat(p, 'happiness', -5); }
    else { partner0.youth = false; log(g, 'family', `💞 You and ${partner0.name} stayed together after school.`, 'good'); }
  }

  for (const per of [...p.people]) {
    const a = personAge(g, per);
    if (per.alive) {
      const tier = p.background.wealthTier;
      const baseHealth = 52 + tier * 4 + (per.traits.includes('athletic') ? 8 : 0);
      const dc = deathChance(a, baseHealth, c, tuning * 0.9, 1);
      if (a > 0 && rollDeath(dc)) {
        per.alive = false; per.deathYear = g.year; per.deathCause = causeOfDeath(a);
        if (per.relation !== 'coworker' && per.relation !== 'boss') mourn(g, per);
        continue;
      }
      // wealth evolution
      per.wealth = Math.max(0, per.wealth * (1 + Math.max(0.01, g.world.inflation + 0.015)) + (a >= 22 && a < 66 ? per.income * 0.08 : 0));
      if (a >= 66) per.income = Math.round(per.income * 0.6);
      else if (a >= 18) per.income = Math.round(per.income * (1 + g.world.inflation * 0.9));
      if (per.relation === 'spouse' || per.relation === 'partner') { if (a < 66 && per.income < 1) per.income = Math.round(genPerson({ relation: 'partner', age: a, year: g.year, culture: c.names, wageScale: wageScale(g), tier: 3 }).income); }
    }
    if (!per.alive) continue;

    // decay / growth of the bond
    const key = per.relation;
    if (per.relation === 'exPartner' || per.relation === 'exSpouse') { per.closeness = clamp(per.closeness - 2, 0, 100); continue; }
    const decay = key === 'friend' ? BALANCE.relationships.friendDecay : key === 'partner' || key === 'spouse' ? BALANCE.relationships.partnerDecay : key === 'coworker' || key === 'boss' ? 2.5 : BALANCE.relationships.familyDecay;
    if (!per.interacted) per.closeness = clamp(per.closeness - decay * rnd() * 1.4, 0, 100);
    else per.closeness = clamp(per.closeness + 0.8, 0, 100);
    if (per.relation === 'partner' || per.relation === 'spouse') per.closeness = clamp(per.closeness + (per.compatibility - 50) / 28, 0, 100);
    if (per.relation === 'child' && a < 18) per.closeness = clamp(per.closeness + 1.5, 0, 100);
    per.trust = clamp(per.trust + (per.closeness > 60 ? 0.8 : -0.8), 0, 100);
    per.interacted = false;

    if (per.relation === 'friend' && per.closeness < 14 && chance(0.5)) {
      p.people = p.people.filter((x) => x.id !== per.id);
      log(g, 'family', `🍂 You and your friend ${per.name} drifted apart.`, 'neutral');
      continue;
    }
    if (per.relation === 'partner' && (per.closeness < 32 || per.trust < 25) && chance(BALANCE.relationships.breakupBase * 3.2)) {
      per.relation = 'exPartner'; per.endedAge = age;
      addStat(p, 'happiness', -8);
      log(g, 'family', `💔 ${per.name} ended the relationship — things had grown cold.`, 'bad');
      continue;
    }
    if (per.relation === 'spouse') {
      const risk = BALANCE.relationships.divorceBase + (per.closeness < 35 ? 0.1 : 0) + (per.trust < 30 ? 0.07 : 0);
      if (chance(risk)) { filedDivorce(g, per, true); continue; }
    }
    // children growing up
    if (per.relation === 'child') {
      const wed = per.match?.status === 'married' && !per.estranged;
      if (a >= 22 && a < 42 && !per.kids?.length && chance(wed ? 0.17 : per.match ? 0.07 : 0.05)) {
        per.kids = per.kids ?? [];
        const gender: Gender = pick(['male', 'female']);
        per.kids.push({ name: randomFirstName(c.names, gender), gender, birthYear: g.year });
        log(g, 'family', `🍼 Your child ${per.name.split(' ')[0]} had a baby — you're a grandparent!`, 'good');
        addStat(p, 'happiness', 8); setFlag(p, 'grandparent', true);
      } else if (a >= 26 && a < 45 && (per.kids?.length ?? 0) < 3 && chance(wed ? 0.1 : 0.025)) {
        per.kids = per.kids ?? [];
        const gender: Gender = pick(['male', 'female']);
        per.kids.push({ name: randomFirstName(c.names, gender), gender, birthYear: g.year });
        log(g, 'family', `🍼 Another grandchild was born to ${per.name.split(' ')[0]}!`, 'good');
        addStat(p, 'happiness', 5);
      }
      if (a >= 22) { per.income = per.income > 0 ? per.income : Math.round(genPerson({ relation: 'child', age: a, year: g.year, culture: c.names, wageScale: wageScale(g), tier: clamp(p.background.wealthTier + rint(-1, 0), 1, 5) }).income * (0.5 + (per.genes?.intelligence ?? 50) / 100)); }
    }
  }

  // making friends through school / work
  const friends = p.people.filter((x) => x.relation === 'friend' && x.alive).length;
  if ((age === 5 || age === 12 || age === 18) && friends < 6) {
    const n = age === 18 ? 1 : 2;
    for (let i = 0; i < n; i++) p.people.push(newFriend(g, age < 18 ? 2 : 4));
    log(g, 'family', age === 5 ? '🧒 You made friends at primary school.' : age === 12 ? '🧑‍🤝‍🧑 You made new friends at secondary school.' : '🤝 You made new friends as you started a new chapter.', 'good');
  } else if (age >= 6 && friends < 3 && chance(0.25 + p.stats.social / 400)) {
    p.people.push(newFriend(g, age < 22 ? 2 : 6));
    log(g, 'family', `🙂 You became friends with ${p.people[p.people.length - 1].name}.`, 'good');
  }
}

export function newFriend(g: GameState, spread: number): Person {
  const p = g.player;
  const c = countryOf(g);
  const f = genPerson({
    relation: 'friend', age: Math.max(1, p.age + rint(-spread, spread)), year: g.year, culture: c.names, closeness: gauss(52, 12),
    tier: clamp(p.background.wealthTier + rint(-1, 1), 1, 5), wageScale: wageScale(g), metAge: p.age,
  });
  if (f.birthYear >= g.year) f.birthYear = g.year - 1;
  const shared = f.traits.filter((t) => p.traits.includes(t)).length;
  f.compatibility = clamp(f.compatibility + shared * 8, 10, 99);
  return f;
}

function filedDivorce(g: GameState, per: Person, theirChoice: boolean) {
  const p = g.player;
  per.relation = 'exSpouse'; per.endedAge = p.age;
  const prenup = p.flags.prenup ? 0.5 : 1;
  const liquidish = p.fin.cash + p.fin.savings + p.fin.holdings.reduce((s, h) => s + h.value, 0) + p.fin.properties.reduce((s, h) => s + h.value, 0) - p.fin.loans.reduce((s, l) => s + l.balance, 0);
  let owe = Math.max(0, liquidish * 0.4 * prenup);
  const f = p.fin;
  const need0 = owe;
  const fromCash = Math.min(f.cash, owe); f.cash -= fromCash; owe -= fromCash;
  const fromSav = Math.min(f.savings, owe); f.savings -= fromSav; owe -= fromSav;
  for (const h of f.holdings) { if (owe <= 0) break; const x = Math.min(h.value, owe); h.value -= x; owe -= x; }
  f.holdings = f.holdings.filter((h) => h.value > 1);
  if (owe > 0 && f.properties.length) {
    const pr = [...f.properties].sort((a, b) => Number(a.home) - Number(b.home))[0];
    f.properties = f.properties.filter((x) => x.id !== pr.id);
    f.loans = f.loans.filter((l) => l.assetId !== pr.id);
    if (f.housing.propertyId === pr.id) f.housing = { kind: 'rent', quality: Math.max(1, pr.tier) };
    f.cash += Math.max(0, pr.value - owe);
  }
  addStat(p, 'happiness', -14); addStat(p, 'confidence', -4);
  setFlag(p, 'divorced', p.age);
  log(g, 'family', `💔 ${theirChoice ? `${per.name} filed for divorce` : `You divorced ${per.name}`}. The settlement cost you about ${money(g, need0)}.`, 'bad');
}

// ------------------------------------------------------------------ interactions
type InteractionKind = 'time' | 'gift' | 'talk' | 'give' | 'ask' | 'apologize' | 'date' | 'care' | 'play' | 'teach' | 'fund' | 'counsel';

export function interactionsFor(g: GameState, per: Person): { kind: InteractionKind; label: string; icon: string; energy: number; cost?: number }[] {
  const p = g.player;
  const out: { kind: InteractionKind; label: string; icon: string; energy: number; cost?: number }[] = [];
  const a = personAge(g, per);
  const sc = econScale(g);
  if (!per.alive) return out;
  const rel = per.relation;
  if (rel === 'exPartner' || rel === 'exSpouse') return out;
  if (rel === 'child' && a < 18) {
    out.push({ kind: 'play', label: 'Play with them', icon: '🧸', energy: 1 }, { kind: 'teach', label: 'Help with schoolwork', icon: '📚', energy: 1 }, { kind: 'fund', label: 'Invest in their future', icon: '🎓', energy: 0, cost: Math.round(1500 * sc) });
    out.push({ kind: 'gift', label: 'Buy a gift', icon: '🎁', energy: 0, cost: Math.round(60 * sc) });
    return out;
  }
  out.push({ kind: 'time', label: rel === 'partner' || rel === 'spouse' ? 'Quality time' : 'Spend time', icon: '🫶', energy: 1 });
  out.push({ kind: 'talk', label: 'Have a deep talk', icon: '💬', energy: 1 });
  out.push({ kind: 'gift', label: 'Give a gift', icon: '🎁', energy: 0, cost: Math.round(80 * sc) });
  if (rel === 'partner' || rel === 'spouse') out.push({ kind: 'date', label: 'Plan a date night', icon: '🌹', energy: 1, cost: Math.round(180 * sc) }, { kind: 'counsel', label: 'Couples counselling', icon: '🛋️', energy: 1, cost: Math.round(600 * sc) });
  if (rel === 'mother' || rel === 'father' || rel === 'guardian') { if (personAge(g, per) >= 65) out.push({ kind: 'care', label: 'Help with their care', icon: '🩺', energy: 1, cost: Math.round(900 * sc) }); }
  if (p.age >= 18 && rel !== 'boss' && rel !== 'coworker') {
    out.push({ kind: 'give', label: 'Give money', icon: '💸', energy: 0, cost: Math.round(500 * sc) });
    if (per.wealth > 2000 * sc || per.income > 10000 * sc) out.push({ kind: 'ask', label: 'Ask for money', icon: '🙏', energy: 1 });
  } else if (rel === 'mother' || rel === 'father' || rel === 'guardian') out.push({ kind: 'ask', label: 'Ask for pocket money', icon: '🙏', energy: 1 });
  if (per.trust < 45 || per.closeness < 35) out.push({ kind: 'apologize', label: 'Apologise & make amends', icon: '🕊️', energy: 1 });
  return out;
}

export function interact(g: GameState, id: string, kind: InteractionKind): ActionResult {
  const p = g.player;
  const per = byId(g, id);
  if (!per || !per.alive) return no('That person is not available.');
  const opt = interactionsFor(g, per).find((x) => x.kind === kind);
  if (!opt) return no('That is not possible right now.');
  const key = `${id}:${kind}`;
  if (p.actions.includes(key)) return no('You already did that with them this year.');
  if (p.energy < opt.energy) return no('You are out of energy this year.');
  let cost = opt.cost ?? 0;
  if (kind === 'give') cost = Math.round((opt.cost ?? 0));
  if (cost > p.fin.cash) return no(`You need ${money(g, cost)} in cash.`);
  p.energy -= opt.energy; p.fin.cash -= cost; p.actions.push(key);
  per.interacted = true;
  const name = per.name.split(' ')[0];
  let msg = '';
  let tone: 'good' | 'bad' | 'neutral' = 'good';
  switch (kind) {
    case 'time':
      per.closeness = clamp(per.closeness + rint(4, 9), 0, 100); addStat(p, 'happiness', 2.5); addStat(p, 'social', 0.4);
      msg = `You spent quality time with ${name}.`; break;
    case 'talk':
      per.trust = clamp(per.trust + rint(5, 10), 0, 100); per.closeness = clamp(per.closeness + rint(1, 4), 0, 100);
      msg = `You had an honest heart-to-heart with ${name}. Trust grew.`; break;
    case 'gift':
      per.closeness = clamp(per.closeness + rint(3, 7), 0, 100); per.trust = clamp(per.trust + 1, 0, 100); addStat(p, 'happiness', 1);
      msg = `${name} loved the gift.`; break;
    case 'give': {
      per.closeness = clamp(per.closeness + rint(3, 8), 0, 100); per.trust = clamp(per.trust + 3, 0, 100); per.wealth += cost; addStat(p, 'happiness', 2);
      msg = `You gave ${name} ${money(g, cost)}.`; break;
    }
    case 'ask': {
      const ch = clamp((per.closeness - 25) / 80 + (per.trust - 30) / 250, 0.05, 0.9);
      if (chance(ch)) {
        const base = per.relation === 'friend' ? 300 : p.age < 18 ? 120 : 1000;
        const amt = Math.round(Math.min(per.wealth * 0.05 + base * econScale(g), per.wealth * 0.3 + 50) * rnd() + base * econScale(g) * 0.4);
        p.fin.cash += amt; per.wealth = Math.max(0, per.wealth - amt); per.trust = clamp(per.trust - 2, 0, 100);
        msg = `${name} gave you ${money(g, amt)}.`;
      } else { per.closeness = clamp(per.closeness - 5, 0, 100); msg = `${name} said no and seemed annoyed that you asked.`; tone = 'bad'; }
      break;
    }
    case 'apologize': {
      if (chance(0.35 + per.closeness / 250 + p.stats.social / 400)) { per.trust = clamp(per.trust + 18, 0, 100); per.closeness = clamp(per.closeness + 10, 0, 100); msg = `${name} accepted your apology. Things are warmer.`; }
      else { per.trust = clamp(per.trust - 2, 0, 100); msg = `${name} isn't ready to forgive you yet.`; tone = 'bad'; }
      break;
    }
    case 'date':
      per.closeness = clamp(per.closeness + rint(7, 13), 0, 100); per.trust = clamp(per.trust + 2, 0, 100); addStat(p, 'happiness', 4);
      msg = `A wonderful evening with ${name}.`; break;
    case 'counsel':
      per.trust = clamp(per.trust + rint(8, 16), 0, 100); per.closeness = clamp(per.closeness + rint(3, 8), 0, 100);
      msg = `Counselling helped you and ${name} communicate better.`; break;
    case 'care':
      per.closeness = clamp(per.closeness + 9, 0, 100); per.trust = clamp(per.trust + 5, 0, 100); addStat(p, 'happiness', 1);
      msg = `You helped ${name} with medical care and daily needs.`; break;
    case 'play':
      per.closeness = clamp(per.closeness + rint(6, 10), 0, 100); per.nurture = clamp((per.nurture ?? 20) + 3, 0, 100); addStat(p, 'happiness', 3);
      msg = `You had a lovely time playing with ${name}.`; break;
    case 'teach':
      per.closeness = clamp(per.closeness + rint(3, 6), 0, 100); per.nurture = clamp((per.nurture ?? 20) + 5, 0, 100);
      msg = `You helped ${name} with homework — it'll pay off later.`; break;
    case 'fund':
      per.nurture = clamp((per.nurture ?? 20) + 6, 0, 100); per.fund = (per.fund ?? 0) + cost; per.schoolTier = (per.schoolTier ?? 0) + 1; per.closeness = clamp(per.closeness + 3, 0, 100);
      msg = `You set aside ${money(g, cost)} for ${name}'s education.`; break;
  }
  per.history.push({ age: p.age, text: msg });
  log(g, 'family', `${opt.icon} ${msg}`, tone);
  return { ok: true, msg, tone };
}

export function makeFriend(g: GameState): ActionResult {
  const p = g.player;
  if (p.age < 3) return no('You are too young for that.');
  if (p.energy < 1) return no('You are out of energy this year.');
  if (p.actions.includes('makeFriend')) return no('You already tried to make friends this year.');
  p.energy -= 1; p.actions.push('makeFriend');
  const ch = clamp(0.35 + (p.stats.social - 50) / 120 + (p.stats.confidence - 50) / 250 + (p.stats.appearance - 50) / 400, 0.12, 0.92);
  if (chance(ch)) {
    const f = newFriend(g, p.age < 25 ? 3 : 8);
    p.people.push(f); addStat(p, 'social', 1); addStat(p, 'happiness', 2);
    log(g, 'family', `🙂 You made a new friend: ${f.name}.`, 'good');
    return ok(`You made a new friend: ${f.name}!`, 'good');
  }
  addStat(p, 'confidence', -0.5);
  return { ok: false, msg: "You put yourself out there, but it didn't click this time.", tone: 'neutral' };
}

// ------------------------------------------------------------------ romance
export function canDate(p: Character) { return p.age >= 14; }

export function scoutRomance(g: GameState): ActionResult {
  const p = g.player;
  if (!canDate(p)) return no('You are too young to date.');
  if (partnerOf(p)) return no('You already have a partner.');
  if (p.energy < 1) return no('You are out of energy this year.');
  p.energy -= 1;
  const ch = clamp(0.45 + (p.stats.social - 50) / 150 + (p.stats.appearance - 50) / 180 + (p.stats.confidence - 50) / 250, 0.15, 0.93);
  if (!chance(ch)) { addStat(p, 'confidence', -1); return { ok: false, msg: 'You went looking for love but did not meet anyone special.', tone: 'neutral' }; }
  const c = countryOf(g);
  const age = p.age < 18 ? clamp(p.age + rint(-1, 1), 14, 17) : clamp(p.age + rint(-6, 8), 18, 90);
  const cand = genPerson({ relation: 'partner', age, year: g.year, culture: c.names, closeness: gauss(48, 10), tier: pick([2, 3, 3, 4]), wageScale: wageScale(g), metAge: p.age });
  const shared = cand.traits.filter((t) => p.traits.includes(t)).length;
  const clash = cand.traits.filter((t) => traitById(t)?.conflicts?.some((x) => p.traits.includes(x))).length;
  cand.compatibility = Math.round(clamp(52 + shared * 9 - clash * 8 + gauss(0, 13), 8, 99));
  cand.youth = p.age < 18;
  g.candidate = cand;
  return ok(`You met ${cand.name}!`, 'good');
}
export function acceptCandidate(g: GameState): ActionResult {
  const p = g.player; const c = g.candidate;
  if (!c) return no('No one to date right now.');
  if (partnerOf(p)) return no('You already have a partner.');
  const ch = clamp(0.3 + (c.compatibility - 40) / 150 + (p.stats.appearance - 50) / 250 + (p.stats.social - 50) / 300, 0.15, 0.9);
  g.candidate = null;
  if (!chance(ch)) { addStat(p, 'happiness', -3); log(g, 'family', `💔 ${c.name} wasn't interested in dating you.`, 'bad'); return { ok: false, msg: `${c.name.split(' ')[0]} politely declined.`, tone: 'bad' }; }
  c.closeness = clamp(c.closeness + 12, 0, 100);
  p.people.push(c);
  addStat(p, 'happiness', 8);
  log(g, 'family', `💘 You started dating ${c.name}${c.job ? ` (${c.job})` : ''}.`, 'good');
  setFlag(p, 'hadPartner', true);
  return ok(`You're now dating ${c.name}!`, 'good');
}
export function declineCandidate(g: GameState): ActionResult {
  g.candidate = null;
  return ok('You politely moved on.', 'info');
}

export const WEDDINGS = [
  { id: 'courthouse', name: 'Courthouse ceremony', cost: 400, happy: 5 },
  { id: 'modest', name: 'Modest celebration', cost: 6000, happy: 9 },
  { id: 'grand', name: 'Grand wedding', cost: 28000, happy: 13 },
];

export function proposeMarriage(g: GameState, weddingId: string, prenup: boolean): ActionResult {
  const p = g.player;
  const per = p.people.find((x) => x.relation === 'partner' && x.alive);
  if (!per) return no('You need a partner first.');
  if (p.age < 18 || personAge(g, per) < 18) return no('You must both be adults to marry.');
  if (per.youth) return no('Wait until you are both adults.');
  if (p.energy < 1) return no('You are out of energy this year.');
  const w = WEDDINGS.find((x) => x.id === weddingId) ?? WEDDINGS[0];
  const cost = Math.round(w.cost * econScale(g));
  if (p.fin.cash + p.fin.savings < cost) return no(`You need ${money(g, cost)} for that ceremony.`);
  p.energy -= 1;
  const ch = clamp((per.closeness - 35) / 65 + (per.trust - 35) / 220 + (per.compatibility - 50) / 220 - (prenup ? 0.07 : 0), 0.05, 0.95);
  if (!chance(ch)) {
    per.closeness = clamp(per.closeness - 12, 0, 100); addStat(p, 'happiness', -9); addStat(p, 'confidence', -3);
    log(g, 'family', `💍 You proposed to ${per.name}, but they said "not yet".`, 'bad');
    return { ok: false, msg: `${per.name.split(' ')[0]} said not yet. They need more time.`, tone: 'bad' };
  }
  let pay = cost; const fc = Math.min(p.fin.cash, pay); p.fin.cash -= fc; pay -= fc; p.fin.savings -= pay;
  per.relation = 'spouse'; per.marriedAge = p.age; p.weddingYear = g.year; per.closeness = clamp(per.closeness + 10, 0, 100);
  if (prenup) setFlag(p, 'prenup', true);
  addStat(p, 'happiness', w.happy); addStat(p, 'confidence', 2);
  log(g, 'family', `💒 You married ${per.name} in a ${w.name.toLowerCase()}!`, 'good');
  setFlag(p, 'married', p.age);
  return ok(`You married ${per.name}!`, 'good');
}

export function breakUp(g: GameState): ActionResult {
  const p = g.player;
  const per = p.people.find((x) => x.relation === 'partner' && x.alive);
  if (!per) return no('You have no partner to break up with.');
  per.relation = 'exPartner'; per.endedAge = p.age;
  addStat(p, 'happiness', -6);
  log(g, 'family', `💔 You broke up with ${per.name}.`, 'bad');
  return ok(`You broke up with ${per.name}.`, 'neutral');
}
export function divorce(g: GameState): ActionResult {
  const p = g.player;
  const per = p.people.find((x) => x.relation === 'spouse' && x.alive);
  if (!per) return no('You are not married.');
  filedDivorce(g, per, false);
  return ok(`You divorced ${per.name}.`, 'neutral');
}

// ------------------------------------------------------------------ children
export function fertilityInfo(g: GameState): { natural: boolean; reason?: string; chance: number } {
  const p = g.player;
  const per = partnerOf(p);
  if (!per) return { natural: false, reason: 'You need a partner', chance: 0 };
  if (p.age < 18 || personAge(g, per) < 18) return { natural: false, reason: 'You must both be adults', chance: 0 };
  const women = [p, per].filter((x) => x.gender === 'female');
  const mAge = women.length === 1 ? (women[0] === p ? p.age : personAge(g, per)) : 30;
  const natural = women.length === 1;
  if (!natural) return { natural: false, reason: 'Adoption or surrogacy is your route to parenthood', chance: 0 };
  if (mAge > BALANCE.relationships.fertileMaxFemale) return { natural: false, reason: 'Too old to conceive naturally', chance: 0 };
  const band = mAge < 25 ? 0 : mAge < 30 ? 1 : mAge < 35 ? 2 : mAge < 40 ? 3 : mAge < 43 ? 4 : 5;
  return { natural: true, chance: BALANCE.relationships.babyChance[band] };
}

function makeChild(g: GameState, age: number, other: Person | null, adopted: boolean): Person {
  const p = g.player;
  const c = countryOf(g);
  const gender: Gender = pick(['male', 'female', 'male', 'female', 'nonbinary'].slice(0, 4) as Gender[]);
  const genes = inheritGenes(playerGenes(p), other?.genes ?? (other ? { intelligence: 50 + gauss(0, 12) } : undefined));
  const kid = genPerson({ relation: 'child', age, year: g.year, culture: c.names, gender, surname: p.lastName, closeness: gauss(90, 6), tier: p.background.wealthTier, wageScale: wageScale(g), metAge: p.age });
  kid.genes = genes; kid.nurture = 20; kid.otherParentId = other?.id; kid.adopted = adopted; kid.income = 0; kid.wealth = 0; kid.job = undefined; kid.fund = 0;
  kid.traits = randomTraits(2);
  return kid;
}

export function growFamily(g: GameState, mode: 'natural' | 'adopt'): ActionResult {
  const p = g.player;
  const per = partnerOf(p);
  if (p.energy < 1) return no('You are out of energy this year.');
  if (livingChildren(p).length >= 8) return no('Your family is already very large!');
  if (mode === 'natural') {
    const fi = fertilityInfo(g);
    if (!fi.natural) return no(fi.reason ?? 'Not possible.');
    p.energy -= 1;
    if (!chance(fi.chance)) { log(g, 'family', '🤞 You and your partner tried for a baby but it did not happen this year.', 'neutral'); return { ok: false, msg: 'Not this year — keep trying.', tone: 'neutral' }; }
    const kid = makeChild(g, 0, per ?? null, false);
    p.people.push(kid);
    addStat(p, 'happiness', 12); setFlag(p, 'hasChild', true);
    log(g, 'family', `👶 ${kid.name} was born! Welcome to the family.`, 'good');
    return ok(`${kid.name} was born!`, 'good');
  }
  if (p.age < 25) return no('You must be at least 25 to adopt.');
  const cost = Math.round(14000 * econScale(g));
  if (p.fin.cash < cost) return no(`Adoption and legal fees cost ${money(g, cost)}.`);
  p.energy -= 1; p.fin.cash -= cost;
  const kid = makeChild(g, rint(0, 5), per ?? null, true);
  p.people.push(kid);
  addStat(p, 'happiness', 11); setFlag(p, 'hasChild', true);
  log(g, 'family', `🏡 You adopted ${kid.name}, aged ${personAge(g, kid)}. Your family grows!`, 'good');
  return ok(`You adopted ${kid.name}!`, 'good');
}

export function addSibling(g: GameState): Person | null {
  const p = g.player;
  const mom = p.people.find((x) => x.relation === 'mother' && x.alive && !x.absent);
  if (!mom || personAge(g, mom) > 43) return null;
  const sib = genPerson({ relation: 'sibling', age: 0, year: g.year, culture: countryOf(g).names, surname: p.lastName, closeness: gauss(70, 10), tier: p.background.wealthTier, wageScale: wageScale(g), metAge: p.age });
  sib.income = 0; sib.wealth = 0; sib.job = undefined;
  p.people.push(sib);
  return sib;
}

export const partnerSummary = (g: GameState) => {
  const per = partnerOf(g.player);
  return per ? `${per.name} (${REL_LABEL[per.relation]})` : null;
};

void netWorth; void fullName;

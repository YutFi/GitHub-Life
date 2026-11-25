// Player-initiated yearly activities. Every one costs energy (5 points per year), is age-gated, and
// resolves to weighted outcomes through the same effect engine used by events.
import { applyEffects, makeCtx, tokenize } from './events';
import { canAfford, payFromAssets } from './finance';
import { fmtMoney } from './format';
import { weightedPick } from './rng';
import { econScale, log, no, ok } from './util';
import { P, o } from './kit';
import type { ActionResult, ActivityDef, EventCtx, Outcome } from './types';

const A = (
  group: string, id: string, icon: string, name: string, desc: string, minAge: number, energy: number, outcomes: Outcome[],
  extra: Partial<ActivityDef> = {},
): ActivityDef => ({ id, name, icon, desc, minAge, energy, group, outcomes, ...extra });

const cure = (c: EventCtx) => { const x = c.p.conditions.shift(); return x ? `Your doctor treated your ${x.toLowerCase()}.` : undefined; };

export const ACTIVITIES: ActivityDef[] = [
  // ---------------------------------------------------------------- Mind
  A('Mind', 'read', '📖', 'Read a book', 'Lose yourself in a good story or learn something new.', 5, 1, [
    o('You devoured a great book.', { intelligence: 2, happiness: 2 }, 3), o('You picked up a fascinating new idea.', { intelligence: 3, happiness: 1, discipline: 1 }, 1),
  ]),
  A('Mind', 'study', '📝', 'Study extra hard', 'Put in extra hours for your classes this year.', 6, 1, [
    o('Your extra effort will show on your next exams.', { grades: 6, intelligence: 1, happiness: -1 }, 3), o('You got a bit burnt out but learned plenty.', { grades: 8, intelligence: 1, happiness: -3, health: -1 }, 1),
  ], { when: P.student, disabledReason: (c) => (c.p.edu.stage ? null : 'You are not currently studying.') }),
  A('Mind', 'tutor', '👩‍🏫', 'Hire a tutor', 'A professional tutor helps you master the hard parts.', 8, 1, [
    o('A tutor made things click.', { grades: 10, intelligence: 2 }, 4), o('Helpful, but not a miracle.', { grades: 5, intelligence: 1 }, 1),
  ], { cost: 600, when: P.student, disabledReason: (c) => (c.p.edu.stage ? null : 'You are not currently studying.') }),
  A('Mind', 'course', '💻', 'Take an online course', 'Build a practical skill in your spare time.', 14, 1, [
    o('You finished the course and learned a lot.', { skill: { tech: 4, business: 2 }, intelligence: 2, discipline: 1 }, 3),
    o('You got halfway before life got in the way.', { skill: { tech: 1 }, discipline: -1 }, 1),
  ], { cost: 150 }),
  A('Mind', 'language', '🗣️', 'Learn a language', 'Practise a new language every day.', 10, 1, [
    o('You can hold a conversation now!', { skill: { communication: 4 }, intelligence: 1, confidence: 1 }, 3), o('Slow progress, but progress.', { skill: { communication: 2 } }, 2),
  ]),
  A('Mind', 'code', '⌨️', 'Build a coding project', 'Make something with code.', 10, 1, [
    o('You shipped a neat little project.', { skill: { tech: 5 }, intelligence: 1, happiness: 2 }, 3), o('Bugs everywhere — but you learned loads.', { skill: { tech: 3 }, happiness: -1 }, 1),
  ]),
  A('Mind', 'meditate', '🧘', 'Meditate & reflect', 'Quiet your mind and recharge.', 10, 1, [
    o('You feel centred and calm.', { happiness: 3, health: 1, discipline: 1 }, 1),
  ]),
  // ---------------------------------------------------------------- Body
  A('Body', 'gym', '🏋️', 'Hit the gym', 'Train hard for a stronger, healthier you.', 13, 1, [
    o('A great training year.', { health: 3, appearance: 2, discipline: 1, skill: { athletic: 3 } }, 5),
    o('You overdid it and strained something.', { health: -3, skill: { athletic: 1 } }, 1),
  ], { cost: 300 }),
  A('Body', 'run', '🏃', 'Go running', 'Free, simple, effective cardio.', 8, 1, [
    o('Good runs all year.', { health: 2, skill: { athletic: 2 }, happiness: 1 }, 5), o('You rolled your ankle.', { health: -2 }, 1),
  ]),
  A('Body', 'sport', '⚽', 'Join a sports team', 'Team sports build fitness and friendships.', 8, 1, [
    o('Your team had a fantastic season!', { skill: { athletic: 4 }, social: 2, health: 2, happiness: 3 }, 4),
    o('You got injured during a match.', { health: -5, happiness: -2, skill: { athletic: 1 } }, 1),
    o('Your team won the league!', { skill: { athletic: 5 }, social: 3, happiness: 6, confidence: 3 }, 0.5),
  ], { maxAge: 55 }),
  A('Body', 'diet', '🥗', 'Eat healthily', 'Plan your meals and cut the junk.', 12, 1, [
    o('You feel lighter and sharper.', { health: 2, appearance: 1, discipline: 1 }, 1),
  ], { cost: 120 }),
  A('Body', 'doctor', '🩺', 'Medical check-up', 'Get checked and treated by a doctor.', 0, 1, [
    o('All clear — and some useful advice.', { health: 2 }, 2), o('Your doctor treated an issue early.', { health: 4, run: cure }, 2),
  ], { cost: 220 }),
  A('Body', 'rest', '🛌', 'Take it easy', 'Rest, recover and recharge.', 0, 1, [
    o('You feel refreshed.', { health: 1, happiness: 2 }, 1),
  ]),
  A('Body', 'cosmetic', '💉', 'Cosmetic procedure', 'Invest in your looks.', 18, 1, [
    o('You love the results.', { appearance: 7, confidence: 3 }, 8), o('It did not go well.', { appearance: -4, health: -3, happiness: -4 }, 1),
  ], { cost: 3500 }),
  // ---------------------------------------------------------------- Social
  A('Social', 'party', '🎉', 'Go to a party', 'Let your hair down and meet people.', 15, 1, [
    o('A fabulous night out!', { social: 3, happiness: 4, add: { rel: 'friend' } }, 2), o('Good music, good company.', { social: 2, happiness: 3 }, 3),
    o('You drank too much and regretted it.', { health: -3, happiness: -2, confidence: -2 }, 1),
  ], { cost: 60 }),
  A('Social', 'volunteer', '🧡', 'Volunteer', 'Give your time to something that matters.', 12, 1, [
    o('A rewarding year of helping others.', { happiness: 4, social: 2, discipline: 1, add: { rel: 'friend' } }, 2), o('You made a real difference.', { happiness: 5, social: 2, confidence: 2 }, 1),
  ]),
  A('Social', 'network', '🤝', 'Network', 'Meet people who can open doors.', 18, 1, [
    o('You made valuable connections.', { skill: { business: 2, communication: 2 }, social: 2, run: (c) => { c.p.career.reputation = Math.min(100, c.p.career.reputation + 6); } }, 3),
    o('A lot of small talk, little gained.', { social: 1 }, 2),
  ], { cost: 100 }),
  A('Social', 'pet', '🐕', 'Adopt a pet', 'Bring home a furry companion.', 8, 1, [
    o('Your new best friend moved in.', { happiness: 6, health: 1, flag: { hadPet: true } }, 1),
  ], { cost: 300, when: (c) => !c.p.flags.hadPet, disabledReason: (c) => (c.p.flags.hadPet ? 'You already have a pet.' : null) }),
  // ---------------------------------------------------------------- Creative
  A('Creative', 'music', '🎸', 'Practise an instrument', 'Music takes practice.', 6, 1, [
    o('You nailed a tricky piece.', { skill: { creative: 4 }, discipline: 1, happiness: 2 }, 3), o('You are slowly getting there.', { skill: { creative: 2 }, discipline: 1 }, 2),
  ]),
  A('Creative', 'art', '🎨', 'Create art', 'Paint, draw or sculpt.', 5, 1, [
    o('You made something you are proud of.', { skill: { creative: 3 }, happiness: 3 }, 3),
    o('Someone offered to buy your piece!', { skill: { creative: 4 }, happiness: 4, money: 150 }, 0.5),
  ]),
  A('Creative', 'write', '✍️', 'Write', 'Stories, blogs, poems — put pen to paper.', 8, 1, [
    o('Words flowed freely.', { skill: { communication: 2, creative: 2 }, intelligence: 1, happiness: 2 }, 3),
  ]),
  // ---------------------------------------------------------------- Money
  A('Money', 'chores', '🧹', 'Do chores for pocket money', 'Earn a little by helping at home.', 7, 1, [
    o('You earned a few coins and a pat on the back.', { money: 40, discipline: 1, rel: ['parents', 2] }, 1),
  ], { maxAge: 16 }),
  A('Money', 'sellstuff', '📦', 'Sell things online', 'Declutter and make a little cash.', 14, 1, [
    o('You sold some old things.', { money: 250 }, 3), o('You found a gem to flip!', { money: 700, skill: { business: 1 } }, 0.5),
  ]),
  A('Money', 'sidegig', '🛵', 'Side gig', 'Work evenings and weekends for extra income.', 16, 1, [
    o('A solid year of side income.', { money: 1600, health: -1 }, 4), o('A great run of gigs.', { money: 3200, health: -2, discipline: 1 }, 1),
  ]),
  A('Money', 'freelance', '🧑‍💻', 'Freelance project', 'Use your skills on a client project.', 18, 1, [
    o('A happy client and a decent payday.', { money: 3600, skill: { business: 2 } }, 3), o('A client who paid late (and less).', { money: 1200 }, 1),
    o('A big contract came through!', { money: 7500, skill: { business: 3 }, confidence: 2 }, 0.5),
  ], { when: (c) => Math.max(c.p.skills.tech, c.p.skills.creative, c.p.skills.communication, c.p.skills.business) >= 20, disabledReason: (c) => (Math.max(c.p.skills.tech, c.p.skills.creative, c.p.skills.communication, c.p.skills.business) >= 20 ? null : 'Needs a skill of at least 20 (try courses and practice).') }),
  A('Money', 'overtime', '⏰', 'Work overtime', 'Put in extra hours for extra pay.', 18, 1, [
    o('A fat overtime cheque.', { job: 'bonus', health: -2, happiness: -2 }, 4), o('Your boss noticed your dedication.', { job: 'bonus', health: -2, rel: ['boss', 4] }, 1),
  ], { when: P.employed, disabledReason: (c) => (c.p.career.job && !c.p.career.job.partTime ? null : 'You need a full-time job.') }),
  A('Money', 'casino', '🎰', 'Visit the casino', 'Try your luck. The house always wins… usually.', 21, 1, [
    o('You lost your stake.', { happiness: -2 }, 8), o('A lucky night!', { money: 1400, happiness: 5 }, 2), o('A very lucky night!', { money: 4000, happiness: 8 }, 0.3),
  ], { cost: 400 }),
  // ---------------------------------------------------------------- Fun
  A('Fun', 'cinema', '🎬', 'Movie night', 'Popcorn and a good film.', 3, 1, [o('A lovely evening.', { happiness: 2 })], { cost: 30 }),
  A('Fun', 'concert', '🎤', 'See a live concert', 'Great music, great crowd.', 14, 1, [o('Unforgettable!', { happiness: 5, social: 1 }, 1)], { cost: 120 }),
  A('Fun', 'gaming', '🎮', 'Play video games', 'Unwind with some gaming.', 6, 1, [
    o('Fun, relaxing hours.', { happiness: 3 }, 3), o('You lost track of time (and sleep).', { happiness: 1, health: -1, discipline: -1 }, 1),
  ]),
  A('Fun', 'spa', '💆', 'Spa day', 'Pamper yourself.', 18, 1, [o('Pure bliss.', { happiness: 5, health: 1, appearance: 1 })], { cost: 220 }),
  A('Fun', 'camping', '🏕️', 'Go camping', 'Fresh air and starry skies.', 6, 1, [
    o('A wonderful trip in nature.', { happiness: 4, health: 2, social: 1 }, 4), o('It rained the whole time.', { happiness: 1 }, 1),
  ], { cost: 80 }),
  A('Fun', 'cook', '🍳', 'Cook at home', 'Learn new recipes.', 10, 1, [o('Delicious experiments!', { health: 1, happiness: 2, discipline: 1, skill: { trades: 1 } })]),
  // ---------------------------------------------------------------- Risky
  A('Risky', 'shoplift', '🛍️', 'Shoplift', 'Take something without paying. Illegal — and wrong.', 13, 1, [
    o('You got away with it. Barely.', { money: 120, discipline: -3, confidence: 1 }, 3),
    o('You were caught by a security guard!', { crime: 2, offence: 'shoplifting', happiness: -7, money: -300, rel: ['parents', -8, -6] }, 2),
  ]),
  A('Risky', 'pickpocket', '🕶️', 'Pick pockets', 'Steal from crowds. Illegal and dangerous.', 16, 1, [
    o('A good haul.', { money: 600, discipline: -3 }, 3), o('You were caught and arrested!', { crime: 3, offence: 'theft', happiness: -9, money: -1200, job: 'fire' }, 2.5),
  ]),
  A('Risky', 'cyber', '🧪', 'Cyber fraud', 'Hack and scam online. Seriously illegal.', 18, 2, [
    o('The payoff was huge.', { money: 9000, discipline: -4 }, 2), o('You were traced and prosecuted.', { crime: 4, offence: 'cyber fraud', happiness: -12, money: -6000, job: 'fire' }, 3),
  ], { when: (c) => c.p.skills.tech >= 30, disabledReason: (c) => (c.p.skills.tech >= 30 ? null : 'Needs technology skill 30.') }),
  A('Risky', 'drugs', '💊', 'Sell drugs', 'Deal on the street. Illegal, dangerous, and punished hard.', 16, 1, [
    o('A quiet night and fast cash.', { money: 1800, discipline: -3, happiness: -1 }, 3), o('Police raided the spot and you were arrested.', { crime: 3, offence: 'drug dealing', happiness: -10, money: -800, job: 'fire' }, 2.5),
  ]),
  A('Risky', 'cartheft', '🚗', 'Steal a car', 'Hotwire and sell. Illegal.', 15, 1, [
    o('You sold it before anyone noticed.', { money: 2200, discipline: -3 }, 2.5), o('Caught red-handed.', { crime: 3, offence: 'car theft', happiness: -9, money: -1000, job: 'fire' }, 2.5),
  ]),
  A('Risky', 'burgle', '🏚️', 'Burglary', 'Break into a house. Dangerous and illegal.', 18, 2, [
    o('Quick and quiet — a big score.', { money: 4500, discipline: -4 }, 2), o('Arrested at the scene.', { crime: 4, offence: 'burglary', happiness: -12, money: -4000, health: -3, job: 'fire' }, 3),
    o('You were hurt escaping.', { health: -10, crime: 2, offence: 'burglary', money: 500, happiness: -6 }, 1),
  ]),
];

export const activityById = (id: string) => ACTIVITIES.find((a) => a.id === id);

export interface ActivityView { def: ActivityDef; cost: number; available: boolean; reason?: string; used: boolean }

/** All activities appropriate for the character's age with their current availability. */
export function listActivities(g: import('./types').GameState): ActivityView[] {
  const p = g.player;
  const ctx = makeCtx(g);
  const sc = econScale(g);
  return ACTIVITIES.filter((a) => p.age >= a.minAge && (a.maxAge === undefined || p.age <= a.maxAge)).map((def) => {
    const cost = def.cost ? Math.round(def.cost * sc) : 0;
    const used = p.actions.includes(def.id);
    let reason: string | undefined;
    if (used) reason = 'Already done this year';
    else if (p.energy < def.energy) reason = 'Not enough energy';
    else if (def.when && !def.when(ctx)) reason = def.disabledReason?.(ctx) ?? 'Not available';
    else if (cost > 0 && !canAfford(g, cost)) reason = `Needs ${fmtMoney(cost, p.countryId, true)}`;
    return { def, cost, available: !reason, reason, used };
  });
}

export function doActivity(g: import('./types').GameState, id: string): ActionResult {
  const def = activityById(id);
  const p = g.player;
  if (!def) return no('Unknown activity.');
  if (g.phase !== 'alive') return no('Your life has ended.');
  if (g.pending) return no('Resolve your pending event first.');
  if (p.age < def.minAge || (def.maxAge !== undefined && p.age > def.maxAge)) return no('Not appropriate for your age.');
  if (p.actions.includes(id)) return no('You already did that this year.');
  if (p.energy < def.energy) return no('You are out of energy this year. Age up to recharge.');
  const ctx = makeCtx(g);
  if (def.when && !def.when(ctx)) return no(def.disabledReason?.(ctx) ?? 'Not available right now.');
  const cost = def.cost ? Math.round(def.cost * econScale(g)) : 0;
  if (cost > 0 && !canAfford(g, cost)) return no(`You need ${fmtMoney(cost, p.countryId, true)}.`);
  if (cost > 0) payFromAssets(g, cost);
  p.energy -= def.energy;
  p.actions.push(id);
  const oc = weightedPick(def.outcomes, (x) => (typeof x.w === 'function' ? x.w(ctx) : x.w ?? 1)) ?? def.outcomes[0];
  const text = tokenize(g, oc.text, {});
  const summary = applyEffects(g, oc.fx ?? {}, ctx);
  summary.money -= cost;
  if (g.phase === 'alive') log(g, 'decision', `${def.icon} ${def.name}: ${text}`, 'neutral');
  const net = Object.values(summary.stats).reduce((s, v) => s + (v ?? 0), 0);
  const tone = net >= 2 || summary.money > 0 ? 'good' : net <= -2 ? 'bad' : 'neutral';
  return ok(text, tone, { outcomeText: text, summary, title: def.name, icon: def.icon, choice: def.name });
}

import { all, ch, ev, o, P } from '../../kit';
import { adjudicate, evidenceWord, jus, systemFor } from '../../justice';
import { chance, pick } from '../../rng';
import type { EventCtx, EventTemplate } from '../../types';

const sen = (c: EventCtx) => jus(c.p).sentence;
const kidInside = (c: EventCtx) => !!sen(c)?.juvenile;

export const JUSTICE_EVENTS: EventTemplate[] = [
  // ------------------------------------------------------------------ court
  ev('jus_court', 'crime', [7, 110], '⚖️', 'Your Day in Court',
    'You have been charged with {offence}. Your case comes before the {court}. The evidence against you looks {evidence}.', [
      ch('Plead guilty and cooperate', [o('You told the court everything. Honesty counts for something.', { run: (c) => adjudicate(c.g, 'plea') })], { hint: 'A lighter sentence, but no chance of acquittal' }),
      ch('Rely on the court-appointed lawyer', [o('The legal aid lawyer did what they could.', { run: (c) => adjudicate(c.g, 'legalaid') })]),
      ch('Hire a top defence lawyer', [o('Your lawyer fought hard on your behalf.', { run: (c) => adjudicate(c.g, 'lawyer') })], { cost: 5000, hint: 'Best chance of acquittal and a lighter sentence' }),
      ch('Defend yourself', [o('You stood up and made your own case.', { run: (c) => adjudicate(c.g, 'self') })], { when: (c) => c.age >= 18, disabledReason: 'Minors need a lawyer' }),
    ], {
      weight: 0, when: () => false, cooldown: 0, max: 999,
      prep: (g) => {
        const ch2 = jus(g.player).charge; const sys = systemFor(g);
        if (!ch2) return null;
        return { tokens: { offence: ch2.label, court: ch2.juvenile ? sys.juvenileCourt : sys.adultCourt, evidence: evidenceWord(ch2.evidence) } };
      },
    }),

  // ------------------------------------------------------------------ first day inside
  ev('jus_arrival', 'prison', [7, 110], '🚪', 'First Day Inside',
    'The gates close behind you at {facility}. {blurb} {life}', [
      ch('Keep your head down and follow the rules', [o('You learned the routine quickly and drew no attention.', { conduct: 8, standing: -3, happiness: -2 })]),
      ch('Introduce yourself to the others', [
        o('A few of them nodded back. It is a start.', { standing: 8, happiness: 1 }, 2),
        o('You said the wrong thing to the wrong person.', { standing: -4, health: -3, conduct: -5 }, 1),
      ]),
      ch('Stand your ground and show you are not to be pushed around', [o('Word of your attitude spread quickly.', { standing: 12, conduct: -8, health: -2 })]),
      ch('Ask about classes and programmes', [o('A staff member put your name down for a course.', { conduct: 6, standing: -1, run: (c) => { const s = sen(c); if (s) s.studied++; } })]),
    ], {
      weight: 0, cooldown: 0, max: 99,
      when: P.prison,
      prep: (g) => { const s = jus(g.player).sentence; if (!s) return null; const sys = systemFor(g); const f = [sys.juvenile.light, sys.juvenile.heavy, sys.youngAdult, sys.adult.low, sys.adult.mid, sys.adult.high, sys.drug].find((x) => x?.id === s.facilityId); return { tokens: { facility: s.facility, blurb: f?.blurb ?? '', life: pick(sys.life) } }; },
    }),

  // ------------------------------------------------------------------ life inside
  ev('pr_bully', 'prison', [7, 110], '😠', 'A Bully Tests You',
    'An older inmate has been taking your food and picking at you. Today he does it in front of everyone.', [
      ch('Fight back', [
        o('You held your own. Nobody bothered you after that.', { standing: 10, health: -3, conduct: -10, offence: 'a fight inside' }, 2),
        o('You were beaten and sent to isolation.', { health: -7, conduct: -15, standing: -5, sentence: 1 }, 1),
      ]),
      ch('Report him to the staff', [o('The staff moved him. Some people called you a snitch.', { conduct: 8, standing: -10 }, 1)]),
      ch('Hand over what he wants', [o('It cost you a little, and it bought some peace.', { standing: -6, happiness: -3 })]),
      ch('Ignore it and walk away', [o('You stayed calm. It was hard.', { discipline: 1.5, standing: -2, conduct: 3 })]),
    ], { weight: 1.6, cooldown: 3, max: 5, when: P.prison }),

  ev('pr_contraband', 'prison', [7, 110], '📱', 'An Offer Behind the Block',
    'Another inmate offers to sell you a smuggled phone and a pack of cigarettes.', [
      ch('Take the deal', [
        o('You got away with it and talked to home for the first time in months.', { happiness: 5, standing: 6, conduct: -6 }, 1.4),
        o('A search turned it up. You were put in isolation and extra time was added.', { conduct: -25, sentence: 1, happiness: -6 }, 1),
      ]),
      ch('Refuse', [o('You kept your record clean.', { conduct: 4, discipline: 1 })]),
      ch('Report it to the staff', [o('The staff were grateful, and the others were not.', { conduct: 10, standing: -12 })]),
    ], { weight: 1.2, cooldown: 3, max: 4, when: P.prison }),

  ev('pr_visit', 'prison', [7, 110], '👪', 'Visiting Day',
    'Someone from outside has come to see you. It is a short visit through a barrier, with a guard watching.', [
      ch('Spend the whole visit just talking', [o('You both felt lighter afterwards.', { happiness: 6, rel: ['parents', 8, 6] })]),
      ch('Ask them to bring you books and news', [o('A box of books arrived the next week.', { happiness: 3, intelligence: 1, rel: ['parents', 4, 3], run: (c) => { const s = sen(c); if (s) s.studied++; } })]),
      ch('Tell them not to wait for you', [o('It hurt both of you.', { happiness: -7, rel: ['everyone', -8, -6] })]),
    ], { weight: 1.5, cooldown: 2, max: 20, when: all(P.prison, P.parent) }),

  ev('pr_gang', 'prison', [14, 110], '🕶️', 'A Protection Offer',
    'A group on your block offers you protection. In return, you will owe them favours.', [
      ch('Join them', [o('You are safer now, but you owe them.', { standing: 15, conduct: -15, run: (c) => { const s = sen(c); if (s) s.gang = true; } })]),
      ch('Say no politely', [o('They let it go. This time.', { standing: -3 }, 2), o('They roughed you up as a warning.', { health: -5, standing: -8 }, 1)]),
      ch('Refuse firmly and stand tall', [o('They respected it.', { standing: 6, confidence: 2 }, 1.2), o('It earned you a beating.', { health: -8, standing: -2 }, 1)]),
    ], { weight: 1, cooldown: 4, max: 3, when: all(P.prison, (c) => !sen(c)?.gang) }),

  ev('pr_riot', 'prison', [14, 110], '🚨', 'Disturbance on the Block',
    'A fight breaks out in the dining hall and spreads fast. Alarms ring and the guards are overwhelmed.', [
      ch('Stay in your cell and keep your head down', [o('It passed. Others were not so lucky.', { conduct: 5, happiness: -2 })]),
      ch('Join in', [o('You were identified and charged with disorder.', { crime: 3, offence: 'rioting', health: -5, conduct: -20 }, 1.6), o('You slipped out of it in the confusion.', { standing: 8, health: -3 }, 1)]),
      ch('Help the guards restore order', [o('The staff noted your help. Some inmates will not forget it.', { conduct: 14, standing: -14, health: -2 })]),
    ], { weight: 0.8, cooldown: 6, max: 3, when: P.prison }),

  ev('pr_sick', 'prison', [7, 110], '🤒', 'Sick Inside',
    'You have been running a fever and cough for days. Medical staff are overstretched.', [
      ch('Report to the clinic', [o('The medic treated you and you recovered.', { health: 3, happiness: 1 }, 2), o('The queue was long and the treatment slow, but you pulled through.', { health: -2 }, 1)]),
      ch('Tough it out', [o('It passed on its own, mostly.', { health: -4, discipline: 1 }, 1.4), o('You got worse before you got better.', { health: -9, happiness: -3 }, 1)]),
    ], { weight: 1.2, cooldown: 4, max: 5, when: P.prison }),

  ev('pr_faith', 'prison', [7, 110], '🙏', 'Faith and Reflection',
    'The chaplain invites you to join the weekly religious and reflection class.', [
      ch('Attend regularly', [o('The quiet and the company helped you think.', { happiness: 4, conduct: 7, discipline: 1, run: (c) => { const s = sen(c); if (s) s.counselled++; } })]),
      ch('Go once to see what it is like', [o('It was calm, and you left with a lighter mind.', { happiness: 2, conduct: 2 })]),
      ch('Stay in your cell', [o('You preferred your own company.', { happiness: -1 })]),
    ], { weight: 1.2, cooldown: 4, max: 4, when: P.prison }),

  ev('pr_mentor', 'prison', [14, 110], '🧰', 'An Unexpected Mentor',
    'An older inmate who runs the workshop says you have good hands, and offers to teach you a trade.', [
      ch('Take him up on it', [o('By the end of the year you could build things properly.', { skill: { trades: 6 }, conduct: 6, confidence: 3, run: (c) => { const s = sen(c); if (s) s.worked++; } })]),
      ch('Decline', [o('He shrugged and moved on.', {})]),
    ], { weight: 1, cooldown: 5, max: 2, when: P.prison }),

  ev('pr_lockdown', 'prison', [7, 110], '🔒', 'Lockdown',
    'The whole facility is locked down for weeks after an incident. Visits and classes are suspended.', [
      ch('Read and study in your cell', [o('The time passed more easily than you feared.', { intelligence: 1, happiness: -1, conduct: 3 })]),
      ch('Work out in the cell every day', [o('You came out stronger.', { health: 3, discipline: 1, happiness: -2 })]),
      ch('Sink into dark thoughts', [o('It was a bleak stretch.', { happiness: -8, health: -2 })]),
    ], { weight: 0.9, cooldown: 5, max: 3, when: P.prison }),

  ev('pr_guard', 'prison', [14, 110], '🛡️', 'A Guard Offers a Deal',
    'A guard hints that if you pass on information about what goes on at night, it could help your record.', [
      ch('Give them information', [o('The guard kept their word. The others eventually found out.', { conduct: 14, standing: -18, health: -3 })]),
      ch('Refuse', [o('The guard shrugged. You kept your self-respect.', { standing: 4, conduct: 0 })]),
    ], { weight: 0.8, cooldown: 5, max: 2, when: P.prison }),

  ev('pr_escape', 'prison', [14, 110], '🪜', 'The Escape Plan',
    'A group is plotting an escape. They want you in on it.', [
      ch('Join them', [o('The plan fell apart before it began.', { standing: 6, conduct: -10 }, 1), o('You were caught at the fence. Years were added.', { crime: 4, offence: 'attempted escape', health: -6, conduct: -30 }, 3)]),
      ch('Refuse and say nothing', [o('You wanted no part of it.', { standing: -1 })]),
      ch('Warn the staff', [o('The attempt was stopped. You had to be moved for your own safety.', { conduct: 15, standing: -15 })]),
    ], { weight: 0.5, cooldown: 8, max: 2, when: P.prison }),

  ev('pr_letter', 'prison', [10, 110], '✉️', 'A Letter From Outside',
    'A letter arrives. It is from someone you have not heard from in a long time.', [
      ch('Write back straight away', [o('The reply brought you something to hold on to.', { happiness: 5, rel: ['everyone', 4, 4] })]),
      ch('Keep it, but do not reply', [o('You read it again and again, and never answered.', { happiness: -2 })]),
    ], { weight: 1, cooldown: 3, max: 8, when: all(P.prison, (c) => c.p.people.some((x) => x.alive && ['friend', 'sibling', 'mother', 'father', 'partner', 'spouse'].includes(x.relation))) }),

  ev('pr_certificate', 'prison', [14, 110], '📜', 'Workshop Certificate',
    'The training coordinator tells you that you are eligible to sit a trade certificate exam.', [
      ch('Sit the exam', [o('You passed, and the certificate will help on the outside.', { skill: { trades: 5 }, confidence: 4, happiness: 3, conduct: 6 }, 2), o('You narrowly failed. There will be another chance.', { happiness: -2 }, 1)]),
      ch('Skip it', [o('You were not ready.', {})]),
    ], { weight: 1, cooldown: 5, max: 3, when: all(P.prison, (c) => (sen(c)?.worked ?? 0) + (sen(c)?.studied ?? 0) >= 1) }),

  // ---- juvenile settings
  ev('jv_teacher', 'prison', [10, 20], '🍎', 'A Teacher Who Believes in You',
    'One of the teachers here keeps telling you that you are smarter than your record says.', [
      ch('Work harder in class', [o('Your grades improved and so did your self-belief.', { intelligence: 2, confidence: 4, happiness: 3, grades: 8, run: (c) => { const s = sen(c); if (s) { s.studied++; s.conduct = Math.min(100, s.conduct + 6); } } })]),
      ch('Brush it off', [o('You did not want to get your hopes up.', { happiness: -1 })]),
    ], { weight: 1.5, cooldown: 3, max: 3, when: all(P.prison, kidInside) }),
  ev('jv_homesick', 'prison', [10, 20], '🏠', 'Homesick',
    'Lights out is the hardest part of the day. You miss your family and the life you had.', [
      ch('Talk to a counsellor', [o('It helped to say it out loud.', { happiness: 3, conduct: 4, run: (c) => { const s = sen(c); if (s) s.counselled++; } })]),
      ch('Write a letter home', [o('You felt closer to them.', { happiness: 3, rel: ['parents', 5, 4] })]),
      ch('Hide it and get on with things', [o('You swallowed it down.', { happiness: -3, discipline: 1 })]),
    ], { weight: 1.5, cooldown: 3, max: 4, when: all(P.prison, kidInside) }),
  ev('jv_parade', 'prison', [10, 22], '🎖️', 'Morning Parade',
    'The day starts early with a strict parade and inspection. The instructors mean business.', [
      ch('Give it your best', [o('Your bearing and discipline improved.', { discipline: 3, health: 1, conduct: 6, standing: 3 })]),
      ch('Slack off and mutter', [o('The instructor noticed. You got extra duty.', { discipline: -1, conduct: -8, happiness: -2 })]),
    ], { weight: 1.3, cooldown: 3, max: 4, when: all(P.prison, kidInside) }),

  // ------------------------------------------------------------------ afterwards
  ev('jus_release', 'crime', [7, 110], '🌅', 'Freedom',
    'The gate opens and the world is louder, faster and stranger than you remember. What do you do first?', [
      ch('Go home to your family', [o('It was awkward at first, then it felt like coming home.', { happiness: 7, rel: ['parents', 12, 8] })], { when: P.parent, disabledReason: 'No family to go to' }),
      ch('Look for work straight away', [o('You put yourself out there, even though doors were closed.', { discipline: 2, confidence: 2, happiness: 1 })]),
      ch('Celebrate with your old friends', [o('A good night out, and some old habits came back.', { happiness: 6, social: 2 }, 1.5), o('Old habits got you into trouble again.', { crime: 2, offence: 'public disorder', happiness: -4 }, 1)]),
      ch('Take it slowly and look after yourself', [o('You gave yourself time to adjust.', { happiness: 4, health: 2 })]),
    ], { weight: 0, cooldown: 0, max: 99, when: P.exOffender }),

  ev('jus_reentry', 'crime', [14, 110], '🧾', 'The Record Follows You',
    'An application falls through when the employer asks about your record. It keeps happening.', [
      ch('Be upfront and explain', [o('One employer gave you a chance.', { happiness: 4, confidence: 3, salaryPct: 0 }, 1), o('They thanked you politely and never called back.', { happiness: -3 }, 1.4)]),
      ch('Start freelancing or working for yourself', [o('No one asked about your past, and your work spoke for itself.', { skill: { tech: 2, communication: 2 }, confidence: 3, money: 400 })]),
      ch('Go back to study', [o('A course gave you something new to put on your CV.', { intelligence: 1, discipline: 2, money: -300 })], { cost: 300 }),
      ch('Turn to the old crowd', [o('They had work for you, and it was not legal.', { crime: 3, offence: 'theft', money: 1500, discipline: -4 }, 1.4), o('You thought better of it at the last minute.', { discipline: 2 }, 1)]),
    ], { weight: 0, cooldown: 0, max: 99, when: P.exOffender }),

  ev('jus_old_crowd', 'crime', [14, 70], '📞', 'One Last Job',
    'An old contact calls. They have a job that pays well, and they need someone you can trust.', [
      ch('Hang up', [o('You blocked the number.', { discipline: 3, confidence: 2 })]),
      ch('Hear them out', [o('It was never going to end well.', { crime: 4, offence: 'armed robbery', money: 3000, happiness: -3 }, 1.2), o('You listened, thought of everything you would lose, and walked away.', { discipline: 2 }, 1.6)]),
    ], { weight: 0.9, cooldown: 4, max: 3, when: P.exOffender }),

  ev('jus_probation_officer', 'crime', [10, 110], '🗂️', 'Check-in With Your Probation Officer',
    'Your supervision officer is waiting for your monthly check-in.', [
      ch('Turn up on time and report honestly', [o('The officer noted your effort.', { discipline: 2, happiness: 1, conduct: 6 })]),
      ch('Skip it', [o('You missed the appointment and got a stern warning.', { happiness: -4, discipline: -1 }, 2), o('Your absence was recorded as a breach and the court was told.', { crime: 2, offence: 'breach of an order', happiness: -6 }, 1)]),
    ], { weight: 1.6, cooldown: 1, max: 5, when: P.probation }),

  // ------------------------------------------------------------------ temptations that lead to trouble
  ev('jus_drug_offer', 'crime', [14, 40], '💊', 'An Easy Way to Make Money',
    'Someone from your neighbourhood says you could earn good money passing small packages around town.', [
      ch('Do it', [o('The cash came easily until it did not. You were caught.', { crime: 3, offence: 'drug dealing', money: 600, happiness: -8 }, 2), o('You made a lot of money and kept looking over your shoulder.', { money: 2500, happiness: -2, discipline: -3 }, 1)]),
      ch('Say no', [o('You walked away.', { discipline: 2 })]),
      ch('Tell someone', [o('It felt like the right thing, though it made you few friends.', { confidence: 1, social: -1 })]),
    ], { weight: 0.7, cooldown: 6, max: 2, when: all(P.free, (c) => c.p.background.wealthTier <= 3) }),
  ev('jus_joyride', 'crime', [13, 25], '🚗', 'Borrowed Wheels',
    'Your friends have a car they say they "borrowed", and they invite you for a ride.', [
      ch('Get in', [o('The police pulled you over. All of you were arrested.', { crime: 2, offence: 'car theft', happiness: -8, rel: ['parents', -8, -6] }, 2), o('A thrilling ride that ended without trouble.', { happiness: 3, discipline: -2 }, 1)]),
      ch('Walk away', [o('You went home. Your friends were not impressed.', { discipline: 2, social: -1 })]),
    ], { weight: 0.8, cooldown: 4, max: 2, when: P.free }),
  ev('jus_scam_recruit', 'crime', [16, 45], '🧑‍💻', 'Easy Money Online',
    'An acquaintance wants you to run a scam, collecting "fees" for products that do not exist.', [
      ch('Join in', [o('It worked for a while. Then the victims reported you.', { crime: 3, offence: 'fraud', money: 1200, happiness: -6 }, 2), o('The money rolled in.', { money: 4000, discipline: -3 }, 1)]),
      ch('Refuse', [o('You wanted no part of it.', { discipline: 2 })]),
    ], { weight: 0.6, cooldown: 6, max: 2, when: all(P.free, (c) => c.p.skills.tech >= 20) }),
  ev('jus_bar_fight', 'crime', [18, 60], '🥊', 'Trouble Outside the Bar',
    'A drunk stranger shoves you outside a bar. Voices rise and a crowd gathers.', [
      ch('Walk away', [o('You went home. It was the right call.', { discipline: 2 })]),
      ch('Throw the first punch', [o('The police arrived before it got worse. You were charged.', { crime: 2, offence: 'assault', happiness: -6, money: -300 }, 2), o('You got away with a black eye.', { health: -3, confidence: 1 }, 1)]),
    ], { weight: 0.8, cooldown: 4, max: 3, when: all(P.free, P.stat('confidence', 40)) }),
];

void chance;

import { all, any, ch, ev, o, P, not } from '../../kit';
import { chance, clamp } from '../../rng';
import { kidFirst, marryChild, newlywed, pendingProposal, vibeText } from '../../kids';
import { livingChildren, personAge } from '../../util';
import type { EventCtx, EventTemplate, GameState, Person } from '../../types';

const kidOf = (c: EventCtx) => c.p.people.find((x) => x.id === c.targets.child);
const rich = (n: number) => P.cash(n);
const renting = (c: EventCtx) => c.p.fin.housing.kind === 'rent';
const mortgaged = (c: EventCtx) => c.p.fin.loans.some((l) => l.kind === 'mortgage');
const grownKids = (g: GameState) => livingChildren(g.player).filter((k) => personAge(g, k) >= 22 && !k.estranged);
const elderParent = (g: GameState): Person | undefined => g.player.people.find((x) => (x.relation === 'mother' || x.relation === 'father') && x.alive && personAge(g, x) >= 72);

// --------------------------------------------------------------------------------------------- your children's love lives
export const FAMILY_EVENTS: EventTemplate[] = [
  ev('fam_child_marry', 'family', [36, 110], '💍', 'A Question From Your Child',
    '{child} sits you down, looking nervous. "I\'ve been seeing {suitor} for a while now, and I want to marry them. I\'d love your blessing."\n\n{vibe}', [
      ch('Give your blessing', [o('{child} burst into tears of joy and hugged you tightly.', {
        rel: ['child', 12, 10], happiness: 5, sched: ['fam_wedding_day', 1, 1, 1],
        run: (c) => { const k = kidOf(c); return k ? marryChild(c.g, k) : undefined; },
      })]),
      ch('Bless them and pay for the wedding', [o('You wrote the cheque with a smile. {child} will never forget it.', {
        rel: ['child', 18, 14], happiness: 7, sched: ['fam_wedding_day', 1, 1, 1],
        run: (c) => { const k = kidOf(c); return k ? marryChild(c.g, k) : undefined; },
      })], { cost: 5000, hint: 'The most generous option' }),
      ch('Ask them to wait and get to know {suitor} first', [
        o('You invited {suitor} to dinner and learned a lot about who they are.', {
          rel: ['child', 1, 2],
          run: (c) => { const k = kidOf(c); if (!k?.match) return; k.match.deferred++; k.match.askAge = c.p.age + 1; k.match.revealed = chance(0.55) || k.match.revealed; return k.match.revealed ? `You now have a much clearer sense of ${k.match.name}.` : 'You still cannot quite read them.'; },
        }, 2),
        o('{child} agreed to wait, but you could tell they were disappointed.', {
          rel: ['child', -3, -2],
          run: (c) => { const k = kidOf(c); if (k?.match) { k.match.deferred++; k.match.askAge = c.p.age + 1; } },
        }, 1),
      ], { when: (c) => { const k = c.p.people.find((x) => x.id === c.targets.child); return !!k?.match && k.match.deferred < 2; }, disabledReason: 'They have already waited long enough' }),
      ch('Quietly look into {suitor}', [o('You asked around and had {suitor} properly looked into.', {
        rel: ['child', -1],
        run: (c) => { const k = kidOf(c); if (!k?.match) return; k.match.revealed = true; k.match.askAge = c.p.age + 1; return vibeText(c.g, k); },
      })], { cost: 1500, hint: 'Reveals what kind of person they really are' }),
      ch('Forbid the marriage', [
        o('{child} was heartbroken but respected your wishes. The relationship ended.', {
          rel: ['child', -12, -10], happiness: -3,
          run: (c) => { const k = kidOf(c); if (k) k.match = undefined; },
        }, (c) => 1 + (kidOf(c)?.closeness ?? 50) / 45),
        o('{child} married {suitor} anyway and barely speaks to you now.', {
          happiness: -7, sched: ['fam_child_reconcile', 3, 6, 1],
          run: (c) => { const k = kidOf(c); return k ? marryChild(c.g, k, { defied: true }) : undefined; },
        }, (c) => 1 + (100 - (kidOf(c)?.closeness ?? 50)) / 35 + (kidOf(c)?.match?.quality === 'great' ? 1 : 0)),
      ], { hint: 'Risky: they may do it anyway' }),
    ], {
      force: true, cooldown: 0, max: 40, when: (c) => !!pendingProposal(c.g),
      prep: (g) => { const k = pendingProposal(g); return k?.match ? { targets: { child: k.id }, tokens: { suitor: k.match.name.split(' ')[0], vibe: vibeText(g, k) } } : null; },
    }),

  ev('fam_wedding_day', 'family', [36, 110], '🎊', 'The Wedding Day',
    'The day arrives. {child} looks radiant, and {suitor} can\'t stop smiling. All eyes turn to you.', [
      ch('Give a heartfelt toast', [o('You spoke from the heart and there wasn\'t a dry eye in the room.', { rel: ['child', 8, 6], happiness: 6, confidence: 2 }, 2), o('You choked up halfway through, and everyone loved you for it.', { rel: ['child', 6, 4], happiness: 5 })]),
      ch('Dance the night away', [o('Your moves became the stuff of family legend.', { happiness: 7, health: 1, rel: ['child', 4] })]),
      ch('Slip them an envelope of cash', [o('{child} pretended not to look, then hugged you.', { rel: ['child', 8, 6], happiness: 4 })], { cost: 1500 }),
    ], {
      weight: 0, cooldown: 0, max: 40, when: (c) => !!newlywed(c.g),
      prep: (g) => { const k = newlywed(g); return k?.match ? { targets: { child: k.id }, tokens: { suitor: k.match.name.split(' ')[0] } } : null; },
    }),

  ev('fam_child_heartbreak', 'family', [38, 110], '💔', 'A Child in Pieces',
    '{child}\'s marriage has ended. They turn up at your door late at night, eyes red, with a small bag.', [
      ch('Let them stay as long as they need', [o('Having them home again was a bit chaotic, but it mended something between you.', { rel: ['child', 14, 12], happiness: 2, money: -400 })]),
      ch('Help pay for a good lawyer', [o('The divorce was messy, but they came out of it fairly.', { rel: ['child', 10, 8], happiness: 2 })], { cost: 3000 }),
      ch('Listen, and be there for them', [o('Sometimes people just need someone to listen.', { rel: ['child', 9, 8], happiness: 1 })]),
      ch('Tell them it\'s their own mess to fix', [o('{child} left quietly. The silence afterwards was heavy.', { rel: ['child', -14, -12], happiness: -4 })]),
    ], {
      weight: 0, cooldown: 0, max: 40, when: (c) => !!c.p.flags.divorcedKid,
      prep: (g) => { const k = g.player.people.find((x) => x.id === g.player.flags.divorcedKid); g.player.flags.divorcedKid = ''; return k ? { targets: { child: k.id } } : null; },
    }),

  ev('fam_child_reconcile', 'family', [38, 110], '🕊️', 'A Letter From {child}',
    'After years of silence, a letter arrives from {child}. They don\'t apologise exactly, but they say they miss you and ask if you would like to meet.', [
      ch('Welcome them back with open arms', [o('You embraced. The years of distance suddenly seemed so unnecessary.', { rel: ['child', 35, 40], happiness: 8, run: (c) => { const k = kidOf(c); if (k) k.estranged = false; } })]),
      ch('Say you will meet, but you need an apology first', [
        o('They apologised, awkwardly. It is a start.', { rel: ['child', 20, 20], happiness: 4, run: (c) => { const k = kidOf(c); if (k) k.estranged = false; } }, 1.6),
        o('They refused. The conversation ended coldly.', { rel: ['child', -5, -5], happiness: -3 }, 1),
      ]),
      ch('Stay silent', [o('The letter went into a drawer. Pride is a lonely thing.', { happiness: -4, sched: ['fam_child_reconcile', 3, 6, 0.8] })]),
    ], {
      weight: 0, cooldown: 0, max: 20, when: (c) => livingChildren(c.p).some((k) => k.estranged),
      prep: (g) => { const k = livingChildren(g.player).find((x) => x.estranged); return k ? { targets: { child: k.id } } : null; },
    }),

  ev('fam_child_money', 'family', [40, 110], '💸', 'A Child Asks for Money',
    '{child} is struggling to cover a deposit and some debts. They ask, a little embarrassed, if you can help with {$4000}.', [
      ch('Give it as a gift', [o('{child} was overwhelmed with gratitude.', { rel: ['child', 12, 10], happiness: 2 })], { cost: 4000 }),
      ch('Lend it, with a simple repayment plan', [
        o('They paid you back, every cent, and grew in confidence.', { money: 4400, rel: ['child', 8, 10], discipline: 1 }, 2),
        o('They struggled to repay. You quietly let it go.', { rel: ['child', 4, 2] }, 1.2),
      ], { cost: 4000 }),
      ch('Say no, kindly', [o('{child} understood, though it stung.', { rel: ['child', -5, -2] })]),
      ch('Help them build a budget instead', [o('Not what they hoped for, but it helped more than cash would have.', { rel: ['child', 3, 5], happiness: 1 })]),
    ], {
      weight: (c) => 1 + grownKids(c.g).filter((k) => k.match?.quality === 'risky').length * 1.5, cooldown: 4, max: 6,
      when: (c) => grownKids(c.g).length > 0,
      prep: (g) => { const ks = grownKids(g); const k = ks.find((x) => x.match?.quality === 'risky' && x.match.status === 'married') ?? ks[Math.floor(Math.random() * ks.length)]; return k ? { targets: { child: k.id } } : null; },
    }),

  ev('fam_grandkid_sitting', 'family', [48, 110], '🍼', 'Grandparent Duty',
    '{child} is stretched thin and asks if you can look after the grandkids for the weekend.', [
      ch('Say yes with delight', [o('Exhausting and wonderful, in equal measure.', { happiness: 6, health: -2, rel: ['child', 8, 6] })]),
      ch('Take them for one day only', [o('A good compromise, and a lot of fun.', { happiness: 3, rel: ['child', 4] })]),
      ch('Pay for a babysitter instead', [o('Everyone got a break.', { rel: ['child', 3], happiness: 1 })], { cost: 500 }),
      ch('Decline, you need your rest', [o('You enjoyed the quiet, but felt a twinge of guilt.', { rel: ['child', -4, -2], health: 1 })]),
    ], {
      weight: 1.3, cooldown: 3, max: 6, when: (c) => livingChildren(c.p).some((k) => (k.kids?.length ?? 0) > 0 && !k.estranged),
      prep: (g) => { const k = livingChildren(g.player).find((x) => (x.kids?.length ?? 0) > 0 && !x.estranged); return k ? { targets: { child: k.id } } : null; },
    }),

  ev('fam_child_abroad', 'family', [42, 110], '✈️', '{child} Wants to Move Abroad',
    '{child} has been offered a great job overseas and wants to take it. It means seeing the grandkids and you far less often.', [
      ch('Encourage them wholeheartedly', [o('They were thrilled. You promised to visit often.', { rel: ['child', 9, 8], happiness: -2 })]),
      ch('Tell them how much you will miss them', [o('They hesitated, then decided to go anyway, closer in spirit than before.', { rel: ['child', 3, 4], happiness: -3 }, 1.4), o('They stayed, a little resentful.', { rel: ['child', -4, -2] }, 1)]),
      ch('Ask them not to go', [o('They felt guilty, and a little trapped.', { rel: ['child', -9, -6], happiness: -2 })]),
    ], { weight: 0.7, max: 2, when: (c) => grownKids(c.g).length > 0, prep: (g) => { const ks = grownKids(g); return ks.length ? { targets: { child: ks[0].id } } : null; } }),

  ev('fam_inlaw_dispute', 'family', [40, 110], '🍽️', 'Holiday Tug-of-War',
    '{child} and {suitor} both want to host the holidays, and neither family wants to give way. They each call you separately to ask for support.', [
      ch('Host everyone yourself', [o('It was chaotic, crowded and quite lovely.', { happiness: 4, money: -500, rel: ['child', 6, 4] })]),
      ch('Stay neutral', [o('They sorted it out themselves in the end.', { rel: ['child', 1] })]),
      ch('Take your child\'s side', [o('{suitor} noticed.', { rel: ['child', 6, 4], happiness: -1 })]),
    ], {
      weight: 0.8, cooldown: 4, max: 3, when: (c) => livingChildren(c.p).some((k) => k.match?.status === 'married' && !k.estranged),
      prep: (g) => { const k = livingChildren(g.player).find((x) => x.match?.status === 'married' && !x.estranged); return k?.match ? { targets: { child: k.id }, tokens: { suitor: k.match.name.split(' ')[0] } } : null; },
    }),

  // ------------------------------------------------------------------------------------------- aging parents and siblings
  ev('fam_elder_care', 'family', [35, 85], '🧓', 'Mum or Dad Needs Care',
    'Your {parentRel}, {parent}, is struggling to cope alone. Daily tasks are getting harder and everyone is looking at you.', [
      ch('Move them in with you', [o('The house was fuller and louder, but they were safe and happy.', { rel: ['parent', 14, 10], happiness: -2, money: -500, health: -1 })]),
      ch('Pay for assisted living', [o('They settled in and made friends. Visits are warm.', { rel: ['parent', 8, 6], happiness: 1 })], { cost: 7000 }),
      ch('Share the care with your siblings', [o('A rota worked, mostly. There were a few quarrels.', { rel: ['parent', 8, 6], happiness: -1 }, 1.5), o('You ended up doing most of it.', { rel: ['parent', 8, 6], happiness: -4, health: -2 }, 1)], { when: P.sibling, disabledReason: 'You have no siblings to share with' }),
      ch('Visit when you can', [o('You felt guilty each time you left.', { rel: ['parent', -6, -4], happiness: -2 })]),
    ], {
      weight: 1.6, cooldown: 4, max: 3, when: (c) => !!elderParent(c.g),
      prep: (g) => { const per = elderParent(g); return per ? { targets: { parent: per.id }, tokens: { parent: per.name.split(' ')[0], parentRel: per.relation === 'mother' ? 'mother' : 'father' } } : null; },
    }),

  ev('fam_parent_hospital', 'family', [30, 85], '🏥', 'Parent in Hospital',
    'You get a call in the middle of the night: your {parent} has been taken to hospital.', [
      ch('Drop everything and go', [o('You sat by the bed for days. They will remember it.', { rel: ['parent', 14, 12], happiness: -3, health: -2 })]),
      ch('Go after work, and call daily', [o('They understood, mostly.', { rel: ['parent', 5, 3] })]),
      ch('Pay for a private room and specialists', [o('The best care money could buy.', { rel: ['parent', 9, 8], happiness: 2 })], { cost: 5000, when: rich(5000) }),
    ], {
      weight: 1.1, cooldown: 5, max: 3, when: (c) => !!elderParent(c.g) || P.parent(c),
      prep: (g) => { const per = g.player.people.find((x) => (x.relation === 'mother' || x.relation === 'father') && x.alive); return per ? { targets: { parent: per.id }, tokens: { parent: per.relation } } : null; },
    }),

  ev('fam_sibling_loan', 'family', [22, 75], '🤝', 'Your {sibling} Needs a Loan',
    'Your {sibling} is in a tight spot and asks to borrow {$3000}. "Just for a few months. I promise."', [
      ch('Lend it', [o('They paid it back, with a thank-you card.', { money: 3000, rel: ['sibling', 8, 8] }, 1.4), o('The money never came back, and neither did the subject.', { rel: ['sibling', -3, -8] }, 1)], { cost: 3000 }),
      ch('Say no', [o('They didn\'t speak to you for a while.', { rel: ['sibling', -8, -5] })]),
      ch('Offer to help them find a job instead', [o('It was a long road but they got back on their feet.', { rel: ['sibling', 6, 8], happiness: 2 })]),
    ], { weight: 0.9, cooldown: 5, max: 3, when: all(P.sibling, (c) => c.age >= 22) }),

  ev('fam_sibling_wedding', 'family', [20, 80], '👰', 'Your {sibling} Is Getting Married',
    'Your {sibling} is getting married and wants you at the centre of it.', [
      ch('Be the best man / maid of honour', [o('You delivered a speech people still quote.', { rel: ['sibling', 12, 10], happiness: 5, confidence: 2 }, 1.5), o('You lost the rings, but you will never live it down in the best way.', { rel: ['sibling', 8, 8], happiness: 3 }, 1)], { cost: 1000 }),
      ch('Attend and enjoy', [o('A lovely day.', { happiness: 4, rel: ['sibling', 5] })], { cost: 400 }),
      ch('Send a gift and skip it', [o('They were hurt, though they understood.', { rel: ['sibling', -9, -6] })], { cost: 150 }),
    ], { weight: 0.8, max: 2, when: P.sibling }),

  // ------------------------------------------------------------------------------------------- everyday money and home
  ev('rl_rent_hike', 'money', [18, 90], '🏠', 'Rent Increase',
    'Your landlord announces the rent is going up by 15% from next month.', [
      ch('Accept it', [o('You absorbed the extra cost.', { money: -900 })]),
      ch('Negotiate', [o('They agreed to a smaller rise.', { money: -300, discipline: 1 }, 1.6), o('They refused and held firm.', { money: -1000 }, 1)]),
      ch('Move somewhere cheaper', [o('It was a hassle, but you saved money.', { happiness: -2, money: 500 })], { cost: 1800 }),
    ], { weight: 1.3, cooldown: 4, max: 4, when: renting }),

  ev('rl_medical_bill', 'money', [20, 90], '🧾', 'Surprise Medical Bill',
    'A hospital bill for {$2800} arrives, far above what you expected.', [
      ch('Pay it in full', [o('Painful, but done.', { money: -2800 })]),
      ch('Dispute the charges', [o('Most of the charges were removed.', { money: -900, discipline: 2 }, 1.2), o('The dispute dragged on and you ended up paying most of it.', { money: -2400, happiness: -2 }, 1)]),
      ch('Set up a payment plan', [o('A monthly plan made it manageable.', { money: -2000, happiness: -1 })]),
    ], { weight: 1.2, cooldown: 4, max: 4, when: not(P.country('gb', 'ca', 'de', 'fr', 'au')) }),

  ev('rl_insurance_premium', 'money', [22, 85], '📄', 'Insurance Premium Jump',
    'Your insurance renewal arrives with the premium up by a third.', [
      ch('Shop around for a better deal', [o('You found a cheaper provider and saved money.', { money: 300, discipline: 2 }, 1.6), o('Everyone had raised prices.', { money: -200 }, 1)]),
      ch('Cut your coverage', [o('Cheaper, until it isn\'t.', { money: 250 }, 1.2), o('A claim later exposed the gap in your cover.', { money: -2500, happiness: -3 }, 0.5)]),
      ch('Pay it', [o('You paid up and grumbled.', { money: -500 })]),
    ], { weight: 1, cooldown: 5, max: 3 }),

  ev('rl_identity_theft', 'money', [20, 85], '🪪', 'Identity Theft',
    'You discover someone opened a credit account in your name.', [
      ch('Report it and dispute everything', [o('It took weeks of calls, but the account was cleared.', { happiness: -3, discipline: 2, skill: { communication: 1 } }, 2), o('The paperwork dragged on and your credit took a hit.', { happiness: -5, money: -400 }, 1)]),
      ch('Pay a monitoring service', [o('They sorted it out for you.', { happiness: -1 })], { cost: 600 }),
      ch('Ignore it', [o('The debt followed you for years.', { debt: 2500, happiness: -6 })]),
    ], { weight: 0.5, cooldown: 12, max: 2 }),

  ev('rl_tax_refund', 'money', [20, 80], '💰', 'Tax Refund',
    'You get a tax refund of {$1200}.', [
      ch('Save it', [o('Future you says thanks.', { money: 1200, discipline: 2 })]),
      ch('Pay down debt', [o('A satisfying dent in what you owe.', { money: 1200, debt: -800, discipline: 2 })], { when: P.inDebt, disabledReason: 'You have no debt to pay' }),
      ch('Treat yourself', [o('A well-earned splurge.', { money: 1200, happiness: 6 })]),
    ], { weight: 1, cooldown: 3, max: 5, when: P.employed }),

  ev('rl_phone_cracked', 'money', [13, 80], '📱', 'Cracked Screen',
    'You dropped your phone and the screen is a spider web.', [
      ch('Repair it', [o('Good as new.', {})], { cost: 180 }),
      ch('Buy a new one', [o('Shiny, and expensive.', { happiness: 2 })], { cost: 700 }),
      ch('Live with it', [o('You cut your thumb once, but saved money.', { happiness: -1 })]),
    ], { weight: 1.2, cooldown: 3, max: 6 }),

  ev('rl_stock_dip', 'money', [22, 85], '📉', 'Market Dip',
    'Markets have dropped sharply and your portfolio is bleeding.', [
      ch('Hold steady', [o('It recovered, as it usually does.', { discipline: 3, money: 600 }, 1.6), o('It stayed low for a long time.', { happiness: -3, discipline: 2 }, 1)]),
      ch('Sell everything', [o('You locked in your losses.', { happiness: -3, money: -900 }, 1.5), o('You dodged a further drop.', { money: 300, confidence: 2 }, 0.8)]),
      ch('Buy more while it is cheap', [o('A brave move that paid off.', { money: 2500, confidence: 3 }, 1.2), o('It kept falling. Ouch.', { money: -1800, happiness: -3 }, 1)], { cost: 2000, when: rich(2000) }),
    ], { weight: 1, cooldown: 4, max: 4, when: all(P.investor, P.econ('recession')) }),

  ev('rl_rate_hike', 'money', [25, 85], '🏦', 'Mortgage Rate Rise',
    'Interest rates have risen and your mortgage repayments are about to jump.', [
      ch('Refinance', [o('You locked in a fairer rate.', { money: 200, discipline: 1 }, 1.4), o('Fees ate most of the saving.', { money: -400 }, 1)], { cost: 1200 }),
      ch('Ride it out', [o('Tight months, but you managed.', { money: -700, happiness: -2 })]),
      ch('Overpay to cut the balance', [o('A bold move that will pay off.', { discipline: 3, happiness: -1 })], { cost: 3000, when: rich(3000) }),
    ], { weight: 1, cooldown: 6, max: 3, when: mortgaged }),

  ev('rl_car_scrape', 'money', [18, 85], '🚗', 'Fender Bender',
    'You scrape another car in a car park. The owner is furious and wants to settle on the spot.', [
      ch('Go through insurance', [o('Your premium will creep up, but it was sorted.', { money: -400 })]),
      ch('Pay them cash on the spot', [o('You both walked away calm.', { money: -650 })]),
      ch('Drive off', [o('Your conscience bothered you for weeks. Someone had seen your plates.', { happiness: -5, crime: 1, money: -900 })]),
    ], { weight: 1, cooldown: 5, max: 4, when: P.car }),

  ev('rl_diy_disaster', 'money', [22, 85], '🛠️', 'DIY Disaster',
    'You decided to tackle a home repair yourself. It has gone sideways.', [
      ch('Call a professional', [o('Cheaper than the repair you almost caused.', { money: -800 })]),
      ch('Watch another video and keep going', [o('You actually fixed it. Smug for a week.', { confidence: 3, happiness: 3, skill: { trades: 2 } }, 1.2), o('It got worse. Much worse.', { money: -2000, happiness: -3 }, 1.4)]),
    ], { weight: 1, cooldown: 5, max: 3, when: P.owner }),

  ev('rl_midlife', 'life', [40, 56], '🏎️', 'Midlife Wobble',
    'You wake up one morning wondering if this is all there is. A little voice says it is time for a change.', [
      ch('Buy the dream car', [o('Fun for a month, then you noticed the payments.', { happiness: 5, money: -5000, confidence: 2 })], { cost: 8000, when: rich(8000) }),
      ch('Start something new', [o('Terrifying and exhilarating.', { happiness: 6, confidence: 4, skill: { creative: 2 } })]),
      ch('Talk it through with someone you trust', [o('Sometimes naming it is half the cure.', { happiness: 4, discipline: 1, rel: ['everyone', 1] })]),
      ch('Ignore it', [o('The feeling faded, but not entirely.', { happiness: -3 })]),
    ], { weight: 1.2, max: 1 }),

  ev('rl_will_planning', 'life', [50, 90], '📝', 'Putting Your Affairs in Order',
    'A friend\'s sudden loss makes you realise you have never written a proper will.', [
      ch('See a lawyer and do it properly', [o('A weight lifted. You can adjust your will any time in Finance.', { happiness: 3, discipline: 2 })], { cost: 800 }),
      ch('Write something up yourself', [o('Better than nothing, though a lawyer would wince.', { happiness: 1 })]),
      ch('Put it off again', [o('It will have to wait.', {})]),
    ], { weight: 1, max: 1 }),

  // ------------------------------------------------------------------------------------------- relationships and work
  ev('rl_wedding_invite', 'social', [20, 70], '💌', 'Wedding Invitation',
    'A close friend is getting married, with a destination wedding and an expensive gift list.', [
      ch('Go all in', [o('A joyful weekend you will never forget.', { happiness: 6, rel: ['friend', 8, 6] })], { cost: 1400 }),
      ch('Attend, keep it modest', [o('A lovely day.', { happiness: 3, rel: ['friend', 4, 3] })], { cost: 500 }),
      ch('Send your regrets and a card', [o('They said they understood.', { rel: ['friend', -6, -3] })]),
    ], { weight: 1, cooldown: 4, max: 4, when: P.friend }),

  ev('rl_friend_loan', 'social', [20, 80], '🫴', 'Friend in a Bind',
    'A friend asks to borrow {$800} for rent. "Pay you back at the end of the month."', [
      ch('Lend it', [o('They paid you back on time.', { money: 800, rel: ['friend', 6, 8] }, 1.4), o('It took a year, and the friendship felt different.', { rel: ['friend', -2, -6] }, 1)], { cost: 800 }),
      ch('Politely decline', [o('A little awkward, but honest.', { rel: ['friend', -3] })]),
    ], { weight: 1, cooldown: 4, max: 4, when: P.friend }),

  ev('rl_online_scam_romance', 'social', [20, 85], '🎭', 'Too Good Online',
    'Someone you matched with online is charming, attentive, and suddenly urgently needs money for an emergency.', [
      ch('Send the money', [o('They vanished the moment the transfer cleared.', { money: -2500, happiness: -7, confidence: -3 })]),
      ch('Ask for a video call', [o('They disappeared. A relief.', { discipline: 2, happiness: -1 })]),
      ch('Report them', [o('You stayed safe and helped others avoid it.', { discipline: 2, confidence: 1 })]),
    ], { weight: 0.8, cooldown: 6, max: 2, when: P.single }),

  ev('rl_pip', 'work', [22, 62], '📉', 'Performance Plan',
    'Your manager puts you on a formal performance improvement plan.', [
      ch('Work hard to prove them wrong', [o('You turned it around and earned respect.', { happiness: -2, discipline: 3, skill: { leadership: 1 } }, 1.4), o('It exhausted you, and it did not change their mind.', { health: -3, happiness: -4 }, 1)]),
      ch('Start looking elsewhere', [o('You updated your CV and quietly applied.', { confidence: 2 })]),
      ch('Push back with HR', [o('The plan was softened.', { confidence: 3, happiness: 1 }, 1), o('Things got frosty.', { happiness: -4 }, 1.2)]),
    ], { weight: 1, cooldown: 5, max: 2, when: P.employed }),

  ev('rl_commute', 'work', [20, 65], '🚆', 'Commute From Hell',
    'Your daily commute has doubled thanks to roadworks and cancelled trains.', [
      ch('Move closer to work', [o('Short commute, bigger rent, happier mornings.', { happiness: 4, health: 1 })], { cost: 2200 }),
      ch('Ask to work from home sometimes', [o('Your manager agreed to two days a week.', { happiness: 4 }, 1.3), o('They said no.', { happiness: -3 }, 1)]),
      ch('Just endure it', [o('You listened to a lot of podcasts and got very tired.', { health: -2, happiness: -2 })]),
    ], { weight: 1, cooldown: 6, max: 2, when: P.employed }),

  ev('rl_sabbatical', 'work', [28, 60], '🧘', 'Running on Empty',
    'You are exhausted. Every day feels like the one before.', [
      ch('Take unpaid leave to recharge', [o('You came back a different person.', { happiness: 8, health: 4, money: -2500 })], { cost: 2000 }),
      ch('Take a long weekend', [o('Not enough, but better than nothing.', { happiness: 3, health: 1 })]),
      ch('Push through', [o('You made it, but not without cost.', { health: -4, happiness: -3, money: 600 })]),
    ], { weight: 1.1, cooldown: 6, max: 2, when: all(P.employed, P.statBelow('happiness', 55)) }),

  ev('rl_gig_work', 'work', [18, 70], '🚕', 'Side Gig Opportunity',
    'You hear about a flexible gig job, with long hours but decent pay if you are willing to put in the time.', [
      ch('Sign up and give it a go', [o('The extra cash helped, though you were tired.', { money: 3500, health: -2, happiness: -1 }, 1.3), o('Less money than advertised once costs came out.', { money: 900, health: -2 }, 1)]),
      ch('Not for you', [o('You enjoyed the free time.', { happiness: 1 })]),
    ], { weight: 1, cooldown: 5, max: 3, when: all(any(P.poor, P.jobless, P.inDebt), (c) => c.age >= 18) }),

  ev('rl_neighbour_noise', 'life', [18, 80], '🔊', 'Noisy Neighbours',
    'The neighbours have been playing loud music until 2am for weeks.', [
      ch('Knock and talk', [o('They apologised and kept it down.', { happiness: 2, confidence: 2 }, 1.4), o('They shrugged you off.', { happiness: -2 }, 1)]),
      ch('Complain to the landlord or council', [o('It got sorted, but things are frosty now.', { happiness: 1, social: -1 })]),
      ch('Buy earplugs', [o('Sleep, at last.', { money: -20, health: 1 })]),
    ], { weight: 1, cooldown: 5, max: 3, when: renting }),

  ev('rl_gym_contract', 'life', [18, 70], '🏋️', 'The Gym Contract',
    'You\'ve been paying for a gym membership you rarely use.', [
      ch('Cancel it', [o('Saved money, though the penalty stung.', { money: -50, discipline: 1 })]),
      ch('Commit to going', [o('Three months later, you could feel the difference.', { health: 5, discipline: 3, happiness: 2 }, 1.2), o('You went twice, then stopped again.', { discipline: -1, money: -300 }, 1)]),
    ], { weight: 1, cooldown: 6, max: 2 }),
];

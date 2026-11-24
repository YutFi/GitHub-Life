import { all, any, ch, ev, o, P, story, not } from '../../kit';
import { pick } from '../../rng';
import type { EventTemplate } from '../../types';

// ------------------------------------------------------------------------------ money
export const MONEY: EventTemplate[] = [
  ev('m_inherit', 'money', [25, 80], '📜', 'Unexpected Inheritance', 'A distant relative you barely knew has left you something in their will.', [
    ch('Invest it wisely', [o('You put it into a diversified fund.', { money: 12000, discipline: 3, skill: { business: 2 } })]),
    ch('Spend it on something you love', [o('A memorable splurge.', { money: 5000, happiness: 7 })]),
    ch('Share it with family', [o('Everyone was grateful.', { money: 6000, rel: ['family', 8, 6], happiness: 5 })]),
  ], { weight: 0.5, max: 2 }),
  ev('m_unexpected_expense', 'money', [18, 80], '🧾', 'Unexpected Bill', 'A big, unplanned expense lands on your doormat — {$1500}.', [
    ch('Pay it right away', [o('Painful, but done.', { money: -1500 })]),
    ch('Negotiate a payment plan', [o('They agreed to instalments.', { money: -1200, discipline: 1 }, 2), o('They refused and added a fee.', { money: -1700, happiness: -2 }, 1)]),
  ], { weight: 1.6, max: 6, cooldown: 4 }),
  ev('m_invest_tip', 'money', [20, 70], '📈', 'Hot Stock Tip', 'A colleague insists a certain stock is about to skyrocket.', [
    ch('Buy {$3000} worth', [o('It soared! Your gamble paid off.', { money: 5500, confidence: 3 }, 1), o('It tanked.', { happiness: -3 }, 1.8)], { cost: 3000, when: P.cash(3000) }),
    ch('Ignore the tip', [o('You stuck to your own plan.', { discipline: 1 })]),
  ], { when: any(P.employed, P.investor), weight: 0.9 }),
  ev('m_scam', 'money', [18, 85], '🕵️', 'Too Good to Be True', 'A message promises huge returns if you act fast.', [
    ch('Send {$800} to try it', [o('It was a scam. Your money is gone.', { happiness: -5, confidence: -2 }, 3), o('It somehow paid out, though risky.', { money: 1200 }, 0.1)], { cost: 800, when: P.cash(800) }),
    ch('Report it and delete', [o('You spotted the red flags.', { intelligence: 1, discipline: 2 })]),
  ], { weight: 0.9, max: 3 }),
  ev('m_tax_audit', 'money', [24, 75], '🏛️', 'Tax Audit', 'The tax authority has selected you for an audit.', [
    ch('Cooperate with an accountant', [o('All in order — cleared.', { money: -600, happiness: -1 }, 2), o('They found an error; you owe a penalty.', { money: -2500, happiness: -3 }, 1)]),
    ch('Handle it yourself', [o('Stressful, but fine.', { happiness: -3, discipline: 1 }, 1), o('You messed up the paperwork.', { money: -3500, happiness: -4 }, 1.2)]),
  ], { when: P.employed, weight: 0.4, max: 2 }),
  ev('m_family_money', 'family', [20, 70], '🙏', 'Family in Need', 'A close relative asks to borrow {$3000}.', [
    ch('Lend it', [o('They repaid you in time.', { money: 3000, rel: ['family', 6, 5] }, 1), o('You never saw that money again.', { rel: ['family', 2] }, 1.4)], { cost: 3000, when: P.cash(3000) }),
    ch('Say no', [o('They were hurt and distant for a while.', { rel: ['family', -8, -4], happiness: -2 })]),
    ch('Give a smaller gift instead', [o('A reasonable compromise.', { money: -800, rel: ['family', 3] })]),
  ], { when: P.sibling, weight: 0.8 }),
  ev('m_lottery_win', 'money', [18, 90], '🎟️', 'Scratch Card Win', 'A scratch card you bought on a whim is a winner!', [
    ch('Cash it in', [o('A pleasant windfall.', { money: 700, happiness: 5 }, 3), o('A modest win — enough for a nice dinner.', { money: 150, happiness: 3 }, 4)]),
  ], { weight: 0.5, max: 3 }),
  ev('m_housing_boom', 'money', [24, 75], '🏘️', 'House Prices Soaring', 'Property prices are climbing rapidly in your area.', [
    ch('Buy now, before it\'s too late', [o('You jumped on the ladder. Check Properties to buy.', { flag: { housingFomo: true } })]),
    ch('Wait for a dip', [o('You kept your powder dry.', {})]),
  ], { when: all(P.econ('boom'), (c) => c.g.world.housingGrowth > 0.04), weight: 1.1, max: 2 }),
  ev('m_crypto', 'money', [19, 60], '🪙', 'Crypto Mania', 'Everyone is buzzing about a surging cryptocurrency.', [
    ch('Put in {$2000}', [o('You rode the wave — big gains!', { money: 6500, confidence: 4 }, 0.9), o('The bubble burst.', { money: 200, happiness: -3 }, 1.5)], { cost: 2000, when: P.cash(2000) }),
    ch('Watch from the sidelines', [o('You avoided the madness.', {})]),
  ], { yearMin: 2012, weight: 0.8, max: 2 }),
  ev('m_stolen', 'money', [16, 80], '🕶️', 'Pickpocketed', 'Your wallet is gone — stolen in a crowd.', [
    ch('Cancel cards and file a report', [o('Annoying but handled.', { money: -250 })]),
    ch('Chase the thief', [o('You got it back!', { confidence: 3, money: 0 }, 1), o('They escaped and you twisted your knee.', { health: -3, money: -300 }, 2)]),
  ], { weight: 0.7, max: 2 }),
  ev('m_car_breakdown', 'money', [18, 80], '🚗', 'Breakdown', 'Your car breaks down on the way home.', [
    ch('Pay for the repair', [o('Back on the road.', { money: -1100 })]),
    ch('Scrap it and rely on transit', [o('Cheaper long-term; less convenient.', { money: -100, happiness: -2, run: (c) => { c.p.fin.vehicles = c.p.fin.vehicles.slice(1); } })]),
  ], { when: P.car, weight: 1.2, max: 5 }),
  ev('m_home_repair', 'money', [24, 85], '🔨', 'Leaky Roof', 'A storm exposes a serious problem with your home.', [
    ch('Pay a professional', [o('Fixed properly.', { money: -4500, happiness: -1 })]),
    ch('DIY it', [o('Your handiness paid off.', { money: -700, skill: { trades: 3 }, discipline: 1 }, 1), o('Your DIY made the damage worse.', { money: -5500, happiness: -3 }, 1.4)]),
  ], { when: P.owner, weight: 1, max: 4 }),
  ev('m_bank_bonus', 'money', [18, 70], '🏦', 'Bank Cashback Offer', 'Your bank is offering a bonus if you move your savings.', [
    ch('Switch accounts', [o('A small but welcome bonus.', { money: 250, discipline: 1 })]),
    ch('Not worth the hassle', [o('You kept things simple.', {})]),
  ]),
  ev('m_student_debt', 'money', [22, 40], '🎓', 'Student Debt Weighs', 'Student loan statements keep arriving.', [
    ch('Pay extra each month', [o('You chipped away at it.', { money: -1500, discipline: 2, happiness: -1 })]),
    ch('Stick to the minimum', [o('Slow and steady.', { happiness: 1 })]),
  ], { when: (c) => c.p.fin.loans.some((l) => l.kind === 'student'), weight: 1.2 }),
  ev('m_wedding_gift', 'money', [22, 60], '💐', 'Friend\'s Wedding', '{friend} is getting married and invites you.', [
    ch('Go and give a generous gift', [o('A beautiful day.', { happiness: 5, money: -250, rel: ['friend', 6] })]),
    ch('Send a card and skip it', [o('You saved money but lost some closeness.', { rel: ['friend', -4], money: -30 })]),
  ], { when: P.friend, weight: 0.9, max: 4 }),
  ev('m_charity_ask', 'moral', [20, 85], '🎗️', 'Charity Appeal', 'A charity you admire is raising funds.', [
    ch('Donate {$400}', [o('It felt good to give.', { money: -400, happiness: 5, social: 1 })], { cost: 400, when: P.cash(400) }),
    ch('Volunteer your time instead', [o('A rewarding weekend.', { happiness: 4, social: 2 })]),
    ch('Not this time', [o('Maybe next year.', {})]),
  ], { weight: 0.8, max: 4 }),
  ev('m_gambling', 'moral', [21, 80], '🎰', 'Night at the Casino', 'Friends invite you to a casino night.', [
    ch('Gamble {$500}', [o('Lady Luck smiled on you!', { money: 1100, happiness: 4 }, 1), o('You lost it all.', { happiness: -3, flag: { gambler: true } }, 2.2)], { cost: 500, when: P.cash(500) }),
    ch('Just watch', [o('Fun atmosphere, no losses.', { happiness: 2, social: 1 })]),
    ch('Decline', [o('You stayed in.', {})]),
  ], { weight: 0.6, max: 3 }),
  ev('m_retire_plan', 'money', [30, 62], '🧓', 'Retirement Planning', 'A financial adviser reviews your retirement plan.', [
    ch('Increase your contributions', [o('Future-you says thank you.', { discipline: 2, money: -400, run: (c) => { c.p.fin.contrib = Math.min(15, c.p.fin.contrib + 3); return 'Retirement contributions +3%'; } })]),
    ch('Keep as is', [o('You kept your plan.', {})]),
  ], { when: P.employed, max: 3 }),
  ev('m_recession_hit', 'money', [20, 80], '📉', 'Markets Tumble', 'Stock markets fall sharply amid economic gloom.', [
    ch('Hold steady', [o('Painful on paper, but you stayed calm.', { happiness: -2, discipline: 2 })]),
    ch('Buy the dip', [o('Bold — it paid off over time.', { money: 4200, confidence: 3 }, 1), o('Prices kept falling.', { money: 200, happiness: -3 }, 1.2)], { cost: 2000, when: all(P.investor, P.cash(2000)) }),
    ch('Sell in a panic', [o('You locked in your losses.', { money: -1500, happiness: -2 })], { when: P.investor }),
  ], { when: P.econ('recession'), weight: 1.4, max: 3 }),
];

// ------------------------------------------------------------------------------ relationships
export const RELATIONSHIPS: EventTemplate[] = [
  ev('r_meet', 'romance', [18, 65], '✨', 'Someone Interesting', 'You strike up a conversation with someone who really catches your eye.', [
    ch('Ask for their number', [o('You started dating!', { happiness: 8, confidence: 3, add: { rel: 'partner' } }, 1.5), o('They politely declined.', { confidence: -3, happiness: -2 }, 1.2)]),
    ch('Say goodbye and walk on', [o('A missed chance, maybe.', { happiness: -1 })]),
  ], { when: P.single, weight: 1.6, max: 5 }),
  ev('r_anniversary', 'romance', [18, 80], '🥂', 'Anniversary', 'Your anniversary with {partner} is coming up.', [
    ch('Plan something special', [o('{partner} was deeply touched.', { rel: ['partner', 10, 5], happiness: 5, money: -300 })]),
    ch('Keep it low-key', [o('A cosy night in.', { rel: ['partner', 4] })]),
    ch('Forget about it', [o('Oops. That stung.', { rel: ['partner', -10, -8], happiness: -3 })]),
  ], { when: P.attached, weight: 1.3 }),
  ev('r_fight', 'romance', [18, 80], '⚡', 'Heated Argument', 'You and {partner} have a serious argument about money.', [
    ch('Listen and compromise', [o('You worked it out calmly.', { rel: ['partner', 5, 6], discipline: 1 })]),
    ch('Stand your ground', [o('The tension lingered for weeks.', { rel: ['partner', -8, -6], happiness: -3 })]),
    ch('Storm out', [o('Both of you needed time to cool off.', { rel: ['partner', -12, -8], happiness: -4 })]),
  ], { when: P.attached, weight: 1.2 }),
  ev('r_proposal_hint', 'romance', [21, 55], '💍', 'Thinking Long-Term', '{partner} hints they see a future together.', [
    ch('Talk about marriage', [o('You both want the same things. Open Relationships to propose when ready.', { rel: ['partner', 6, 5], happiness: 4 })]),
    ch('Change the subject', [o('A little distance appeared.', { rel: ['partner', -5, -4] })]),
  ], { when: P.partner, max: 2 }),
  ev('r_cheating', 'romance', [20, 65], '🫣', 'Temptation', 'Someone flirts heavily with you while you are in a relationship.', [
    ch('Shut it down', [o('You stayed loyal.', { discipline: 2, rel: ['partner', 3, 4] })]),
    ch('Flirt back', [o('Your partner found out. Trust shattered.', { rel: ['partner', -25, -35], happiness: -8, flag: { cheated: true } }, 2), o('Nothing happened, but you felt guilty.', { happiness: -3, discipline: -2 }, 1)]),
  ], { when: P.attached, weight: 0.5, max: 2 }),
  ev('r_parent_visit', 'family', [22, 70], '🏡', 'Family Reunion', 'Your family is organising a get-together.', [
    ch('Attend', [o('Lovely food, loud laughs.', { rel: ['family', 6], happiness: 5 })]),
    ch('Skip it', [o('Work excuses only go so far.', { rel: ['family', -5] })]),
  ], { when: P.parent, weight: 0.9, max: 4 }),
  ev('r_friend_crisis', 'social', [18, 80], '🆘', 'A Friend in Trouble', '{friend} calls you late at night — they are in a crisis.', [
    ch('Drop everything and go', [o('Your friend will never forget it.', { rel: ['friend', 14, 12], happiness: 1, health: -1 })]),
    ch('Talk on the phone', [o('You offered comfort from a distance.', { rel: ['friend', 5, 4] })]),
    ch('Let it ring', [o('Your friend felt abandoned.', { rel: ['friend', -15, -15] })]),
  ], { when: P.friend }),
  ev('r_new_neighbors', 'social', [20, 80], '🏘️', 'New Neighbours', 'A friendly couple moves in next door.', [
    ch('Invite them over', [o('You became good friends.', { social: 3, add: { rel: 'friend' }, happiness: 3 })]),
    ch('Wave from afar', [o('Friendly nodding only.', {})]),
  ], { max: 3 }),
  ev('r_sibling_rivalry', 'family', [16, 60], '🥊', 'Sibling Rivalry', 'You and {sibling} clash over a family decision.', [
    ch('Make peace', [o('You cleared the air.', { rel: ['sibling', 6, 6] })]),
    ch('Hold a grudge', [o('You did not speak for months.', { rel: ['sibling', -12, -8], happiness: -3 })]),
  ], { when: P.sibling, max: 3 }),
  ev('r_kids_school', 'family', [24, 50], '🧸', 'Parent-Teacher Meeting', 'Your child\'s teacher wants to discuss their progress.', [
    ch('Attend and engage', [o('Your child felt supported.', { rel: ['child', 5, 4], happiness: 2, run: (c) => { c.p.people.filter((x) => x.relation === 'child').forEach((k) => { k.nurture = Math.min(100, (k.nurture ?? 20) + 3); }); } })]),
    ch('Skip it, work is busy', [o('Your child noticed you were not there.', { rel: ['child', -5, -3] })]),
  ], { when: P.minorKids, weight: 1.5 }),
  ev('r_kids_sick', 'family', [24, 55], '🤒', 'Sick Child', 'Your child comes down with a high fever.', [
    ch('Stay by their side', [o('They recovered under your care.', { rel: ['child', 8, 6], happiness: 2 })]),
    ch('Call a doctor right away', [o('The doctor said it was nothing serious.', { money: -150, rel: ['child', 3] })]),
  ], { when: P.minorKids, weight: 1.2 }),
  ev('r_kids_trouble', 'family', [30, 60], '🚨', 'Teen Trouble', 'Your teenager got into trouble at school.', [
    ch('Talk it through with compassion', [o('They opened up to you.', { rel: ['child', 8, 8], happiness: 1 })]),
    ch('Ground them firmly', [o('They sulked but understood.', { rel: ['child', -4, 2] })]),
    ch('Ignore it', [o('Things got worse.', { rel: ['child', -8, -8] })]),
  ], { when: (c) => c.p.people.some((x) => x.relation === 'child' && x.alive && c.g.year - x.birthYear >= 13 && c.g.year - x.birthYear <= 17), max: 3 }),
  ev('r_empty_nest', 'family', [45, 70], '🪺', 'Empty Nest', 'Your youngest child has moved out.', [
    ch('Embrace the freedom', [o('You and your partner rediscovered adventures.', { happiness: 4, rel: ['partner', 6] })]),
    ch('Miss them terribly', [o('The house felt too quiet.', { happiness: -4, rel: ['child', 5] })]),
  ], { when: (c) => c.p.people.some((x) => x.relation === 'child' && x.alive && c.g.year - x.birthYear >= 18), max: 1 }),
  ev('r_old_friend', 'social', [25, 80], '📞', 'Old Friend Reappears', 'A friend from your past reaches out after years of silence.', [
    ch('Reconnect', [o('You picked up as if no time had passed.', { happiness: 5, social: 2, add: { rel: 'friend' } })]),
    ch('Let the past stay in the past', [o('You wished them well from afar.', {})]),
  ], { max: 3 }),
  ev('r_ex_returns', 'romance', [22, 60], '🌀', 'Message from an Ex', 'An ex-partner texts out of the blue.', [
    ch('Reply warmly', [o('A friendly catch-up and closure.', { happiness: 2 }, 1.5), o('Old feelings stirred — messy.', { happiness: -3, rel: ['partner', -6] }, 1)]),
    ch('Ignore it', [o('You left the past where it belongs.', { discipline: 1 })]),
  ], { when: (c) => c.p.people.some((x) => x.relation === 'exPartner' || x.relation === 'exSpouse'), max: 3 }),
  ev('r_dating_streak', 'romance', [20, 55], '🍷', 'Dating App Dilemma', 'You are juggling a few dates.', [
    ch('Focus on one person', [o('A deeper connection grew.', { happiness: 4, add: { rel: 'partner' } }, 1), o('It fizzled after a few dates.', { happiness: -1 }, 1)]),
    ch('Keep your options open', [o('Fun, but tiring.', { happiness: 1, social: 1 })]),
  ], { when: P.single, max: 3 }),
];

// ------------------------------------------------------------------------------ health
export const HEALTH: EventTemplate[] = [
  ev('h_flu', 'health', [3, 90], '🤧', 'Nasty Flu', 'A bad flu knocks you flat for a week.', [
    ch('Rest and see a doctor', [o('You were back on your feet soon.', { health: -2, money: -120 })]),
    ch('Tough it out at work', [o('You got everyone sick and recovered slowly.', { health: -5, rel: ['coworker', -3] })], { when: P.employed }),
    ch('Rest at home', [o('A week in bed did the trick.', { health: -2, happiness: -1 })]),
  ], { weight: 1.3, max: 8, cooldown: 3 }),
  ev('h_injury', 'health', [8, 80], '🩼', 'Sports Injury', 'You tweak something badly while exercising.', [
    ch('See a physiotherapist', [o('Full recovery.', { health: -2, money: -500 })]),
    ch('Ignore the pain', [o('It became a lingering problem.', { health: -6, cond: 'Back pain' }, 1.4), o('It healed on its own.', { health: -2 }, 1.4)]),
  ], { weight: 1, max: 5 }),
  ev('h_checkup', 'health', [30, 85], '🩺', 'Annual Check-up', 'Your doctor recommends a full health check-up.', [
    ch('Book it', [o('Caught a problem early — treatable.', { health: 3, money: -300, cure: 'Chronic stress' }, 1), o('A clean bill of health.', { health: 2, money: -300, happiness: 2 }, 2)], { cost: 0 }),
    ch('Skip it', [o('You hoped for the best.', {}, 2), o('A problem you ignored got worse.', { health: -5 }, 0.6)]),
  ], { weight: 1.2, max: 8 }),
  ev('h_mental', 'health', [14, 85], '🌧️', 'Heavy Months', 'For weeks you have felt low, tired and unmotivated.', [
    ch('Talk to a professional', [o('Therapy helped you understand yourself better.', { happiness: 8, confidence: 3, money: -900, cure: 'Anxiety' })], { cost: 0 }),
    ch('Lean on friends and family', [o('Opening up helped more than you expected.', { happiness: 5, rel: ['family', 5, 5], social: 1 })]),
    ch('Bottle it up', [o('It dragged on and affected everything.', { happiness: -9, health: -2, cond: 'Anxiety' })]),
  ], { weight: 0.9, max: 4 }),
  ev('h_diabetes', 'health', [35, 85], '🩸', 'Blood Sugar Warning', 'Tests show you are at risk of type 2 diabetes.', [
    ch('Overhaul your lifestyle', [o('Diet and exercise turned things around.', { health: 5, discipline: 4, happiness: -1 })]),
    ch('Take medication only', [o('Managed, but a condition you now carry.', { health: -2, cond: 'Diabetes', money: -400 })]),
    ch('Ignore it', [o('Your health slipped further.', { health: -6, cond: 'Diabetes' })]),
  ], { when: any(P.flag('smoker'), P.statBelow('discipline', 40), (c) => c.p.age > 50), weight: 0.8, max: 1 }),
  ev('h_hypertension', 'health', [40, 90], '❤️', 'High Blood Pressure', 'Your doctor warns about your blood pressure.', [
    ch('Take your meds and exercise', [o('You brought it under control.', { health: 3, discipline: 2, cond: 'Hypertension', money: -250 })]),
    ch('Brush it off', [o('Risks quietly rose.', { health: -5, cond: 'Hypertension' })]),
  ], { weight: 0.7, max: 1 }),
  ev('h_accident', 'health', [16, 75], '🚑', 'Road Accident', 'A car collides with yours at an intersection.', [
    ch('Seek immediate treatment', [o('Bruised but alright.', { health: -5, money: -800 }, 3), o('A serious fracture needed surgery.', { health: -14, money: -4500, happiness: -5 }, 1)]),
  ], { when: P.car, weight: 0.5, max: 2 }),
  ev('h_dental', 'health', [10, 90], '🦷', 'Toothache', 'A nagging toothache gets harder to ignore.', [
    ch('See a dentist', [o('A filling fixed it.', { money: -350, health: 1, appearance: 1 })]),
    ch('Wait and hope', [o('It became an infection and an emergency visit.', { money: -1200, health: -4 }, 2), o('It passed on its own.', {}, 1)]),
  ], { weight: 1, max: 4 }),
  ev('h_cancer_scare', 'health', [38, 85], '🔍', 'A Worrying Lump', 'You find something concerning and your doctor orders tests.', [
    ch('Get it checked immediately', [o('Benign — a huge relief.', { happiness: 4, health: 0, money: -700 }, 3), o('Caught early. Treatment is successful.', { health: -8, money: -5000, happiness: -5, flag: { survivor: true } }, 1)]),
    ch('Avoid thinking about it', [o('It turned out to be harmless — you were lucky.', { happiness: -2 }, 1), o('It had grown by the time you went in.', { health: -18, money: -12000, happiness: -10, flag: { survivor: true } }, 1.3)]),
  ], { weight: 0.6, max: 2 }),
  ev('h_gym', 'health', [16, 70], '🏋️', 'New Year, New You', 'You decide to get in shape.', [
    ch('Join a gym', [o('You stuck with it!', { health: 5, appearance: 3, discipline: 3, confidence: 3, money: -300, flag: { fitYear: 1 } }, 1.3), o('You went twice, then stopped.', { money: -300, discipline: -1 }, 1.2)]),
    ch('Jog around the neighbourhood', [o('Free and effective.', { health: 4, discipline: 2 })]),
    ch('Nah', [o('The couch won.', {})]),
  ], { weight: 1, max: 6, cooldown: 4 }),
  ev('h_sleep', 'health', [18, 80], '😴', 'Sleepless Nights', 'You have been sleeping terribly.', [
    ch('Fix your routine', [o('Better sleep, better days.', { health: 3, happiness: 3, discipline: 2 })]),
    ch('Rely on caffeine', [o('You wired through it.', { health: -3, happiness: -2 })]),
  ], { weight: 0.9, max: 4 }),
  ev('h_food_poison', 'health', [5, 80], '🤢', 'Bad Oysters', 'Something you ate disagrees with you violently.', [
    ch('Ride it out', [o('Miserable two days.', { health: -3 })]),
    ch('Go to the clinic', [o('A drip and some medicine did the trick.', { health: -1, money: -150 })]),
  ], { weight: 0.6, max: 3 }),
  ev('h_vaccine', 'health', [18, 90], '💉', 'Health Campaign', 'A public health campaign urges everyone to get vaccinated.', [
    ch('Get the shot', [o('Protected.', { health: 2 })]),
    ch('Skip it', [o('A rough bout of illness followed.', { health: -4 }, 1), o('You stayed fine.', {}, 3)]),
  ], { when: any(P.econ('recession'), P.year(2020, 2023)), weight: 0.6, max: 2 }),
];

// ------------------------------------------------------------------------------ senior & late life
export const SENIOR: EventTemplate[] = [
  story('s_grandchild', 'family', [50, 90], '👶', 'Grandchild\'s Visit', 'Your grandchildren spend the weekend at your place.', 'Chaos, cookies and a memory to treasure.', { happiness: 6, rel: ['child', 4] }, { when: P.flag('grandparent'), weight: 1.5, max: 6 }),
  ev('s_retire_party', 'milestone', [55, 75], '🎉', 'Retirement Celebration', 'Your colleagues organise a farewell party.', [
    ch('Enjoy it', [o('Heartfelt speeches and a cake.', { happiness: 7, rel: ['coworker', 5] })]),
  ], { when: P.retired, max: 1 }),
  ev('s_hobby', 'hobby', [55, 95], '🪴', 'A Retirement Hobby', 'With time on your hands, a new hobby calls.', [
    ch('Gardening', [o('Fresh vegetables and fresh air.', { happiness: 4, health: 2 })]),
    ch('Painting', [o('You discovered a latent talent.', { happiness: 5, skill: { creative: 5 } })]),
    ch('Volunteering', [o('You made a difference and new friends.', { happiness: 5, social: 3, add: { rel: 'friend' } })]),
    ch('Long walks', [o('Your health improved gently.', { health: 3, happiness: 2 })]),
  ], { when: P.retired, max: 2 }),
  ev('s_widow', 'family', [60, 100], '🕯️', 'Facing Loneliness', 'You miss the company of loved ones.', [
    ch('Join a community group', [o('You found connection again.', { happiness: 5, social: 3, add: { rel: 'friend' } })]),
    ch('Call your children more', [o('They appreciated hearing from you.', { rel: ['child', 6], happiness: 3 })], { when: P.kids }),
    ch('Stay in', [o('Days blurred together.', { happiness: -5 })]),
  ], { when: (c) => !P.attached(c) && c.p.age >= 62, weight: 1.2, max: 3 }),
  ev('s_memoir', 'hobby', [60, 100], '📖', 'Write Your Story', 'You feel a pull to record your life story.', [
    ch('Write a memoir', [o('Your family treasures the pages.', { happiness: 6, intelligence: 1, rel: ['family', 4] })]),
    ch('Record stories for the grandkids', [o('A priceless legacy.', { happiness: 5, rel: ['child', 4] })], { when: P.flag('grandparent') }),
    ch('Not interested', [o('The past is the past.', {})]),
  ], { when: P.retired, max: 1 }),
  ev('s_fall', 'health', [68, 105], '🧓', 'A Nasty Fall', 'You slip at home and cannot get up.', [
    ch('Call for help', [o('A hospital stay and a long recovery.', { health: -9, money: -2500, happiness: -3 }, 2), o('A bruise and a fright — no break.', { health: -3 }, 2)]),
  ], { weight: 1.2, max: 3 }),
  ev('s_care_home', 'health', [78, 105], '🏥', 'Time for Care?', 'Daily life is getting harder at home.', [
    ch('Move to a care home', [o('Professional care brings peace of mind.', { health: 3, happiness: -2, money: -9000 })]),
    ch('Hire a carer at home', [o('You keep your independence.', { health: 2, money: -6000, happiness: 1 })]),
    ch('Move in with your children', [o('Family looks after you.', { health: 2, rel: ['child', 6], happiness: 2 })], { when: P.kids }),
  ], { weight: 1, max: 1 }),
  ev('s_scammer_call', 'money', [60, 100], '☎️', 'Suspicious Caller', 'A caller claims to be from your bank and asks for your details.', [
    ch('Hang up and call the bank', [o('Good instinct — it was a scam.', { discipline: 1 })]),
    ch('Give your details', [o('Your account was drained.', { money: -3500, happiness: -7, confidence: -3 })]),
  ], { weight: 1.1, max: 2 }),
  ev('s_memory', 'health', [70, 105], '🧠', 'Forgetful Moments', 'You are losing track of names and dates.', [
    ch('See a specialist', [o('Early support slowed the decline.', { health: -2, money: -600, happiness: -3 })]),
    ch('Keep your mind active', [o('Puzzles and walks helped.', { intelligence: 1, happiness: 2 })]),
    ch('Hide it', [o('It got worse before you told anyone.', { health: -5, happiness: -5 })]),
  ], { weight: 0.8, max: 1 }),
  story('s_birthday_big', 'milestone', [70, 110], '🎂', 'A Milestone Birthday', 'Family gathers to celebrate your milestone birthday.', 'Loved ones from near and far came to wish you well.', { happiness: 6, rel: ['family', 4] }, { when: (c) => c.p.age % 10 === 0, force: true, max: 6, ages: [70, 110] }),
  ev('s_legacy', 'family', [65, 105], '📜', 'Settle Your Affairs', 'You are thinking about what you will leave behind.', [
    ch('Update your will (Finance → Estate)', [o('Peace of mind. Review your will in the Finance tab.', { happiness: 3, discipline: 1 })]),
    ch('Donate a large sum now', [o('Seeing the impact brought joy.', { happiness: 7, social: 1 })], { cost: 2500, when: P.cash(5000) }),
    ch('Leave it to fate', [o('You put it off.', {})]),
  ], { max: 1 }),
  ev('s_pension_visit', 'money', [62, 90], '💶', 'Pension Review', 'Your pension adviser suggests changes.', [
    ch('Follow the advice', [o('A slightly better income stream.', { money: 600, discipline: 1 })]),
    ch('Keep it as is', [o('You stayed the course.', {})]),
  ], { when: P.retired, max: 2 }),
];

// ------------------------------------------------------------------------------ world/misc
export const MISC: EventTemplate[] = [
  ev('x_disaster', 'world', [5, 90], '🌪️', 'Storm Damage', 'A severe storm hits your area.', [
    ch('Evacuate early', [o('You stayed safe; the house was damaged.', { happiness: -3, money: -800 })]),
    ch('Ride it out', [o('Terrifying, but you were fine.', { happiness: -4, health: -1 }, 2), o('Injured by flying debris.', { health: -9, money: -1500 }, 1)]),
  ], { weight: 0.6, max: 3 }),
  ev('x_election', 'world', [18, 90], '🗳️', 'Election Season', 'The country is heading into an election.', [
    ch('Vote', [o('You did your civic duty.', { happiness: 1, social: 1 })]),
    ch('Volunteer for a campaign', [o('Long days but an eye-opening experience.', { skill: { communication: 3, leadership: 2 }, social: 3, health: -1 })]),
    ch('Stay out of politics', [o('Not for you.', {})]),
  ], { weight: 0.7, max: 6 }),
  ev('x_found_wallet', 'moral', [10, 90], '👛', 'Lost Wallet', 'You find a wallet full of cash on the pavement.', [
    ch('Return it', [o('The owner was incredibly grateful.', { happiness: 4, discipline: 2, money: 60 })]),
    ch('Keep the cash', [o('Easy money — but a guilty conscience.', { money: 400, happiness: -2, discipline: -2 })]),
  ], { weight: 0.5, max: 2 }),
  ev('x_jury', 'moral', [21, 75], '⚖️', 'Jury Duty', 'You receive a summons for jury duty.', [
    ch('Serve', [o('An eye-opening civic experience.', { intelligence: 1, social: 1, money: 100 })]),
    ch('Try to get out of it', [o('Excused.', {}, 1.5), o('A fine for dodging.', { money: -300 }, 1)]),
  ], { weight: 0.5, max: 3 }),
  ev('x_festival', 'social', [14, 80], '🎪', 'Local Festival', 'A big festival is coming to {city}.', [
    ch('Go with friends', [o('A fantastic day out.', { happiness: 5, social: 2, money: -80, rel: ['friend', 4] })], { when: P.friend }),
    ch('Go alone', [o('You met interesting people.', { happiness: 3, social: 2, money: -50 })]),
    ch('Stay home', [o('A quiet day.', {})]),
  ], { weight: 0.9, max: 6 }),
  ev('x_pet_adopt', 'family', [20, 85], '🐕', 'A Four-Legged Friend', 'You come across a rescue animal in need of a home.', [
    ch('Adopt', [o('A loyal companion changed your days.', { happiness: 8, health: 2, money: -300, flag: { hadPet: true } })]),
    ch('Make a donation instead', [o('You helped the shelter.', { happiness: 2, money: -100 })]),
    ch('Walk on by', [o('Not the right time.', {})]),
  ], { when: not(P.flag('hadPet')), max: 1 }),
  ev('x_learn_language', 'hobby', [14, 70], '🗣️', 'A New Language', 'You feel inspired to learn another language.', [
    ch('Commit to daily practice', [o('You became conversational!', { intelligence: 3, skill: { communication: 5 }, discipline: 2 }, 2), o('You drifted away after a month.', { discipline: -1 }, 1)]),
    ch('Not now', [o('Some other time.', {})]),
  ], { max: 3 }),
  ev('x_move_city', 'career', [22, 60], '🌆', 'Fresh Start in a New City', 'You are tempted to relocate to another city.', [
    ch('Move', [o('A new chapter began.', { happiness: 4, confidence: 3, social: -2, money: -1500, run: (c) => { const o2 = c.country.cities.filter((x) => x !== c.p.city); if (o2.length) c.p.city = pick(o2); return `You moved to ${c.p.city}.`; } })]),
    ch('Stay', [o('Home is home.', {})]),
  ], { max: 3, weight: 0.8 }),
  ev('x_burglary', 'crime', [18, 85], '🚪', 'Break-In', 'You come home to find your place burgled.', [
    ch('Report it and claim insurance', [o('Some items were recovered.', { money: -400, happiness: -4 })]),
    ch('Install an alarm system', [o('You feel safer now.', { money: -900, happiness: -2, discipline: 1 })]),
  ], { weight: 0.5, max: 2 }),
  ev('x_speeding', 'crime', [17, 80], '🚓', 'Pulled Over', 'Blue lights flash behind your car.', [
    ch('Accept the fine', [o('A lesson learned.', { money: -250 })]),
    ch('Contest in court', [o('The fine was dropped.', {}, 1), o('You lost and paid more.', { money: -450 }, 2)]),
  ], { when: P.car, weight: 0.9, max: 4 }),
  ev('x_book', 'hobby', [14, 90], '📚', 'A Book That Changes You', 'A book you pick up completely shifts how you see the world.', [
    ch('Read more widely', [o('Your mind expanded.', { intelligence: 3, happiness: 2 })]),
    ch('Recommend it to everyone', [o('You started great conversations.', { social: 2, happiness: 1 })]),
  ], { weight: 0.8, max: 5 }),
  ev('x_housing_dream', 'money', [25, 55], '🏡', 'Home Hunting', 'You spot your dream house for sale.', [
    ch('Make an offer (see Properties)', [o('Time to see if the numbers work.', { flag: { dreamHouse: true }, happiness: 2 })]),
    ch('Keep renting', [o('Flexibility has its perks.', {})]),
  ], { when: (c) => c.p.fin.properties.length === 0 && c.p.age >= 25, max: 2 }),
];

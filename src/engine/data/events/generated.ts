import { ch, ev, o, P, not, any, all } from '../../kit';
import type { Effects, EventTemplate, SkillKey, StatKey } from '../../types';

type Ages = [number, number];

/** two-button event helper */
const duo = (
  id: string, cat: string, ages: Ages, icon: string, title: string, text: string,
  a: [string, string, Effects], b: [string, string, Effects], extra: Partial<EventTemplate> = {},
) => ev(id, cat, ages, icon, title, text, [ch(a[0], [o(a[1], a[2])]), ch(b[0], [o(b[1], b[2])])], extra);

/** a gamble: one choice with good/bad outcomes (stake is charged up front via `cost`) and one safe option */
const risk = (
  id: string, cat: string, ages: Ages, icon: string, title: string, text: string,
  label: string, good: [string, Effects, number], bad: [string, Effects, number],
  safe: [string, string, Effects], extra: Partial<EventTemplate> = {}, cost = 0,
) => ev(id, cat, ages, icon, title, text, [
  ch(label, [o(good[0], good[1], good[2]), o(bad[0], bad[1], bad[2])], cost ? { cost, when: P.cash(cost) } : {}),
  ch(safe[0], [o(safe[1], safe[2])]),
], extra);

// ------------------------------------------------------------------------------ hobbies (24)
interface Hobby { slug: string; name: string; what: string; icon: string; skill: SkillKey; stat: StatKey; ages: Ages; cost: number }
const HOBBIES: Hobby[] = [
  { slug: 'guitar', name: 'Guitar', what: 'playing guitar', icon: '🎸', skill: 'creative', stat: 'confidence', ages: [9, 80], cost: 250 },
  { slug: 'piano', name: 'Piano', what: 'the piano', icon: '🎹', skill: 'creative', stat: 'discipline', ages: [6, 85], cost: 400 },
  { slug: 'painting', name: 'Painting', what: 'painting', icon: '🎨', skill: 'creative', stat: 'happiness', ages: [8, 90], cost: 120 },
  { slug: 'photography', name: 'Photography', what: 'photography', icon: '📷', skill: 'creative', stat: 'appearance', ages: [12, 85], cost: 500 },
  { slug: 'coding', name: 'Coding', what: 'writing code for fun', icon: '💻', skill: 'tech', stat: 'intelligence', ages: [10, 75], cost: 0 },
  { slug: 'chess', name: 'Chess', what: 'chess', icon: '♟️', skill: 'business', stat: 'intelligence', ages: [7, 95], cost: 30 },
  { slug: 'cooking', name: 'Cooking', what: 'cooking from scratch', icon: '🍳', skill: 'trades', stat: 'health', ages: [12, 90], cost: 150 },
  { slug: 'baking', name: 'Baking', what: 'baking', icon: '🥐', skill: 'trades', stat: 'happiness', ages: [10, 90], cost: 100 },
  { slug: 'woodwork', name: 'Woodworking', what: 'woodworking', icon: '🪚', skill: 'trades', stat: 'discipline', ages: [16, 90], cost: 600 },
  { slug: 'writing', name: 'Creative Writing', what: 'writing stories', icon: '✍️', skill: 'communication', stat: 'intelligence', ages: [10, 95], cost: 0 },
  { slug: 'yoga', name: 'Yoga', what: 'yoga', icon: '🧘', skill: 'athletic', stat: 'health', ages: [14, 95], cost: 200 },
  { slug: 'running', name: 'Running', what: 'running', icon: '🏃', skill: 'athletic', stat: 'health', ages: [10, 80], cost: 120 },
  { slug: 'hiking', name: 'Hiking', what: 'hiking', icon: '🥾', skill: 'athletic', stat: 'happiness', ages: [10, 85], cost: 150 },
  { slug: 'gardening', name: 'Gardening', what: 'gardening', icon: '🌱', skill: 'trades', stat: 'happiness', ages: [14, 100], cost: 100 },
  { slug: 'dance', name: 'Dance', what: 'dancing', icon: '💃', skill: 'athletic', stat: 'confidence', ages: [8, 75], cost: 250 },
  { slug: 'singing', name: 'Singing', what: 'singing', icon: '🎤', skill: 'creative', stat: 'confidence', ages: [8, 90], cost: 150 },
  { slug: 'gaming', name: 'Competitive Gaming', what: 'competitive gaming', icon: '🎮', skill: 'tech', stat: 'social', ages: [10, 60], cost: 300 },
  { slug: 'drone', name: 'Drone Flying', what: 'flying drones', icon: '🛸', skill: 'tech', stat: 'confidence', ages: [14, 75], cost: 700 },
  { slug: 'fishing', name: 'Fishing', what: 'fishing', icon: '🎣', skill: 'trades', stat: 'happiness', ages: [8, 100], cost: 150 },
  { slug: 'knitting', name: 'Knitting', what: 'knitting', icon: '🧶', skill: 'creative', stat: 'discipline', ages: [12, 100], cost: 60 },
  { slug: 'debate', name: 'Public Speaking', what: 'public speaking', icon: '🎙️', skill: 'communication', stat: 'confidence', ages: [13, 80], cost: 40 },
  { slug: 'invest_club', name: 'Investment Club', what: 'investing with a club', icon: '📊', skill: 'business', stat: 'discipline', ages: [18, 85], cost: 100 },
  { slug: 'firstaid', name: 'First Aid', what: 'first-aid volunteering', icon: '🩹', skill: 'medical', stat: 'social', ages: [14, 85], cost: 80 },
  { slug: 'leadership', name: 'Community Leadership', what: 'running community projects', icon: '🧭', skill: 'leadership', stat: 'social', ages: [16, 85], cost: 0 },
];

export const HOBBY_EVENTS: EventTemplate[] = HOBBIES.map((h) =>
  ev(`hb_${h.slug}`, 'hobby', h.ages, h.icon, `Taking Up ${h.name}`, `You've been curious about ${h.what} for a while. Time to give it a proper go?`, [
    ch('Commit seriously', [
      o(`You stuck with ${h.what} and got genuinely good.`, { skill: { [h.skill]: 5 }, [h.stat]: 3, happiness: 4, flag: { [`hobby_${h.slug}`]: true } }, 1.6),
      o('The enthusiasm faded after a few weeks.', { happiness: -1, discipline: -1 }, 1),
    ], h.cost ? { cost: h.cost, when: P.cash(h.cost) } : {}),
    ch('Dabble casually', [o(`A fun, low-pressure pastime — ${h.what} grew on you.`, { happiness: 3, skill: { [h.skill]: 1 } })]),
    ch('Not for me', [o('You kept your free time free.', {})]),
  ], { max: 1, weight: 0.65, when: not(P.flag(`hobby_${h.slug}`)) }));

export const HOBBY_FOLLOWUPS: EventTemplate[] = [
  ev('hb_showcase', 'hobby', [14, 90], '🏆', 'Show Off Your Skills', 'Friends encourage you to show what you have been working on.', [
    ch('Perform or exhibit', [o('A standing ovation! It meant the world.', { confidence: 5, happiness: 6, social: 3 }, 1.3), o('Stage fright got the better of you.', { confidence: -2, happiness: -2 }, 1)]),
    ch('Keep it private', [o('You enjoy it on your own terms.', { happiness: 2 })]),
  ], { when: (c) => Object.keys(c.p.flags).some((k) => k.startsWith('hobby_')), weight: 0.8, max: 3 }),
  ev('hb_sell', 'hobby', [18, 85], '🛍️', 'Turn It Into a Side Hustle', 'People keep telling you that you could sell what you make.', [
    ch('Try it out', [o('A small but real side income.', { money: 1800, confidence: 3, skill: { business: 2 } }, 1.2), o('It took more time than it earned.', { money: 150, happiness: -2 }, 1)]),
    ch('Keep it a hobby', [o('Some things are better unmonetised.', { happiness: 2 })]),
  ], { when: (c) => Object.keys(c.p.flags).some((k) => k.startsWith('hobby_')), weight: 0.6, max: 2 }),
  ev('hb_club', 'hobby', [14, 85], '🤝', 'Join a Club', 'There is a local club for your favourite pastime.', [
    ch('Join', [o('You met people who share your passion.', { social: 4, happiness: 4, add: { rel: 'friend' } })]),
    ch('Skip it', [o('You prefer to practise alone.', {})]),
  ], { when: (c) => Object.keys(c.p.flags).some((k) => k.startsWith('hobby_')), weight: 0.7, max: 2 }),
];

// ------------------------------------------------------------------------------ sports (10)
interface Sport { slug: string; name: string; icon: string; ages: Ages }
const SPORTS: Sport[] = [
  { slug: 'football', name: 'Football', icon: '⚽', ages: [8, 45] },
  { slug: 'basketball', name: 'Basketball', icon: '🏀', ages: [10, 45] },
  { slug: 'swimming', name: 'Swimming', icon: '🏊', ages: [6, 80] },
  { slug: 'badminton', name: 'Badminton', icon: '🏸', ages: [8, 70] },
  { slug: 'tennis', name: 'Tennis', icon: '🎾', ages: [8, 75] },
  { slug: 'martial', name: 'Martial Arts', icon: '🥋', ages: [7, 65] },
  { slug: 'cycling', name: 'Cycling', icon: '🚴', ages: [10, 80] },
  { slug: 'cricket', name: 'Cricket', icon: '🏏', ages: [8, 55] },
  { slug: 'volleyball', name: 'Volleyball', icon: '🏐', ages: [10, 50] },
  { slug: 'climbing', name: 'Rock Climbing', icon: '🧗', ages: [12, 60] },
];
export const SPORT_EVENTS: EventTemplate[] = SPORTS.map((s) =>
  ev(`sp_${s.slug}`, 'sport', s.ages, s.icon, `${s.name} Trials`, `A local ${s.name.toLowerCase()} team is holding open trials.`, [
    ch('Give it everything', [
      o('You made the team and loved the camaraderie!', { health: 4, skill: { athletic: 5 }, social: 3, happiness: 5, flag: { athlete: true } }, 1.3),
      o('You missed out narrowly, but improved a lot.', { skill: { athletic: 2 }, health: 2, confidence: -1 }, 1.2),
      o('You pulled a muscle during the trials.', { health: -4, happiness: -2 }, 0.5),
    ]),
    ch('Just play for fun', [o('Relaxed games with friends.', { health: 2, happiness: 3, social: 1 })]),
    ch('Watch from the stands', [o('Cheering is fun too.', { happiness: 1 })]),
  ], { max: 1, weight: 0.6 }));

// ------------------------------------------------------------------------------ small mishaps (20)
type Mishap = [id: string, icon: string, title: string, text: string, fixLabel: string, fixText: string, fixCost: number, ages: Ages, extra?: Partial<EventTemplate>];
const MISHAPS: Mishap[] = [
  ['mi_phone_crack', '📱', 'Cracked Screen', 'Your phone slips and the screen shatters.', 'Get it repaired', 'Good as new.', 180, [12, 85]],
  ['mi_keys', '🔑', 'Lost Keys', 'You cannot find your keys anywhere.', 'Call a locksmith', 'Back inside, a little poorer.', 120, [14, 90]],
  ['mi_laptop', '💻', 'Laptop Meltdown', 'Your laptop dies right before something important.', 'Buy a replacement', 'A fresh start (and a lesson on backups).', 700, [14, 80], { when: any(P.student, P.employed) }],
  ['mi_flat_tyre', '🛞', 'Flat Tyre', 'You wake to find a flat tyre.', 'Pay for roadside help', 'Quickly sorted.', 90, [18, 85], { when: P.car }],
  ['mi_pipe', '🚰', 'Burst Pipe', 'A pipe bursts and water floods the floor.', 'Call a plumber', 'Fixed, though the floor needed drying.', 650, [20, 90]],
  ['mi_parking', '🅿️', 'Parking Ticket', 'You return to find a ticket on the windscreen.', 'Pay the fine', 'Lesson learned.', 80, [18, 85], { when: P.car }],
  ['mi_flight', '✈️', 'Missed Flight', 'Traffic made you miss your flight.', 'Rebook the next one', 'You arrived late but in one piece.', 300, [18, 85]],
  ['mi_luggage', '🧳', 'Lost Luggage', 'The airline loses your bag.', 'Buy essentials until it arrives', 'It showed up two days later.', 200, [18, 85]],
  ['mi_bike', '🚲', 'Stolen Bike', 'You find the lock cut and your bike gone.', 'Buy a new one', 'Better lock this time.', 250, [10, 70]],
  ['mi_lockout', '🚪', 'Locked Out', 'The door clicks shut with your keys inside.', 'Hire a locksmith', 'An embarrassing and costly mistake.', 140, [16, 90]],
  ['mi_wifi', '📶', 'Internet Outage', 'The internet goes down for three days.', 'Use mobile data', 'You survived the digital desert.', 40, [10, 90]],
  ['mi_glasses', '👓', 'Broken Glasses', 'You sit on your glasses.', 'Get new lenses', 'Crystal clear again.', 220, [8, 90]],
  ['mi_haircut', '💇', 'Bad Haircut', 'The new stylist went rogue with the scissors.', 'Pay a pro to fix it', 'Rescued — mostly.', 90, [12, 70], { when: P.stat('appearance', 1) }],
  ['mi_sunburn', '☀️', 'Terrible Sunburn', 'You forgot sunscreen on the beach day.', 'Buy aloe and rest', 'Peeling, but you recover.', 25, [8, 85]],
  ['mi_appliance', '🧺', 'Washing Machine Dies', 'Your washing machine floods the bathroom and dies.', 'Buy a new one', 'Laundry day is back.', 450, [20, 90]],
  ['mi_fridge', '🧊', 'Fridge on the Fritz', 'Your fridge stops cooling overnight.', 'Replace it', 'The groceries were not saved.', 520, [20, 90]],
  ['mi_noise', '🔊', 'Noisy Neighbours', 'A neighbour blasts music every night.', 'Politely complain', 'It got quieter. Mostly.', 0, [18, 90]],
  ['mi_hack', '🔓', 'Account Hacked', 'Someone breaks into one of your online accounts.', 'Secure everything and monitor', 'A headache, but contained.', 100, [14, 90]],
  ['mi_cold_office', '🥶', 'Broken Heater', 'Your heating dies in the middle of winter.', 'Call a technician', 'Warm again.', 300, [18, 90]],
  ['mi_ruined_event', '🌧️', 'Rained-Out Plans', 'Your long-planned outdoor event is washed out.', 'Rebook indoors', 'Not the same, but still fun.', 150, [14, 80]],
];
export const MISHAP_EVENTS: EventTemplate[] = MISHAPS.map(([id, icon, title, text, fixLabel, fixText, fixCost, ages, extra]) =>
  ev(id, 'mishap', ages, icon, title, text, [
    ch(fixLabel, [o(fixText, { happiness: -1 })], fixCost ? { cost: fixCost } : {}),
    ch('Make do for now', [o('You muddled through, with some stress.', { happiness: -3, discipline: 1 }), o('It turned out worse than expected.', { happiness: -4, money: -Math.round(fixCost * 1.5) }, 0.6)]),
  ], { weight: 0.7, max: 3, cooldown: 5, ...extra }));

// ------------------------------------------------------------------------------ small joys (16)
type Joy = [id: string, icon: string, title: string, text: string, result: string, fx: Effects, ages: Ages, extra?: Partial<EventTemplate>];
const JOYS: Joy[] = [
  ['jy_cafe', '☕', 'A Perfect Cafe', 'You stumble on a charming little cafe that becomes your favourite spot.', 'You go back every week.', { happiness: 3, social: 1 }, [14, 95]],
  ['jy_compliment', '💬', 'Genuine Compliment', 'A stranger tells you they admire something about you.', 'It made your whole week.', { happiness: 3, confidence: 2 }, [10, 95]],
  ['jy_gift', '🎁', 'Surprise Gift', 'Someone leaves a thoughtful gift at your door.', 'You felt truly seen.', { happiness: 4 }, [6, 95]],
  ['jy_sunny', '🌞', 'Perfect Weekend', 'A sunny weekend with nothing to do.', 'You recharged completely.', { happiness: 4, health: 2 }, [8, 95]],
  ['jy_concert', '🎵', 'Concert Night', 'You catch a fantastic live show.', 'You are still humming the tunes.', { happiness: 5, social: 1, money: -90 }, [14, 80]],
  ['jy_upgrade', '🛫', 'Free Upgrade', 'You are bumped up to a better seat on a trip.', 'Living the high life for a few hours.', { happiness: 3 }, [18, 90]],
  ['jy_photo', '🖼️', 'Old Photo Album', 'You find a box of old photographs.', 'Memories flooded back.', { happiness: 4, rel: ['family', 3] }, [20, 100]],
  ['jy_meal', '🍜', 'The Perfect Meal', 'Someone cooks you the best meal of your life.', 'You savoured every bite.', { happiness: 4, health: 1 }, [8, 100]],
  ['jy_stars', '🌌', 'Stargazing', 'A clear night shows the Milky Way.', 'Everything felt small, and calm.', { happiness: 3, intelligence: 1 }, [8, 100]],
  ['jy_rain', '🌧️', 'Walk in the Rain', 'You walk in a warm rain with no umbrella.', 'A strangely joyful memory.', { happiness: 3, health: 1 }, [8, 95]],
  ['jy_stray', '🐈', 'Friendly Stray', 'A stray cat adopts your doorstep.', 'You started leaving out food.', { happiness: 3 }, [8, 95]],
  ['jy_market', '🧺', 'Weekend Market', 'You find a lively market full of local treats.', 'You came home with bags and a smile.', { happiness: 3, money: -40, social: 1 }, [14, 95]],
  ['jy_message', '💌', 'Kind Message', 'An old teacher writes to thank you for being a good student.', 'It touched you deeply.', { happiness: 4, confidence: 2 }, [20, 90]],
  ['jy_sunrise', '🌅', 'Early Sunrise', 'You wake early and catch a glorious sunrise.', 'You decide to do it more often.', { happiness: 3, discipline: 1 }, [10, 95]],
  ['jy_nap', '😴', 'Guilt-Free Nap', 'A rare quiet afternoon.', 'You slept like a stone.', { happiness: 2, health: 2 }, [10, 95]],
  ['jy_stranger', '🤝', 'Helpful Stranger', 'A stranger helps you out when you are in a bind.', 'You pay it forward the next day.', { happiness: 3, social: 1 }, [10, 95]],
];
export const JOY_EVENTS: EventTemplate[] = JOYS.map(([id, icon, title, text, result, fx, ages, extra]) =>
  ev(id, 'joy', ages, icon, title, text, [ch('Savour it', [o(result, fx)])], { weight: 0.6, max: 3, cooldown: 6, ...extra }));

// ------------------------------------------------------------------------------ everyday dilemmas (24)
export const DILEMMAS: EventTemplate[] = [
  duo('dl_cheat_exam', 'moral', [12, 30], '📝', 'Tempting Shortcut', 'You see a chance to copy answers during an exam.',
    ['Resist', 'You did it honestly.', { discipline: 2, intelligence: 1 }],
    ['Copy the answers', 'You got away with it… this time.', { grades: 6, discipline: -3, confidence: 1, flag: { cheater: true } }], { when: P.student, weight: 0.8, max: 3 }),
  risk('dl_overpay', 'moral', [16, 90], '🧾', 'Cashier Error', 'The cashier gives you far too much change.', 'Keep it', ['Nobody noticed.', { money: 60, discipline: -1 }, 1.5], ['You felt guilty all day.', { happiness: -2, discipline: -1 }, 1],
    ['Point it out', 'The cashier thanked you warmly.', { happiness: 2, discipline: 1 }], { weight: 0.6, max: 2 }),
  duo('dl_whistle', 'moral', [20, 65], '📣', 'Witness to Misconduct', 'You notice a colleague falsifying records.',
    ['Report it', 'It was uncomfortable, but you did the right thing.', { discipline: 3, rel: ['coworker', -6], happiness: -2 }],
    ['Look the other way', 'You stayed out of it, uneasily.', { discipline: -2, happiness: -2 }], { when: P.employed, weight: 0.7, max: 2 }),
  duo('dl_white_lie', 'moral', [14, 90], '🤥', 'Awkward Question', '{friend} asks what you really think of their new haircut/outfit.',
    ['Be honest', 'They appreciated the honesty… eventually.', { rel: ['friend', -2, 4], discipline: 1 }],
    ['White lie', 'Peace was preserved.', { rel: ['friend', 3, -1] }], { when: P.friend, weight: 0.8, max: 4 }),
  risk('dl_hitch', 'moral', [16, 70], '🚗', 'Stranded Stranger', 'A stranger waves for help on a quiet road.', 'Stop and help', ['You helped them get going. They were grateful.', { happiness: 4, social: 1 }, 3], ['It made you late and shaken.', { happiness: -2, health: -1 }, 0.5],
    ['Drive on', 'Better safe than sorry.', {}], { when: P.car, weight: 0.5, max: 2 }),
  duo('dl_litter', 'moral', [8, 90], '🗑️', 'Litter Louts', 'You spot someone dumping rubbish in a park.',
    ['Say something', 'They grumbled but picked it up.', { confidence: 2, discipline: 1 }],
    ['Pick it up yourself', 'A small act of care.', { happiness: 2, health: 1 }], { weight: 0.5, max: 2 }),
  risk('dl_found_phone', 'moral', [10, 90], '📱', 'Found Phone', 'You find an expensive phone left on a bench.', 'Hand it in', ['The owner offered a reward.', { money: 120, happiness: 3, discipline: 2 }, 1], ['Nobody ever claimed it, but you felt good.', { discipline: 2 }, 1],
    ['Keep it', 'A shiny upgrade, though not quite clean.', { money: 150, discipline: -3 }], { weight: 0.4, max: 2 }),
  duo('dl_plagiarism', 'moral', [15, 30], '📄', 'Copy-Paste Temptation', 'A deadline looms and a convincing essay sits online.',
    ['Write it yourself, late', 'Tired but proud.', { intelligence: 2, discipline: 2, health: -2 }],
    ['Copy bits and tweak', 'It worked, but the risk was real.', { grades: 3, discipline: -2, flag: { plagiarised: true } }], { when: P.student, weight: 0.6, max: 2 }),
  duo('dl_confide', 'moral', [14, 80], '🤫', 'Told in Confidence', '{friend} shares a big secret and asks you to keep it.',
    ['Keep it to yourself', 'Your friend trusts you more than ever.', { rel: ['friend', 5, 8] }],
    ['Tell someone else', 'It got back to them. Trust shattered.', { rel: ['friend', -10, -20], social: -2 }], { when: P.friend, weight: 0.6, max: 3 }),
  duo('dl_charity_scam', 'moral', [18, 90], '🥺', 'Street Appeal', 'Someone on the street asks for money for a sad story.',
    ['Give {$20}', 'You hope it helped.', { money: -20, happiness: 1 }],
    ['Walk past', 'You kept moving.', {}], { weight: 0.5, max: 4 }),
  risk('dl_shoplift', 'crime', [10, 30], '🏬', 'Shoplifting Dare', 'Friends dare you to swipe something from a shop.', 'Take it', ['Nobody noticed. You felt a rush.', { confidence: 2, discipline: -3, crime: 1 }, 1], ['You were caught!', { happiness: -6, crime: 3, rel: ['parents', -6] }, 2],
    ['Refuse', 'Your friends teased you, but you held firm.', { discipline: 2, confidence: 1 }], { when: P.friend, weight: 0.6, max: 2 }),
  duo('dl_rumour', 'moral', [12, 60], '🗣️', 'Spreading Rumours', 'Everyone is gossiping about someone you barely know.',
    ['Join in', 'It was fun for a minute, then felt bad.', { social: 1, discipline: -1, happiness: -1 }],
    ['Change the subject', 'You earned quiet respect.', { discipline: 1, confidence: 1 }], { weight: 0.6, max: 3 }),
  duo('dl_credit', 'career', [20, 62], '🏅', 'Taking Credit', 'Your team\'s idea is praised — and the boss assumes it was only yours.',
    ['Share credit', 'Your teammates noticed, and trusted you more.', { rel: ['coworker', 6, 6], skill: { leadership: 2 } }],
    ['Accept the praise', 'A short-term boost, with an uneasy conscience.', { job: 'bonus', discipline: -2, rel: ['coworker', -6, -8] }], { when: all(P.employed, P.boss), weight: 0.6, max: 2 }),
  risk('dl_ticket', 'moral', [16, 80], '🚇', 'No Ticket', 'You could sneak onto the train without a ticket.', 'Sneak through', ['Free ride, no checks.', { money: 5 }, 2], ['An inspector fined you.', { money: -90, happiness: -3 }, 1], ['Buy a ticket', 'Boring but clean.', {}], { weight: 0.4, max: 2 }),
  duo('dl_overtime_ask', 'career', [20, 62], '⏰', 'Weekend Request', 'Your manager asks you to work this weekend.',
    ['Agree', 'You earned goodwill and tired eyes.', { job: 'bonus', health: -2, rel: ['boss', 4] }],
    ['Decline politely', 'Boundaries respected… mostly.', { happiness: 2, rel: ['boss', -3] }], { when: P.employed, weight: 0.9, max: 6 }),
  duo('dl_friend_dating', 'romance', [16, 45], '💘', 'Same Crush', '{friend} reveals a crush on the person you also like.',
    ['Step aside', 'Your friendship deepened.', { rel: ['friend', 6, 8], happiness: -2 }],
    ['Go for it anyway', 'Things got complicated.', { rel: ['friend', -14, -18], happiness: 2 }], { when: all(P.friend, P.single), weight: 0.5, max: 2 }),
  duo('dl_diet_trend', 'health', [16, 70], '🥗', 'Fad Diet', 'Everyone online is raving about an extreme new diet.',
    ['Try it', 'Short-term results, long-term fatigue.', { appearance: 2, health: -3, discipline: 1 }],
    ['Eat sensibly', 'Boring, but effective over time.', { health: 2, discipline: 1 }], { weight: 0.7, max: 3 }),
  duo('dl_late_night', 'health', [16, 40], '🌙', 'All-Nighter', 'A friend invites you out the night before something important.',
    ['Go out', 'Epic night, rough morning.', { happiness: 4, health: -2, discipline: -2, rel: ['friend', 4] }],
    ['Rest up', 'You nailed the next day.', { health: 2, discipline: 2 }], { when: any(P.student, P.employed), weight: 0.8, max: 4 }),
  duo('dl_borrow_car', 'moral', [18, 70], '🔑', 'Borrow Your Car', '{friend} asks to borrow your car for a weekend.',
    ['Lend it', 'Returned with a full tank and a thank-you.', { rel: ['friend', 4, 5] }],
    ['Say no', 'They were a bit hurt.', { rel: ['friend', -4] }], { when: all(P.car, P.friend), weight: 0.6, max: 2 }),
  duo('dl_offer_help', 'moral', [14, 90], '🤲', 'Elderly Neighbour', 'An elderly neighbour struggles with their shopping.',
    ['Help carry the bags', 'You made a new friend.', { happiness: 3, social: 1 }],
    ['Hurry past', 'You were running late.', {}], { weight: 0.5, max: 3 }),
  duo('dl_donate_blood', 'health', [18, 65], '🩸', 'Blood Drive', 'A mobile blood donation clinic is nearby.',
    ['Donate', 'A small act that saves lives.', { happiness: 3, social: 1, health: -1 }],
    ['Skip', 'You were busy.', {}], { weight: 0.5, max: 4 }),
  duo('dl_group_project', 'school', [13, 28], '👥', 'Slacking Teammate', 'One group member does nothing for the project.',
    ['Cover for them', 'You got the grade but burned out a bit.', { grades: 2, health: -2, discipline: 1 }],
    ['Report them', 'Fair, if awkward.', { discipline: 2, social: -1 }], { when: P.student, weight: 0.8, max: 3 }),
  duo('dl_envy', 'social', [16, 60], '😒', 'Friend\'s Big News', '{friend} got the promotion/award you wanted.',
    ['Congratulate them sincerely', 'You rose above it, mostly.', { rel: ['friend', 4], discipline: 1 }],
    ['Stew in silence', 'You pulled away from them.', { rel: ['friend', -5], happiness: -3 }], { when: P.friend, weight: 0.6, max: 3 }),
  duo('dl_ethics_ad', 'career', [22, 62], '📢', 'Dubious Campaign', 'You are asked to push marketing that stretches the truth.',
    ['Refuse politely', 'You protected your integrity.', { discipline: 2, rel: ['boss', -3] }],
    ['Go along with it', 'Sales soared; your conscience grumbled.', { job: 'bonus', discipline: -2 }], { when: P.employed, weight: 0.5, max: 2 }),
];

// ------------------------------------------------------------------------------ technology & modern life (10)
export const MODERN: EventTemplate[] = [
  duo('tk_social_media', 'social', [11, 40], '📲', 'Social Media Spiral', 'You find yourself scrolling for hours every evening.',
    ['Set app limits', 'Your focus and mood improved.', { discipline: 3, happiness: 2, intelligence: 1 }],
    ['Keep scrolling', 'Hours disappeared into the feed.', { happiness: -3, discipline: -2, confidence: -1 }], { yearMin: 2008, weight: 1.1, max: 4 }),
  risk('tk_viral', 'social', [12, 45], '🔥', 'Going Viral', 'A post of yours is suddenly shared everywhere.', 'Lean into the attention', ['Fame, followers, and some brand deals!', { social: 5, confidence: 4, money: 800, happiness: 4 }, 1], ['The comments turned nasty.', { happiness: -6, confidence: -4 }, 1.4],
    ['Log off for a while', 'It blew over quickly.', {}], { yearMin: 2008, weight: 0.4, max: 2 }),
  duo('tk_ai_tool', 'career', [14, 70], '🤖', 'New AI Tools', 'Powerful AI tools are changing how people work.',
    ['Learn them deeply', 'You became noticeably more productive.', { skill: { tech: 4 }, intelligence: 2 }],
    ['Stick to old ways', 'Comfortable, but you noticed others pulling ahead.', { discipline: -1 }], { yearMin: 2022, weight: 1, max: 3 }),
  duo('tk_online_course', 'education', [16, 80], '🎓', 'Online Course', 'A well-reviewed online course catches your eye.',
    ['Enrol and finish it', 'New knowledge and a certificate.', { intelligence: 3, discipline: 2, money: -120, skill: { tech: 2, business: 1 } }],
    ['Bookmark it for later', 'It sits in your tabs. Forever.', {}], { yearMin: 2010, weight: 0.9, max: 4 }),
  risk('tk_phishing', 'money', [14, 90], '🎣', 'Phishing Email', 'An official-looking email asks you to confirm your login.', 'Click the link', ['It was legitimate, thankfully.', {}, 0.3], ['Your account was compromised.', { money: -600, happiness: -4 }, 2],
    ['Delete it', 'Smart move.', { discipline: 1 }], { weight: 0.7, max: 3 }),
  duo('tk_remote_work', 'career', [22, 62], '🏠', 'Remote Work Option', 'Your employer offers a work-from-home arrangement.',
    ['Work from home', 'More flexibility, less commuting, less office social life.', { happiness: 3, social: -2, money: 300 }],
    ['Stay in the office', 'You kept the office buzz and routine.', { social: 2, rel: ['coworker', 3] }], { when: P.employed, yearMin: 2018, weight: 0.8, max: 2 }),
  duo('tk_smartwatch', 'health', [14, 80], '⌚', 'Fitness Tracker', 'You are gifted a smartwatch that tracks everything.',
    ['Use it daily', 'Data nudged you into healthier habits.', { health: 3, discipline: 2 }],
    ['Leave it in a drawer', 'Another gadget gathering dust.', {}], { yearMin: 2014, weight: 0.6, max: 1 }),
  duo('tk_streaming', 'hobby', [10, 90], '📺', 'Binge Weekend', 'A new series everyone talks about is out.',
    ['Binge it all', 'You were up all night, but it was great.', { happiness: 3, health: -2 }],
    ['Watch one episode a night', 'You savoured it.', { happiness: 2, discipline: 1 }], { weight: 0.8, max: 5 }),
  duo('tk_side_project', 'career', [16, 60], '🧪', 'Side Project', 'You have an idea for an app or a small business.',
    ['Build it on weekends', 'You learned loads, and it earned a little.', { skill: { tech: 3, business: 2 }, money: 400, health: -1 }],
    ['Park the idea', 'Someone else built it a year later.', { happiness: -1 }], { weight: 0.7, max: 3 }),
  duo('tk_privacy', 'money', [18, 90], '🛡️', 'Data Breach Notice', 'A company you use announces a data breach.',
    ['Change passwords and freeze credit', 'Hassle, but safe.', { discipline: 2 }],
    ['Ignore it', 'You got lucky — or did you?', { money: -250 }], { yearMin: 2010, weight: 0.6, max: 3 }),
];

// ------------------------------------------------------------------------------ pets (6)
export const PETS: EventTemplate[] = [
  duo('pt_vet', 'family', [18, 95], '🐾', 'Pet\'s Vet Visit', 'Your pet seems unwell.',
    ['Go to the vet', 'Treated in time — your pet is fine.', { money: -300, happiness: 2 }],
    ['Wait and see', 'It turned out alright, but you worried.', { happiness: -3 }], { when: P.flag('hadPet'), weight: 1.2, max: 5 }),
  duo('pt_trick', 'family', [10, 95], '🦴', 'Training Time', 'You decide to train your pet.',
    ['Practise every day', 'Wow, what a clever companion!', { happiness: 4, discipline: 2 }],
    ['Let them be', 'They are happy just as they are.', { happiness: 2 }], { when: P.flag('hadPet'), weight: 0.8, max: 2 }),
  duo('pt_run_away', 'family', [10, 95], '🔍', 'Missing Pet', 'Your pet slipped out and is missing.',
    ['Search the neighbourhood', 'You found them hours later, safe.', { happiness: 4, social: 1, health: -1 }],
    ['Post flyers and wait', 'A neighbour brought them back.', { happiness: 2 }], { when: P.flag('hadPet'), weight: 0.6, max: 2 }),
  duo('pt_walk', 'health', [10, 95], '🐕', 'Daily Walks', 'Your pet needs a lot of exercise.',
    ['Walk them every day', 'You both got healthier.', { health: 3, happiness: 3, social: 1 }],
    ['Skip it sometimes', 'They chewed a shoe in protest.', { money: -40 }], { when: P.flag('hadPet'), weight: 0.8, max: 3 }),
  ev('pt_pass', 'family', [25, 100], '🌈', 'Saying Goodbye', 'Your beloved pet has grown old and frail.', [
    ch('Stay with them to the end', [o('A tearful, peaceful goodbye.', { happiness: -6, flag: { hadPet: false } })]),
    ch('Let the vet handle it', [o('It was done gently, but you felt the loss.', { happiness: -7, flag: { hadPet: false } })]),
  ], { when: P.flag('hadPet'), weight: 0.5, max: 2, cooldown: 15 }),
  duo('pt_new_friend', 'family', [14, 95], '🐾', 'Another Pet?', 'You see an adorable puppy/kitten at the shelter.',
    ['Adopt another', 'Your household got louder and happier.', { happiness: 5, money: -250, flag: { hadPet: true } }],
    ['Resist the cuteness', 'Your wallet thanks you.', {}], { when: P.flag('hadPet'), weight: 0.3, max: 2 }),
];

// ------------------------------------------------------------------------------ housing & neighbourhood (8)
export const HOUSING: EventTemplate[] = [
  duo('ho_landlord', 'money', [18, 70], '🏚️', 'Rent Hike', 'Your landlord announces a big rent increase.',
    ['Negotiate', 'You settled for a smaller increase.', { money: -300, confidence: 2 }],
    ['Move out', 'You found a new place, with some hassle.', { money: -900, happiness: -2 }], { when: not(P.owner), weight: 1, max: 4 }),
  duo('ho_roommate', 'social', [18, 35], '🛋️', 'Roommate Trouble', 'Your roommate never cleans or pays on time.',
    ['Have a firm talk', 'Things improved.', { confidence: 2, discipline: 1 }],
    ['Move out', 'Peace and quiet, at a cost.', { money: -600, happiness: 2 }], { when: not(P.owner), weight: 0.7, max: 2 }),
  duo('ho_reno', 'money', [28, 80], '🧱', 'Renovation Dreams', 'You want to refresh your home.',
    ['Invest in a full renovation', 'Your home value and comfort improved.', { money: -4000, happiness: 4, run: (c) => { for (const pr of c.p.fin.properties) pr.value *= 1.03; } }],
    ['Do a small refresh', 'A fresh coat of paint did wonders.', { money: -400, happiness: 2 }], { when: P.owner, weight: 0.8, max: 3 }),
  duo('ho_block_party', 'social', [20, 85], '🎈', 'Street Party', 'The neighbourhood is organising a block party.',
    ['Join in', 'You met half the street.', { happiness: 4, social: 3, add: { rel: 'friend' } }],
    ['Stay inside', 'Quiet night.', {}], { weight: 0.7, max: 3 }),
  duo('ho_burglar_alarm', 'crime', [25, 90], '🚨', 'Neighbourhood Crime Wave', 'Burglaries are spiking in your area.',
    ['Install security', 'You sleep easier.', { money: -500, happiness: 1 }],
    ['Trust your luck', 'Nothing happened.', {}, ], { weight: 0.5, max: 2 }),
  duo('ho_noisy_construct', 'social', [20, 90], '🚧', 'Construction Next Door', 'Months of drilling begin next door.',
    ['Wear earplugs and cope', 'You adapted.', { happiness: -2, discipline: 1 }],
    ['Escape on a getaway', 'Worth every penny.', { money: -450, happiness: 3 }], { weight: 0.6, max: 2 }),
  duo('ho_flood', 'world', [20, 90], '🌊', 'Flood Warning', 'Heavy rains threaten flooding in your area.',
    ['Prepare and move valuables', 'You kept the damage minimal.', { money: -200, discipline: 1 }],
    ['Ignore the warning', 'Water seeped in and ruined belongings.', { money: -2200, happiness: -5 }], { weight: 0.5, max: 2 }),
  duo('ho_downsize', 'money', [55, 95], '📦', 'Downsizing', 'Your home feels too big now.',
    ['Downsize', 'Smaller, simpler and cheaper to run.', { money: 1500, happiness: 2 }],
    ['Stay put', 'Too many memories to leave.', { happiness: 1 }], { when: P.owner, weight: 0.6, max: 1 }),
];

// ------------------------------------------------------------------------------ parenting (10)
export const PARENTING: EventTemplate[] = [
  duo('pa_newborn', 'family', [20, 48], '🍼', 'Sleepless Nights', 'Your newborn keeps you up all night.',
    ['Share night shifts', 'Exhausting, but you got through it together.', { health: -3, rel: ['partner', 4] }],
    ['Handle it alone', 'You are wiped out.', { health: -5, happiness: -3 }], { when: (c) => c.p.people.some((x) => x.relation === 'child' && x.alive && c.g.year - x.birthYear <= 1), weight: 3, max: 4 }),
  duo('pa_first_word', 'family', [20, 48], '🗨️', 'Baby\'s First Word', 'Your baby says their very first word.',
    ['Record it', 'A moment you will treasure.', { happiness: 6, rel: ['child', 5] }],
    ['Just enjoy it', 'Pure joy.', { happiness: 5, rel: ['child', 4] }], { when: (c) => c.p.people.some((x) => x.relation === 'child' && x.alive && c.g.year - x.birthYear === 1), weight: 2, max: 3 }),
  duo('pa_school_choice', 'family', [25, 50], '🏫', 'Choosing a School', 'You need to choose a school for your child.',
    ['Pay for a private school', 'A great education, at a price.', { money: -3500, rel: ['child', 3] }],
    ['Use the local public school', 'Close to home, and perfectly good.', { money: 0, rel: ['child', 1] }], { when: P.minorKids, weight: 1, max: 3 }),
  duo('pa_tantrum', 'family', [22, 50], '😤', 'Supermarket Tantrum', 'Your toddler melts down in the middle of the supermarket.',
    ['Stay calm', 'The storm passed.', { discipline: 2, rel: ['child', 2] }],
    ['Give in and buy sweets', 'Peace… for now.', { money: -10, discipline: -1 }], { when: P.minorKids, weight: 1, max: 4 }),
  duo('pa_sports_day', 'family', [24, 55], '🏅', 'Sports Day', 'Your child is competing at sports day.',
    ['Take time off to cheer', 'They beamed when they saw you.', { rel: ['child', 6], happiness: 4 }],
    ['Work through it', 'You missed their big moment.', { rel: ['child', -5], money: 100 }], { when: P.minorKids, weight: 1, max: 4 }),
  duo('pa_talk', 'family', [30, 55], '💬', 'The Big Talk', 'Your child is old enough for some important life conversations.',
    ['Be open and honest', 'They trusted you with their questions.', { rel: ['child', 6, 8] }],
    ['Dodge it awkwardly', 'They learned from friends instead.', { rel: ['child', -2] }], { when: P.minorKids, weight: 0.8, max: 2 }),
  duo('pa_pocket', 'family', [28, 55], '💰', 'Pocket Money', 'Your child wants pocket money.',
    ['Give regular allowance', 'They learned about saving.', { money: -150, rel: ['child', 3] }],
    ['Make them earn it', 'They grew resourceful.', { rel: ['child', 1], discipline: 1 }], { when: P.minorKids, weight: 0.9, max: 2 }),
  duo('pa_college_fund', 'money', [28, 55], '🎓', 'College Fund', 'You think about your child\'s future education.',
    ['Start a savings fund', 'A cushion for them later.', { money: -1200, discipline: 2 }],
    ['Deal with it later', 'There is always next year.', {}], { when: P.minorKids, weight: 0.9, max: 2 }),
  duo('pa_teen_curfew', 'family', [32, 55], '🌃', 'Curfew Clash', 'Your teenager wants to stay out later.',
    ['Negotiate a compromise', 'A rule you both accept.', { rel: ['child', 3, 4] }],
    ['Stay strict', 'They resented it quietly.', { rel: ['child', -4, -2] }], { when: (c) => c.p.people.some((x) => x.relation === 'child' && x.alive && c.g.year - x.birthYear >= 13 && c.g.year - x.birthYear < 18), weight: 1, max: 3 }),
  duo('pa_graduation', 'milestone', [38, 70], '🎓', 'Your Child Graduates', 'Your child is graduating!',
    ['Throw a party', 'A joyous celebration.', { happiness: 8, money: -500, rel: ['child', 8] }],
    ['A quiet dinner', 'Just as meaningful.', { happiness: 5, rel: ['child', 5] }], { when: (c) => c.p.people.some((x) => x.relation === 'child' && x.alive && c.g.year - x.birthYear === 22), weight: 3, max: 4 }),
];

// ------------------------------------------------------------------------------ legal & civic (6)
export const LEGAL: EventTemplate[] = [
  risk('lg_dispute', 'crime', [20, 80], '⚖️', 'Property Dispute', 'A neighbour disputes your boundary line.', 'Take it to court', ['You won the case.', { money: 800, confidence: 3 }, 1], ['You lost, and paid costs.', { money: -2500, happiness: -4 }, 1.3],
    ['Settle amicably', 'A fair compromise.', { money: -300, happiness: 1 }], { when: P.owner, weight: 0.5, max: 1 }, 1500),
  duo('lg_will', 'money', [35, 90], '📃', 'Write a Will', 'A lawyer reminds you about estate planning.',
    ['Make a will', 'Done — your wishes are clear.', { money: -400, discipline: 2, flag: { hasWill: true } }],
    ['Put it off', 'It can wait… right?', {}], { when: P.noFlag('hasWill'), weight: 0.6, max: 3 }),
  duo('lg_protest', 'world', [16, 70], '📢', 'Local Protest', 'A cause you care about is holding a rally.',
    ['Join the rally', 'You felt part of something bigger.', { social: 2, happiness: 3, confidence: 2 }],
    ['Support from home', 'You signed a petition.', { happiness: 1 }], { weight: 0.6, max: 3 }),
  duo('lg_contract', 'money', [20, 80], '🖊️', 'Fine Print', 'A long contract needs your signature.',
    ['Read every clause', 'You spotted and fixed a nasty clause.', { money: 200, intelligence: 1 }],
    ['Skim and sign', 'It hid a costly fee.', { money: -350 }], { weight: 0.7, max: 3 }),
  duo('lg_census', 'world', [18, 90], '🗳️', 'Public Survey', 'You are randomly picked for a national survey.',
    ['Participate', 'A small payment for your time.', { money: 40, intelligence: 1 }],
    ['Ignore it', 'Not your thing.', {}], { weight: 0.4, max: 2 }),
  duo('lg_traffic_camera', 'crime', [18, 85], '📸', 'Speed Camera', 'A speed camera flashes as you pass.',
    ['Pay the fine', 'You eased off the pedal after that.', { money: -200 }],
    ['Dispute it', 'The fine stuck, plus admin fees.', { money: -300, happiness: -1 }], { when: P.car, weight: 0.8, max: 4 }),
];

// ------------------------------------------------------------------------------ seasons, culture & world (12)
export const SEASONAL: EventTemplate[] = [
  duo('se_new_year', 'milestone', [10, 100], '🎆', 'New Year\'s Resolution', 'A new year begins. What will you commit to?',
    ['Get healthier', 'You stuck to it surprisingly well.', { health: 3, discipline: 2 }],
    ['Learn something new', 'Your mind felt sharper.', { intelligence: 2, discipline: 1 }], { weight: 0.8, cooldown: 3, max: 8 }),
  duo('se_heatwave', 'world', [5, 100], '🌡️', 'Heatwave', 'A scorching heatwave grips your region.',
    ['Stay indoors with the air-con', 'Cool and costly.', { money: -120, health: 0 }],
    ['Go out and swim', 'Refreshing!', { happiness: 3, health: 1 }], { weight: 0.5, max: 4 }),
  duo('se_winter', 'world', [5, 100], '❄️', 'Cold Snap', 'Temperatures plunge.',
    ['Bundle up and enjoy the snow/cold', 'Hot chocolate tasted better than ever.', { happiness: 3 }],
    ['Stay in', 'A cosy day.', { happiness: 1, health: 1 }], { weight: 0.5, max: 4 }),
  duo('se_holiday_trip', 'family', [10, 90], '🏖️', 'Summer Holiday', 'Time for a summer break.',
    ['Take a proper trip', 'Wonderful memories.', { happiness: 6, money: -900, health: 1 }],
    ['Staycation', 'Relaxing and budget-friendly.', { happiness: 3, money: -100 }], { weight: 1, cooldown: 2, max: 10 }),
  duo('se_festival_gift', 'family', [8, 100], '🎁', 'Festive Season', 'The holiday season is here.',
    ['Spend lavishly on loved ones', 'Warm hearts all round.', { money: -400, rel: ['family', 6], happiness: 4 }],
    ['Keep it simple and sincere', 'Heartfelt, not extravagant.', { rel: ['family', 3], happiness: 2 }], { weight: 1, cooldown: 2, max: 20 }),
  duo('se_economic_news', 'world', [20, 90], '📰', 'Cost of Living', 'Prices are rising across the board.',
    ['Tighten your budget', 'Careful spending kept you afloat.', { discipline: 2, happiness: -1 }],
    ['Carry on as usual', 'Your savings took a dent.', { money: -400 }], { when: (c) => c.g.world.inflation > 0.04, weight: 1, max: 4 }),
  duo('se_war_news', 'world', [10, 90], '🕊️', 'Distant Conflict', 'News of a faraway conflict dominates headlines.',
    ['Donate to relief efforts', 'It felt right to help.', { money: -100, happiness: 1, social: 1 }],
    ['Switch off the news', 'You protected your peace of mind.', {}], { weight: 0.4, max: 3 }),
  duo('se_pandemic', 'world', [0, 100], '😷', 'Health Scare Nationwide', 'A fast-spreading illness has everyone cautious.',
    ['Follow all precautions', 'You stayed safe, though isolated.', { health: 1, happiness: -3, social: -2 }],
    ['Live as usual', 'You caught it and felt awful.', { health: -6, happiness: -2 }], { when: P.year(2020, 2022), weight: 3, max: 2 }),
  duo('se_art_fair', 'hobby', [10, 90], '🖼️', 'Art Fair', 'A big art and craft fair comes to town.',
    ['Browse and buy something', 'A lovely keepsake.', { money: -120, happiness: 3 }],
    ['Just look', 'Inspiring.', { happiness: 2, skill: { creative: 1 } }], { weight: 0.6, max: 4 }),
  duo('se_marathon', 'sport', [16, 60], '🏃', 'Charity Run', 'A charity run is coming up.',
    ['Train and run', 'You crossed the finish line!', { health: 3, skill: { athletic: 3 }, happiness: 4, discipline: 2 }],
    ['Cheer from the sidelines', 'Everyone appreciates the support.', { happiness: 2 }], { weight: 0.6, max: 3 }),
  duo('se_volunteer', 'moral', [14, 90], '🧡', 'Volunteer Day', 'A local volunteering day needs helpers.',
    ['Volunteer', 'It was fulfilling.', { happiness: 4, social: 2, add: { rel: 'friend' } }],
    ['Not this time', 'Maybe next year.', {}], { weight: 0.6, max: 4 }),
  duo('se_reunion', 'social', [28, 80], '🎓', 'School Reunion', 'Your old class is organising a reunion.',
    ['Go', 'Great catching up, and some surprises.', { happiness: 4, social: 2, add: { rel: 'friend' } }],
    ['Skip', 'You prefer to leave the past in the past.', {}], { weight: 0.6, max: 2 }),
];

// ------------------------------------------------------------------------------ extra workplace flavour (10)
export const WORKPLACE: EventTemplate[] = [
  duo('wp_conflict', 'career', [20, 62], '😤', 'Colleague Clash', 'A colleague criticises your work in front of others.',
    ['Respond calmly', 'You earned respect.', { confidence: 2, rel: ['coworker', 2] }],
    ['Snap back', 'The tension lingered for weeks.', { rel: ['coworker', -8, -6], happiness: -2 }], { when: P.employed, weight: 1, max: 5 }),
  duo('wp_mentor', 'career', [20, 50], '🧭', 'Mentor Offer', 'A senior colleague offers to mentor you.',
    ['Accept eagerly', 'You learned a lot.', { skill: { leadership: 3, business: 2 }, rel: ['boss', 3] }],
    ['Politely decline', 'You preferred your own path.', {}], { when: P.employed, weight: 0.8, max: 2 }),
  duo('wp_team_event', 'career', [20, 62], '🍕', 'Team Outing', 'Your team organises an outing.',
    ['Join them', 'Fun and bonding.', { social: 2, rel: ['coworker', 5], happiness: 2 }],
    ['Skip it', 'You missed the inside jokes.', { rel: ['coworker', -2] }], { when: P.employed, weight: 1, max: 6 }),
  duo('wp_training', 'career', [20, 60], '📚', 'Training Course', 'Your employer offers a paid training course.',
    ['Attend', 'You picked up valuable skills.', { skill: { business: 2, tech: 1 }, intelligence: 1 }],
    ['Pass on it', 'You stuck with what you know.', {}], { when: P.employed, weight: 0.9, max: 4 }),
  duo('wp_burnout', 'health', [24, 60], '🥵', 'Burning Out', 'Long hours are wearing you down.',
    ['Take leave and rest', 'You recovered and came back stronger.', { health: 4, happiness: 4, money: -400 }],
    ['Push through', 'Your health took a hit.', { health: -6, happiness: -5, job: 'bonus' }], { when: P.employed, weight: 1, max: 3 }),
  duo('wp_office_romance', 'romance', [22, 55], '💞', 'Office Spark', 'You and a coworker keep exchanging glances.',
    ['Ask them out', 'You started seeing each other.', { happiness: 5, add: { rel: 'partner' } }],
    ['Keep it professional', 'You kept your boundaries.', { discipline: 1 }], { when: all(P.employed, P.single, P.coworker), weight: 0.6, max: 2 }),
  duo('wp_salary_talk', 'career', [22, 62], '💵', 'Pay Transparency', 'You find out a colleague earns more than you for the same role.',
    ['Ask for a raise', 'You made your case.', { job: 'raise', confidence: 2, rel: ['boss', -2] }],
    ['Let it go', 'You swallowed your pride.', { happiness: -2 }], { when: P.employed, weight: 0.7, max: 2 }),
  duo('wp_new_boss', 'career', [22, 62], '👔', 'New Manager', 'A new manager takes over your team.',
    ['Make a good impression', 'You built a strong rapport.', { rel: ['boss', 5], confidence: 1 }],
    ['Keep your head down', 'Nothing changed, for better or worse.', {}], { when: P.employed, weight: 0.8, max: 4 }),
  duo('wp_conference', 'career', [24, 62], '🎤', 'Industry Conference', 'You get a chance to attend an industry event.',
    ['Network hard', 'Valuable connections made.', { social: 2, skill: { business: 2 }, money: -250 }],
    ['Attend quietly', 'You learned a few things.', { intelligence: 1 }], { when: P.employed, weight: 0.8, max: 4 }),
  duo('wp_headhunter', 'career', [24, 58], '📞', 'Headhunter Calls', 'A recruiter offers an exciting alternative role.',
    ['Interview for it', 'You used the offer to negotiate a raise.', { job: 'raise', confidence: 3 }],
    ['Not interested', 'Loyalty has its rewards.', { rel: ['boss', 3] }], { when: P.employed, weight: 0.7, max: 3 }),
];

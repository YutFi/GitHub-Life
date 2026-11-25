import { all, ch, ev, o, P } from '../../kit';
import { hire } from '../../career';
import { careerById } from '../careers';
import { clamp } from '../../rng';
import type { EventCtx, EventTemplate } from '../../types';

const CREATORS = ['content_creator', 'streamer', 'youtuber', 'podcaster'];
const FREELANCE = ['fl_writer', 'fl_designer', 'fl_dev', 'fl_translator', 'ride_hail', 'rider', 'online_seller', 'fl_editor', 'fl_photo', 'pt_freelance', 'social_mgr', 'dj', 'model'];
const isCreatorNow = P.industry(...CREATORS);
const aud = (c: EventCtx) => c.p.career.audience ?? 0;
const grow = (c: EventCtx, pct: number, add = 0) => { c.p.career.audience = Math.max(0, Math.round(aud(c) * (1 + pct) + add)); };
const bigEnough = (n: number) => (c: EventCtx) => aud(c) >= n;

export const CREATOR_EVENTS: EventTemplate[] = [
  ev('cr_brand_deal', 'work', [15, 70], '🤑', 'A Brand Wants to Work With You',
    'A brand has noticed your audience and offers a paid partnership. The product is fine, but not really your style.', [
      ch('Accept the deal', [o('The post performed well and the cheque cleared.', { money: 1800, run: (c) => grow(c, 0.01) }, 2), o('Followers called it a sell-out and some unfollowed.', { money: 1800, happiness: -2, run: (c) => grow(c, -0.04) }, 1)]),
      ch('Negotiate a better rate', [o('They came back with a better offer.', { money: 3200, confidence: 2, skill: { business: 2 } }, 1.3), o('They walked away.', { happiness: -1, skill: { business: 1 } }, 1)]),
      ch('Decline, it is not you', [o('Your audience trusts you more for it.', { confidence: 2, run: (c) => grow(c, 0.03) })]),
    ], { weight: 1.4, cooldown: 2, max: 8, when: all(isCreatorNow, bigEnough(1500)) }),

  ev('cr_trend', 'work', [15, 70], '📈', 'A Trend Is Taking Off',
    'A challenge is exploding all over your feed. Everyone in your niche is jumping on it.', [
      ch('Jump on it right away', [o('Your version caught the algorithm\'s eye.', { happiness: 4, run: (c) => grow(c, 0.18, 400) }, 1.6), o('It came across as trying too hard.', { happiness: -2, run: (c) => grow(c, -0.02) }, 1)]),
      ch('Put your own spin on it', [o('Your take went further than the original.', { confidence: 3, skill: { creative: 2 }, run: (c) => grow(c, 0.25, 600) }, 1), o('It was too far from the trend and sank.', { run: (c) => grow(c, 0.01) }, 1.4)]),
      ch('Stick to your plan', [o('You stayed on message.', { discipline: 1 })]),
    ], { weight: 1.3, cooldown: 2, max: 8, when: isCreatorNow }),

  ev('cr_strike', 'work', [15, 70], '⚠️', 'Copyright Strike',
    'A claim has been filed against one of your posts for using copyrighted music.', [
      ch('Dispute it', [o('The claim was dropped.', { discipline: 1 }, 1.2), o('The dispute failed and you got a strike.', { happiness: -3, run: (c) => grow(c, -0.04) }, 1)]),
      ch('Take it down', [o('A quiet fix, though the post is gone.', { run: (c) => grow(c, -0.01) })]),
      ch('Buy a proper licence', [o('Your content is safe from now on.', { skill: { business: 1 } })], { cost: 400 }),
    ], { weight: 0.9, cooldown: 4, max: 3, when: all(isCreatorNow, bigEnough(500)) }),

  ev('cr_hate', 'work', [15, 70], '🗯️', 'Pile-on in the Comments',
    'A post went the wrong way and strangers are piling on in your comments, some of it deeply personal.', [
      ch('Ignore it and keep posting', [o('It blew over in a week.', { discipline: 2, confidence: 1 }, 1.4), o('It stung more than you let on.', { happiness: -5 }, 1)]),
      ch('Reply and defend yourself', [o('It made things worse.', { happiness: -5, run: (c) => grow(c, -0.05) }, 1.4), o('Your calm reply won people over.', { confidence: 3, run: (c) => grow(c, 0.05) }, 1)]),
      ch('Take a break from social media', [o('You logged off and felt lighter, though the algorithm noticed.', { happiness: 4, health: 1, run: (c) => grow(c, -0.06) })]),
    ], { weight: 1, cooldown: 3, max: 5, when: all(isCreatorNow, bigEnough(5000)) }),

  ev('cr_algorithm', 'work', [15, 70], '🤖', 'The Algorithm Changes',
    'The platform has changed how it ranks content, and your numbers have dropped overnight.', [
      ch('Study the changes and adapt', [o('You adjusted and your reach recovered.', { skill: { tech: 2, creative: 1 }, discipline: 1 }, 1.4), o('Adapting took months and cost you followers.', { run: (c) => grow(c, -0.06) }, 1)]),
      ch('Diversify to other platforms', [o('A second platform brought new fans.', { run: (c) => grow(c, 0.1, 300), skill: { business: 1 } })], { cost: 300 }),
      ch('Complain about it', [o('It felt good. It did not help.', { happiness: 1, run: (c) => grow(c, -0.03) })]),
    ], { weight: 1, cooldown: 4, max: 3, when: all(isCreatorNow, bigEnough(1000)) }),

  ev('cr_burnout', 'work', [15, 70], '🪫', 'Creator Burnout',
    'The constant need to post is wearing you down. Everything feels like content.', [
      ch('Take a proper break', [o('You came back refreshed, to fewer followers.', { happiness: 6, health: 3, run: (c) => grow(c, -0.1) })]),
      ch('Push through it', [o('You kept going, and it showed in your work and health.', { health: -5, happiness: -5, run: (c) => grow(c, 0.02) })]),
      ch('Hire an editor to share the load', [o('The extra hands made all the difference.', { happiness: 3, health: 2, run: (c) => grow(c, 0.04) })], { cost: 2500 }),
    ], { weight: 1, cooldown: 4, max: 3, when: all(isCreatorNow, P.stat('discipline', 0), (c) => c.p.career.effort === 'high' || aud(c) >= 20000) }),

  ev('cr_collab_offer', 'work', [15, 70], '🤝', 'A Bigger Creator Reaches Out',
    'A creator with a much bigger audience offers a collaboration.', [
      ch('Say yes and plan it properly', [o('Their audience loved it and you gained a lot of followers.', { happiness: 5, confidence: 3, run: (c) => grow(c, 0.25, 800) }, 1.6), o('They hogged the spotlight, but it still helped.', { run: (c) => grow(c, 0.08, 200) }, 1)]),
      ch('Say yes, but only on your terms', [o('They respected it and it went well.', { confidence: 3, run: (c) => grow(c, 0.18, 500) })]),
      ch('Say no', [o('You played it safe.', {})]),
    ], { weight: 1, cooldown: 3, max: 4, when: all(isCreatorNow, bigEnough(5000)) }),

  ev('cr_sketchy_sponsor', 'work', [15, 70], '🕵️', 'A Dodgy Sponsor',
    'A company offers a huge fee to promote its "miracle" supplement. You are fairly sure it does not work.', [
      ch('Promote it', [o('The money was great. The backlash came later.', { money: 4000, happiness: -3, run: (c) => { c.p.career.reputation = clamp(c.p.career.reputation - 12, 0, 100); grow(c, -0.08); } }, 1.6), o('You got the money and nobody noticed.', { money: 4000 }, 1)]),
      ch('Refuse', [o('You kept your integrity, and your fans noticed.', { confidence: 2, run: (c) => { c.p.career.reputation = clamp(c.p.career.reputation + 5, 0, 100); grow(c, 0.02); } })]),
    ], { weight: 0.8, cooldown: 5, max: 3, when: all(isCreatorNow, bigEnough(10000)) }),

  ev('cr_fan_meetup', 'work', [16, 70], '🎟️', 'Fan Meet-up',
    'A few hundred followers have organised a meet-up for you in the city.', [
      ch('Go and meet everyone', [o('It was surreal, and the fans were wonderful.', { happiness: 6, confidence: 3, run: (c) => grow(c, 0.06) })]),
      ch('Go for a short time with security', [o('Safe, and it still went well.', { happiness: 3, run: (c) => grow(c, 0.03) })], { cost: 300 }),
      ch('Skip it', [o('You stayed home.', { happiness: -1 })]),
    ], { weight: 0.9, cooldown: 5, max: 3, when: all(isCreatorNow, bigEnough(25000)) }),

  ev('cr_agent', 'work', [16, 70], '📇', 'A Talent Agency Calls',
    'An agency wants to represent you in exchange for a cut of your deals.', [
      ch('Sign with them', [o('Bigger deals started coming in.', { money: 2500, confidence: 3, run: (c) => grow(c, 0.1) }, 1.5), o('They took their cut and did very little.', { money: -800 }, 1)]),
      ch('Keep going on your own', [o('You kept control of everything.', { discipline: 1 })]),
    ], { weight: 0.9, cooldown: 6, max: 2, when: all(isCreatorNow, bigEnough(30000)) }),

  ev('cr_suspended', 'work', [15, 70], '🚫', 'Account Suspended',
    'Your account was suspended without warning for breaking guidelines you did not know existed.', [
      ch('Appeal it', [o('The ban was lifted after a tense week.', { happiness: -2 }, 1.6), o('The appeal failed. You had to rebuild from a backup account.', { happiness: -6, run: (c) => grow(c, -0.4) }, 1)]),
      ch('Start a fresh account', [o('Starting again hurt, and it was quicker the second time.', { run: (c) => grow(c, -0.5), skill: { creative: 2 } })]),
    ], { weight: 0.4, cooldown: 8, max: 2, when: all(isCreatorNow, bigEnough(5000)) }),

  // ------------------------------------------------------------------ students & freelancers
  ev('st_internship', 'work', [18, 40], '🧑‍💼', 'An Internship Offer',
    'A company in your field offers you a part-time internship alongside your studies.', [
      ch('Accept it', [o('You learned a lot, and your CV got stronger.', { happiness: 2, discipline: 1, run: (c) => { if (!c.p.career.job) hire(c.g, careerById('pt_intern')!); return 'You started as an intern.'; } })]),
      ch('Politely decline', [o('You wanted to focus on your studies.', {})]),
    ], { weight: 1.4, cooldown: 3, max: 3, when: all(P.uni, (c) => !c.p.career.job) }),

  ev('st_research_assistant', 'work', [18, 40], '🔬', 'A Professor Notices You',
    'One of your professors was impressed by your work and invites you to help with their research.', [
      ch('Accept the research position', [o('It was hard work, but it opened doors.', { intelligence: 2, confidence: 3, run: (c) => { if (!c.p.career.job) hire(c.g, careerById('pt_ra')!); return 'You became a research assistant.'; } })]),
      ch('Say thanks, but no', [o('You kept your schedule clear.', {})]),
    ], { weight: 1, cooldown: 4, max: 2, when: all(P.uni, P.stat('intelligence', 62), (c) => !c.p.career.job) }),

  ev('st_work_clash', 'work', [17, 40], '📚', 'Exams or Shifts?',
    'Your exams fall in the same week as your busiest shifts at work.', [
      ch('Put your studies first', [o('You aced the exam and your boss understood.', { grades: 5, discipline: 1 }, 1.5), o('Your boss was less understanding and cut your hours.', { grades: 5, money: -300 }, 1)]),
      ch('Take the extra shifts', [o('The money helped, but your grades suffered.', { money: 500, grades: -6, happiness: -2 })]),
      ch('Try to do both', [o('You pulled it off, barely.', { health: -3, happiness: -3, grades: 2 }, 1), o('You were exhausted and did badly in both.', { health: -5, grades: -5, happiness: -5 }, 1.4)]),
    ], { weight: 1.2, cooldown: 3, max: 4, when: all(P.uni, P.working) }),

  ev('fl_client_ghost', 'work', [16, 75], '👻', 'The Client Who Vanished',
    'A client has stopped replying and still owes you for a finished project.', [
      ch('Chase them politely', [o('After a few messages they paid up.', { money: 900, skill: { communication: 1 } }, 1.2), o('Silence. You never got paid.', { money: -400, happiness: -3 }, 1)]),
      ch('Threaten legal action', [o('They paid immediately.', { money: 900, confidence: 2 }, 1), o('They blocked you.', { happiness: -3 }, 1)]),
      ch('Write it off and learn', [o('From now on you ask for a deposit.', { discipline: 1, skill: { business: 1 } })]),
    ], { weight: 1, cooldown: 4, max: 4, when: P.industry(...FREELANCE) }),

  ev('fl_big_client', 'work', [16, 75], '🏆', 'A Big Client Appears',
    'A well-known company wants to hire you for a big project, with a tight deadline.', [
      ch('Take it on and work flat out', [o('You delivered, and they became a regular client.', { money: 4500, confidence: 4, health: -2 }, 1.4), o('You missed the deadline and lost the contract.', { money: -300, confidence: -3, happiness: -4 }, 1)]),
      ch('Negotiate a longer deadline', [o('They agreed, and the project went smoothly.', { money: 3500, discipline: 2, skill: { business: 1 } }, 1.2), o('They went with someone else.', { happiness: -2 }, 1)]),
      ch('Turn it down', [o('You played it safe.', {})]),
    ], { weight: 1, cooldown: 4, max: 3, when: P.industry(...FREELANCE, ...CREATORS) }),
];

import { all, ch, ev, o, P, story, not } from '../../kit';
import { pick } from '../../rng';
import { moveCountry } from '../../travel';
import type { EventTemplate } from '../../types';

export const YOUNG_ADULT: EventTemplate[] = [
  ev('y_move_out', 'milestone', [18, 24], '🧳', 'Time to Spread Your Wings', 'Living at home is comfortable, but you are an adult now. Do you move out?', [
    ch('Find your own place', [o('You rented a small apartment — freedom!', { happiness: 6, confidence: 4, flag: { movedOut: true }, run: (c) => { c.p.fin.housing = { kind: 'rent', quality: 1 }; } })], { when: (c) => c.p.fin.housing.kind === 'family', disabledReason: 'You already moved out' }),
    ch('Stay home and save money', [o('Your savings account loves it.', { money: 800, happiness: -1, discipline: 2 })]),
  ], { when: (c) => c.p.fin.housing.kind === 'family', max: 2, weight: 1.2 }),
  ev('y_uni_party', 'social', [18, 23], '🍻', 'Freshers\' Week', 'Your first week on campus is a blur of events and parties.', [
    ch('Go to everything', [o('You made friends for life.', { social: 5, happiness: 5, health: -2, grades: -2, add: { rel: 'friend' } }, 2), o('You overdid it and missed lectures.', { social: 3, grades: -5, health: -3 }, 1)]),
    ch('Be selective', [o('A few good connections.', { social: 2, happiness: 2 })]),
  ], { when: P.uni, max: 1 }),
  ev('y_study_abroad', 'school', [19, 24], '🌍', 'Study Abroad', 'Your university offers a semester abroad.', [
    ch('Apply', [o('It was life-changing.', { intelligence: 3, confidence: 5, happiness: 8, skill: { communication: 4 }, money: -4000, flag: { studiedAbroad: true } }, 2), o('Culture shock was real but rewarding.', { confidence: 3, happiness: 3, money: -4000 }, 1)], { cost: 0 }),
    ch('Stay put', [o('A normal semester.', {})]),
  ], { when: P.uni, max: 1 }),
  ev('y_group_project', 'school', [18, 25], '👥', 'Group Project from Hell', 'One of your group members does nothing.', [
    ch('Cover for them', [o('You pulled off a great grade but burned out.', { grades: 3, happiness: -3, discipline: 2 })]),
    ch('Report them to the lecturer', [o('The lecturer redistributed marks fairly.', { grades: 1, social: -1, confidence: 2 })]),
    ch('Let it slide', [o('The project suffered.', { grades: -4 })]),
  ], { when: P.uni }),
  ev('y_thesis', 'school', [20, 27], '📚', 'Crunch Time', 'Your thesis deadline is looming.', [
    ch('Pull all-nighters', [o('Handed in on time — barely.', { grades: 4, health: -3, happiness: -3, discipline: 2 })]),
    ch('Plan carefully from the start', [o('A calm, well-structured paper.', { grades: 5, discipline: 3 })]),
    ch('Ask for an extension', [o('Granted, with a small penalty.', { grades: -1, happiness: 1 }, 2), o('Denied — you panicked.', { grades: -5, happiness: -4 }, 1)]),
  ], { when: P.uni }),
  ev('y_internship', 'career', [19, 25], '🧑‍💻', 'Internship Offer', 'A company offers you a summer internship in your field.', [
    ch('Accept', [o('The experience paid off — and you made contacts.', { skill: { business: 3, communication: 4 }, money: 2000, confidence: 4, flag: { internship: true } })]),
    ch('Travel for the summer', [o('Memories for life.', { happiness: 7, social: 2, money: -1500 })]),
  ], { when: P.uni, max: 2 }),
  ev('y_roommate', 'social', [18, 28], '🏠', 'Roommate Roulette', 'Your new roommate leaves dishes everywhere and plays music at 2 a.m.', [
    ch('Have a direct conversation', [o('Boundaries agreed. Life improved.', { confidence: 3, social: 1 }, 2), o('It escalated into a shouting match.', { happiness: -3, social: -1 }, 1)]),
    ch('Passive-aggressive notes', [o('Nothing changed.', { happiness: -2 })]),
    ch('Move out', [o('A bit pricier, but peaceful.', { happiness: 2, money: -800 })]),
  ], { when: (c) => c.p.fin.housing.kind === 'rent' && c.p.age <= 28 }),
  ev('y_first_job_nerves', 'career', [18, 28], '😬', 'First Day Jitters', 'It is your first week at {company} and everything is unfamiliar.', [
    ch('Ask lots of questions', [o('Your colleagues respected your curiosity.', { confidence: 3, skill: { communication: 2 }, rel: ['coworker', 5] })]),
    ch('Keep your head down', [o('You got by, but felt isolated.', { happiness: -1, confidence: -1 })]),
  ], { when: (c) => !!c.p.career.job && c.p.career.job.years <= 1 && !c.p.career.job.partTime, max: 1, weight: 2 }),
  ev('y_gap', 'milestone', [19, 26], '🎒', 'Backpacking Adventure', 'You have a chance to travel for a few months.', [
    ch('Go for it', [o('You saw wonders and came back changed.', { happiness: 10, confidence: 5, social: 3, intelligence: 2, money: -3500 }, 2), o('Money ran out early and you came home sooner.', { happiness: 4, money: -2500 }, 1)], { cost: 1000, when: P.cash(3000) }),
    ch('Stay and build your career', [o('You kept your momentum.', { discipline: 2 })]),
  ], { max: 1 }),
];

export const CAREER_EVENTS: EventTemplate[] = [
  ev('w_promo_offer', 'career', [22, 60], '🚀', 'Unexpected Promotion', 'Your manager calls you in — a senior role has opened up.', [
    ch('Accept the promotion', [o('You stepped up and thrived.', { job: 'promote', confidence: 4 }, 2), o('The extra pressure took a toll.', { job: 'promote', happiness: -4, health: -2 }, 1)]),
    ch('Decline — you like where you are', [o('Your manager respected your honesty.', { happiness: 2 })]),
  ], { when: (c) => P.employed(c) && (c.p.career.job?.performance ?? 0) >= 60 && (c.p.career.job?.level ?? 4) < 4 && (c.p.career.job?.years ?? 0) >= 2, weight: 1.1 }),
  ev('w_layoff_rumor', 'career', [22, 62], '😨', 'Layoff Rumours', 'Your company announces restructuring. Layoffs are rumoured.', [
    ch('Work extra hard to stand out', [o('Your effort was noticed — you were safe.', { discipline: 2, health: -1, rel: ['boss', 3] }, 2), o('You were let go anyway.', { job: 'layoff' }, 1)]),
    ch('Quietly update your CV', [o('You secured a standing offer.', { confidence: 2, skill: { communication: 1 } }, 2), o('You were laid off — but you were prepared.', { job: 'layoff', confidence: 1 }, 1)]),
    ch('Do nothing and hope', [o('You survived the cuts.', { happiness: -2 }, 1.5), o('You were laid off.', { job: 'layoff' }, 1.2)]),
  ], { when: all(P.employed, (c) => c.g.world.economy !== 'boom'), weight: (c) => (c.g.world.economy === 'recession' ? 3 : 0.8) }),
  ev('w_offer_overseas', 'career', [24, 55], '✈️', 'Job Offer Overseas', 'A recruiter offers you a role in another country with a bigger salary.', [
    ch('Take it and relocate', [o('A new country, new challenges and a big pay jump.', { salaryPct: 0.25, happiness: 5, confidence: 4, social: -2, run: (c) => moveCountry(c.g, pick(['us', 'uk', 'ca', 'au', 'de', 'sg', 'jp'].filter((x) => x !== c.p.countryId)), true) })], { when: P.single, disabledReason: 'Hard to relocate with a partner right now' }),
    ch('Politely decline', [o('You stayed put.', { happiness: 1 })]),
  ], { when: all(P.employed, P.educated), max: 1, weight: 0.5 }),
  ev('w_business_opp', 'career', [24, 58], '🤝', 'A Friend\'s Business Pitch', '{friend} pitches you a business idea and wants you to invest.', [
    ch('Invest {$5000}', [o('The venture took off — your stake doubled!', { money: 8000, skill: { business: 3 }, rel: ['friend', 8] }, 1), o('The business folded and your money vanished.', { money: -5000, rel: ['friend', -6] }, 1.6)], { cost: 5000, when: P.cash(5000) }),
    ch('Join as a partner (no cash)', [o('Long hours, but you learned a lot.', { skill: { business: 5 }, health: -2, rel: ['friend', 6] })]),
    ch('Decline', [o('You played it safe.', { rel: ['friend', -2] })]),
  ], { when: P.friend, weight: 0.9 }),
  ev('w_bonus', 'career', [22, 62], '🎁', 'Annual Bonus', 'Your company had a strong year and is paying bonuses.', [
    ch('Save it', [o('A cushion for the future.', { job: 'bonus', discipline: 2 })]),
    ch('Treat yourself', [o('You bought something you had been eyeing.', { job: 'bonus', happiness: 5, money: -1200 })]),
  ], { when: all(P.employed, P.econ('boom')), weight: 1.4 }),
  ev('w_conflict_boss', 'career', [22, 62], '😤', 'Clash with the Boss', 'You and {boss} disagree sharply about how a project should be run.', [
    ch('Push back with data', [o('{boss} came round to your view.', { confidence: 3, rel: ['boss', 6, 5] }, 2), o('{boss} took it personally.', { rel: ['boss', -8, -6], happiness: -3 }, 1.5)]),
    ch('Defer to {boss}', [o('The project went as planned. You felt unheard.', { happiness: -2, rel: ['boss', 2] })]),
    ch('Go over their head', [o('It backfired badly.', { rel: ['boss', -15, -15], happiness: -5 }, 2), o('Leadership sided with you.', { confidence: 4, rel: ['boss', -10] }, 1)]),
  ], { when: P.boss }),
  ev('w_mentor', 'career', [22, 45], '🌟', 'A Mentor Appears', 'A senior colleague offers to mentor you.', [
    ch('Embrace it', [o('Your skills and network grew rapidly.', { skill: { leadership: 5, communication: 3 }, confidence: 3, rel: ['coworker', 8, 6] })]),
    ch('Politely decline', [o('You preferred finding your own path.', {})]),
  ], { when: all(P.employed, P.coworker), max: 2 }),
  ev('w_burnout', 'health', [25, 60], '🔥', 'On the Edge of Burnout', 'The hours are relentless. You are exhausted.', [
    ch('Take a proper break', [o('Time off restored you.', { health: 5, happiness: 6, money: -1000 })]),
    ch('Push through', [o('You made it — but at a cost.', { health: -6, happiness: -6, discipline: 1 }, 2), o('You collapsed and needed medical leave.', { health: -10, happiness: -8, money: -2000, cond: 'Chronic stress' }, 1)]),
    ch('Quit and rethink', [o('You walked away from the pressure.', { job: 'quit', happiness: 5, health: 4 })]),
  ], { when: (c) => P.employed(c) && (c.p.career.effort === 'high' || (c.p.career.job?.satisfaction ?? 60) < 40), weight: 1.3 }),
  ev('w_remote', 'career', [24, 60], '🏡', 'Remote Work Option', 'Your company offers more remote work.', [
    ch('Work from home', [o('No commute! But you missed colleagues.', { happiness: 3, social: -2, health: 1, money: 300 })]),
    ch('Stay in the office', [o('You kept your office routine and relationships.', { social: 1, rel: ['coworker', 3] })]),
  ], { when: all(P.employed, P.year(2015)), max: 1 }),
  ev('w_office_romance', 'romance', [23, 55], '💘', 'Office Spark', 'You feel a connection with a colleague.', [
    ch('Ask them out', [o('You started dating — carefully.', { happiness: 6, add: { rel: 'partner' } }, 1.5), o('It got awkward at work.', { happiness: -4, confidence: -2, rel: ['coworker', -6] }, 1)], { when: P.single }),
    ch('Keep it professional', [o('Probably wise.', { discipline: 1 })]),
  ], { when: all(P.employed, P.coworker, P.single), max: 2 }),
  ev('w_credit_steal', 'career', [23, 58], '😒', 'Credit Thief', 'A colleague takes credit for your idea in a meeting.', [
    ch('Call them out publicly', [o('Your manager noticed your initiative.', { confidence: 3, rel: ['coworker', -8], skill: { leadership: 2 } }, 1.5), o('It made you look petty.', { confidence: -2, rel: ['boss', -4] }, 1)]),
    ch('Speak to them privately', [o('They apologised and set the record straight.', { rel: ['coworker', 4], confidence: 2 })]),
    ch('Let it go', [o('You learned to document your work.', { happiness: -2, discipline: 1 })]),
  ], { when: all(P.employed, P.coworker) }),
  ev('w_train', 'career', [23, 58], '🎓', 'Paid Training Course', 'Your employer will fund a professional training course.', [
    ch('Enrol and commit', [o('You emerged with sharper skills.', { skill: { business: 3, leadership: 3 }, intelligence: 2, discipline: 2, flag: { upskilled: true } })]),
    ch('Skip it', [o('You didn\'t have the bandwidth.', {})]),
  ], { when: P.employed, max: 3 }),
  ev('w_side_hustle', 'money', [22, 55], '⚡', 'Side Hustle', 'You could earn extra money on weekends by freelancing.', [
    ch('Start freelancing', [o('Your side income grew steadily.', { money: 4000, health: -1, skill: { business: 3 }, happiness: -1 }, 2), o('Clients were scarce and it was exhausting.', { money: 400, health: -2, happiness: -3 }, 1)]),
    ch('Protect your free time', [o('Your weekends stayed yours.', { happiness: 2 })]),
  ], { when: P.employed, max: 2 }),
  ev('w_salary_negotiation', 'career', [23, 58], '💬', 'Negotiate Your Pay', 'You discover you are paid less than peers doing the same job.', [
    ch('Ask for a raise', [o('Your boss agreed to a raise.', { job: 'raise', confidence: 3 }, 2), o('Your boss said there is no budget.', { confidence: -2, rel: ['boss', -2] }, 1.5)]),
    ch('Look for another job', [o('You got a better offer elsewhere.', { salaryPct: 0.1, confidence: 3 }, 1), o('Nothing materialised.', { happiness: -2 }, 1)]),
    ch('Let it go', [o('You stayed quiet. It still bothers you.', { happiness: -2 })]),
  ], { when: P.employed, max: 3 }),
  ev('w_fired_mistake', 'career', [22, 60], '🧯', 'A Costly Mistake', 'You made a mistake that cost your company money.', [
    ch('Own up immediately', [o('Your honesty was appreciated.', { confidence: -1, rel: ['boss', 4, 6], discipline: 2 }, 2), o('You were disciplined and put on notice.', { happiness: -5, rel: ['boss', -4] }, 1)]),
    ch('Cover it up', [o('It came back to bite you — you were dismissed.', { job: 'fire', happiness: -8 }, 1.6), o('You fixed it quietly. Phew.', { happiness: -2, discipline: -1 }, 1)]),
  ], { when: P.employed, max: 2 }),
  ev('w_startup', 'career', [24, 50], '🦄', 'Startup Dream', 'You have an idea that could become a company.', [
    ch('Quit and build it', [o('The first months were brutal, but exhilarating.', { job: 'quit', happiness: 4, confidence: 4, skill: { business: 5 }, flag: { startupIdea: true } })]),
    ch('Build it on the side', [o('Nights and weekends of grind.', { health: -2, skill: { business: 4 }, flag: { startupIdea: true } })]),
    ch('Shelve the idea', [o('You wondered "what if" now and then.', { happiness: -1 })]),
  ], { when: P.employed, max: 1 }),
  ev('w_conference', 'career', [24, 60], '🎤', 'Invitation to Speak', 'You are invited to speak at an industry conference.', [
    ch('Prepare and give the talk', [o('A big success — new opportunities.', { confidence: 5, skill: { communication: 5, leadership: 2 }, social: 2 }, 2), o('Stage fright got the better of you.', { confidence: -3 }, 1)]),
    ch('Decline', [o('Not your stage.', {})]),
  ], { when: all(P.employed, P.educated), max: 2 }),
  ev('w_new_boss', 'career', [23, 60], '🆕', 'New Manager', 'Your team gets a new manager.', [
    ch('Win them over', [o('You quickly became their go-to.', { rel: ['boss', 8, 6], confidence: 2 })]),
    ch('Keep a low profile', [o('Things continued as before.', {})]),
  ], { when: P.employed, max: 3 }),
  ev('w_unemployed_offer', 'career', [20, 62], '📞', 'A Recruiter Calls', 'A recruiter reaches out about an opening.', [
    ch('Take the call', [o('The role looks promising — try applying in the Career tab.', { confidence: 3, flag: { recruiterLead: true } })]),
    ch('Hang up', [o('Not interested.', {})]),
  ], { when: P.jobless, weight: 2 }),
  ev('w_job_loss_savings', 'money', [22, 62], '🧾', 'Dry Spell', 'Being out of work is draining your savings.', [
    ch('Cut spending to the bone', [o('You stretched every dollar.', { discipline: 3, happiness: -4 })]),
    ch('Take any temp job', [o('Work is work.', { money: 1500, happiness: -1, confidence: 1 })]),
    ch('Ask family for support', [o('They helped, with kind words.', { money: 1200, rel: ['family', 3] }), o('They helped but it felt awkward.', { money: 800, rel: ['family', -2], happiness: -2 })], { when: P.parent }),
  ], { when: all(P.jobless, (c) => c.p.career.unemployedYears >= 1), weight: 2 }),
  ev('w_award', 'career', [24, 62], '🏆', 'Employee of the Year', 'You are nominated for an award.', [
    ch('Accept with gratitude', [o('A trophy, a bonus and a boost in status.', { happiness: 6, confidence: 4, job: 'bonus' })]),
  ], { when: (c) => P.employed(c) && (c.p.career.job?.performance ?? 0) >= 75, max: 2 }),
  ev('w_toxic', 'career', [23, 60], '☣️', 'Toxic Workplace', 'The culture at {company} has become poisonous.', [
    ch('Look for a way out', [o('You started interviewing elsewhere.', { happiness: 1, flag: { jobHunting: true } })]),
    ch('Try to change it from within', [o('Small wins, but exhausting.', { skill: { leadership: 3 }, happiness: -3 })]),
    ch('Quit on the spot', [o('Dramatic, but liberating.', { job: 'quit', happiness: 5, money: -500 })]),
  ], { when: P.employed, max: 2 }),
  ev('w_commute', 'career', [22, 60], '🚇', 'The Commute', 'Your commute has become longer and more painful.', [
    ch('Move closer to work', [o('Shorter commute, higher rent.', { happiness: 3, money: -1800 }, 1)], { when: (c) => c.p.fin.housing.kind === 'rent' }),
    ch('Listen to audiobooks', [o('You used the time to learn.', { intelligence: 1, happiness: 1 })]),
    ch('Ignore it', [o('You grit your teeth.', { happiness: -2 })]),
  ], { when: P.employed, max: 2 }),
];

// ----------------------------------------------------------- industry-specific events
const ind = (id: string, ids: string[], icon: string, title: string, text: string, choices: ReturnType<typeof ch>[], w = 1): EventTemplate =>
  ev(id, 'career', [20, 65], icon, title, text, choices, { when: P.industry(...ids), weight: w, max: 3 });

export const INDUSTRY: EventTemplate[] = [
  ind('i_bug', ['software_dev', 'cyber_analyst', 'it_support'], '🐛', 'Production Down!', 'A critical bug takes your product offline at 2 a.m.', [
    ch('Fix it yourself, overnight', [o('You saved the day and earned the respect of the CTO.', { skill: { tech: 4 }, confidence: 4, rel: ['boss', 5] }, 2), o('Your fix made things worse before they got better.', { happiness: -4, rel: ['boss', -3] }, 1)]),
    ch('Escalate to the team', [o('A smooth, shared recovery.', { skill: { leadership: 2 } })]),
  ]),
  ind('i_hackathon', ['software_dev', 'data_analyst', 'data_scientist'], '💡', 'Hackathon Weekend', 'A company hackathon runs this weekend.', [
    ch('Lead a team', [o('You won first prize!', { skill: { tech: 5, leadership: 4 }, money: 1000, confidence: 4 }, 1.2), o('You built something fun but did not win.', { skill: { tech: 3 }, happiness: 3 }, 1.5)]),
    ch('Skip it', [o('Rest was the right call.', { health: 1 })]),
  ]),
  ind('i_ai_tools', ['software_dev', 'data_analyst', 'data_scientist', 'designer', 'journalist'], '🤖', 'New Tools at Work', 'Your company rolls out powerful new automation tools.', [
    ch('Master them quickly', [o('You became the team\'s expert.', { skill: { tech: 5 }, confidence: 3, intelligence: 2 })]),
    ch('Stick to your methods', [o('You fell a little behind.', { skill: { tech: -1 }, confidence: -1 })]),
  ], 1.2),
  ind('i_patient', ['doctor', 'nurse'], '🏥', 'A Difficult Case', 'A patient\'s condition takes a turn for the worse under your care.', [
    ch('Stay late and fight for them', [o('The patient recovered. You were praised.', { skill: { medical: 4 }, happiness: 5, health: -1 }, 2), o('You did everything right, but lost the patient. It hurt.', { happiness: -8, skill: { medical: 2 } }, 1)]),
    ch('Follow protocol and hand over', [o('A professional handover.', { skill: { medical: 1 } })]),
  ]),
  ind('i_malpractice', ['doctor', 'dentist', 'pharmacist'], '⚖️', 'Complaint Filed', 'A patient files a complaint about your treatment.', [
    ch('Cooperate fully', [o('You were cleared of wrongdoing.', { confidence: 1, happiness: -2 }, 2), o('A formal reprimand was issued.', { happiness: -6, money: -4000 }, 1)]),
    ch('Hire a lawyer', [o('Your lawyer got it dismissed.', { money: -3000, happiness: -1 })]),
  ]),
  ind('i_class', ['teacher', 'professor'], '🧑‍🏫', 'Challenging Class', 'You have a particularly difficult class this year.', [
    ch('Get creative with lessons', [o('You turned them around — grades soared.', { skill: { communication: 4 }, happiness: 5, rel: ['coworker', 3] }, 2), o('It was a long, hard year.', { happiness: -4, health: -2 }, 1)]),
    ch('Stick to the curriculum', [o('A steady but uneventful year.', {})]),
  ]),
  ind('i_research', ['scientist', 'professor', 'data_scientist'], '🔭', 'Breakthrough?', 'Your research shows an unexpected result.', [
    ch('Publish quickly', [o('The paper made waves.', { skill: { creative: 3 }, confidence: 5, job: 'bonus', happiness: 5 }, 1.3), o('A reviewer found a flaw. Embarrassing.', { confidence: -4, happiness: -3 }, 1)]),
    ch('Replicate carefully first', [o('A solid, respected publication.', { intelligence: 2, discipline: 3 })]),
  ]),
  ind('i_trial', ['lawyer'], '📜', 'High-Stakes Trial', 'You are handed a major case with media attention.', [
    ch('Go all in', [o('You won! Your reputation soared.', { confidence: 6, job: 'bonus', happiness: 6, skill: { communication: 4 } }, 1.3), o('You lost, and the client blamed you.', { confidence: -4, happiness: -6 }, 1)]),
    ch('Recommend a settlement', [o('A pragmatic result.', { skill: { business: 2 }, happiness: 1 })]),
  ]),
  ind('i_crime_scene', ['police', 'firefighter', 'soldier'], '🚨', 'Dangerous Call-Out', 'An emergency call puts you in harm\'s way.', [
    ch('Run in', [o('You rescued someone — a hero\'s moment.', { happiness: 7, confidence: 5, health: -3, social: 2 }, 1.3), o('You were injured in the line of duty.', { health: -10, happiness: -4, money: -500 }, 1)]),
    ch('Wait for backup', [o('A safe, by-the-book resolution.', { discipline: 1 })]),
  ]),
  ind('i_deal', ['banker', 'fin_analyst', 'consultant', 'sales_rep', 'real_estate'], '💼', 'The Mega Deal', 'A huge deal lands on your desk.', [
    ch('Throw yourself at it', [o('You closed it. Commission cheque incoming!', { money: 15000, confidence: 4, health: -2, skill: { business: 4 } }, 1.3), o('It collapsed at the last minute.', { happiness: -5, health: -2 }, 1)]),
    ch('Delegate to the team', [o('The team delivered; you took a share of the credit.', { money: 3000, skill: { leadership: 3 } })]),
  ]),
  ind('i_shift', ['chef', 'barista', 'retail', 'driver'], '⏰', 'Double Shift', 'You are asked to cover a double shift.', [
    ch('Take it', [o('Extra pay, aching feet.', { money: 400, health: -2, happiness: -1 })]),
    ch('Refuse', [o('You protected your evening.', { happiness: 2, rel: ['boss', -3] })]),
  ], 1.2),
  ind('i_art_show', ['artist', 'designer', 'musician', 'writer', 'actor'], '🖼️', 'Big Showcase', 'You get a chance to showcase your work to an influential audience.', [
    ch('Give it your all', [o('A critic raved about you!', { confidence: 6, money: 3000, skill: { creative: 4 }, social: 3 }, 1.2), o('It fell flat.', { confidence: -3, happiness: -3 }, 1.4)]),
    ch('Play it safe', [o('Modest, steady reactions.', { skill: { creative: 1 } })]),
  ]),
  ind('i_training_camp', ['athlete'], '🏋️', 'Training Camp', 'A gruelling pre-season camp awaits.', [
    ch('Push your limits', [o('Peak form!', { skill: { athletic: 5 }, health: 2, confidence: 4 }, 2), o('You overdid it and strained a tendon.', { health: -8, happiness: -4 }, 1)]),
    ch('Train smart and rest', [o('Steady progress.', { skill: { athletic: 3 }, health: 1 })]),
  ]),
  ind('i_campaign', ['politician'], '📢', 'Campaign Trail', 'Election season arrives.', [
    ch('Run an energetic campaign', [o('Voters loved your message.', { confidence: 5, social: 4, skill: { communication: 4 }, flag: { reputationBoost: true } }, 1.2), o('A gaffe went viral.', { confidence: -5, happiness: -5 }, 1)]),
    ch('Run a quiet campaign', [o('A modest result.', {})]),
  ]),
  ind('i_scandal', ['politician', 'ceo', 'banker'], '📰', 'Press Scandal', 'A journalist digs up something embarrassing about you.', [
    ch('Come clean', [o('The public respected your honesty.', { happiness: -3, confidence: 2 }, 2), o('The fallout hurt your standing.', { happiness: -6, confidence: -3 }, 1)]),
    ch('Deny everything', [o('The story blew over.', { happiness: -2 }, 1), o('The cover-up became the story.', { happiness: -9, job: 'fire' }, 1)]),
  ], 0.6),
  ind('i_client', ['consultant', 'accountant', 'marketing_mgr', 'designer', 'real_estate'], '🧑‍💼', 'Demanding Client', 'A key client demands the impossible by Friday.', [
    ch('Work all weekend', [o('Delivered! The client was thrilled.', { rel: ['boss', 5], health: -2, happiness: -2 }, 2), o('You burned out and missed details.', { health: -4, rel: ['boss', -2] }, 1)]),
    ch('Negotiate scope', [o('A fair compromise.', { skill: { communication: 3 } })]),
  ]),
  ind('i_harvest', ['farmer'], '🌦️', 'Weather Gamble', 'Unusual weather threatens this year\'s harvest.', [
    ch('Invest in protection', [o('You saved most of the crop.', { money: -600, happiness: 2 }, 2), o('It was not enough.', { money: -1500, happiness: -4 }, 1)]),
    ch('Hope for the best', [o('Lucky — the weather turned.', { money: 800 }, 1), o('A poor harvest.', { money: -2000, happiness: -5 }, 1.5)]),
  ]),
  ind('i_flight', ['pilot'], '🌩️', 'Turbulent Flight', 'Severe weather hits mid-flight.', [
    ch('Stay calm and follow procedure', [o('You landed safely — a textbook response.', { confidence: 5, skill: { trades: 3 } }, 2), o('A bumpy diversion; passengers were shaken.', { happiness: -3 }, 1)]),
  ]),
];
void not; void story;

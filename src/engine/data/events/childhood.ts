import { all, ch, ev, o, P, story } from '../../kit';
import { hire } from '../../career';
import { careerById } from '../careers';
import { pick } from '../../rng';
import { countryOf } from '../../util';
import type { EventTemplate } from '../../types';

export const CHILDHOOD: EventTemplate[] = [
  // ---------------------------------------------------------------- babies & toddlers
  story('b_first_steps', 'milestone', [1, 2], '👣', 'First Steps', 'You wobbled, tumbled and then took your very first steps while {mother} cheered.', 'Everyone clapped. You felt unstoppable.', { happiness: 4, health: 1, rel: ['parents', 4] }, { max: 1 }),
  story('b_first_words', 'milestone', [1, 3], '🗣️', 'First Words', 'Your first word was clear as a bell. Your family argued about who it was meant for.', 'Your parents recorded it on repeat.', { intelligence: 2, happiness: 3, rel: ['parents', 3] }, { max: 1 }),
  story('b_lullabies', 'family', [0, 3], '🎶', 'Bedtime Songs', 'Every night your family sings you to sleep.', 'You drift off feeling safe and loved.', { happiness: 3, intelligence: 1, rel: ['parents', 2] }),
  ev('b_sick_baby', 'health', [0, 3], '🤒', 'Feverish Night', 'You spiked a fever overnight and cried for hours.', [
    ch('Parents rush you to the clinic', [o('The doctors treated it quickly. You were fine by morning.', { health: 2, rel: ['parents', 3] })]),
    ch('Home remedies and a long night', [o('You recovered, but it was a hard few days.', { health: -3, rel: ['parents', 1] }, 3), o('It lingered and needed medical care after all.', { health: -6, rel: ['parents', -1] }, 1)]),
  ], { weight: 1.3 }),
  ev('b_new_sibling', 'family', [2, 9], '🍼', 'A New Baby', "Your {mother} announces she's expecting a baby — you're going to be a big brother or sister!", [
    ch('Be thrilled', [o('You help pick the name and can hardly wait.', { happiness: 5, add: { rel: 'sibling' }, rel: ['mother', 3] })]),
    ch('Feel a bit jealous', [o('Attention gets divided, but you grow to love the little one.', { happiness: -2, add: { rel: 'sibling' } })]),
  ], { when: (c) => P.mother(c) && c.p.people.filter((x) => x.relation === 'sibling').length < 4 && c.p.people.some((x) => x.relation === 'mother' && x.alive && !x.absent && c.g.year - x.birthYear <= 41), max: 2, weight: 0.8 }),
  // ---------------------------------------------------------------- childhood
  ev('c_bully', 'school', [6, 13], '😠', 'The Class Bully', 'A bigger kid at school keeps picking on you at recess.', [
    ch('Stand up to them', [o('They backed off, impressed by your courage.', { confidence: 5, social: 2 }, 2), o('A scuffle broke out and you were sent to the principal.', { confidence: 2, health: -3, discipline: -2, flag: { fighter: true } }, 1)]),
    ch('Tell {teacher}', [o('The bully was disciplined and left you alone.', { happiness: 3, rel: ['parents', 2] }), o('It got worse before it got better.', { happiness: -3, confidence: -2, flag: { bullied: true } }, 0.5)]),
    ch('Keep quiet and avoid them', [o('You dodged them for months, but it wore you down.', { happiness: -5, confidence: -4, flag: { bullied: true }, sched: ['t_bullying_echo', 2, 5, 0.7] })]),
    ch('Try to befriend them', [o('To your surprise, they turned out to be lonely. You became friends!', { social: 4, add: { rel: 'friend' } }, 1), o('They laughed in your face.', { confidence: -3, happiness: -2 }, 1.5)], { when: P.stat('social', 40), disabledReason: 'Needs decent social skills' }),
  ], { weight: 1.5, max: 2 }),
  story('t_bullying_echo', 'school', [8, 16], '🫥', 'Old Wounds', 'The memory of being bullied still stings when you walk into a crowded room.', 'You decide not to let it define you. It takes effort, though.', { confidence: -2, discipline: 2, happiness: -1 }, { weight: 0, max: 1 }),
  ev('c_lost_toy', 'family', [3, 8], '🧸', 'The Missing Toy', 'You lost your favourite toy at the park and you are heartbroken.', [
    ch('Cry until someone helps', [o('{mother} bought you a new one.', { happiness: 2, rel: ['mother', 2] })]),
    ch('Search everywhere', [o('You found it under a bush!', { happiness: 4, discipline: 2 }, 2), o('No luck, but you learned persistence.', { discipline: 2, happiness: -1 })]),
  ]),
  ev('c_science_fair', 'school', [7, 13], '🔬', 'Science Fair', 'Your class is holding a science fair. Everyone is paired with a project.', [
    ch('Pour hours into an ambitious experiment', [o('Your volcano erupted perfectly — first prize!', { intelligence: 5, confidence: 4, grades: 4 }, 2), o('It fizzled out, but you learned a lot.', { intelligence: 3, discipline: 2 }, 1)]),
    ch('Do something simple', [o('A neat poster earned a solid grade.', { intelligence: 1, happiness: 1 })]),
    ch('Skip it and play outside', [o('You had a blast but the teacher was disappointed.', { happiness: 2, grades: -3, discipline: -1 })]),
  ], { when: P.inSchool }),
  ev('c_pet', 'family', [5, 12], '🐶', 'Can I Have a Pet?', 'You have been begging your parents for a pet for months.', [
    ch('Plead and promise to care for it', [o('You got a puppy! Responsibility comes with it.', { happiness: 8, discipline: 3, flag: { hadPet: true } }, 1.5), o('"Maybe when you are older," they said.', { happiness: -2 }, 1.5)]),
    ch('Save your allowance for a fish', [o('A goldfish named Bubbles joined the family.', { happiness: 4, discipline: 2, flag: { hadPet: true } })]),
  ], { when: P.parent, max: 1 }),
  ev('c_playground', 'health', [4, 12], '🛝', 'Playground Tumble', 'You tried a daring jump off the top of the playground slide.', [
    ch('Go for it', [o('You landed it like a hero!', { confidence: 4, happiness: 3 }, 2), o('You twisted your ankle badly.', { health: -6, happiness: -3 }, 1.5)]),
    ch('Think better of it', [o('You played it safe and had fun anyway.', { happiness: 1, discipline: 1 })]),
  ], { weight: 1.2 }),
  ev('c_cheat', 'school', [8, 13], '📝', 'Wandering Eyes', 'During a big test you can see your neighbour\'s answers.', [
    ch('Copy a few answers', [o('You got away with it — but felt guilty.', { grades: 5, discipline: -3, happiness: -2 }, 2), o('Caught! The teacher called your parents.', { grades: -10, rel: ['parents', -6, -8], confidence: -3 }, 1.5)]),
    ch('Eyes on your own paper', [o('Honest effort paid off.', { discipline: 3, intelligence: 1 })]),
  ], { when: P.inSchool }),
  ev('c_birthday', 'family', [4, 12], '🎂', 'Birthday Party', 'It is almost your birthday. What kind of party do you want?', [
    ch('A big party with the whole class', [o('Best party ever! You were popular all week.', { happiness: 6, social: 3 }, 2), o('Too chaotic — someone cried and the cake got ruined.', { happiness: 1, social: 1 })], { cost: 250 }),
    ch('A quiet family dinner', [o('Cosy and sweet.', { happiness: 3, rel: ['family', 3] })]),
  ]),
  ev('c_school_play', 'school', [6, 12], '🎭', 'School Play', 'Your class is putting on a play and auditions are open.', [
    ch('Audition for the lead', [o('You got the lead and nailed it!', { confidence: 6, social: 3, skill: { creative: 3 } }, 1.2), o('You froze on stage and forgot your lines.', { confidence: -4, happiness: -2 }, 1)], { when: P.stat('confidence', 35), disabledReason: 'Needs more confidence' }),
    ch('Work backstage', [o('You built props and loved being part of the team.', { social: 2, skill: { creative: 2 }, happiness: 2 })]),
    ch('Sit this one out', [o('You cheered from the audience.', { happiness: 1 })]),
  ], { when: P.inSchool }),
  ev('c_new_kid', 'social', [5, 14], '🧑‍🤝‍🧑', 'The New Kid', 'A new student joins your class and sits alone at lunch.', [
    ch('Invite them to sit with you', [o('You became fast friends.', { social: 3, happiness: 4, add: { rel: 'friend' } })]),
    ch('Stay with your usual group', [o('Nothing changes, though you wonder how they feel.', { happiness: 0 })]),
  ], { when: P.inSchool }),
  ev('c_music', 'hobby', [5, 12], '🎹', 'Music Lessons', 'Your parents offer you music lessons.', [
    ch('Say yes — piano!', [o('You practised hard and your skills bloomed.', { intelligence: 2, discipline: 3, skill: { creative: 6 }, happiness: 2 }, 2), o('Scales were boring and you quit after a few months.', { discipline: -1, skill: { creative: 2 } }, 1)], { cost: 400, when: P.parent }),
    ch('No thanks, I would rather play', [o('You spent the summer outside.', { health: 2, happiness: 3 })]),
  ], { max: 1 }),
  ev('c_sports', 'hobby', [6, 13], '⚽', 'Join the Team?', 'Your school is forming a football team.', [
    ch('Sign up', [o('You made the team and made friends.', { health: 4, social: 3, skill: { athletic: 6 }, confidence: 2 }, 2), o('You rode the bench but loved it.', { health: 2, social: 2 }, 1)]),
    ch('Not for me', [o('You spent the afternoons reading instead.', { intelligence: 2 })]),
  ], { when: P.inSchool, max: 2 }),
  story('c_family_trip', 'family', [4, 14], '🚗', 'Family Road Trip', 'Your family packs the car for a trip to see something new.', 'Squished in the back seat, singing off-key — a memory you will keep.', { happiness: 5, rel: ['family', 4] }, { when: P.parent }),
  story('c_grandma', 'family', [3, 14], '👵', 'Visiting Grandparents', 'You spend the weekend at your grandparents\' house baking and hearing old stories.', 'You come away full of cookies and wisdom.', { happiness: 4, intelligence: 1 }),
  ev('c_candy', 'moral', [5, 10], '🍬', 'Sweet Temptation', 'At the shop, nobody is looking and there is candy within reach.', [
    ch('Slip some into your pocket', [o('Caught by the cashier! Your face burned with shame.', { discipline: 2, rel: ['parents', -3], happiness: -3, flag: { learnedHonesty: true } }, 2), o('You got away with it, but felt strangely bad.', { happiness: -1, discipline: -1 }, 1)]),
    ch('Leave it', [o('Good call.', { discipline: 2 })]),
  ], { max: 1 }),
  story('c_nightmare', 'health', [3, 9], '🌙', 'Bad Dream', 'A scary nightmare has you running to your parents\' room.', 'A hug and a glass of water — and you slept soundly.', { happiness: -1, rel: ['parents', 3] }),
  ev('c_reading', 'school', [6, 12], '📚', 'Reading Challenge', 'The library runs a summer reading challenge.', [
    ch('Read as many books as you can', [o('You devoured twenty books and won a certificate.', { intelligence: 4, discipline: 2, happiness: 2 })]),
    ch('Read a few', [o('A handful of good stories.', { intelligence: 1 })]),
    ch('Ignore it', [o('Summer was for playing outside.', { health: 1, happiness: 1 })]),
  ]),
  ev('c_chickenpox', 'health', [3, 10], '🤧', 'Spots Everywhere', 'You woke up covered in itchy spots.', [
    ch('Rest and follow doctor\'s advice', [o('It passed in a week.', { health: -1 })]),
    ch('Scratch like crazy', [o('Scars on your arms are a souvenir.', { health: -2, appearance: -1 })]),
  ]),
  ev('c_move_house', 'family', [4, 14], '📦', 'We\'re Moving', 'Your family has decided to move to a new neighbourhood.', [
    ch('Embrace the adventure', [o('You adapted quickly and made new friends.', { social: 2, confidence: 2, add: { rel: 'friend' }, run: (c) => { c.p.city = pick(c.country.cities); return `You moved to ${c.p.city}.`; } }, 2), o('It took months to settle in.', { happiness: -3, run: (c) => { c.p.city = pick(c.country.cities); } })]),
    ch('Sulk about leaving your friends', [o('The move was hard on you.', { happiness: -5, social: -1, run: (c) => { c.p.city = pick(c.country.cities); } })]),
  ], { when: P.parent, max: 1, weight: 0.6 }),
  ev('c_parents_argue', 'family', [5, 16], '🗯️', 'Raised Voices', 'You overhear your parents arguing late at night.', [
    ch('Pretend to sleep', [o('The next morning, everyone acted normal.', { happiness: -3 })]),
    ch('Ask them what is wrong', [o('They hugged you and promised to work things out.', { rel: ['parents', 4], happiness: 2 }, 2), o('They snapped at you to go to bed.', { happiness: -4, rel: ['parents', -2] }, 1)]),
  ], { when: (c) => c.p.background.household === 'two-parent' && P.mother(c) && P.father(c), max: 2 }),
  ev('c_fight_friend', 'social', [6, 15], '🥲', 'Falling Out', 'You and {friend} had a huge argument over something silly.', [
    ch('Apologise first', [o('{friend} forgave you instantly.', { social: 2, rel: ['friend', 8, 6] })]),
    ch('Wait for them to apologise', [o('Days of silence... eventually you made up.', { rel: ['friend', -4] }, 2), o('The friendship never recovered.', { rel: ['friend', -25, -15], happiness: -3 }, 1)]),
  ], { when: P.friend }),
  ev('c_allowance', 'money', [7, 13], '🪙', 'Pocket Money', 'You received some birthday money. What do you do?', [
    ch('Save it in a jar', [o('Your savings grew nicely.', { discipline: 3, money: 60, flag: { saver: true } })]),
    ch('Spend it all on treats', [o('Sweet! But it was gone in a day.', { happiness: 3, discipline: -1, money: 10 })]),
    ch('Buy a gift for {mother}', [o('She teared up with joy.', { rel: ['mother', 6, 3], happiness: 2 })], { when: P.mother }),
  ]),
  ev('c_videogames', 'hobby', [6, 15], '🎮', 'Game Obsession', 'A new video game has captured your attention completely.', [
    ch('Play every free minute', [o('You got really good — and a bit pale.', { happiness: 3, health: -2, intelligence: 1, discipline: -2 })]),
    ch('Limit yourself to weekends', [o('A healthy balance.', { happiness: 2, discipline: 2 })]),
    ch('Lose interest and go outside', [o('Fresh air did you good.', { health: 2, social: 1 })]),
  ], { max: 2 }),
  ev('c_lemonade', 'money', [7, 12], '🍋', 'Lemonade Stand', 'It is a scorching summer day. You decide to set up a lemonade stand.', [
    ch('Set up on the busiest corner', [o('You sold out and earned your first profit!', { money: 45, confidence: 3, skill: { business: 4 } }, 2), o('Rain ruined the day.', { happiness: -2, money: -5 }, 1)]),
    ch('Don\'t bother', [o('You relaxed in the shade.', { happiness: 1 })]),
  ]),
  ev('c_talent_show', 'school', [6, 15], '🌟', 'Talent Show', 'The school is holding a talent show.', [
    ch('Perform in front of everyone', [o('Standing ovation!', { confidence: 6, social: 3, skill: { creative: 3 } }, 1.5), o('Stage fright took over.', { confidence: -4 }, 1)], { when: P.inSchool }),
    ch('Be a spectator', [o('You cheered for your classmates.', { happiness: 2 })]),
  ]),
  ev('c_homework', 'school', [7, 13], '📖', 'Homework Mountain', 'This week is packed with assignments.', [
    ch('Do it all with care', [o('A+ effort.', { grades: 3, discipline: 3, intelligence: 1 })]),
    ch('Rush it', [o('Done, but sloppy.', { grades: -2, happiness: 1 })]),
    ch('Ask {mother} for help', [o('A nice study session together.', { grades: 2, rel: ['mother', 3] })], { when: P.mother }),
  ], { when: P.inSchool }),
  ev('c_school_trip', 'school', [6, 13], '🚌', 'Class Trip', 'Your class is going on a trip to a science museum.', [
    ch('Pay attention and take notes', [o('You learned loads.', { intelligence: 3 })]),
    ch('Mess around with friends', [o('Hilarious day.', { happiness: 4, social: 2, discipline: -1 })]),
  ], { when: P.inSchool }),
  ev('c_tooth', 'health', [5, 12], '🦷', 'Loose Tooth', 'Your tooth finally fell out!', [
    ch('Put it under the pillow', [o('The tooth fairy left a coin.', { happiness: 3, money: 5 })]),
  ]),
  ev('c_stage', 'social', [5, 12], '🎤', 'Show and Tell', 'It is your turn for show and tell.', [
    ch('Bring a cool object', [o('Everyone loved it.', { confidence: 3, social: 2 })]),
    ch('Tell a story', [o('You captivated the room.', { confidence: 3, intelligence: 1 }, 2), o('You got the giggles and could not stop.', { happiness: 2, confidence: -1 }, 1)]),
  ], { when: P.inSchool }),
  ev('c_swim', 'hobby', [5, 12], '🏊', 'Swim Lessons', 'Your family signs you up for swimming lessons.', [
    ch('Dive in', [o('By summer you were swimming laps.', { health: 4, skill: { athletic: 4 }, confidence: 2 })]),
    ch('Hide at the pool edge', [o('It took time, but you slowly got comfortable.', { health: 1, confidence: -1 })]),
  ], { max: 1 }),
  ev('c_teacher_praise', 'school', [6, 13], '👏', 'Teacher\'s Pet?', '{teacher} praised your work in front of the class.', [
    ch('Beam with pride', [o('You worked even harder.', { confidence: 4, grades: 2 })]),
    ch('Feel embarrassed', [o('You blushed but secretly loved it.', { confidence: 1 })]),
  ], { when: (c) => P.inSchool(c) && c.p.edu.grades >= 70 }),
  ev('c_broken_window', 'moral', [6, 12], '🪟', 'Crash!', 'Your ball sailed through a neighbour\'s window.', [
    ch('Own up and apologise', [o('The neighbour was kind. Your parents paid for the repair.', { discipline: 3, rel: ['parents', 1], flag: { learnedHonesty: true } })]),
    ch('Run away', [o('Nobody saw, but guilt gnawed at you.', { happiness: -3, discipline: -2 }, 2), o('A neighbour saw you and told your parents.', { rel: ['parents', -6, -8], happiness: -3 }, 1)]),
  ], { max: 1 }),
  ev('c_art', 'hobby', [4, 12], '🎨', 'Art Time', 'Your art teacher says you have real talent.', [
    ch('Sign up for the art club', [o('You love every session.', { skill: { creative: 6 }, happiness: 3, confidence: 2 })]),
    ch('Stick to football', [o('Art can wait.', { skill: { athletic: 2 } })]),
  ], { when: P.inSchool, max: 1 }),
  ev('c_coding', 'hobby', [8, 15], '🧩', 'Puzzle Brain', 'A family friend shows you a coding game for kids.', [
    ch('Get hooked', [o('You build your first tiny game!', { intelligence: 4, skill: { tech: 6 }, happiness: 3 })]),
    ch('Not your thing', [o('Back to cartoons.', { happiness: 1 })]),
  ], { max: 1, yearMin: 1995 }),
  // ---------------------------------------------------------------- teenage
  ev('t_crush', 'romance', [13, 17], '💘', 'A First Crush', 'You can\'t stop thinking about someone in your year.', [
    ch('Ask them out', [o('They said yes! You are officially going out.', { happiness: 8, confidence: 3, add: { rel: 'partner' } }, 1.4), o('They said no, kindly. It still hurt.', { happiness: -5, confidence: -3 }, 1.4)], { when: P.single }),
    ch('Admire from afar', [o('The crush faded over time.', { happiness: -1 })]),
    ch('Tell {friend} everything', [o('{friend} teased you but kept the secret.', { social: 2, rel: ['friend', 4] })], { when: P.friend }),
  ], { when: P.single, max: 2 }),
  ev('t_smoke', 'peer', [13, 17], '🚬', 'Peer Pressure', 'Older kids offer you a cigarette behind the bike shed.', [
    ch('Take a puff', [o('You coughed horribly. But it felt "cool".', { health: -2, social: 2, flag: { smoker: true }, sched: ['a_quit_smoking', 6, 20, 0.7] }, 1.3), o('It made you feel sick and you swore never again.', { health: -1, discipline: 1 }, 1)]),
    ch('Say no and walk away', [o('Some teased you, but you felt proud.', { confidence: 3, discipline: 2 })]),
  ], { when: P.noFlag('smoker'), weight: 1.1, max: 1 }),
  ev('a_quit_smoking', 'health', [18, 70], '🚭', 'Time to Quit?', 'Your smoking habit is starting to cost you — in health and in money.', [
    ch('Quit cold turkey', [o('It was brutal, but you did it.', { health: 4, discipline: 5, happiness: -2, flag: { smoker: false } }, 2), o('You relapsed after a month.', { discipline: -1, happiness: -2 }, 1.5)]),
    ch('Keep smoking', [o('You cut a few days off your future.', { health: -4 })]),
  ], { when: P.flag('smoker'), weight: 0, max: 5 }),
  ev('t_party', 'peer', [15, 17], '🎉', 'House Party', 'A classmate is throwing a house party. Alcohol will be there.', [
    ch('Go and drink', [o('You had fun — and a terrible hangover.', { happiness: 3, health: -3, social: 3, discipline: -2 }, 2), o('Things got out of hand and the police arrived.', { happiness: -3, rel: ['parents', -8, -8], flag: { partyTrouble: true } }, 1)]),
    ch('Go but stay sober', [o('You became the designated friend.', { social: 3, discipline: 2 })]),
    ch('Stay home and study', [o('You missed the gossip but aced the test.', { grades: 3, social: -1 })]),
  ], { when: P.inSchool }),
  ev('t_social', 'social', [13, 17], '📱', 'Going Viral?', 'A funny video you posted starts getting lots of views.', [
    ch('Lean into it', [o('You gained a following — and some haters.', { social: 4, confidence: 3, happiness: 2, appearance: 1 }, 1.5), o('The attention turned nasty and it hurt.', { happiness: -5, confidence: -3 }, 1)]),
    ch('Delete it', [o('Back to normal life.', { happiness: 0 })]),
  ], { yearMin: 2008, max: 2 }),
  ev('t_exam_stress', 'school', [14, 17], '😵', 'Exam Season', 'Final exams are coming and the pressure is building.', [
    ch('Study every night', [o('You were exhausted but well prepared.', { grades: 6, intelligence: 2, discipline: 3, happiness: -3, health: -1 })]),
    ch('Balance study with sleep and exercise', [o('Steady and sustainable.', { grades: 3, health: 2, happiness: 1 })]),
    ch('Cram the night before', [o('You scraped through.', { grades: -1, happiness: -2 }, 2), o('Disaster — you blanked in the exam.', { grades: -7, happiness: -4 }, 1)]),
  ], { when: P.inSchool, weight: 1.2 }),
  ev('t_pt_job', 'career', [15, 17], '💼', 'Your First Job Offer', 'The local café is hiring part-time staff.', [
    ch('Take the job', [o('You started earning your own money!', { money: 0, confidence: 3, discipline: 2, run: (c) => { if (!c.p.career.job) { const j = hire(c.g, careerById('pt_cafe')!); return `You are now a ${j.title}.`; } } })]),
    ch('Focus on school', [o('Good grades beat a pay cheque for now.', { grades: 2 })]),
  ], { when: (c) => !c.p.career.job && P.inSchool(c), max: 1 }),
  ev('t_driving', 'milestone', [16, 18], '🚗', 'Learner Driver', 'You are old enough to start driving lessons.', [
    ch('Take lessons seriously', [o('You passed first time!', { confidence: 5, happiness: 5, flag: { license: true } }, 2), o('You failed the test but passed next time.', { confidence: -1, flag: { license: true } }, 1)], { cost: 600 }),
    ch('Not interested', [o('Public transport it is.', { happiness: 0 })]),
  ], { when: P.noFlag('license'), max: 1 }),
  story('t_dance', 'social', [14, 17], '💃', 'School Dance', 'The big school dance is tonight.', 'Awkward and magical in equal parts.', { happiness: 4, social: 2 }, { when: P.inSchool }),
  ev('t_bad_report', 'school', [12, 17], '📉', 'Warning Letter', 'Your grades have slipped and the school sent a letter home.', [
    ch('Promise to turn things around', [o('You hit the books and improved.', { grades: 5, discipline: 3, rel: ['parents', 2] })]),
    ch('Blame the teachers', [o('Your parents were not impressed.', { rel: ['parents', -4], discipline: -2 })]),
  ], { when: (c) => P.inSchool(c) && c.p.edu.grades < 55 }),
  ev('t_friend_drama', 'social', [13, 17], '🙊', 'Group Chat Drama', 'A rumour about you is spreading in the group chat.', [
    ch('Confront the person who started it', [o('You cleared the air.', { confidence: 3, rel: ['friend', 2] }, 1.5), o('It blew up even more.', { happiness: -4, social: -2 }, 1)]),
    ch('Ignore it', [o('It blew over in a week.', { happiness: -1 })]),
  ], { yearMin: 2008, when: P.friend }),
  ev('t_sports_trial', 'hobby', [13, 17], '🏅', 'Trials Day', 'A scout is watching the school\'s sports trials.', [
    ch('Give it everything', [o('You impressed the scout!', { skill: { athletic: 8 }, confidence: 5, happiness: 4 }, 1), o('You pulled a muscle early on.', { health: -4, happiness: -2 }, 1)], { when: P.stat('health', 55) }),
    ch('Watch from the stands', [o('You enjoyed the show.', { happiness: 1 })]),
  ], { when: P.inSchool, max: 2 }),
  ev('t_coding_club', 'hobby', [13, 17], '🖥️', 'Coding Club', 'A teacher is starting a coding club.', [
    ch('Join up', [o('You built an app with your teammates.', { skill: { tech: 8 }, intelligence: 3, social: 2 })]),
    ch('Pass', [o('Maybe another time.', {})]),
  ], { when: P.inSchool, max: 1, yearMin: 1995 }),
  ev('t_volunteer', 'moral', [14, 17], '🤲', 'Volunteering Drive', 'A local charity needs volunteers for the weekend.', [
    ch('Volunteer', [o('A rewarding experience that looks good on applications.', { happiness: 4, social: 3, skill: { leadership: 3 }, flag: { volunteer: true } })]),
    ch('Spend weekends gaming', [o('You relaxed, but felt a little unproductive.', { happiness: 1, discipline: -1 })]),
  ]),
  ev('t_divorce', 'family', [8, 17], '💔', 'Parents Split', 'Your parents tell you they are getting divorced.', [
    ch('Stay strong for everyone', [o('It was hard but you found your footing.', { happiness: -6, discipline: 3, rel: ['parents', 1] })]),
    ch('Withdraw from everyone', [o('You felt lost for a long time.', { happiness: -10, social: -3, confidence: -3 })]),
    ch('Talk it through with a counsellor', [o('It helped to say things out loud.', { happiness: -3, confidence: 2 })], { cost: 250 }),
  ], { when: (c) => c.p.background.household === 'two-parent' && P.mother(c) && P.father(c), max: 1, weight: 0.5 }),
  ev('t_scholarship', 'school', [16, 17], '🏆', 'Scholarship Opportunity', 'Your teacher recommends you for a competitive scholarship.', [
    ch('Apply with a strong essay', [o('You won a scholarship!', { scholarship: 0.5, happiness: 8, confidence: 4 }, 1), o('You were not selected this time.', { happiness: -2 }, 2)], { when: (c) => c.p.edu.avg >= 70 && P.inSchool(c) }),
    ch('Skip it', [o('You moved on.', {})]),
  ], { max: 1 }),
  ev('t_vandal', 'crime', [13, 17], '🎨', 'Spray Can Dare', 'Your friends dare you to tag the school wall.', [
    ch('Do it', [o('You were caught on camera. Detention and a fine.', { crime: 1, discipline: -3, rel: ['parents', -6, -6], money: -150 }, 1.5), o('Nobody ever found out.', { social: 2, discipline: -2 }, 1)]),
    ch('Refuse', [o('They called you boring but you slept well.', { discipline: 2 })]),
  ], { when: P.inSchool, max: 1 }),
  ev('t_mirror', 'self', [13, 17], '🪞', 'Growing Pains', 'You are self-conscious about how you look compared to others online.', [
    ch('Focus on hobbies and health', [o('You felt stronger and more like yourself.', { confidence: 4, health: 2, happiness: 2 })]),
    ch('Talk to someone you trust', [o('It helped to hear you are not alone.', { confidence: 3, happiness: 2, rel: ['friend', 3] })]),
    ch('Keep comparing', [o('You felt worse each time.', { confidence: -4, happiness: -4 })]),
  ], { yearMin: 2008, max: 1 }),
  ev('t_mentor', 'school', [14, 17], '🧑‍🏫', 'A Teacher Believes in You', '{teacher} stays after class to say you have real potential.', [
    ch('Take extra lessons', [o('You thrived under their guidance.', { intelligence: 4, grades: 5, confidence: 3 })]),
    ch('Thank them and move on', [o('The compliment stayed with you.', { confidence: 2 })]),
  ], { when: P.inSchool, max: 1 }),
  ev('t_internship', 'career', [16, 17], '🧑‍💼', 'Summer Internship', 'A relative offers you a summer internship at their company.', [
    ch('Take it', [o('You got a taste of the working world.', { skill: { business: 4, communication: 3 }, confidence: 3, money: 400 })]),
    ch('Spend summer with friends', [o('A fun summer.', { happiness: 5, social: 2 })]),
  ], { when: P.inSchool, max: 1 }),
  ev('t_graduation_plan', 'milestone', [17, 17], '🎓', 'What Comes After School?', 'School is almost over. What are your plans?', [
    ch('Apply to university', [o('You started researching degrees. Open Education → Apply when ready.', { flag: { plan: 'university' }, discipline: 1 })]),
    ch('Learn a trade or vocational skill', [o('Hands-on training suits you. Check out vocational programmes under Education.', { flag: { plan: 'vocational' } })]),
    ch('Start working straight away', [o('You are ready to earn. Browse jobs under Career.', { flag: { plan: 'work' }, confidence: 1 })]),
    ch('Take a gap year', [o('You decided to explore before choosing.', { flag: { plan: 'gap' }, happiness: 3 })]),
  ], { force: true, max: 1 }),
  story('t_prom', 'milestone', [17, 17], '🎊', 'Prom Night', 'Prom night arrives — the end of an era.', 'You danced, laughed and took a hundred photos with your friends.', { happiness: 7, social: 2 }, { when: P.inSchool }),
  ev('t_gaming', 'hobby', [13, 17], '🕹️', 'Late Night Gaming', 'You keep staying up late to game with online friends.', [
    ch('Keep going — it is fun', [o('You made friends online but your grades suffered.', { happiness: 3, social: 1, grades: -3, health: -1, discipline: -2 })]),
    ch('Set a sensible limit', [o('Sleep and gaming in harmony.', { happiness: 2, discipline: 2 })]),
  ], { max: 2 }),
  ev('t_club', 'hobby', [13, 17], '🎯', 'Join a Club', 'The school has clubs for chess, debate and robotics.', [
    ch('Debate', [o('You learned to argue effectively.', { skill: { communication: 5 }, confidence: 3, social: 2 })]),
    ch('Chess', [o('Your strategic mind sharpened.', { intelligence: 4, discipline: 2 })]),
    ch('Robotics', [o('You built a robot that nearly worked.', { skill: { tech: 5 }, intelligence: 2, social: 1 })]),
  ], { when: P.inSchool, max: 2 }),
  ev('t_first_money', 'money', [13, 17], '💵', 'Odd Jobs', 'Neighbours offer you money for mowing lawns and dog-walking.', [
    ch('Build a little business', [o('You saved up a nice sum.', { money: 250, skill: { business: 3 }, discipline: 3 })]),
    ch('Just help once or twice', [o('A little extra cash.', { money: 40 })]),
  ], { max: 2 }),
  ev('t_dating_app_pressure', 'romance', [14, 17], '💬', 'Everyone\'s Dating', 'It feels like everyone around you has a boyfriend or girlfriend.', [
    ch('Take your time', [o('There is no rush — you enjoyed being yourself.', { confidence: 2, happiness: 1 })]),
    ch('Chase someone just to fit in', [o('It fizzled out within weeks.', { happiness: -3, confidence: -1 }, 1)]),
  ], { when: P.single, max: 1 }),
];
void all; void countryOf;

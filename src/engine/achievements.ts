import { livingChildren, netWorth, partnerOf, fullName } from './util';
import { careerById, EDU_RANK } from './data/careers';
import type { AchievementDef, GameState, MetaState } from './types';

const real = (g: GameState) => netWorth(g) / g.world.priceIndex;
const hasJob = (g: GameState, ...ids: string[]) => g.player.career.history.some((h) => ids.includes(h.careerId)) || (!!g.player.career.job && ids.includes(g.player.career.job.careerId));
const special = (g: GameState, s: string) => {
  const ids = [...g.player.career.history.map((h) => h.careerId), g.player.career.job?.careerId].filter(Boolean) as string[];
  return ids.some((id) => careerById(id)?.special === s);
};
const maxLevel = (g: GameState) => Math.max(g.player.career.job?.level ?? 0, ...g.player.career.history.map((h) => h.level), 0);

export const ACHIEVEMENTS: AchievementDef[] = [
  // ---- milestones of age
  { id: 'teen', name: 'Teenager', desc: 'Turn 13.', icon: '🎒', tier: 'bronze', check: (g) => g.player.age >= 13 },
  { id: 'adult', name: 'Coming of Age', desc: 'Turn 18.', icon: '🎉', tier: 'bronze', check: (g) => g.player.age >= 18 },
  { id: 'midlife', name: 'Halfway There', desc: 'Reach age 50.', icon: '🌗', tier: 'bronze', check: (g) => g.player.age >= 50 },
  { id: 'senior', name: 'Golden Years', desc: 'Reach age 70.', icon: '🌅', tier: 'silver', check: (g) => g.player.age >= 70 },
  { id: 'ninety', name: 'Nonagenarian', desc: 'Reach age 90.', icon: '🎂', tier: 'gold', check: (g) => g.player.age >= 90 },
  { id: 'centenarian', name: 'Centenarian', desc: 'Live to 100.', icon: '💯', tier: 'legendary', check: (g) => g.player.age >= 100 },
  // ---- education
  { id: 'secondary', name: 'Graduate', desc: 'Finish secondary school.', icon: '🎓', tier: 'bronze', check: (g) => EDU_RANK[g.player.edu.level] >= EDU_RANK.secondary },
  { id: 'bachelor', name: 'Bachelor\'s Degree', desc: 'Earn a university degree.', icon: '📜', tier: 'silver', check: (g) => g.player.edu.degrees.some((d) => d.level === 'bachelor' || d.level === 'master' || d.level === 'doctorate') },
  { id: 'master', name: 'Master of Arts & Sciences', desc: 'Earn a master\'s degree.', icon: '🧑‍🎓', tier: 'gold', check: (g) => g.player.edu.degrees.some((d) => d.level === 'master' || d.level === 'doctorate') },
  { id: 'doctor', name: 'Doctor', desc: 'Earn a doctorate.', icon: '🔬', tier: 'legendary', check: (g) => g.player.edu.degrees.some((d) => d.level === 'doctorate') },
  { id: 'honors', name: 'With Honours', desc: 'Graduate university with honours.', icon: '🏅', tier: 'gold', check: (g) => g.player.edu.degrees.some((d) => d.honors) },
  { id: 'valedictorian', name: 'Valedictorian', desc: 'Graduate secondary school as class valedictorian.', icon: '🥇', tier: 'gold', check: (g) => !!g.player.flags.valedictorian },
  { id: 'genius', name: 'Genius', desc: 'Reach 95 intelligence.', icon: '🧠', tier: 'gold', check: (g) => g.player.stats.intelligence >= 95 },
  // ---- career
  { id: 'firstjob', name: 'Pay Day', desc: 'Get your first job.', icon: '💼', tier: 'bronze', check: (g) => !!g.player.career.job || g.player.career.history.length > 0 },
  { id: 'topdog', name: 'Top of the Ladder', desc: 'Reach the highest level in a career.', icon: '🪜', tier: 'gold', check: (g) => maxLevel(g) >= 4 },
  { id: 'ceo', name: 'Corner Office', desc: 'Become a CEO.', icon: '🏢', tier: 'legendary', check: (g) => special(g, 'ceo') },
  { id: 'politician', name: 'Public Servant', desc: 'Win a political career.', icon: '🏛️', tier: 'gold', check: (g) => special(g, 'politician') },
  { id: 'athlete', name: 'Going Pro', desc: 'Become a professional athlete.', icon: '🏆', tier: 'gold', check: (g) => special(g, 'athlete') },
  { id: 'founder', name: 'Founder', desc: 'Start your own business.', icon: '🚀', tier: 'silver', check: (g) => !!g.player.career.business || hasJob(g, 'entrepreneur') },
  { id: 'veteran', name: 'Seasoned Pro', desc: 'Work for 30 years.', icon: '⏳', tier: 'silver', check: (g) => g.player.career.totalYears >= 30 },
  { id: 'retired', name: 'Retirement Party', desc: 'Retire from work.', icon: '🏖️', tier: 'silver', check: (g) => g.player.career.retired },
  { id: 'earlyretire', name: 'FIRE', desc: 'Retire before 55 with financial independence.', icon: '🔥', tier: 'legendary', check: (g) => typeof g.player.flags.earlyRetire === 'number' },
  { id: 'polymath', name: 'Jack of All Trades', desc: 'Reach 50 in four different skills.', icon: '🧰', tier: 'gold', check: (g) => Object.values(g.player.skills).filter((v) => v >= 50).length >= 4 },
  // ---- money
  { id: 'saver', name: 'Rainy Day Fund', desc: 'Reach a net worth of $10,000 (inflation-adjusted).', icon: '🐖', tier: 'bronze', check: (g) => real(g) >= 10000 },
  { id: 'hundredk', name: 'Six Figures', desc: 'Reach a net worth of $100,000.', icon: '💵', tier: 'silver', check: (g) => real(g) >= 100000 },
  { id: 'millionaire', name: 'Millionaire', desc: 'Reach a net worth of $1,000,000.', icon: '💰', tier: 'gold', check: (g) => real(g) >= 1000000 },
  { id: 'tenmillion', name: 'Tycoon', desc: 'Reach a net worth of $10,000,000.', icon: '🏰', tier: 'legendary', check: (g) => real(g) >= 10000000 },
  { id: 'selfmade', name: 'Self-Made', desc: 'Become a millionaire without inheriting a fortune.', icon: '🛠️', tier: 'legendary', check: (g) => real(g) >= 1000000 && g.player.fin.totalInherited < 100000 && g.player.generation >= 1 },
  { id: 'homeowner', name: 'Home Sweet Home', desc: 'Buy a property.', icon: '🏠', tier: 'silver', check: (g) => g.player.fin.properties.length > 0 },
  { id: 'landlord', name: 'Landlord', desc: 'Own three properties at once.', icon: '🏘️', tier: 'gold', check: (g) => g.player.fin.properties.length >= 3 },
  { id: 'investor', name: 'Market Mind', desc: 'Hold $50,000 in investments.', icon: '📈', tier: 'silver', check: (g) => g.player.fin.holdings.reduce((s, h) => s + h.value, 0) / g.world.priceIndex >= 50000 },
  { id: 'philanthropist', name: 'Philanthropist', desc: 'Donate $50,000 to good causes.', icon: '🎗️', tier: 'gold', check: (g) => g.player.fin.donated / g.world.priceIndex >= 50000 },
  { id: 'phoenix', name: 'Phoenix', desc: 'Go bankrupt, then rebuild a net worth of $100,000.', icon: '🔥', tier: 'gold', check: (g) => !!g.player.flags.bankrupt && real(g) >= 100000 },
  { id: 'lucky', name: 'Lucky Day', desc: 'Win the lottery jackpot.', icon: '🍀', tier: 'silver', check: (g) => !!g.player.flags.jackpot },
  { id: 'survivor', name: 'Against the Odds', desc: 'Suffer 3 years of hardship and still end up comfortable.', icon: '🧗', tier: 'gold', check: (g) => (Number(g.player.flags.hardshipYears) || 0) >= 3 && real(g) >= 150000 },
  // ---- family & social
  { id: 'inlove', name: 'In Love', desc: 'Start a relationship.', icon: '💞', tier: 'bronze', check: (g) => !!partnerOf(g.player) || !!g.player.flags.hadPartner },
  { id: 'married', name: 'Tied the Knot', desc: 'Get married.', icon: '💍', tier: 'silver', check: (g) => g.player.people.some((x) => x.relation === 'spouse' || x.relation === 'exSpouse') },
  { id: 'parent', name: 'Parenthood', desc: 'Have a child.', icon: '👶', tier: 'silver', check: (g) => g.player.people.some((x) => x.relation === 'child') },
  { id: 'bigfamily', name: 'Full House', desc: 'Raise four or more children.', icon: '👨‍👩‍👧‍👦', tier: 'gold', check: (g) => g.player.people.filter((x) => x.relation === 'child').length >= 4 },
  { id: 'grandparent', name: 'Grandparent', desc: 'Welcome a grandchild.', icon: '👵', tier: 'silver', check: (g) => !!g.player.flags.grandparent },
  { id: 'divorced', name: 'Fresh Start', desc: 'Go through a divorce.', icon: '💔', tier: 'bronze', check: (g) => g.player.people.some((x) => x.relation === 'exSpouse') },
  { id: 'social', name: 'Social Butterfly', desc: 'Reach 90 social and have 5 close friends.', icon: '🦋', tier: 'gold', check: (g) => g.player.stats.social >= 90 && g.player.people.filter((x) => x.relation === 'friend' && x.alive && x.closeness >= 60).length >= 5 },
  { id: 'petlover', name: 'Best Friend', desc: 'Adopt a pet.', icon: '🐕', tier: 'bronze', check: (g) => !!g.player.flags.hadPet },
  // ---- life
  { id: 'world', name: 'Globetrotter', desc: 'Visit 10 different countries.', icon: '🌍', tier: 'gold', check: (g) => new Set(g.player.visited).size >= 10 },
  { id: 'abroad', name: 'New Horizons', desc: 'Move to another country.', icon: '🛫', tier: 'silver', check: (g) => g.player.countryId !== g.player.birthCountry },
  { id: 'fit', name: 'Peak Condition', desc: 'Reach 95 health after age 30.', icon: '💪', tier: 'gold', check: (g) => g.player.age >= 30 && g.player.stats.health >= 95 },
  { id: 'beauty', name: 'Head Turner', desc: 'Reach 95 appearance.', icon: '✨', tier: 'silver', check: (g) => g.player.stats.appearance >= 95 },
  { id: 'cancer', name: 'Survivor', desc: 'Beat a serious illness.', icon: '🎗️', tier: 'silver', check: (g) => !!g.player.flags.survivor },
  { id: 'blacksheep', name: 'Black Sheep', desc: 'Acquire a criminal record.', icon: '🐑', tier: 'bronze', check: (g) => !!g.player.flags.criminalRecord },
  { id: 'happy', name: 'Joy of Living', desc: 'Reach 95 happiness.', icon: '😄', tier: 'silver', check: (g) => g.player.stats.happiness >= 95 },
  // ---- generational
  { id: 'heir', name: 'Heir Apparent', desc: 'Continue a dynasty as a child.', icon: '🌱', tier: 'silver', check: (g) => g.player.generation >= 2 },
  { id: 'dynasty3', name: 'Three Generations', desc: 'Play a third generation.', icon: '🌳', tier: 'gold', check: (g) => g.player.generation >= 3 },
  { id: 'dynasty5', name: 'A Great House', desc: 'Play five generations.', icon: '👑', tier: 'legendary', check: (g) => g.player.generation >= 5 },
  { id: 'legacy', name: 'Inheritance', desc: 'Inherit $100,000 or more.', icon: '📜', tier: 'silver', check: (g) => g.player.fin.totalInherited >= 100000 },
];

export const achievementById = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);

/**
 * Evaluate every achievement; newly unlocked ones are recorded on the meta profile and the
 * character, and returned so the UI can toast them.
 */
export function checkAchievements(g: GameState, meta: MetaState): AchievementDef[] {
  const out: AchievementDef[] = [];
  const p = g.player;
  const unlock = (a: AchievementDef) => {
    const first = !meta.unlocked[a.id];
    if (first) { meta.unlocked[a.id] = { at: new Date().toISOString(), who: fullName(p), age: p.age }; out.push(a); }
    if (!p.achievements.includes(a.id)) {
      p.achievements.push(a.id);
      p.journal.push({ id: `ach_${a.id}_${g.year}`, age: p.age, year: g.year, kind: 'achievement', tone: 'good', text: `${a.icon} Achievement unlocked: ${a.name}` });
    }
  };
  for (const a of ACHIEVEMENTS) {
    if (p.achievements.includes(a.id)) continue;
    let pass = false;
    try { pass = a.check(g, meta); } catch { pass = false; }
    if (pass) unlock(a);
  }
  // event-granted achievements (flag `ach_<id>`)
  for (const k of Object.keys(p.flags)) {
    if (!k.startsWith('ach_')) continue;
    const a = achievementById(k.slice(4));
    if (a && !p.achievements.includes(a.id)) unlock(a);
  }
  void livingChildren;
  return out;
}

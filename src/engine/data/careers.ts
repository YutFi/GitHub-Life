import type { CareerDef, DegreeDef, EduLevel } from '../types';

export const EDU_RANK: Record<EduLevel, number> = { none: 0, primary: 1, secondary: 2, vocational: 3, bachelor: 4, master: 5, doctorate: 6 };
export const EDU_NAME: Record<EduLevel, string> = {
  none: 'No formal education', primary: 'Primary school', secondary: 'Secondary school', vocational: 'Vocational diploma',
  bachelor: "Bachelor's degree", master: "Master's degree", doctorate: 'Doctorate / professional degree',
};

export const FIELDS: Record<string, { name: string; icon: string }> = {
  cs: { name: 'Computer Science', icon: '💻' }, data: { name: 'Data Science & Statistics', icon: '📊' },
  eng: { name: 'Engineering', icon: '⚙️' }, business: { name: 'Business', icon: '💼' },
  econ: { name: 'Economics & Finance', icon: '📈' }, nursing: { name: 'Nursing & Health', icon: '🩺' },
  edu: { name: 'Education', icon: '🍎' }, psych: { name: 'Psychology', icon: '🧠' },
  science: { name: 'Natural Sciences', icon: '🔬' }, arts: { name: 'Fine Arts & Design', icon: '🎨' },
  comms: { name: 'Communications & Media', icon: '🎙️' }, arch: { name: 'Architecture', icon: '🏛️' },
  human: { name: 'Humanities', icon: '📚' }, med: { name: 'Medicine', icon: '⚕️' }, law: { name: 'Law', icon: '⚖️' },
  dent: { name: 'Dentistry', icon: '🦷' }, trade: { name: 'Skilled Trade', icon: '🔧' }, aviation: { name: 'Aviation', icon: '✈️' },
  culinary: { name: 'Culinary Arts', icon: '🍳' },
};

const B = (id: string, field: string, difficulty: number, skill: DegreeDef['skill'], cost = 1): DegreeDef => ({
  id: `bsc_${id}`, name: `${FIELDS[field].name} (Bachelor)`, field, level: 'bachelor', years: 4, difficulty, cost, skill,
});

export const DEGREES: DegreeDef[] = [
  // Vocational
  { id: 'voc_trade', name: 'Electrical & Mechanical Trades Diploma', field: 'trade', level: 'vocational', years: 2, difficulty: 6, cost: 1, skill: 'trades' },
  { id: 'voc_aviation', name: 'Commercial Pilot Licence', field: 'aviation', level: 'vocational', years: 2, difficulty: 16, cost: 3.2, skill: 'trades' },
  { id: 'voc_culinary', name: 'Culinary Arts Diploma', field: 'culinary', level: 'vocational', years: 2, difficulty: 6, cost: 1.1, skill: 'creative' },
  { id: 'voc_nursing', name: 'Nursing Diploma', field: 'nursing', level: 'vocational', years: 2, difficulty: 12, cost: 1, skill: 'medical' },
  // Bachelors
  B('cs', 'cs', 18, 'tech', 1.0), B('data', 'data', 18, 'tech', 1.0), B('eng', 'eng', 20, 'trades', 1.05),
  B('business', 'business', 10, 'business', 1.0), B('econ', 'econ', 14, 'business', 1.0), B('nursing', 'nursing', 14, 'medical', 1.0),
  B('edu', 'edu', 8, 'communication', 0.9), B('psych', 'psych', 11, 'communication', 0.95), B('science', 'science', 17, 'medical', 1.0),
  B('arts', 'arts', 6, 'creative', 0.95), B('comms', 'comms', 8, 'communication', 0.95), B('arch', 'arch', 18, 'creative', 1.0),
  B('human', 'human', 8, 'communication', 0.9),
  // Professional doctorates
  { id: 'doc_med', name: 'Doctor of Medicine (MD)', field: 'med', level: 'doctorate', years: 5, difficulty: 28, cost: 2.6, skill: 'medical', requires: '*' },
  { id: 'doc_law', name: 'Juris Doctor (Law School)', field: 'law', level: 'doctorate', years: 3, difficulty: 22, cost: 2.1, skill: 'communication', requires: '*' },
  { id: 'doc_dent', name: 'Doctor of Dental Surgery', field: 'dent', level: 'doctorate', years: 4, difficulty: 24, cost: 2.4, skill: 'medical', requires: '*' },
  // Masters (generated below) + PhDs
];

// Master's & PhD in every academic bachelor field
for (const f of ['cs', 'data', 'eng', 'business', 'econ', 'nursing', 'edu', 'psych', 'science', 'arts', 'comms', 'arch', 'human']) {
  const base = DEGREES.find((d) => d.field === f && d.level === 'bachelor')!;
  DEGREES.push({
    id: `msc_${f}`, name: f === 'business' ? 'MBA (Master of Business Administration)' : `${FIELDS[f].name} (Master's)`, field: f, level: 'master',
    years: 2, difficulty: base.difficulty + 4, cost: 1.15, skill: base.skill, requires: f,
  });
  DEGREES.push({
    id: `phd_${f}`, name: `PhD in ${FIELDS[f].name}`, field: f, level: 'doctorate', years: 4, difficulty: base.difficulty + 9, cost: 0.5, skill: base.skill, requires: f,
  });
}

export const degreeById = (id: string) => DEGREES.find((d) => d.id === id);

// ------------------------------------------------------------------------- careers
const C = (
  id: string, title: string, industry: string, icon: string, minEdu: EduLevel, salary: number,
  skill: CareerDef['skill'], skillMin: number, prestige: number, stress: number, desc: string, extra: Partial<CareerDef> = {},
): CareerDef => ({ id, title, industry, icon, minEdu, minAge: 18, salary, skill, skillMin, prestige, stress, layoffRisk: 1, desc, ...extra });

export const CAREERS: CareerDef[] = [
  // ---- Technology
  C('software_dev', 'Software Developer', 'Technology', '💻', 'bachelor', 78000, 'tech', 35, 12, 5, 'Design and build software products.', { fields: ['cs', 'eng', 'data', 'science'], layoffRisk: 1.1 }),
  C('data_analyst', 'Data Analyst', 'Technology', '📊', 'bachelor', 62000, 'tech', 25, 9, 4, 'Turn raw data into decisions.', { fields: ['data', 'cs', 'econ', 'business', 'science', 'eng'] }),
  C('data_scientist', 'Data Scientist', 'Technology', '🧪', 'master', 98000, 'tech', 45, 15, 5, 'Build models that predict the future.', { fields: ['data', 'cs', 'science', 'eng', 'econ'] }),
  C('cyber_analyst', 'Cybersecurity Analyst', 'Technology', '🛡️', 'bachelor', 80000, 'tech', 40, 13, 6, 'Defend systems from attackers.', { fields: ['cs', 'eng', 'data'] }),
  C('it_support', 'IT Support Specialist', 'Technology', '🖥️', 'secondary', 38000, 'tech', 15, 3, 3, 'Keep everyone online and happy.'),
  // ---- Engineering & science
  C('engineer', 'Engineer', 'Engineering', '⚙️', 'bachelor', 74000, 'trades', 35, 12, 5, 'Solve technical problems at scale.', { fields: ['eng', 'science'] }),
  C('civil_engineer', 'Civil Engineer', 'Engineering', '🏗️', 'bachelor', 70000, 'trades', 30, 10, 5, 'Design bridges, roads and cities.', { fields: ['eng', 'arch'] }),
  C('architect', 'Architect', 'Engineering', '🏛️', 'bachelor', 66000, 'creative', 35, 12, 5, 'Shape the skyline.', { fields: ['arch', 'arts'] }),
  C('scientist', 'Research Scientist', 'Science', '🔬', 'master', 72000, 'medical', 40, 13, 4, 'Push the frontiers of knowledge.', { fields: ['science', 'data', 'eng', 'psych', 'nursing'] }),
  C('pilot', 'Airline Pilot', 'Transport', '✈️', 'vocational', 95000, 'trades', 45, 18, 6, 'Command aircraft across continents.', { fields: ['aviation'], minAge: 21, maxAge: 65, stats: { health: 60 }, ladder: ['Cadet Pilot', 'First Officer', 'Senior First Officer', 'Captain', 'Senior Captain'] }),
  // ---- Healthcare
  C('doctor', 'Doctor', 'Healthcare', '⚕️', 'doctorate', 150000, 'medical', 55, 24, 8, 'Heal patients and save lives.', { fields: ['med'], minAge: 24, ladder: ['Resident', 'Doctor', 'Senior Doctor', 'Consultant', 'Chief Physician'], layoffRisk: 0.3 }),
  C('dentist', 'Dentist', 'Healthcare', '🦷', 'doctorate', 130000, 'medical', 50, 20, 5, 'Care for smiles.', { fields: ['dent'], minAge: 24, layoffRisk: 0.4 }),
  C('nurse', 'Nurse', 'Healthcare', '🩺', 'vocational', 55000, 'medical', 25, 8, 7, 'Frontline patient care.', { fields: ['nursing'], layoffRisk: 0.4, ladder: ['Junior Nurse', 'Staff Nurse', 'Senior Nurse', 'Nurse Manager', 'Chief Nursing Officer'] }),
  C('pharmacist', 'Pharmacist', 'Healthcare', '💊', 'bachelor', 78000, 'medical', 35, 13, 4, 'Dispense medicine and advice.', { fields: ['science', 'nursing'], layoffRisk: 0.6 }),
  C('psychologist', 'Psychologist', 'Healthcare', '🧠', 'master', 68000, 'communication', 40, 14, 5, 'Help people through hard times.', { fields: ['psych'], layoffRisk: 0.6 }),
  // ---- Education
  C('teacher', 'Teacher', 'Education', '🍎', 'bachelor', 46000, 'communication', 25, 6, 5, 'Shape young minds.', { fields: ['edu', 'human', 'science', 'psych', 'comms', 'arts'], layoffRisk: 0.5, ladder: ['Trainee Teacher', 'Teacher', 'Senior Teacher', 'Head of Department', 'Principal'] }),
  C('professor', 'University Professor', 'Education', '🎓', 'doctorate', 88000, 'communication', 50, 20, 5, 'Research and teach at university.', { fields: ['cs', 'data', 'eng', 'business', 'econ', 'nursing', 'edu', 'psych', 'science', 'arts', 'comms', 'arch', 'human'], ladder: ['Lecturer', 'Senior Lecturer', 'Associate Professor', 'Professor', 'Distinguished Professor'], layoffRisk: 0.3 }),
  // ---- Business & finance
  C('accountant', 'Accountant', 'Finance', '🧾', 'bachelor', 58000, 'business', 25, 8, 5, 'Keep the books straight.', { fields: ['business', 'econ', 'data'] }),
  C('fin_analyst', 'Financial Analyst', 'Finance', '💹', 'bachelor', 72000, 'business', 35, 12, 6, 'Model markets and companies.', { fields: ['econ', 'business', 'data', 'eng'] }),
  C('banker', 'Investment Banker', 'Finance', '🏦', 'bachelor', 110000, 'business', 50, 22, 9, 'Deals, deadlines and big bonuses.', { fields: ['econ', 'business'], layoffRisk: 1.5, ladder: ['Analyst', 'Associate', 'Vice President', 'Director', 'Managing Director'] }),
  C('consultant', 'Management Consultant', 'Business', '📋', 'bachelor', 88000, 'business', 40, 17, 8, 'Advise executives on strategy.', { anyDegree: true, layoffRisk: 1.1 }),
  C('marketing_mgr', 'Marketing Manager', 'Business', '📣', 'bachelor', 64000, 'communication', 28, 9, 6, 'Build brands people love.', { anyDegree: true }),
  C('ops_mgr', 'Operations Manager', 'Business', '🏭', 'bachelor', 68000, 'leadership', 28, 10, 6, 'Make the machine run smoothly.', { anyDegree: true }),
  C('hr_mgr', 'HR Manager', 'Business', '🤝', 'bachelor', 60000, 'communication', 25, 8, 5, 'People, culture and compliance.', { anyDegree: true, layoffRisk: 0.9 }),
  C('sales_rep', 'Sales Representative', 'Business', '📞', 'secondary', 42000, 'communication', 20, 5, 6, 'Hit your number, earn commission.', { layoffRisk: 1.2 }),
  C('real_estate', 'Real Estate Agent', 'Business', '🏠', 'secondary', 46000, 'communication', 25, 6, 5, 'Match people with places.', { volatile: true }),
  C('entrepreneur', 'Entrepreneur', 'Business', '🚀', 'none', 40000, 'business', 20, 0, 9, 'Build a company from nothing.', { special: 'business', volatile: true, layoffRisk: 0, ladder: ['Founder', 'Founder & CEO', 'Serial Founder', 'Business Mogul', 'Industry Titan'] }),
  C('ceo', 'Chief Executive Officer', 'Business', '👔', 'bachelor', 260000, 'leadership', 65, 25, 9, 'Run an entire company.', { special: 'ceo', minAge: 35, anyDegree: true, ladder: ['Junior CEO', 'CEO', 'CEO of Large Firm', 'CEO of Major Corporation', 'Global CEO'], layoffRisk: 0.5 }),
  // ---- Law, government, protection
  C('lawyer', 'Lawyer', 'Law', '⚖️', 'doctorate', 105000, 'communication', 50, 21, 8, 'Argue, advise and negotiate.', { fields: ['law'], minAge: 24, ladder: ['Associate', 'Senior Associate', 'Partner', 'Senior Partner', 'Managing Partner'] }),
  C('police', 'Police Officer', 'Public Service', '👮', 'secondary', 52000, 'athletic', 20, 8, 8, 'Protect and serve.', { minAge: 21, maxAge: 55, stats: { health: 55 }, ladder: ['Constable', 'Officer', 'Sergeant', 'Lieutenant', 'Chief of Police'], layoffRisk: 0.3 }),
  C('firefighter', 'Firefighter', 'Public Service', '🚒', 'secondary', 48000, 'athletic', 25, 9, 8, 'Run toward the danger.', { minAge: 20, maxAge: 55, stats: { health: 65 }, layoffRisk: 0.3 }),
  C('soldier', 'Military Officer', 'Public Service', '🎖️', 'secondary', 46000, 'athletic', 25, 10, 8, 'Serve your country.', { minAge: 18, maxAge: 50, stats: { health: 60, discipline: 45 }, ladder: ['Private', 'Corporal', 'Lieutenant', 'Colonel', 'General'], layoffRisk: 0.2 }),
  C('civil_servant', 'Civil Servant', 'Public Service', '🏛️', 'bachelor', 54000, 'business', 20, 7, 3, 'Keep government running.', { anyDegree: true, layoffRisk: 0.35 }),
  C('politician', 'Politician', 'Public Service', '🗳️', 'bachelor', 62000, 'communication', 45, 25, 9, 'Win votes. Change laws.', { special: 'politician', minAge: 25, anyDegree: true, stats: { social: 60, confidence: 55 }, ladder: ['Local Councillor', 'Mayor', 'Legislator', 'Cabinet Minister', 'Head of Government'], layoffRisk: 0.7 }),
  // ---- Creative & media
  C('artist', 'Artist', 'Creative', '🎨', 'none', 30000, 'creative', 30, 3, 3, 'Make art; hope someone buys it.', { volatile: true, layoffRisk: 0 }),
  C('musician', 'Musician', 'Creative', '🎸', 'none', 28000, 'creative', 35, 4, 4, 'Play gigs and chase the hit.', { volatile: true, layoffRisk: 0 }),
  C('writer', 'Author', 'Creative', '✍️', 'none', 34000, 'creative', 30, 5, 3, 'Write the next bestseller.', { volatile: true, layoffRisk: 0 }),
  C('actor', 'Actor', 'Creative', '🎭', 'none', 36000, 'creative', 35, 9, 6, 'Audition, perform, repeat.', { volatile: true, stats: { appearance: 45 }, layoffRisk: 0 }),
  C('designer', 'Graphic Designer', 'Creative', '🖌️', 'bachelor', 52000, 'creative', 30, 7, 4, 'Make things look incredible.', { fields: ['arts', 'comms', 'arch', 'cs'] }),
  C('journalist', 'Journalist', 'Media', '📰', 'bachelor', 50000, 'communication', 30, 8, 6, 'Find the story and tell it.', { fields: ['comms', 'human', 'psych', 'econ'], layoffRisk: 1.3 }),
  C('athlete', 'Professional Athlete', 'Sports', '🏅', 'none', 60000, 'athletic', 55, 15, 7, 'Compete at the highest level.', { special: 'athlete', minAge: 16, maxAge: 40, volatile: true, stats: { health: 70 }, ladder: ['Amateur', 'Semi-Pro', 'Professional', 'Star Player', 'Sporting Legend'], layoffRisk: 0 }),
  C('chef', 'Chef', 'Hospitality', '🍳', 'vocational', 40000, 'creative', 25, 7, 8, 'Heat, pressure and flavour.', { fields: ['culinary'], ladder: ['Line Cook', 'Sous Chef', 'Head Chef', 'Executive Chef', 'Celebrity Chef'] }),
  // ---- Trades & services
  C('electrician', 'Electrician', 'Trades', '⚡', 'vocational', 54000, 'trades', 25, 7, 5, 'Keep the lights on.', { fields: ['trade'], layoffRisk: 0.6 }),
  C('mechanic', 'Mechanic', 'Trades', '🔧', 'vocational', 44000, 'trades', 20, 5, 4, 'Fix what is broken.', { fields: ['trade'], layoffRisk: 0.7 }),
  C('construction', 'Construction Worker', 'Trades', '👷', 'none', 38000, 'athletic', 15, 2, 6, 'Build it with your hands.', { stats: { health: 45 }, layoffRisk: 1.2 }),
  C('driver', 'Delivery Driver', 'Transport', '🚚', 'secondary', 34000, 'trades', 10, 2, 4, 'Always on the road.', { minAge: 18, layoffRisk: 1.1 }),
  C('farmer', 'Farmer', 'Agriculture', '🌾', 'none', 32000, 'trades', 20, 3, 6, 'Grow the food that feeds everyone.', { volatile: true, layoffRisk: 0 }),
  C('security', 'Security Guard', 'Services', '🔦', 'secondary', 31000, 'athletic', 10, 2, 3, 'Watch the doors.', { layoffRisk: 0.9 }),
  C('retail', 'Retail Associate', 'Services', '🛒', 'none', 27000, 'communication', 5, 1, 4, 'Customer-facing, always busy.', { layoffRisk: 1.4, ladder: ['Sales Assistant', 'Team Lead', 'Assistant Manager', 'Store Manager', 'Regional Manager'] }),
  C('barista', 'Barista / Server', 'Hospitality', '☕', 'none', 25000, 'communication', 5, 1, 4, 'Coffee, plates and small talk.', { layoffRisk: 1.5, ladder: ['Server', 'Senior Server', 'Shift Lead', 'Venue Manager', 'Hospitality Director'] }),
  // ---- Creator economy (freelance: allowed while studying; income follows your audience)
  C('content_creator', 'Influencer / Content Creator', 'Creator Economy', '📱', 'none', 4000, 'creative', 10, 2, 5, 'Build an audience with photos, short videos and personality. Brand deals follow the followers.', { minAge: 15, special: 'creator', freelance: true, volatile: true, layoffRisk: 0, ladder: ['Aspiring Creator', 'Micro-Influencer', 'Rising Influencer', 'Top Influencer', 'Global Superstar'] }),
  C('streamer', 'Live Streamer', 'Creator Economy', '🎮', 'none', 3500, 'communication', 10, 2, 5, 'Go live, chat with your community and earn from subs, tips and sponsors.', { minAge: 15, special: 'creator', freelance: true, volatile: true, layoffRisk: 0, ladder: ['Hobby Streamer', 'Affiliate Streamer', 'Partnered Streamer', 'Top Streamer', 'Streaming Legend'] }),
  C('youtuber', 'Video Creator', 'Creator Economy', '🎬', 'none', 3800, 'creative', 12, 2, 5, 'Make videos people want to watch, then turn views into income.', { minAge: 15, special: 'creator', freelance: true, volatile: true, layoffRisk: 0, ladder: ['New Channel', 'Growing Channel', 'Established Creator', 'Top Creator', 'Platform Icon'] }),
  C('podcaster', 'Podcaster', 'Creator Economy', '🎙️', 'none', 3000, 'communication', 12, 2, 3, 'Talk for a living, one episode at a time.', { minAge: 16, special: 'creator', freelance: true, volatile: true, layoffRisk: 0, ladder: ['Podcast Hobbyist', 'Indie Host', 'Network Host', 'Top Host', 'Audio Legend'] }),
  C('social_mgr', 'Social Media Manager', 'Creator Economy', '📣', 'secondary', 36000, 'communication', 15, 3, 5, 'Run brand accounts, schedule content and chase engagement.', { freelance: true, layoffRisk: 0.6 }),
  C('fl_editor', 'Video Editor', 'Creator Economy', '🎞️', 'none', 30000, 'creative', 20, 3, 4, 'Cut footage for creators and brands.', { minAge: 16, freelance: true, volatile: true, layoffRisk: 0 }),
  C('fl_photo', 'Photographer', 'Creator Economy', '📸', 'none', 28000, 'creative', 20, 4, 3, 'Weddings, events, products and portraits.', { minAge: 16, freelance: true, volatile: true, layoffRisk: 0 }),
  C('model', 'Model', 'Creator Economy', '🧍', 'none', 26000, 'creative', 5, 6, 5, 'Shoots, shows and campaigns. A career with an expiry date.', { minAge: 16, maxAge: 45, freelance: true, volatile: true, stats: { appearance: 68 }, layoffRisk: 0, ladder: ['Fresh Face', 'Working Model', 'Agency Model', 'Top Model', 'Supermodel'] }),
  C('dj', 'DJ / Music Producer', 'Creator Economy', '🎧', 'none', 24000, 'creative', 25, 4, 4, 'Spin sets at clubs and release your own tracks.', { minAge: 16, freelance: true, volatile: true, layoffRisk: 0, ladder: ['Bedroom DJ', 'Club DJ', 'Resident DJ', 'Festival Headliner', 'World Tour Act'] }),
  C('esports', 'Esports Pro', 'Creator Economy', '🕹️', 'none', 36000, 'tech', 40, 9, 7, 'Compete for prize money and sponsors. Reflexes fade, so careers are short.', { minAge: 16, maxAge: 33, freelance: true, volatile: true, stats: { intelligence: 50 }, layoffRisk: 0, ladder: ['Amateur', 'Semi-Pro', 'Pro Player', 'Team Captain', 'World Champion'] }),
  C('talent_agent', 'Talent Manager', 'Creator Economy', '🤝', 'secondary', 52000, 'business', 25, 8, 6, 'Manage creators, negotiate deals and take your cut.', { layoffRisk: 0.9 }),
  C('media_producer', 'Media Producer', 'Creator Economy', '🎥', 'bachelor', 58000, 'creative', 30, 9, 6, 'Produce shows, films and branded content.', { anyDegree: true, layoffRisk: 1.1 }),
  C('pr_mgr', 'PR & Brand Manager', 'Creator Economy', '📰', 'bachelor', 62000, 'communication', 28, 9, 6, 'Shape stories and protect reputations.', { anyDegree: true, layoffRisk: 0.9 }),
  // ---- Freelance & gig work (allowed while studying)
  C('fl_writer', 'Freelance Writer', 'Freelance', '✍️', 'none', 30000, 'communication', 15, 3, 3, 'Articles, copy and ghostwriting on your own schedule.', { minAge: 16, freelance: true, volatile: true, layoffRisk: 0 }),
  C('fl_designer', 'Freelance Designer', 'Freelance', '🎨', 'none', 34000, 'creative', 20, 3, 3, 'Logos, posters and websites for clients.', { minAge: 16, freelance: true, volatile: true, layoffRisk: 0 }),
  C('fl_dev', 'Freelance Developer', 'Freelance', '🧑‍💻', 'none', 42000, 'tech', 25, 4, 4, 'Build websites and apps for small clients.', { minAge: 16, freelance: true, volatile: true, layoffRisk: 0 }),
  C('fl_translator', 'Translator', 'Freelance', '🌐', 'secondary', 32000, 'communication', 20, 3, 3, 'Move words between languages.', { minAge: 17, freelance: true, volatile: true, layoffRisk: 0 }),
  C('ride_hail', 'Ride-hailing Driver', 'Freelance', '🚖', 'secondary', 28000, 'trades', 5, 1, 4, 'Drive passengers around town whenever you like.', { minAge: 18, freelance: true, volatile: true, layoffRisk: 0 }),
  C('rider', 'Delivery Rider', 'Freelance', '🛵', 'none', 24000, 'athletic', 5, 1, 4, 'Deliver food and parcels on two wheels.', { minAge: 16, freelance: true, volatile: true, layoffRisk: 0 }),
  C('online_seller', 'Online Seller', 'Freelance', '🛒', 'none', 26000, 'business', 10, 2, 4, 'Sell products through marketplaces and social shops.', { minAge: 16, freelance: true, volatile: true, layoffRisk: 0 }),
  // ---- Campus & internships (only while studying)
  C('pt_campus', 'Campus Job', 'Part-time', '🏫', 'none', 22000, 'communication', 0, 0, 2, 'Library desk, cafeteria or student services on campus.', { minAge: 17, partTime: true, studentOnly: true, layoffRisk: 0.5 }),
  C('pt_ra', 'Research Assistant', 'Part-time', '🔬', 'none', 28000, 'medical', 10, 3, 3, 'Help a professor with experiments and data.', { minAge: 18, partTime: true, studentOnly: true, stats: { intelligence: 62 }, layoffRisk: 0.5 }),
  C('pt_intern', 'Industry Intern', 'Part-time', '🧑‍💼', 'none', 20000, 'business', 5, 2, 4, 'Learn on the job at a real company and build experience in your field.', { minAge: 18, partTime: true, studentOnly: true, layoffRisk: 0.7 }),
  // ---- Part-time (teens & students)
  C('pt_retail', 'Part-time Retail Assistant', 'Part-time', '🛍️', 'none', 24000, 'communication', 0, 0, 2, 'Weekend shifts at the local store.', { minAge: 15, maxAge: 70, partTime: true, layoffRisk: 0.8 }),
  C('pt_cafe', 'Part-time Café Worker', 'Part-time', '🥐', 'none', 24000, 'communication', 0, 0, 2, 'Evening shifts pouring coffee.', { minAge: 15, maxAge: 70, partTime: true, layoffRisk: 0.8 }),
  C('pt_tutor', 'Tutor', 'Part-time', '📖', 'secondary', 30000, 'communication', 10, 2, 2, 'Help younger students with homework.', { minAge: 16, maxAge: 75, partTime: true, stats: { intelligence: 60 }, layoffRisk: 0.6 }),
  C('pt_freelance', 'Freelancer', 'Part-time', '🧑‍💻', 'none', 30000, 'tech', 20, 2, 3, 'Gig work on your own schedule.', { minAge: 16, maxAge: 80, partTime: true, volatile: true, layoffRisk: 0 }),
];

export const careerById = (id: string) => CAREERS.find((c) => c.id === id);

export const COMPANY_A = ['Apex', 'Northwind', 'Bluepeak', 'Orbital', 'Summit', 'Evergreen', 'Harbor', 'Nimbus', 'Crestline', 'Vantage', 'Lumen', 'Atlas', 'Keystone', 'Pioneer', 'Silverline', 'Redwood'];
export const COMPANY_B = ['Dynamics', 'Systems', 'Group', 'Labs', 'Partners', 'Holdings', 'Works', 'Solutions', 'Industries', 'Collective', '& Co.', 'Ventures'];

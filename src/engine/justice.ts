import { closeJob } from './career';
import { facilityById, justiceFor, type Facility, type JusticeSystem } from './data/justice';
import { dropOut } from './education';
import { fmtMoney } from './format';
import { payFromAssets } from './finance';
import { chance, clamp, pick, rint, rnd } from './rng';
import { addStat, incFlag, livingChildren, log, no, ok, partnerOf, setFlag, wageScale } from './util';
import type { ActionResult, Character, GameState, JusticeState, Sentence } from './types';

/**
 * Crime, courts and prison life. Each country has its own institutions (see data/justice.ts):
 * juveniles go to youth facilities such as Malaysia's Sekolah Henry Gurney or Tunas Bakti, drug offenders to rehab
 * centres, and adults to prisons by seriousness.
 */

let queueHook: ((g: GameState, id: string) => void) | null = null;
/** the event engine registers itself here so justice can queue events without an import cycle */
export const registerEventQueue = (fn: (g: GameState, id: string) => void) => { queueHook = fn; };
const queueNow = (g: GameState, id: string) => { if (queueHook) queueHook(g, id); else g.scheduled.push({ id, dueAge: g.player.age, chance: 1 }); };

export const jus = (p: Character): JusticeState => (p.justice ??= { record: [], charge: null, sentence: null, yearsInside: 0 });
export const sentenceOf = (g: GameState): Sentence | null => g.player.justice?.sentence ?? null;
export const isIncarcerated = (g: GameState) => { const s = sentenceOf(g); return !!s && (s.kind === 'prison' || s.kind === 'juvenile' || s.kind === 'rehab'); };
export const onSupervision = (g: GameState) => { const s = sentenceOf(g); return !!s && (s.kind === 'probation' || s.kind === 'community'); };
export const systemFor = (g: GameState): JusticeSystem => justiceFor(g.player.countryId);
export const facilityFor = (s: Sentence): Facility | undefined => facilityById(s.facilityId);

const money = (g: GameState, v: number) => fmtMoney(v, g.player.countryId, true);

const OFFENCES: Record<number, string[]> = {
  1: ['petty theft', 'vandalism', 'trespassing', 'a street scuffle'],
  2: ['shoplifting', 'vandalism', 'theft', 'fighting in public', 'joyriding'],
  3: ['burglary', 'car theft', 'assault', 'fraud', 'drug dealing'],
  4: ['armed robbery', 'aggravated assault', 'large-scale fraud', 'drug trafficking', 'arson'],
  5: ['manslaughter', 'kidnapping', 'murder'],
};
export const offenceName = (sev: number) => pick(OFFENCES[clamp(Math.round(sev), 1, 5)]);

// ------------------------------------------------------------------ being caught
/** Called whenever an effect adds crime. Returns 'court' when a trial must be held. */
export function reportCrime(g: GameState, severity: number, label?: string): 'court' | 'none' {
  const p = g.player; const j = jus(p); const sys = systemFor(g);
  let sev = clamp(Math.round(severity), 1, 5);
  if (p.age < sys.criminalAge) return 'none';
  const s = j.sentence;
  if (s && (s.kind === 'prison' || s.kind === 'juvenile' || s.kind === 'rehab')) {
    const extra = Math.max(1, Math.round(sev * 0.7));
    s.years += extra; s.conduct = clamp(s.conduct - 25, 0, 100);
    log(g, 'crime', `⛓️ You broke the rules inside and ${extra} year${extra > 1 ? 's were' : ' was'} added to your sentence.`, 'bad');
    return 'none';
  }
  if (s && (s.kind === 'probation' || s.kind === 'community')) {
    j.sentence = null; sev = Math.min(5, sev + 1);
    log(g, 'crime', '⚠️ You breached your order. The court will deal with you more harshly.', 'bad');
  }
  if (j.charge) return 'none';
  const name = label ?? offenceName(sev);
  const juv = p.age < sys.juvenileMax;
  if (sev <= 1) {
    j.record.push({ year: g.year, age: p.age, label: name, severity: 1, outcome: juv ? 'cautioned' : 'warned' });
    log(g, 'crime', `🚔 You were stopped over ${name} and let off with a ${juv ? 'caution and a lecture' : 'warning'}.`, 'neutral');
    return 'none';
  }
  j.charge = { label: name, severity: sev, evidence: rint(35, 92), juvenile: juv };
  log(g, 'crime', `🚔 You were arrested for ${name}.`, 'bad');
  return 'court';
}

export const evidenceWord = (e: number) => (e >= 80 ? 'overwhelming' : e >= 60 ? 'strong' : e >= 45 ? 'mixed' : 'thin');

export type DefenceMode = 'plea' | 'legalaid' | 'lawyer' | 'self';
export const lawyerCost = (g: GameState, sev: number) => Math.round(1800 * sev * wageScale(g));

// ------------------------------------------------------------------ sentencing
function chooseFacility(g: GameState, juv: boolean, sev: number, label: string): { facility: Facility; kind: Sentence['kind'] } {
  const sys = systemFor(g); const age = g.player.age;
  if (/drug/.test(label) && sev <= 3) return { facility: sys.drug, kind: 'rehab' };
  if (juv) return { facility: sev >= 4 ? sys.juvenile.heavy : sys.juvenile.light, kind: 'juvenile' };
  if (sys.youngAdult && sys.youngAdultMax && age < sys.youngAdultMax && sev >= 3) return { facility: sys.youngAdult, kind: 'prison' };
  return { facility: sev >= 5 ? sys.adult.high : sev >= 4 ? sys.adult.mid : sys.adult.low, kind: 'prison' };
}

export function startSentence(g: GameState, kind: Sentence['kind'], facility: Facility | null, years: number, offence: string, sev: number, juvenile: boolean) {
  const p = g.player; const j = jus(p); const sys = systemFor(g);
  const s: Sentence = {
    kind, facilityId: facility?.id ?? kind, facility: facility?.name ?? (kind === 'probation' ? sys.probation : sys.community), offence, severity: sev, juvenile,
    years: Math.max(kind === 'probation' || kind === 'community' ? 1 : 1, Math.round(years)), served: 0, startAge: p.age, conduct: 60, standing: 40, gang: false, studied: 0, worked: 0, counselled: 0, appealed: false, transferred: false,
  };
  j.sentence = s;
  if (kind === 'prison' || kind === 'juvenile' || kind === 'rehab') {
    if (p.career.job) closeJob(g, 'incarcerated');
    if (['bachelor', 'master', 'doctorate', 'vocational'].includes(p.edu.stage ?? '')) dropOut(g);
    // those in school keep studying inside juvenile facilities
    p.career.reputation = clamp(p.career.reputation - 12 - sev * 3, 0, 100);
    for (const x of p.people) {
      if (!x.alive) continue;
      if (x.relation === 'mother' || x.relation === 'father') { x.closeness = clamp(x.closeness - (juvenile ? 6 : 12), 0, 100); x.trust = clamp(x.trust - 10, 0, 100); }
    }
    queueNow(g, 'jus_arrival');
  }
  return s;
}

export function adjudicate(g: GameState, mode: DefenceMode): string {
  const p = g.player; const j = jus(p); const sys = systemFor(g);
  const ch = j.charge;
  if (!ch) return '';
  j.charge = null;
  const sev = ch.severity;
  const acquit = mode === 'plea' ? 0 : clamp((100 - ch.evidence) / 190 + (mode === 'lawyer' ? 0.2 : mode === 'self' ? -0.03 : 0) + (p.stats.intelligence - 55) * 0.001, 0, 0.7);
  const rec = { year: g.year, age: p.age, label: ch.label, severity: sev, outcome: '' };
  if (chance(acquit)) {
    rec.outcome = 'acquitted'; j.record.push(rec);
    addStat(p, 'happiness', 5);
    log(g, 'crime', `⚖️ You were found not guilty of ${ch.label}.`, 'good');
    return 'Not guilty. You walk free.';
  }
  setFlag(p, ch.juvenile ? 'juvenileRecord' : 'criminalRecord', true);
  if (!ch.juvenile) p.career.reputation = clamp(p.career.reputation - 8 * sev, 0, 100);
  const mult = mode === 'plea' ? 0.7 : mode === 'lawyer' ? 0.8 : mode === 'self' ? 1.1 : 1;
  const r = rnd();
  const juv = ch.juvenile;
  const scale = (a: number, b: number) => Math.max(1, Math.round(rint(a, b) * mult));
  let kind: Sentence['kind'] | 'fine' = 'fine'; let years = 0; let fac: Facility | null = null;
  const pickFac = () => { const c = chooseFacility(g, juv, sev, ch.label); fac = c.facility; kind = c.kind; };
  if (juv) {
    if (sev === 2) { if (r < 0.5) { kind = 'probation'; years = 1; } else if (r < 0.8) { kind = 'community'; years = 1; } else { pickFac(); years = 1; } }
    else if (sev === 3) { if (r < 0.35) { kind = 'probation'; years = 2; } else { pickFac(); years = scale(1, 2); } }
    else if (sev === 4) { pickFac(); years = scale(2, 4); }
    else { pickFac(); years = scale(4, 7); }
  } else if (sev === 2) {
    if (r < 0.55) kind = 'fine'; else if (r < 0.85) { kind = 'community'; years = 1; } else { kind = 'probation'; years = 1; }
  } else if (sev === 3) {
    if (r < 0.3) { kind = 'probation'; years = 2; } else if (r < 0.45) { kind = 'community'; years = 1; } else { pickFac(); years = scale(1, 3); }
  } else if (sev === 4) { pickFac(); years = scale(3, 9); }
  else { pickFac(); years = chance(0.12) ? 40 : scale(10, 25); }
  if (fac && (fac as Facility).kind === 'rehab') years = Math.min(years, 2);

  if (kind === 'fine') {
    const amt = Math.round(250 * sev * wageScale(g) * (0.7 + rnd() * 0.8));
    payFromAssets(g, amt);
    rec.outcome = `fined ${money(g, amt)}`; j.record.push(rec);
    addStat(p, 'happiness', -4);
    log(g, 'crime', `⚖️ ${sys.adultCourt}: convicted of ${ch.label}. You were fined ${money(g, amt)}.`, 'bad');
    return `Convicted. You were fined ${money(g, amt)}.`;
  }
  if (kind === 'probation' || kind === 'community') {
    const label = kind === 'probation' ? sys.probation : sys.community;
    startSentence(g, kind, null, years, ch.label, sev, juv);
    rec.outcome = `${label} (${years} yr)`; j.record.push(rec);
    addStat(p, 'happiness', -5);
    log(g, 'crime', `⚖️ Convicted of ${ch.label}. Sentence: ${label} for ${years} year${years > 1 ? 's' : ''}.`, 'bad');
    return `Convicted. Sentence: ${label}, ${years} year${years > 1 ? 's' : ''}. Stay out of trouble.`;
  }
  const f = fac as Facility | null;
  if (!f) return '';
  startSentence(g, kind as Sentence['kind'], f, years, ch.label, sev, juv);
  rec.outcome = `${f.name} (${years >= 40 ? 'life' : `${years} yr`})`; j.record.push(rec);
  addStat(p, 'happiness', -14); addStat(p, 'confidence', -6);
  log(g, 'crime', `⚖️ ${juv ? sys.juvenileCourt : sys.adultCourt}: convicted of ${ch.label}. Sentenced to ${years >= 40 ? 'a life term' : `${years} year${years > 1 ? 's' : ''}`} at ${f.name}.`, 'bad');
  if (sys.caning && sev >= 4 && !juv && p.age < 50 && chance(0.4)) { addStat(p, 'health', -6); log(g, 'crime', '🩹 The court also ordered corporal punishment. It left lasting scars.', 'bad'); }
  return `Convicted. Sentenced to ${years >= 40 ? 'a life term' : `${years} year${years > 1 ? 's' : ''}`} at ${f.name}.`;
}

// ------------------------------------------------------------------ release
export function release(g: GameState, why: 'served' | 'remission' | 'parole' | 'appeal' | 'transferred-out') {
  const p = g.player; const j = jus(p); const s = j.sentence;
  if (!s) return;
  const inside = s.kind === 'prison' || s.kind === 'juvenile' || s.kind === 'rehab';
  j.sentence = null;
  if (!inside) { log(g, 'crime', `✅ You completed your ${s.facility.toLowerCase()}.`, 'good'); addStat(p, 'happiness', 3); return; }
  const sys = systemFor(g);
  const msg = why === 'remission' ? `for good conduct (${sys.release.label})` : why === 'parole' ? 'on early release' : why === 'appeal' ? 'after a successful appeal' : 'after serving your term';
  log(g, 'crime', `🔓 You were released from ${s.facility} ${msg} after ${s.served} year${s.served === 1 ? '' : 's'}.`, 'good');
  addStat(p, 'happiness', 9); addStat(p, 'confidence', -3); addStat(p, 'health', 1);
  setFlag(p, 'exOffender', p.age);
  incFlag(p, 'timesReleased', 1);
  // education: schooling or training inside counts
  if (s.studied >= 2 && p.edu.level !== 'secondary' && p.edu.level !== 'vocational' && p.edu.level !== 'bachelor' && p.edu.level !== 'master' && p.edu.level !== 'doctorate' && !p.edu.stage) {
    p.edu.level = 'secondary'; p.edu.secondaryAvg = Math.max(p.edu.secondaryAvg, 62);
    log(g, 'education', '🎓 You completed a secondary-school equivalency certificate while you were inside.', 'good');
  }
  if (s.worked >= 2) { p.skills.trades = clamp(p.skills.trades + 6, 0, 100); log(g, 'career', '🛠️ The trade you learned inside gave you a useful skill.', 'good'); }
  queueNow(g, 'jus_release');
  g.scheduled.push({ id: 'jus_reentry', dueAge: p.age + 1, chance: 0.9 });
}

const effectiveTerm = (s: Sentence, sys: JusticeSystem) => (s.years >= 40 ? 40 : s.years);

// ------------------------------------------------------------------ yearly life inside
export function processJustice(g: GameState) {
  const p = g.player; const j = jus(p); const s = j.sentence; const sys = systemFor(g);
  if (!s) return;
  s.served++;
  if (s.kind === 'probation' || s.kind === 'community') {
    if (s.served >= s.years) release(g, 'served');
    return;
  }
  j.yearsInside++;
  const fac = facilityFor(s);
  const violence = fac?.violence ?? 5;
  // body and mind
  const hardness = violence * 0.22 * (s.gang ? 0.6 : 1) * (s.standing > 65 ? 0.7 : 1);
  addStat(p, 'health', -hardness);
  addStat(p, 'happiness', -(2.5 + violence * 0.15) + s.counselled * 0.4);
  addStat(p, 'discipline', 0.4);
  // conduct drift: disciplined people behave; gangs and low standing push it down
  s.conduct = clamp(s.conduct + (p.stats.discipline - 50) * 0.08 + (s.gang ? -6 : 2) + (s.counselled ? 2 : 0), 0, 100);
  s.standing = clamp(s.standing + (s.gang ? 3 : 0) + (p.stats.confidence - 50) * 0.03, 0, 100);
  // relationships fade without contact
  for (const x of p.people) {
    if (!x.alive) continue;
    if (['partner', 'spouse', 'mother', 'father', 'sibling', 'friend', 'child'].includes(x.relation)) {
      x.closeness = clamp(x.closeness - (x.relation === 'friend' ? 5 : 3), 0, 100);
      x.trust = clamp(x.trust - 2, 0, 100);
    }
  }
  const pt = partnerOf(p);
  if (pt && pt.closeness < 22 && chance(0.5)) {
    pt.relation = 'exPartner';
    log(g, 'family', `💔 ${pt.name.split(' ')[0]} could not wait any longer and ended the relationship.`, 'bad');
  }
  if (p.age >= 70 || p.stats.health < 25) addStat(p, 'health', -1);
  // juveniles move to an adult facility when they age out
  if (s.kind === 'juvenile' && p.age >= sys.juvenileMax) {
    const left = s.years - s.served;
    if (left <= 1) { release(g, 'served'); return; }
    const next = sys.youngAdult && sys.youngAdultMax && p.age < sys.youngAdultMax ? sys.youngAdult : sys.adult.low;
    s.kind = 'prison'; s.facilityId = next.id; s.facility = next.name; s.transferred = true; s.juvenile = false;
    log(g, 'crime', `🚌 You turned ${p.age} and were transferred from the youth facility to ${next.name}.`, 'bad');
    return;
  }
  const term = effectiveTerm(s, sys);
  // automatic early release for good conduct
  if (s.kind !== 'rehab' && s.served >= Math.ceil(term * sys.release.frac) && s.served < term && s.conduct >= 70 && term < 40) { release(g, 'remission'); return; }
  if (s.served >= term && term < 40) { release(g, 'served'); return; }
  if (s.years >= 40 && s.served >= 25 && s.conduct >= 70 && chance(0.15)) { release(g, 'parole'); return; }
}

// ------------------------------------------------------------------ prison actions
const used = (p: Character, k: string) => p.actions.includes(k);
const act = (g: GameState, key: string): ActionResult | null => {
  const p = g.player; const s = sentenceOf(g);
  if (!s || !isIncarcerated(g)) return no('You are not incarcerated.');
  if (used(p, key)) return no('You already did that this year.');
  if (p.energy < 1) return no('No energy left this year.');
  p.energy -= 1; p.actions.push(key);
  return null;
};

export function prisonWork(g: GameState): ActionResult {
  const bad = act(g, 'pw'); if (bad) return bad;
  const s = sentenceOf(g)!; const p = g.player;
  s.worked++; s.conduct = clamp(s.conduct + 7, 0, 100);
  const wage = Math.round(120 * wageScale(g));
  p.fin.cash += wage; addStat(p, 'discipline', 1.5);
  p.skills.trades = clamp(p.skills.trades + 1.5, 0, 100);
  log(g, 'crime', `🛠️ You took a work detail inside${wage ? ` and earned ${money(g, wage)}` : ''}.`, 'good');
  return ok('You kept busy with a work detail. Good conduct noted.', 'good');
}
export function prisonStudy(g: GameState): ActionResult {
  const bad = act(g, 'ps'); if (bad) return bad;
  const s = sentenceOf(g)!; const p = g.player;
  s.studied++; s.conduct = clamp(s.conduct + 5, 0, 100);
  addStat(p, 'intelligence', 1.2); addStat(p, 'discipline', 1);
  log(g, 'education', '📚 You attended classes and studied hard inside.', 'good');
  return ok('You studied. A certificate may follow if you keep at it.', 'good');
}
export function prisonExercise(g: GameState): ActionResult {
  const bad = act(g, 'pe'); if (bad) return bad;
  const s = sentenceOf(g)!; const p = g.player;
  addStat(p, 'health', 3); addStat(p, 'happiness', 1); p.skills.athletic = clamp(p.skills.athletic + 1.5, 0, 100);
  s.standing = clamp(s.standing + 3, 0, 100);
  return ok('Yard time kept you strong, and people noticed.', 'good');
}
export function prisonCounselling(g: GameState): ActionResult {
  const bad = act(g, 'pc'); if (bad) return bad;
  const s = sentenceOf(g)!; const p = g.player;
  s.counselled++; s.conduct = clamp(s.conduct + 8, 0, 100);
  addStat(p, 'happiness', 3); addStat(p, 'confidence', 1);
  return ok('Counselling and group sessions helped you think things through.', 'good');
}
export function prisonWriteHome(g: GameState): ActionResult {
  const bad = act(g, 'pwh'); if (bad) return bad;
  const p = g.player;
  let n = 0;
  for (const x of p.people) if (x.alive && ['partner', 'spouse', 'mother', 'father', 'sibling', 'child', 'friend'].includes(x.relation)) { x.closeness = clamp(x.closeness + 6, 0, 100); x.trust = clamp(x.trust + 3, 0, 100); n++; }
  addStat(p, 'happiness', 2);
  return ok(n ? `You wrote to ${n} people on the outside, and some wrote back.` : 'You wrote letters, but there was no one to send them to.', n ? 'good' : 'neutral');
}
export function prisonFriends(g: GameState): ActionResult {
  const bad = act(g, 'pf'); if (bad) return bad;
  const s = sentenceOf(g)!; const p = g.player;
  s.standing = clamp(s.standing + 6, 0, 100);
  addStat(p, 'social', 1); addStat(p, 'happiness', 1);
  if (chance(0.35)) { s.conduct = clamp(s.conduct - 5, 0, 100); return ok('You made a few acquaintances, though one of them is trouble.', 'neutral'); }
  return ok('You found people to eat and talk with. It makes the days lighter.', 'good');
}
export function prisonGang(g: GameState): ActionResult {
  const bad = act(g, 'pg'); if (bad) return bad;
  const s = sentenceOf(g)!; const p = g.player;
  if (s.gang) { s.gang = false; s.conduct = clamp(s.conduct + 6, 0, 100); s.standing = clamp(s.standing - 15, 0, 100); addStat(p, 'health', -2); return ok('You left the group. It cost you, but you are free of it.', 'neutral'); }
  s.gang = true; s.standing = clamp(s.standing + 20, 0, 100); s.conduct = clamp(s.conduct - 18, 0, 100);
  addStat(p, 'confidence', 3);
  return ok('You joined a group for protection. You are safer, but more trouble will come.', 'neutral');
}
export function prisonAppeal(g: GameState): ActionResult {
  const s = sentenceOf(g); const p = g.player;
  if (!s || !isIncarcerated(g)) return no('You are not incarcerated.');
  if (s.appealed) return no('You have already used your appeal.');
  if (s.kind === 'rehab') return no('There is nothing to appeal.');
  const cost = lawyerCost(g, s.severity);
  if (p.fin.cash + p.fin.savings < cost) return no(`A lawyer for the appeal costs ${money(g, cost)}.`);
  const bad = act(g, 'pa'); if (bad) return bad;
  payFromAssets(g, cost);
  s.appealed = true;
  const ch = clamp(0.28 + (s.conduct - 50) * 0.003, 0.1, 0.55);
  if (chance(ch)) {
    const cut = Math.max(1, Math.round((s.years - s.served) * (0.2 + rnd() * 0.3)));
    s.years = Math.max(s.served + 1, s.years - cut);
    log(g, 'crime', `⚖️ Your appeal succeeded. ${cut} year${cut > 1 ? 's were' : ' was'} cut from your sentence.`, 'good');
    return ok(`The appeal worked: ${cut} year${cut > 1 ? 's' : ''} off your sentence.`, 'good');
  }
  addStat(p, 'happiness', -4);
  log(g, 'crime', '⚖️ Your appeal was dismissed.', 'bad');
  return { ok: false, msg: 'The appeal was dismissed.', tone: 'bad' };
}
export const paroleEligible = (g: GameState) => {
  const s = sentenceOf(g); if (!s || !isIncarcerated(g) || s.kind === 'rehab') return false;
  return s.served >= Math.ceil(effectiveTerm(s, systemFor(g)) * systemFor(g).release.frac * 0.85) && s.served < s.years || (s.years >= 40 && s.served >= 15);
};
export const paroleChance = (g: GameState) => { const s = sentenceOf(g); if (!s) return 0; return clamp(0.15 + s.conduct * 0.006 + s.counselled * 0.04 + s.studied * 0.02 - (s.gang ? 0.25 : 0) - s.severity * 0.03, 0.03, 0.85); };
export function prisonParole(g: GameState): ActionResult {
  const s = sentenceOf(g);
  if (!s || !isIncarcerated(g)) return no('You are not incarcerated.');
  if (!paroleEligible(g)) return no('You have not served enough of your sentence to apply for early release.');
  const bad = act(g, 'pp'); if (bad) return bad;
  if (chance(paroleChance(g))) { release(g, 'parole'); return ok('Your application for early release was granted!', 'good'); }
  addStat(g.player, 'happiness', -3);
  log(g, 'crime', '📄 Your application for early release was refused. You can try again next year.', 'bad');
  return { ok: false, msg: 'Early release refused. Keep your record clean and try again.', tone: 'bad' };
}
export const prisonActionsAvailable = (g: GameState) => isIncarcerated(g);

export function sentenceProgress(g: GameState) {
  const s = sentenceOf(g); if (!s) return null;
  const left = Math.max(0, s.years - s.served);
  return { left, life: s.years >= 40, pct: s.years >= 40 ? 0 : clamp((s.served / s.years) * 100, 0, 100) };
}

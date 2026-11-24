import { BALANCE } from './config';
import { DEGREES, degreeById, EDU_RANK, FIELDS } from './data/careers';
import { chance, clamp, gauss, pick, rint } from './rng';
import { addStat, countryOf, diff, log, no, ok, setFlag, wageScale } from './util';
import { COMPANY_A } from './data/careers';
import type { ActionResult, Character, DegreeDef, DegreeRecord, EduLevel, GameState } from './types';

export const SCHOOL_TYPES = ['Elementary', 'Primary', 'Grammar', 'Community'];
const SCHOOL_SUFFIX = ['Academy', 'School', 'Institute', 'College'];
export const randomSchoolName = (city: string) => `${city} ${pick(SCHOOL_SUFFIX)}`;
export const gradeLetter = (v: number) => (v >= 93 ? 'A+' : v >= 87 ? 'A' : v >= 80 ? 'A-' : v >= 75 ? 'B+' : v >= 70 ? 'B' : v >= 65 ? 'B-' : v >= 60 ? 'C+' : v >= 55 ? 'C' : v >= 50 ? 'C-' : v >= 40 ? 'D' : 'F');

export function stageLabel(p: Character): string {
  const e = p.edu;
  if (!e.stage) return e.level === 'none' ? 'Not in school' : 'Not studying';
  const nm: Record<string, string> = { kindergarten: 'Kindergarten', primary: 'Primary school', secondary: 'Secondary school', vocational: 'Vocational college', bachelor: 'University', master: "Master's programme", doctorate: 'Doctoral programme' };
  return `${nm[e.stage]} · year ${Math.min(e.yearInStage + 1, e.stageYears)}/${e.stageYears}`;
}

export function highestDegreeName(p: Character): string {
  const d = [...p.edu.degrees].sort((a, b) => EDU_RANK[b.level] - EDU_RANK[a.level])[0];
  if (d) return d.name;
  const names: Record<EduLevel, string> = { none: 'No formal education', primary: 'Primary school', secondary: 'Secondary school diploma', vocational: 'Vocational diploma', bachelor: "Bachelor's", master: "Master's", doctorate: 'Doctorate' };
  return names[p.edu.level];
}

export const hasField = (p: Character, fields: string[]) => p.edu.degrees.some((d) => fields.includes(d.field));
export const eduRank = (p: Character) => EDU_RANK[p.edu.level];

export function tuitionFor(g: GameState, d: DegreeDef): number {
  const c = countryOf(g);
  const key = d.field === 'med' || d.field === 'dent' ? 'medicine' : d.field === 'law' ? 'law' : d.level;
  const base = BALANCE.education.tuition[key] ?? 12000;
  return Math.round(base * d.cost * c.tuitionIndex * g.world.priceIndex * (0.35 + 0.65 * c.wageIndex));
}

/** Schooling status for a character starting a life at an arbitrary age (used for heirs). */
export function initEducationForAge(g: GameState, p: Character, age: number, tier: number) {
  const e = p.edu;
  e.schoolName = randomSchoolName(p.city);
  const bright = p.stats.intelligence;
  if (age < 4) return;
  if (age < 6) { e.stage = 'kindergarten'; e.stageYears = 2; e.yearInStage = age - 4; return; }
  if (age < 12) { e.level = 'none'; e.stage = 'primary'; e.stageYears = 6; e.yearInStage = age - 6; return; }
  if (age < 18) { e.level = 'primary'; e.stage = 'secondary'; e.stageYears = 6; e.yearInStage = age - 12; return; }
  // adult heirs get a plausible backstory
  e.level = 'secondary';
  e.secondaryAvg = clamp(gauss(55 + bright * 0.25, 9), 35, 98);
  e.avg = e.secondaryAvg;
  const uniChance = clamp(0.1 + tier * 0.1 + (bright - 50) / 150, 0.05, 0.85);
  if (age >= 22 && chance(uniChance)) {
    const options = DEGREES.filter((d) => d.level === 'bachelor');
    const d = pick(options);
    e.level = 'bachelor';
    e.degrees.push({ id: d.id, name: d.name, field: d.field, level: 'bachelor', age: 22, gpa: +(e.secondaryAvg / 25).toFixed(2) });
    if (age >= 26 && bright > 62 && chance(0.25)) {
      const m = DEGREES.find((x) => x.id === `msc_${d.field}`);
      if (m) { e.level = 'master'; e.degrees.push({ id: m.id, name: m.name, field: m.field, level: 'master', age: 24, gpa: 3.2 }); }
    }
  } else if (age >= 20 && chance(0.2)) {
    const d = DEGREES.find((x) => x.id === 'voc_trade')!;
    e.level = 'vocational';
    e.degrees.push({ id: d.id, name: d.name, field: d.field, level: 'vocational', age: 20, gpa: 3 });
  }
  void g;
}

// ------------------------------------------------------------------------------------ yearly
function yearPerformance(g: GameState, difficulty: number): number {
  const p = g.player;
  const e = p.edu;
  const s = p.stats;
  const base = 22 + s.intelligence * 0.46 + s.discipline * 0.22 + s.happiness * 0.05 + (s.health - 50) * 0.04;
  let perf = base + BALANCE.education.effort[e.effort] + gauss(0, 6) - difficulty * 0.55;
  if (p.traits.includes('curious')) perf += 2;
  if (p.traits.includes('lazy')) perf -= 3;
  if (e.scholarship) perf += 1;
  return clamp(Math.round(perf), 5, 100);
}

function graduate(g: GameState, def: DegreeDef | null, level: EduLevel, name: string, field: string) {
  const p = g.player;
  const e = p.edu;
  const gpa = clamp(+(e.avg / 24).toFixed(2), 0.5, 4);
  const rec: DegreeRecord = { id: def?.id ?? level, name, field, level, age: p.age, gpa, honors: gpa >= 3.7 };
  if (def) {
    e.degrees.push(rec);
    if (def.skill) p.skills[def.skill] = clamp(p.skills[def.skill] + 18 + (def.level === 'master' ? 6 : 0) + (def.level === 'doctorate' ? 10 : 0), 0, 100);
  }
  if (EDU_RANK[level] > EDU_RANK[e.level]) e.level = level;
  e.stage = null; e.yearInStage = 0; e.stageYears = 0; e.scholarship = null; e.failedYears = 0;
  e.degreeId = undefined; e.degreeName = undefined;
  if (def) {
    log(g, 'education', `🎓 You graduated with ${name}${rec.honors ? ' — with honours!' : '.'} (GPA ${gpa.toFixed(2)})`, 'good');
    addStat(p, 'happiness', 8); addStat(p, 'confidence', 4); addStat(p, 'intelligence', 3);
  }
}

export function processEducation(g: GameState) {
  const p = g.player;
  const e = p.edu;
  const age = p.age;
  e.appliedThisYear = false;
  e.tuitionDue = 0;
  if (!e.schoolName) e.schoolName = randomSchoolName(p.city);

  // ---- enrolled: evaluate the year just completed
  if (e.stage) {
    const st = e.stage;
    const def = e.degreeId ? degreeById(e.degreeId) : null;
    const difficulty = def?.difficulty ?? (st === 'secondary' ? 10 : st === 'primary' ? 2 : 0);
    const perf = yearPerformance(g, difficulty);
    e.grades = perf;
    e.avg = e.yearInStage === 0 && e.failedYears === 0 ? perf : Math.round((e.avg * (e.yearInStage + e.failedYears) + perf) / (e.yearInStage + e.failedYears + 1));
    if (st === 'bachelor' || st === 'master' || st === 'doctorate' || st === 'vocational') {
      e.tuitionDue = def ? Math.round(tuitionFor(g, def) * (1 - (e.scholarship?.pct ?? 0))) : 0;
      if (def?.skill) p.skills[def.skill] = clamp(p.skills[def.skill] + 3, 0, 100);
    }
    if (e.effort === 'high') { addStat(p, 'happiness', -2); addStat(p, 'discipline', 1.2); addStat(p, 'health', -0.5); }
    if (e.effort === 'low') { addStat(p, 'happiness', 1.5); addStat(p, 'discipline', -1); }
    addStat(p, 'intelligence', e.effort === 'high' ? 1.4 : e.effort === 'low' ? 0.2 : 0.7);

    const failed = (st === 'secondary' && perf < 30) || ((st === 'bachelor' || st === 'master' || st === 'doctorate' || st === 'vocational') && perf < 38);
    const label = st === 'kindergarten' ? 'Kindergarten' : st === 'primary' ? 'Primary school' : st === 'secondary' ? 'Secondary school' : def?.name ?? 'Studies';
    if (failed) {
      e.failedYears++;
      log(g, 'education', `📉 You failed your exams in ${label} (score ${perf}%). You'll have to repeat the year.`, 'bad');
      addStat(p, 'happiness', -6);
      if (e.failedYears >= 3 && st !== 'secondary') {
        log(g, 'education', `🚪 After repeated failures you were asked to leave your programme.`, 'bad');
        e.stage = null; e.scholarship = null; e.dropouts++;
      }
    } else {
      e.yearInStage++;
      if (st !== 'kindergarten') log(g, 'education', `📝 ${label}: year ${e.yearInStage}/${e.stageYears} — you scored ${perf}% (${gradeLetter(perf)}).${perf >= 90 ? ' Top of the class!' : perf < 50 ? ' Not your best year.' : ''}`, perf >= 75 ? 'good' : perf < 50 ? 'bad' : 'neutral');
      if (e.scholarship && e.avg < 60) {
        log(g, 'education', `💸 Your grades slipped below the scholarship requirement — you lost your ${e.scholarship.name}.`, 'bad');
        e.scholarship = null;
      }
      // ---- completing a stage
      if (e.yearInStage >= e.stageYears) {
        if (st === 'kindergarten') { e.stage = null; e.yearInStage = 0; log(g, 'education', '🧸 You finished kindergarten.', 'good'); }
        else if (st === 'primary') { e.level = 'primary'; e.stage = null; e.yearInStage = 0; log(g, 'education', '🎒 You finished primary school and are heading to secondary school!', 'good'); }
        else if (st === 'secondary') {
          e.secondaryAvg = e.avg;
          e.admission = clamp(Math.round(e.avg * 0.7 + p.stats.intelligence * 0.25 + gauss(0, 5)), 10, 100);
          if (e.avg >= 32) {
            e.level = 'secondary'; e.stage = null; e.yearInStage = 0;
            log(g, 'education', `🎓 You graduated from secondary school with an average of ${e.avg}% (${gradeLetter(e.avg)}). Entrance exam score: ${e.admission}.`, 'good');
            if (e.avg >= 95) { setFlag(p, 'valedictorian'); log(g, 'achievement', '🏅 You graduated as class valedictorian!', 'good'); }
            addStat(p, 'happiness', 6);
          } else {
            e.stage = null; e.yearInStage = 0; e.level = 'primary';
            log(g, 'education', '📭 You did not earn your secondary diploma. You can sit equivalency classes as an adult.', 'bad');
          }
        } else {
          const field = def?.field ?? e.field ?? 'human';
          graduate(g, def ?? null, def?.level ?? (st as EduLevel), def?.name ?? 'your degree', field);
        }
      }
    }
  }

  // ---- compulsory schooling pathway by age
  const E = BALANCE.education;
  if (!e.stage && !e.dropouts) {
    if (age === E.startKindergarten && e.level === 'none') { e.stage = 'kindergarten'; e.stageYears = 2; e.yearInStage = 0; e.avg = 70; e.schoolName = randomSchoolName(p.city); log(g, 'education', `🧸 You started kindergarten at ${e.schoolName}.`, 'good'); }
    if (age >= E.startPrimary && age < 12 && e.level === 'none' && e.stage === null) { e.stage = 'primary'; e.stageYears = 6; e.yearInStage = Math.max(0, age - E.startPrimary); e.avg = 70; log(g, 'education', `🎒 You started primary school at ${e.schoolName}.`, 'good'); }
    if (age >= E.startSecondary && age < 18 && e.level === 'primary' && e.stage === null) { e.stage = 'secondary'; e.stageYears = 6; e.yearInStage = Math.max(0, age - E.startSecondary); e.avg = 65; e.schoolName = randomSchoolName(p.city); log(g, 'education', `📚 You started secondary school at ${e.schoolName}.`, 'good'); }
  }
  if (e.stage === 'kindergarten' && age >= 6) { e.stage = null; }
  if (age === 16 && e.stage === 'secondary' && e.dropouts === 0) { /* may drop out via action */ }
}

// ------------------------------------------------------------------------------------ actions
export function availableDegrees(g: GameState): { def: DegreeDef; ok: boolean; reason?: string; chance: number; tuition: number }[] {
  const p = g.player;
  return DEGREES.map((def) => {
    const r = checkDegree(g, def);
    return { def, ok: r.ok, reason: r.reason, chance: r.ok ? admissionChance(g, def) : 0, tuition: tuitionFor(g, def) };
  });
}

function checkDegree(g: GameState, d: DegreeDef): { ok: boolean; reason?: string } {
  const p = g.player;
  const e = p.edu;
  const rank = EDU_RANK[e.level];
  if (p.age < 16) return { ok: false, reason: 'Too young' };
  if (p.age > 65) return { ok: false, reason: 'Too late to enrol' };
  if (e.stage) return { ok: false, reason: 'Already studying' };
  if (e.degrees.some((x) => x.id === d.id)) return { ok: false, reason: 'Already completed' };
  if (d.level === 'vocational') {
    if (d.id === 'voc_aviation' || d.id === 'voc_nursing') { if (rank < EDU_RANK.secondary) return { ok: false, reason: 'Needs secondary diploma' }; }
    else if (rank < EDU_RANK.primary) return { ok: false, reason: 'Needs primary school' };
    if (p.age < 17) return { ok: false, reason: 'Minimum age 17' };
    return { ok: true };
  }
  if (d.level === 'bachelor') {
    if (rank < EDU_RANK.secondary) return { ok: false, reason: 'Needs secondary diploma' };
    if (p.age < 17) return { ok: false, reason: 'Minimum age 17' };
    if (p.edu.degrees.some((x) => x.level === 'bachelor' && x.field === d.field)) return { ok: false, reason: 'Already have this degree' };
    return { ok: true };
  }
  if (d.level === 'master') {
    if (!p.edu.degrees.some((x) => x.level === 'bachelor' && (x.field === d.field || d.field === 'business'))) return { ok: false, reason: `Needs a bachelor's in ${FIELDS[d.field].name}` };
    return { ok: true };
  }
  // doctorate
  if (d.requires === '*') return p.edu.degrees.some((x) => x.level === 'bachelor' || x.level === 'master') ? { ok: true } : { ok: false, reason: "Needs a bachelor's degree" };
  const hasMaster = p.edu.degrees.some((x) => x.level === 'master' && x.field === d.field);
  const hasBach = p.edu.degrees.some((x) => x.level === 'bachelor' && x.field === d.field);
  if (!hasMaster && !(hasBach && p.stats.intelligence >= 65)) return { ok: false, reason: `Needs a master's in ${FIELDS[d.field].name}` };
  return { ok: true };
}

export function admissionChance(g: GameState, d: DegreeDef): number {
  const p = g.player;
  const e = p.edu;
  const prev = d.level === 'bachelor' || d.level === 'vocational' ? Math.max(e.secondaryAvg, e.admission) : e.avg;
  const ability = prev * 0.42 + p.stats.intelligence * 0.34 + p.stats.discipline * 0.1 + p.stats.confidence * 0.06 + (e.degrees.length > 0 ? 4 : 0);
  const threshold = 22 + d.difficulty * 1.15;
  return clamp(1 / (1 + Math.exp(-(ability - threshold) / 6.5)), 0.04, 0.96);
}

export function applyToDegree(g: GameState, degreeId: string): ActionResult {
  const p = g.player;
  const e = p.edu;
  const d = degreeById(degreeId);
  if (!d) return no('Unknown programme.');
  const chk = checkDegree(g, d);
  if (!chk.ok) return no(chk.reason ?? 'You are not eligible.');
  if (e.appliedThisYear) return no('You have already applied to a programme this year.');
  e.appliedThisYear = true;
  const c = admissionChance(g, d);
  if (!chance(c)) {
    addStat(p, 'happiness', -4); addStat(p, 'confidence', -2);
    log(g, 'education', `📭 Your application to ${d.name} was rejected.`, 'bad');
    return { ok: false, msg: `Rejected from ${d.name}. Try another programme or improve your grades.`, tone: 'bad' };
  }
  if (p.age < 17 && d.level !== 'vocational') return no('Too young.');
  e.stage = d.level === 'vocational' ? 'vocational' : d.level;
  e.stageYears = d.years; e.yearInStage = 0; e.degreeId = d.id; e.degreeName = d.name; e.field = d.field; e.avg = 65; e.failedYears = 0;
  e.schoolName = `${p.city} ${d.level === 'vocational' ? 'Technical College' : 'University'}`;
  // scholarship?
  const merit = e.secondaryAvg >= 85 ? 0.45 : e.secondaryAvg >= 75 ? 0.2 : 0;
  const need = p.background.wealthTier <= 2 ? 0.25 : 0;
  if (chance(merit + need)) {
    const pct = pick([0.25, 0.5, 0.5, 0.75, 1]);
    e.scholarship = { name: `${pick(COMPANY_A)} Foundation Scholarship`, pct };
    log(g, 'education', `🏆 You received the ${e.scholarship.name} covering ${Math.round(pct * 100)}% of tuition!`, 'good');
  }
  // moving out for study
  log(g, 'education', `✅ You were accepted into ${d.name} at ${e.schoolName}!`, 'good');
  addStat(p, 'happiness', 6);
  setFlag(p, 'studiedAbroad', false);
  return ok(`Accepted into ${d.name}!`, 'good');
}

export function setEffort(g: GameState, effort: 'low' | 'normal' | 'high'): ActionResult {
  g.player.edu.effort = effort;
  return ok(`Study effort set to ${effort}.`, 'info');
}

export function dropOut(g: GameState): ActionResult {
  const p = g.player;
  const e = p.edu;
  if (!e.stage) return no('You are not enrolled in anything.');
  if (p.age < 16 && e.stage !== 'bachelor') return no('You are required to stay in school until age 16.');
  const nm = e.degreeName ?? stageLabel(p);
  e.stage = null; e.yearInStage = 0; e.scholarship = null; e.dropouts++; e.degreeId = undefined; e.degreeName = undefined;
  addStat(p, 'happiness', -3); addStat(p, 'discipline', -2);
  log(g, 'education', `🚪 You dropped out of ${nm}.`, 'bad');
  return ok(`You dropped out of ${nm}.`, 'bad');
}

export function returnToSchool(g: GameState): ActionResult {
  const p = g.player;
  const e = p.edu;
  if (e.stage) return no('You are already studying.');
  if (EDU_RANK[e.level] >= EDU_RANK.secondary) return no('You already hold a secondary diploma.');
  if (p.age < 17) return no('You must be at least 17.');
  e.stage = 'secondary'; e.stageYears = 1; e.yearInStage = 0; e.avg = 60; e.dropouts = 0; e.schoolName = `${p.city} Adult Education Centre`;
  log(g, 'education', '📖 You enrolled in secondary-equivalency classes.', 'info');
  return ok('Enrolled in secondary-equivalency classes — complete the year to earn your diploma.', 'good');
}

export function applyScholarship(g: GameState): ActionResult {
  const p = g.player;
  const e = p.edu;
  if (!e.stage || !['vocational', 'bachelor', 'master', 'doctorate'].includes(e.stage)) return no('You can only apply for scholarships while at college or university.');
  if (e.scholarship) return no(`You already hold the ${e.scholarship.name}.`);
  if (p.actions.includes('scholarship')) return no('You already applied this year.');
  p.actions.push('scholarship');
  const c = clamp((e.avg - 55) / 55 + (p.background.wealthTier <= 2 ? 0.2 : 0), 0.05, 0.85);
  if (chance(c)) {
    const pct = pick([0.25, 0.25, 0.5, 0.75]);
    e.scholarship = { name: `${pick(COMPANY_A)} Merit Award`, pct };
    log(g, 'education', `🏆 You won the ${e.scholarship.name}, covering ${Math.round(pct * 100)}% of tuition!`, 'good');
    addStat(p, 'happiness', 6);
    return ok(`Scholarship awarded: ${Math.round(pct * 100)}% of tuition.`, 'good');
  }
  log(g, 'education', '📭 Your scholarship application was unsuccessful.', 'bad');
  return { ok: false, msg: 'Your scholarship application was unsuccessful.', tone: 'bad' };
}

export function studyHarder(g: GameState): ActionResult {
  const p = g.player;
  const e = p.edu;
  if (!e.stage) return no('You are not in school.');
  if (p.energy < 1) return no('You are out of energy this year.');
  p.energy -= 1;
  e.grades = clamp(e.grades + rint(2, 5), 0, 100);
  e.avg = clamp(e.avg + rint(1, 3), 0, 100);
  addStat(p, 'intelligence', 0.8); addStat(p, 'discipline', 0.6); addStat(p, 'happiness', -1);
  log(g, 'education', '📚 You put in extra study hours.', 'neutral');
  return ok('You studied hard. Your grades improved a little.', 'good');
}

void diff; void wageScale;

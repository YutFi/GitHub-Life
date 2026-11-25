import { careerById } from './data/careers';
import { fmtMoney } from './format';
import { payFromAssets } from './finance';
import { chance, clamp, pick, rint, rnd } from './rng';
import { addStat, log, no, ok, wageScale } from './util';
import type { ActionResult, CareerDef, Character, GameState } from './types';

/**
 * The creator economy. Your audience grows with skill, effort and luck (viral moments), shrinks when you neglect it
 * or when scandals and algorithm changes hit, and your income follows the audience.
 */

export const NICHES = ['lifestyle', 'gaming', 'comedy', 'tech reviews', 'fitness', 'food', 'travel', 'beauty', 'education', 'music', 'sports', 'fashion'];
const RPM: Record<string, number> = { content_creator: 0.42, streamer: 0.3, youtuber: 0.36, podcaster: 0.26 };
export const AUDIENCE_TIERS = [0, 1000, 20000, 250000, 2000000];
const MILESTONES = [1000, 10000, 100000, 1000000, 10000000];
const GEAR_COST = [600, 2500, 10000];
export const GEAR_NAME = ['Phone and a ring light', 'Good camera and mic', 'Studio setup', 'Professional studio'];

export const creatorLevel = (aud: number) => AUDIENCE_TIERS.reduce((lv, t, i) => (aud >= t ? i : lv), 0);
export const isCreator = (def: CareerDef | undefined | null) => def?.special === 'creator';
export const creatorSkill = (p: Character) => clamp(p.skills.creative * 0.45 + p.skills.communication * 0.25 + p.stats.social * 0.15 + p.stats.appearance * 0.1 + p.stats.confidence * 0.05, 0, 100);
export const gearCost = (g: GameState) => { const lv = g.player.career.gear ?? 0; return lv >= 3 ? 0 : Math.round(GEAR_COST[lv] * wageScale(g)); };
export const fmtAudience = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1)}K` : `${n}`);
export const nextTier = (aud: number) => AUDIENCE_TIERS.find((t) => t > aud);

const creatorJob = (g: GameState) => { const j = g.player.career.job; const d = j ? careerById(j.careerId) : null; return j && isCreator(d) ? { job: j, def: d! } : null; };

function setTier(g: GameState, announce: boolean) {
  const p = g.player; const c = p.career; const cj = creatorJob(g); if (!cj) return;
  const lv = creatorLevel(c.audience ?? 0);
  if (lv === cj.job.level) return;
  const up = lv > cj.job.level;
  cj.job.level = lv;
  cj.job.title = cj.def.ladder?.[lv] ?? cj.job.title;
  const last = c.history[c.history.length - 1]; if (last) { last.title = cj.job.title; last.level = lv; }
  if (up && announce) { addStat(p, 'happiness', 6); addStat(p, 'confidence', 3); log(g, 'career', `🌟 Your audience hit ${fmtAudience(c.audience ?? 0)}. You are now a "${cj.job.title}".`, 'good'); }
}

export function onCreatorHired(g: GameState) {
  const c = g.player.career;
  if (!c.niche) c.niche = pick(NICHES);
  if (c.audience === undefined) c.audience = rint(20, 150);
  setTier(g, false);
}

/** yearly update, called from processCareer */
export function processCreator(g: GameState, def: CareerDef) {
  const p = g.player; const c = p.career; const job = c.job!;
  const aud0 = c.audience ?? 0;
  const skill = creatorSkill(p);
  const posts = c.posts ?? 0;
  const effort = c.effort === 'high' ? 1.35 : c.effort === 'low' ? 0.6 : 1;
  const gear = 1 + (c.gear ?? 0) * 0.12;
  const studying = ['bachelor', 'master', 'doctorate', 'vocational'].includes(p.edu.stage ?? '') ? 0.75 : 1;
  const econ = g.world.economy === 'recession' ? 0.85 : g.world.economy === 'boom' ? 1.1 : 1;
  const seed = (150 + skill * 14) * effort * gear * studying * (1 + posts * 0.45);
  const rate = ((0.03 + skill * 0.0035) * effort * (1 + posts * 0.12)) / (1 + aud0 / 1.5e6);
  let gain = seed + aud0 * rate;
  let viral = false;
  if (chance(0.02 + skill * 0.0004 + posts * 0.012)) { viral = true; gain = gain * rint(2, 4) + aud0 * 0.3 + 500; }
  let loss = 0;
  if (chance(0.05)) loss += aud0 * (0.04 + rnd() * 0.12);
  if (aud0 >= 50000 && chance(0.012)) { loss += aud0 * 0.3; c.reputation = clamp(c.reputation - 15, 0, 100); addStat(p, 'happiness', -6); log(g, 'career', '📉 A controversy hit your feed. Followers left in droves and brands went quiet.', 'bad'); }
  if (posts === 0 && effort < 1) loss += aud0 * 0.1;
  if (c.effort === 'high') { addStat(p, 'health', -1.5); addStat(p, 'happiness', -1.5); }
  if (aud0 >= 20000 && chance(0.04)) { addStat(p, 'happiness', -4); addStat(p, 'confidence', -2); log(g, 'career', '😔 Online hate and the pressure to perform wore you down this year.', 'bad'); }
  const aud = Math.max(0, Math.round(aud0 + gain * econ - loss));
  c.audience = aud;
  for (const m of MILESTONES) if (aud0 < m && aud >= m) { addStat(p, 'happiness', 5); log(g, 'career', `🎉 You passed ${fmtAudience(m)} followers!`, 'good'); }
  if (viral) log(g, 'career', '🔥 One of your posts went viral and your audience exploded.', 'good');
  else if (aud < aud0 * 0.9 && aud0 > 500) log(g, 'career', `📉 Your audience shrank to ${fmtAudience(aud)}.`, 'bad');
  const rpm = RPM[def.id] ?? 0.3;
  job.salary = Math.round(Math.max(0, aud * rpm * wageScale(g) * (c.reputation > 70 ? 1.15 : c.reputation < 35 ? 0.8 : 1)));
  job.performance = Math.round(clamp(skill * 0.6 + (viral ? 20 : 0) + posts * 7 + (aud > aud0 ? 8 : -8), 5, 100));
  job.satisfaction = Math.round(clamp(job.satisfaction + (aud > aud0 ? 4 : -4) + (c.effort === 'high' ? -2 : 1), 5, 100));
  p.skills.creative = clamp(p.skills.creative + 0.8, 0, 100); p.skills.communication = clamp(p.skills.communication + 0.5, 0, 100);
  c.posts = 0;
  setTier(g, true);
}

// ------------------------------------------------------------------ actions
const need = (g: GameState): ActionResult | null => (creatorJob(g) ? null : no('You need to be working as a creator first.'));

export function creatorPost(g: GameState): ActionResult {
  const bad = need(g); if (bad) return bad;
  const p = g.player; const c = p.career;
  if (p.energy < 1) return no('No energy left this year.');
  if ((c.posts ?? 0) >= 4) return no('You already posted plenty this year.');
  p.energy -= 1; c.posts = (c.posts ?? 0) + 1;
  const gain = Math.round(30 + (c.audience ?? 0) * 0.008 + creatorSkill(p) * 3);
  c.audience = (c.audience ?? 0) + gain;
  p.skills.creative = clamp(p.skills.creative + 0.6, 0, 100);
  setTier(g, true);
  return ok(`Your content gained ${fmtAudience(gain)} followers.`, 'good');
}
export function creatorCollab(g: GameState): ActionResult {
  const bad = need(g); if (bad) return bad;
  const p = g.player; const c = p.career; const aud = c.audience ?? 0;
  if (aud < 300) return no('You need at least 300 followers for someone to collaborate with you.');
  if (p.actions.includes('collab')) return no('You already collaborated this year.');
  if (p.energy < 1) return no('No energy left this year.');
  p.energy -= 1; p.actions.push('collab');
  if (chance(0.15)) { const lost = Math.round(aud * 0.03); c.audience = aud - lost; addStat(p, 'happiness', -3); return { ok: false, msg: 'The collaboration turned awkward and some followers unfollowed.', tone: 'bad' }; }
  const gain = Math.round(aud * (0.04 + rnd() * 0.12) + 200);
  c.audience = aud + gain; addStat(p, 'social', 1);
  setTier(g, true);
  return ok(`The collaboration brought ${fmtAudience(gain)} new followers.`, 'good');
}
export function creatorGear(g: GameState): ActionResult {
  const bad = need(g); if (bad) return bad;
  const c = g.player.career; const cost = gearCost(g);
  if ((c.gear ?? 0) >= 3) return no('You already have a professional studio.');
  if (g.player.fin.cash + g.player.fin.savings < cost) return no(`Upgrading costs ${fmtMoney(cost, g.player.countryId, true)}.`);
  payFromAssets(g, cost); c.gear = (c.gear ?? 0) + 1;
  addStat(g.player, 'happiness', 2);
  return ok(`Upgraded to: ${GEAR_NAME[c.gear]}. Your content looks sharper.`, 'good');
}
export function creatorAds(g: GameState): ActionResult {
  const bad = need(g); if (bad) return bad;
  const p = g.player; const c = p.career; const cost = Math.round(1500 * wageScale(g));
  if (p.fin.cash + p.fin.savings < cost) return no(`An ad campaign costs ${fmtMoney(cost, p.countryId, true)}.`);
  if (p.actions.includes('ads')) return no('You already ran a campaign this year.');
  payFromAssets(g, cost); p.actions.push('ads');
  if (chance(0.3)) return { ok: false, msg: 'The campaign flopped. The money is gone.', tone: 'bad' };
  const gain = rint(200, 1500) + Math.round((c.audience ?? 0) * 0.03);
  c.audience = (c.audience ?? 0) + gain;
  setTier(g, true);
  return ok(`The campaign brought ${fmtAudience(gain)} followers.`, 'good');
}

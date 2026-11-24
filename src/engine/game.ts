// Public facade of the engine. The UI talks to this module (and the individual engine modules) only —
// no React imports exist anywhere under src/engine.
import { ageUp } from './aging';
import { ACHIEVEMENTS, checkAchievements } from './achievements';
import { ACTIVITIES } from './activities';
import { newGame, randomNewLifeOptions, snapshot } from './character';
import { continueAsChild } from './family';
import { registerEvents } from './data/events';
import { popNextEvent, resolveChoice } from './events';
import type { AchievementDef, ActionResult, ActivityDef, EventTemplate, GameState, MetaState, NewGameOptions } from './types';

export { GAME_VERSION } from './character';

export function startNewGame(o: NewGameOptions, meta?: MetaState): GameState {
  const g = newGame(o);
  if (meta) { meta.livesLived++; checkAchievements(g, meta); }
  return g;
}

export interface StepResult extends ActionResult { unlocked: AchievementDef[] }

/** Run an action then keep the meta profile (achievements) in sync. */
export function withMeta(g: GameState, meta: MetaState, fn: () => ActionResult): StepResult {
  const r = fn();
  snapshot(g);
  const unlocked = checkAchievements(g, meta);
  return { ...r, unlocked };
}

export const advanceYear = (g: GameState, meta: MetaState): StepResult => withMeta(g, meta, () => ageUp(g));
export const chooseOption = (g: GameState, meta: MetaState, index: number): StepResult => withMeta(g, meta, () => {
  const r = resolveChoice(g, index);
  if (r.ok && !g.pending) popNextEvent(g);
  return r;
});
export const nextGeneration = (g: GameState, meta: MetaState, childId: string): StepResult => withMeta(g, meta, () => continueAsChild(g, childId));

/** Extension point: add events, activities or achievements without touching engine code. */
export function registerContent(c: { events?: EventTemplate[]; activities?: ActivityDef[]; achievements?: AchievementDef[] }) {
  if (c.events) registerEvents(c.events);
  if (c.activities) for (const a of c.activities) if (!ACTIVITIES.some((x) => x.id === a.id)) ACTIVITIES.push(a);
  if (c.achievements) for (const a of c.achievements) if (!ACHIEVEMENTS.some((x) => x.id === a.id)) ACHIEVEMENTS.push(a);
}

export { randomNewLifeOptions };

import type { EventTemplate } from '../../types';
import { CHILDHOOD } from './childhood';
import { YOUNG_ADULT, CAREER_EVENTS, INDUSTRY } from './career';
import { MONEY, RELATIONSHIPS, HEALTH, SENIOR, MISC } from './life';
import {
  HOBBY_EVENTS, HOBBY_FOLLOWUPS, SPORT_EVENTS, MISHAP_EVENTS, JOY_EVENTS, DILEMMAS, MODERN, PETS, HOUSING,
  PARENTING, LEGAL, SEASONAL, WORKPLACE,
} from './generated';

export const EVENTS: EventTemplate[] = [
  ...CHILDHOOD, ...YOUNG_ADULT, ...CAREER_EVENTS, ...INDUSTRY, ...MONEY, ...RELATIONSHIPS, ...HEALTH, ...SENIOR, ...MISC,
  ...HOBBY_EVENTS, ...HOBBY_FOLLOWUPS, ...SPORT_EVENTS, ...MISHAP_EVENTS, ...JOY_EVENTS, ...DILEMMAS, ...MODERN, ...PETS,
  ...HOUSING, ...PARENTING, ...LEGAL, ...SEASONAL, ...WORKPLACE,
];

/** Extension point: other modules may register more templates before the game starts. */
export function registerEvents(more: EventTemplate[]) {
  const have = new Set(EVENTS.map((e) => e.id));
  for (const e of more) if (!have.has(e.id)) EVENTS.push(e);
}

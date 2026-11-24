import type { StatKey } from '../types';

export interface TraitDef {
  id: string; name: string; icon: string; desc: string; stats?: Partial<Record<StatKey, number>>;
  // behaviour hooks read by the engines
  spend?: number; // expense multiplier delta
  risk?: number; // appetite for risk (-1..1)
  work?: number; // work performance bonus
  luck?: number; // small happiness drift
  conflicts?: string[];
}

export const TRAITS: TraitDef[] = [
  { id: 'ambitious', name: 'Ambitious', icon: '🚀', desc: 'Drives hard for promotions.', stats: { confidence: 4, discipline: 3 }, work: 4, conflicts: ['lazy'] },
  { id: 'curious', name: 'Curious', icon: '🔍', desc: 'Learns quickly and loves new things.', stats: { intelligence: 6 } },
  { id: 'shy', name: 'Shy', icon: '🫣', desc: 'Struggles to put themselves out there.', stats: { social: -7, confidence: -6 }, conflicts: ['charming', 'outgoing'] },
  { id: 'charming', name: 'Charming', icon: '😏', desc: 'People are drawn to you.', stats: { social: 7, appearance: 3 }, conflicts: ['shy'] },
  { id: 'outgoing', name: 'Outgoing', icon: '🎉', desc: 'Energized by people.', stats: { social: 6, happiness: 3 }, conflicts: ['shy'] },
  { id: 'lazy', name: 'Lazy', icon: '🛋️', desc: 'Prefers the couch to the grind.', stats: { discipline: -8 }, work: -4, conflicts: ['ambitious', 'hardworking'] },
  { id: 'hardworking', name: 'Hardworking', icon: '💪', desc: 'Puts in the hours.', stats: { discipline: 7 }, work: 5, conflicts: ['lazy'] },
  { id: 'risktaker', name: 'Risk-taker', icon: '🎲', desc: 'Bold bets, big swings.', risk: 0.8, stats: { confidence: 3 }, conflicts: ['cautious'] },
  { id: 'cautious', name: 'Cautious', icon: '🛡️', desc: 'Careful and prepared.', risk: -0.7, stats: { health: 2, discipline: 3 }, conflicts: ['risktaker', 'impulsive'] },
  { id: 'generous', name: 'Generous', icon: '🎁', desc: 'Gives freely.', spend: 0.06, stats: { social: 3 }, conflicts: ['frugal'] },
  { id: 'frugal', name: 'Frugal', icon: '🪙', desc: 'Watches every penny.', spend: -0.1, stats: { discipline: 3 }, conflicts: ['spendthrift', 'generous'] },
  { id: 'spendthrift', name: 'Spendthrift', icon: '🛍️', desc: 'Money burns a hole in your pocket.', spend: 0.14, conflicts: ['frugal'] },
  { id: 'creative', name: 'Creative', icon: '🎨', desc: 'Sees the world differently.', stats: { intelligence: 2, happiness: 2 } },
  { id: 'analytical', name: 'Analytical', icon: '🧮', desc: 'Loves data and logic.', stats: { intelligence: 5 }, work: 2 },
  { id: 'anxious', name: 'Anxious', icon: '😰', desc: 'Worries more than most.', stats: { happiness: -5, confidence: -4 }, conflicts: ['optimistic'] },
  { id: 'optimistic', name: 'Optimistic', icon: '🌞', desc: 'Looks on the bright side.', stats: { happiness: 7 }, luck: 1, conflicts: ['anxious'] },
  { id: 'stubborn', name: 'Stubborn', icon: '🪨', desc: 'Digs in when challenged.', stats: { discipline: 2 } },
  { id: 'loyal', name: 'Loyal', icon: '🤝', desc: 'Sticks by the people you love.', stats: { social: 2 } },
  { id: 'impulsive', name: 'Impulsive', icon: '⚡', desc: 'Acts first, thinks later.', risk: 0.6, stats: { discipline: -5 }, conflicts: ['cautious'] },
  { id: 'athletic', name: 'Athletic', icon: '🏃', desc: 'Built for movement.', stats: { health: 6, appearance: 2 } },
  { id: 'empathetic', name: 'Empathetic', icon: '💞', desc: 'Feels what others feel.', stats: { social: 4 } },
];

export const traitById = (id: string) => TRAITS.find((t) => t.id === id);
export const traitSum = (traits: string[], key: 'spend' | 'risk' | 'work' | 'luck'): number =>
  traits.reduce((s, t) => s + (traitById(t)?.[key] ?? 0), 0);

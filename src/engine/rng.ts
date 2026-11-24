// Random helpers. A seedable generator makes headless simulations reproducible in tests.
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let gen: () => number = Math.random;

export function seedRng(n: number | null) {
  gen = n == null ? Math.random : mulberry32(n);
}

export const rnd = () => gen();
export const rint = (a: number, b: number) => Math.floor(rnd() * (b - a + 1)) + a;
export const rfloat = (a: number, b: number) => a + rnd() * (b - a);
export const chance = (p: number) => rnd() < p;
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const round = (v: number, step = 1) => Math.round(v / step) * step;

export function gauss(mean = 0, sd = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function weightedPick<T>(items: readonly T[], weight: (t: T) => number): T | undefined {
  let total = 0;
  const ws = items.map((i) => {
    const w = Math.max(0, weight(i));
    total += w;
    return w;
  });
  if (total <= 0) return undefined;
  let r = rnd() * total;
  for (let i = 0; i < items.length; i++) {
    r -= ws[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

let uidCounter = 0;
export function uid(prefix = 'id'): string {
  uidCounter++;
  return `${prefix}_${uidCounter.toString(36)}${Math.floor(rnd() * 1e9).toString(36)}`;
}

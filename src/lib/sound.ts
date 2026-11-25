// Tiny sound engine: every effect is synthesised with the Web Audio API, so there are no audio files to download or cache.
export type Sfx = 'tap' | 'good' | 'bad' | 'coin' | 'age' | 'event' | 'achievement' | 'death' | 'alarm' | 'splash' | 'birth';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let volume = 0.7;
let lastTap = 0;

export function configureSound(cfg: { enabled: boolean; volume: number }) {
  enabled = cfg.enabled;
  volume = Math.min(1, Math.max(0, cfg.volume));
  if (master) master.gain.value = volume * 0.5;
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = volume * 0.5;
      master.connect(ctx.destination);
    } catch { return null; }
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  return ctx;
}

/** Browsers only allow sound after a tap or key press. Call this from the first user gesture. */
export function unlockAudio(): boolean {
  const c = audio();
  return !!c && c.state === 'running';
}
export const audioReady = () => !!ctx && ctx.state === 'running';

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.5, slideTo?: number) {
  const c = ctx!; const t0 = c.currentTime + start;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master!);
  o.start(t0); o.stop(t0 + dur + 0.03);
}
function noise(start: number, dur: number, gain = 0.3, lowpass = 800) {
  const c = ctx!; const t0 = c.currentTime + start;
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass;
  const g = c.createGain(); g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(master!); s.start(t0);
}

const N = (semi: number) => 440 * Math.pow(2, (semi - 9) / 12); // semitones above middle C

const RECIPES: Record<Sfx, () => void> = {
  tap: () => tone(N(19), 0, 0.05, 'triangle', 0.22),
  good: () => { tone(N(12), 0, 0.14, 'triangle', 0.35); tone(N(16), 0.09, 0.2, 'triangle', 0.35); },
  bad: () => { tone(N(7), 0, 0.2, 'sawtooth', 0.18, N(2)); tone(N(3), 0.12, 0.3, 'sawtooth', 0.16, N(-3)); },
  coin: () => { tone(N(23), 0, 0.07, 'square', 0.14); tone(N(28), 0.07, 0.22, 'square', 0.14); },
  age: () => { noise(0, 0.28, 0.14, 1800); tone(N(7), 0.02, 0.18, 'sine', 0.3); tone(N(14), 0.12, 0.3, 'sine', 0.28); },
  event: () => { tone(N(19), 0, 0.12, 'sine', 0.3); tone(N(24), 0.1, 0.28, 'sine', 0.26); },
  achievement: () => { [12, 16, 19, 24].forEach((s, i) => tone(N(s), i * 0.1, 0.28, 'triangle', 0.3)); tone(N(28), 0.42, 0.55, 'sine', 0.28); },
  death: () => { [7, 3, 0, -5].forEach((s, i) => tone(N(s), i * 0.42, 0.7, 'sine', 0.3)); },
  alarm: () => { noise(0, 0.22, 0.5, 400); tone(N(-17), 0, 0.3, 'sine', 0.5, N(-24)); tone(N(-17), 0.34, 0.3, 'sine', 0.5, N(-24)); noise(0.34, 0.22, 0.5, 400); },
  splash: () => { [0, 7, 12, 16, 19].forEach((s, i) => tone(N(s), i * 0.11, 0.9, 'sine', 0.22)); tone(N(24), 0.62, 1.0, 'triangle', 0.18); },
  birth: () => { tone(N(12), 0, 0.2, 'sine', 0.3); tone(N(19), 0.14, 0.4, 'sine', 0.28); },
};

export function sfx(name: Sfx) {
  if (!enabled || volume <= 0) return;
  const now = performance.now();
  if (name === 'tap') { if (now - lastTap < 70) return; lastTap = now; }
  if (!audio() || ctx!.state !== 'running') return;
  try { RECIPES[name](); } catch { /* sound is never worth a crash */ }
}

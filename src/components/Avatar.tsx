import { useMemo } from 'react';
import type { Gender } from '../engine/types';

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }
const SKIN = ['#f6d3b8', '#eab98f', '#d9a073', '#b97b52', '#8d5a3b', '#6b4229'];
const HAIR = ['#1b1512', '#3a2418', '#6b4423', '#a9743a', '#d8b36a', '#b0432b', '#2d2d33', '#7c5a98'];
const SHIRT = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6'];

/** A friendly procedurally generated portrait: unique per seed, ages with the character. */
export function Avatar({ seed, gender = 'male', age = 25, size = 64, className, dead }: { seed: string; gender?: Gender; age?: number; size?: number; className?: string; dead?: boolean }) {
  const a = useMemo(() => {
    const h = hash(seed);
    return { skin: SKIN[h % SKIN.length], hair: HAIR[(h >> 3) % HAIR.length], shirt: SHIRT[(h >> 6) % SHIRT.length], style: (h >> 9) % 4, bg: (h >> 12) % 6 };
  }, [seed]);
  const baby = age < 3;
  const child = age < 13;
  const old = age >= 62;
  const gray = age >= 52 ? Math.min(1, (age - 52) / 14) : 0;
  const hair = gray > 0.2 ? `color-mix(in srgb, ${a.hair} ${Math.round((1 - gray) * 100)}%, #e5e7eb)` : a.hair;
  const headR = baby ? 25 : child ? 23 : 21;
  const cy = baby ? 44 : child ? 42 : 38;
  const female = gender === 'female';
  const bgs = ['#c4b5fd', '#a5f3fc', '#fde68a', '#fbcfe8', '#bbf7d0', '#bfdbfe'];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label="Portrait" style={dead ? { filter: 'grayscale(1)' } : undefined}>
      <defs><clipPath id={`c${seed}`}><circle cx="50" cy="50" r="50" /></clipPath></defs>
      <g clipPath={`url(#c${seed})`}>
        <rect width="100" height="100" fill={bgs[a.bg]} />
        {/* shoulders */}
        <path d={`M8 100 C 8 ${baby ? 78 : 74}, 28 ${baby ? 70 : 64}, 50 ${baby ? 70 : 64} C 72 ${baby ? 70 : 64}, 92 ${baby ? 78 : 74}, 92 100 Z`} fill={a.shirt} />
        <rect x={baby ? 44 : 43} y={cy + headR - 4} width={baby ? 12 : 14} height="14" rx="5" fill={a.skin} />
        {/* long hair behind */}
        {(female || a.style === 3) && !baby && age < 70 && <path d={`M${50 - headR - 3} ${cy} q-2 ${female ? 34 : 18} 8 ${female ? 38 : 22} h${(headR + 3) * 2 - 16} q10 -${female ? 4 : 0} 8 -${female ? 38 : 22} z`} fill={hair} />}
        {/* head */}
        <ellipse cx="50" cy={cy} rx={headR} ry={headR + 2} fill={a.skin} />
        <circle cx={50 - headR} cy={cy + 2} r="4" fill={a.skin} /><circle cx={50 + headR} cy={cy + 2} r="4" fill={a.skin} />
        {/* hair top */}
        {!baby && age < 85 && (a.style === 2 && !female ? <path d={`M${50 - headR} ${cy - 6} q ${headR} -${headR + 8} ${headR * 2} 0 q -${headR} -6 -${headR * 2} 0z`} fill={hair} opacity={gray > 0.8 ? 0.6 : 1} /> : <path d={`M${50 - headR - 1} ${cy - 2} q 1 -${headR + 6} ${headR + 1} -${headR + 6} q ${headR} 0 ${headR + 1} ${headR + 6} q -6 -${headR - 4} -${headR + 1} -${headR - 6} q -${headR - 6} 2 -${headR + 1} ${headR - 4}z`} fill={hair} />)}
        {baby && <path d={`M${44} ${cy - headR} q6 -6 12 0`} stroke={a.hair} strokeWidth="3" fill="none" strokeLinecap="round" />}
        {/* face */}
        <circle cx="42" cy={cy + 1} r="2.4" fill="#1f2937" /><circle cx="58" cy={cy + 1} r="2.4" fill="#1f2937" />
        {dead ? <path d={`M${40} ${cy - 1} l4 4 m0 -4 l-4 4 M${56} ${cy - 1} l4 4 m0 -4 l-4 4`} stroke="#111" strokeWidth="1.5" /> : null}
        <path d={`M43 ${cy + 11} q7 ${dead ? -2 : 6} 14 0`} stroke="#7f1d1d" strokeWidth="2" fill="none" strokeLinecap="round" />
        {old && <path d={`M${36} ${cy - 7} h8 M${56} ${cy - 7} h8`} stroke="#00000030" strokeWidth="1.5" strokeLinecap="round" />}
        {age >= 62 && <><circle cx="42" cy={cy + 1} r="6" fill="none" stroke="#374151" strokeWidth="1.2" /><circle cx="58" cy={cy + 1} r="6" fill="none" stroke="#374151" strokeWidth="1.2" /><path d={`M48 ${cy + 1} h4`} stroke="#374151" strokeWidth="1.2" /></>}
        <circle cx="35" cy={cy + 8} r="3.2" fill="#f87171" opacity=".25" /><circle cx="65" cy={cy + 8} r="3.2" fill="#f87171" opacity=".25" />
      </g>
    </svg>
  );
}

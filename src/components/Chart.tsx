import { useId, useMemo, useState } from 'react';

export interface Series { name: string; color: string; points: { x: number; y: number }[]; area?: boolean }

const nice = (v: number) => { const a = Math.abs(v); const s = v < 0 ? '-' : ''; return a >= 1e9 ? `${s}${(a / 1e9).toFixed(1)}B` : a >= 1e6 ? `${s}${(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `${s}${(a / 1e3).toFixed(a >= 1e5 ? 0 : 1)}K` : `${s}${Math.round(a)}`; };

/** A lightweight, dependency-free SVG line chart with hover read-out. */
export function LineChart({ series, height = 180, yFormat, xLabel = 'Age', yMin, yMax }: { series: Series[]; height?: number; yFormat?: (v: number) => string; xLabel?: string; yMin?: number; yMax?: number }) {
  const id = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = height, L = 40, R = 10, T = 10, B = 24;
  const all = series.flatMap((s) => s.points);
  const dims = useMemo(() => {
    if (!all.length) return null;
    const xs = all.map((p) => p.x), ys = all.map((p) => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs, x0 + 1);
    let y0 = yMin ?? Math.min(...ys, 0), y1 = yMax ?? Math.max(...ys);
    if (y1 === y0) y1 = y0 + 1;
    const pad = (y1 - y0) * 0.06; if (yMax === undefined) y1 += pad; if (yMin === undefined && y0 < 0) y0 -= pad;
    return { x0, x1, y0, y1 };
  }, [all, yMin, yMax]);
  if (!dims) return <div className="grid h-24 place-items-center text-sm text-muted">No data yet</div>;
  const sx = (x: number) => L + ((x - dims.x0) / (dims.x1 - dims.x0)) * (W - L - R);
  const sy = (y: number) => T + (1 - (y - dims.y0) / (dims.y1 - dims.y0)) * (H - T - B);
  const fmt = yFormat ?? nice;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => dims.y0 + (dims.y1 - dims.y0) * t);
  const xs = [...new Set(all.map((p) => p.x))].sort((a, b) => a - b);
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const xv = dims.x0 + ((px - L) / (W - L - R)) * (dims.x1 - dims.x0);
    let best = xs[0]; for (const x of xs) if (Math.abs(x - xv) < Math.abs(best - xv)) best = x;
    setHover(best);
  };
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" role="img" aria-label="Line chart" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="currentColor" strokeOpacity=".1" />
            <text x={L - 6} y={sy(t) + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity=".55">{fmt(t)}</text>
          </g>
        ))}
        {[dims.x0, Math.round((dims.x0 + dims.x1) / 2), dims.x1].map((x) => <text key={x} x={sx(x)} y={H - 6} textAnchor="middle" fontSize="10" fill="currentColor" opacity=".55">{xLabel} {x}</text>)}
        {series.map((s, i) => {
          const d = s.points.map((p, j) => `${j ? 'L' : 'M'}${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(' ');
          const area = `${d} L${sx(s.points[s.points.length - 1]?.x ?? 0).toFixed(1)} ${sy(Math.max(dims.y0, 0)).toFixed(1)} L${sx(s.points[0]?.x ?? 0).toFixed(1)} ${sy(Math.max(dims.y0, 0)).toFixed(1)} Z`;
          return (
            <g key={s.name}>
              {s.area && s.points.length > 1 && <><defs><linearGradient id={`${id}g${i}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={s.color} stopOpacity=".35" /><stop offset="1" stopColor={s.color} stopOpacity="0" /></linearGradient></defs><path d={area} fill={`url(#${id}g${i})`} /></>}
              {s.points.length > 1 ? <path d={d} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" /> : s.points[0] && <circle cx={sx(s.points[0].x)} cy={sy(s.points[0].y)} r="3" fill={s.color} />}
            </g>
          );
        })}
        {hover !== null && (
          <g>
            <line x1={sx(hover)} x2={sx(hover)} y1={T} y2={H - B} stroke="currentColor" strokeOpacity=".3" strokeDasharray="3 3" />
            {series.map((s) => { const p = s.points.find((q) => q.x === hover); return p ? <circle key={s.name} cx={sx(p.x)} cy={sy(p.y)} r="4" fill={s.color} stroke="white" strokeWidth="1.2" /> : null; })}
          </g>
        )}
      </svg>
      <div className="mt-1 flex min-h-5 flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {series.map((s) => {
          const p = hover !== null ? s.points.find((q) => q.x === hover) : s.points[s.points.length - 1];
          return <span key={s.name} className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}{p ? <b className="tabular-nums">{fmt(p.y)}</b> : null}</span>;
        })}
        {hover !== null && <span className="ml-auto text-muted">{xLabel} {hover}</span>}
      </div>
    </div>
  );
}

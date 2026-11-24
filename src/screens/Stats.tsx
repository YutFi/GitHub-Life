import { useGame } from '../store/useGame';
import { Card, Chip, KV, Meter, Money, PageHeader, SectionTitle, StatBar } from '../components/ui';
import { LineChart } from '../components/Chart';
import { fmtMoney } from '../engine/format';
import { SKILL_NAMES } from '../engine/character';
import { getCountry } from '../engine/data/countries';
import type { SkillKey, StatKey } from '../engine/types';
import { netWorth } from '../engine/util';

const STATS: StatKey[] = ['health', 'happiness', 'intelligence', 'appearance', 'confidence', 'discipline', 'social'];

export function Stats() {
  const g = useGame((s) => s.game)!;
  const p = g.player; const cc = p.countryId; const w = g.world; const c = getCountry(cc);
  const h = p.history;
  const avgHappy = h.length ? Math.round(h.reduce((s, x) => s + x.happiness, 0) / h.length) : Math.round(p.stats.happiness);
  const years = h.map((x) => x.age);
  void years;
  return (
    <div className="space-y-4">
      <PageHeader title="Statistics" sub={`${p.firstName} ${p.lastName} · age ${p.age}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><SectionTitle>Current stats</SectionTitle><div className="grid grid-cols-2 gap-x-5 gap-y-3.5">{STATS.map((k) => <StatBar key={k} stat={k} value={p.stats[k]} />)}</div></Card>
        <Card><SectionTitle>Skills</SectionTitle>
          <div className="space-y-2.5">{(Object.keys(p.skills) as SkillKey[]).map((k) => <div key={k}><div className="mb-1 flex justify-between text-xs"><span className="text-muted">{SKILL_NAMES[k]}</span><b className="tabular-nums">{Math.round(p.skills[k])}</b></div><Meter value={p.skills[k]} color="linear-gradient(90deg,var(--brand),var(--brand2))" label={SKILL_NAMES[k]} height={6} /></div>)}</div></Card>
      </div>

      <Card><SectionTitle>Health, happiness & smarts</SectionTitle>
        <LineChart yMin={0} yMax={100} series={[
          { name: 'Health', color: '#fb7185', points: h.map((x) => ({ x: x.age, y: x.health })) },
          { name: 'Happiness', color: '#fbbf24', points: h.map((x) => ({ x: x.age, y: x.happiness })) },
          { name: 'Smarts', color: '#60a5fa', points: h.map((x) => ({ x: x.age, y: x.intelligence })) },
        ]} /></Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><SectionTitle>Net worth</SectionTitle><LineChart series={[{ name: 'Net worth', color: '#34d399', area: true, points: h.map((x) => ({ x: x.age, y: x.netWorth })) }]} yFormat={(v) => fmtMoney(v, cc, true)} /></Card>
        <Card><SectionTitle>Yearly income</SectionTitle><LineChart series={[{ name: 'Income', color: '#a78bfa', area: true, points: h.map((x) => ({ x: x.age, y: x.income })) }]} yFormat={(v) => fmtMoney(v, cc, true)} yMin={0} /></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Lifetime</SectionTitle>
          <KV k="Net worth now" v={<Money usd={netWorth(g)} country={cc} compact />} />
          <KV k="Peak net worth" v={<Money usd={p.fin.peakNetWorth * w.priceIndex} country={cc} compact />} />
          <KV k="Average happiness" v={avgHappy} />
          <KV k="Years worked" v={p.career.totalYears} />
          <KV k="Years unemployed" v={p.career.unemployedYears} />
          <KV k="Jobs held" v={p.career.history.length} />
          <KV k="Countries visited" v={p.visited.length} />
          <KV k="Inherited in total" v={<Money usd={p.fin.totalInherited} country={cc} compact />} />
          <KV k="Given to charity" v={<Money usd={p.fin.donated * w.priceIndex} country={cc} compact />} />
          <KV k="Achievements this life" v={p.achievements.length} />
        </Card>
        <Card>
          <SectionTitle right={<Chip tone={w.economy === 'boom' ? 'good' : w.economy === 'recession' ? 'bad' : 'neutral'}>{w.economy}</Chip>}>World economy · {c.name}</SectionTitle>
          <KV k="Inflation" v={`${(w.inflation * 100).toFixed(1)}%`} />
          <KV k="Unemployment" v={`${(w.unemployment * 100).toFixed(1)}%`} />
          <KV k="Interest rate" v={`${(w.interest * 100).toFixed(1)}%`} />
          <KV k="Stock market (last year)" v={<span className={w.stockReturn >= 0 ? 'text-good' : 'text-bad'}>{(w.stockReturn * 100).toFixed(1)}%</span>} />
          <KV k="House prices (last year)" v={<span className={w.housingGrowth >= 0 ? 'text-good' : 'text-bad'}>{(w.housingGrowth * 100).toFixed(1)}%</span>} />
          <KV k="Prices vs. 2025" v={`${(w.priceIndex * 100).toFixed(0)}%`} />
          {w.events.length > 0 && <div className="mt-2 space-y-1.5">{w.events.map((e) => <div key={e.id} className="rounded-xl bg-black/10 p-2 text-xs"><b>{e.title}</b> — {e.desc} <span className="text-muted">({e.yearsLeft} yr left)</span></div>)}</div>}
        </Card>
      </div>
      {w.history.length > 1 && (
        <Card><SectionTitle>Economic history</SectionTitle>
          <LineChart xLabel="" series={[
            { name: 'Inflation %', color: '#fb923c', points: w.history.map((x) => ({ x: x.year, y: Math.round(x.inflation * 1000) / 10 })) },
            { name: 'Unemployment %', color: '#22d3ee', points: w.history.map((x) => ({ x: x.year, y: Math.round(x.unemployment * 1000) / 10 })) },
          ]} yFormat={(v) => `${v.toFixed(0)}%`} /></Card>
      )}
    </div>
  );
}

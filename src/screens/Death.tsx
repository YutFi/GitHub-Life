import { useNavigate } from 'react-router-dom';
import { useGame } from '../store/useGame';
import { Avatar } from '../components/Avatar';
import { Card, Chip, KV, Money, SectionTitle } from '../components/ui';
import { eligibleHeirs } from '../engine/family';
import { achievementById } from '../engine/achievements';
import { getCountry } from '../engine/data/countries';
import { LineChart } from '../components/Chart';
import { fmtMoney } from '../engine/format';

export function Death() {
  const g = useGame((s) => s.game)!;
  const next = useGame((s) => s.nextGeneration);
  const leave = useGame((s) => s.leave);
  const nav = useNavigate();
  const d = g.deathSummary;
  const p = g.player;
  if (!d) return <div className="grid min-h-dvh place-items-center text-muted">Loading…</div>;
  const cc = d.countryId;
  const heirs = eligibleHeirs(g);
  const share = (id: string) => g.estateShares.find((s) => s.id === id);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl space-y-4 px-4 pb-12 pt-6">
      <div className="anim-pop text-center">
        <Avatar seed={p.id} gender={p.gender} age={d.age} size={104} dead className="mx-auto rounded-[2rem] shadow-2xl" />
        <div className="mt-3 text-xs font-bold uppercase tracking-widest text-muted">In memoriam</div>
        <h1 className="h-display text-3xl font-extrabold">{d.name}</h1>
        <p className="text-muted">{d.birthYear} – {d.deathYear} · aged {d.age}</p>
        <p className="mt-1 text-sm">☠️ {d.cause}</p>
      </div>

      <Card className="text-center">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Legacy score</div>
        <div className="text-gradient h-display text-6xl font-extrabold tabular-nums">{d.legacyScore}</div>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">{d.legacyText}</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><SectionTitle>Life summary</SectionTitle>
          <KV k="Country" v={`${getCountry(cc).flag} ${getCountry(cc).name}`} /><KV k="Education" v={d.highestEdu} /><KV k="Spouse" v={d.spouse ?? '—'} />
          <KV k="Children" v={d.children.length} /><KV k="Net worth at death" v={<Money usd={d.netWorth} country={cc} compact />} /><KV k="Peak net worth" v={<Money usd={d.peakNetWorth} country={cc} compact />} />
          <KV k="Average happiness" v={d.avgHappiness} /><KV k="Countries visited" v={d.countries} /><KV k="Generation" v={d.generation} /></Card>
        <Card><SectionTitle>Career</SectionTitle>
          {d.careerHistory.length === 0 ? <p className="text-sm text-muted">Never held a formal job.</p> : <div className="space-y-1.5">{d.careerHistory.map((j, i) => <div key={i} className="text-sm"><b>{j.title}</b> <span className="text-muted">· {j.company} · {j.startAge}–{j.endAge ?? d.age}</span></div>)}</div>}
          {d.achievements.length > 0 && <><SectionTitle>Achievements</SectionTitle><div className="flex flex-wrap gap-1.5">{d.achievements.map((id) => { const a = achievementById(id); return a ? <Chip key={id} tone="good">{a.icon} {a.name}</Chip> : null; })}</div></>}</Card>
      </div>

      {p.history.length > 1 && <Card><SectionTitle>A life in numbers</SectionTitle><LineChart yMin={0} yMax={100} series={[{ name: 'Health', color: '#fb7185', points: p.history.map((h) => ({ x: h.age, y: h.health })) }, { name: 'Happiness', color: '#fbbf24', points: p.history.map((h) => ({ x: h.age, y: h.happiness })) }]} /></Card>}

      <Card>
        <SectionTitle>Estate</SectionTitle>
        <KV k="Gross estate" v={<Money usd={d.estate.gross} country={cc} compact />} /><KV k="Debts settled" v={<span className="text-bad">−<Money usd={d.estate.debts} country={cc} compact /></span>} />
        <KV k="Inheritance tax" v={<span className="text-bad">−<Money usd={d.estate.tax} country={cc} compact /></span>} /><KV k="Charity" v={<Money usd={d.estate.charity} country={cc} compact />} />
        {d.estate.shares.length > 0 ? <div className="mt-2 space-y-1.5 border-t border-line pt-2">{d.estate.shares.map((s) => <KV key={s.id} k={`${s.name} (${s.relation})`} v={<Money usd={s.amount} country={cc} compact />} />)}</div> : <p className="mt-2 text-sm text-muted">No heirs received an inheritance.</p>}
      </Card>

      <Card>
        <SectionTitle>Your legacy continues</SectionTitle>
        {heirs.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">Choose which child carries the family name. You will start their life where they are now, with their inheritance and everything their upbringing gave them.</p>
            {heirs.map((h) => (
              <div key={h.id} className="card flex items-center gap-3 p-3">
                <Avatar seed={h.id} gender={h.gender} age={h.age} size={52} />
                <button className="btn btn-primary btn-sm" onClick={() => { next(h.id); nav('/play'); }} data-testid="continue-as">Play as {h.name.split(' ')[0]}</button>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted">There is no one left to carry on the line. Every story ends — begin another.</p>}
      </Card>

      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary flex-1" onClick={() => { leave(); nav('/new'); }}>✨ Start a new life</button>
        <button className="btn flex-1" onClick={() => { leave(); nav('/'); }}>Main menu</button>
      </div>
    </div>
  );
}

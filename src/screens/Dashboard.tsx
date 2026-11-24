import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useGame } from '../store/useGame';
import { Avatar } from '../components/Avatar';
import { AgeButton } from '../components/Shell';
import { Card, Chip, KV, Meter, Money, SectionTitle, StatBar, cx, toneClass } from '../components/ui';
import { getCountry } from '../engine/data/countries';
import { traitById } from '../engine/data/traits';
import { stageLabel, highestDegreeName } from '../engine/education';
import { BALANCE } from '../engine/config';
import { netWorth, STAGE_NAME, stageOf, liquid } from '../engine/util';
import { TIER_NAME } from '../engine/people';
import type { StatKey } from '../engine/types';

const STATS: StatKey[] = ['health', 'happiness', 'intelligence', 'appearance', 'confidence', 'discipline', 'social'];

export function Dashboard() {
  const g = useGame((s) => s.game)!;
  const nav = useNavigate();
  const p = g.player;
  const c = getCountry(p.countryId);
  const job = p.career.job;
  const nw = netWorth(g);
  const rep = p.fin.lastReport;
  const debt = p.fin.loans.reduce((s, l) => s + l.balance, 0) + p.fin.card.balance;
  const status = p.edu.stage ? `📚 ${stageLabel(p)}` : job ? `💼 ${job.title} at ${job.company}` : p.career.business ? `🏢 Founder of ${p.career.business.name}` : p.career.retired ? '🌴 Retired' : p.age < 5 ? '🍼 Growing up' : p.age < 16 ? '🏠 Not in school' : '🔎 Looking for work';
  const energyMax = BALANCE.energyPerYear;

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl" style={{ background: 'var(--brand)' }} />
        <div className="relative flex items-center gap-4">
          <Avatar seed={p.id} gender={p.gender} age={p.age} size={84} dead={!p.alive} className="shrink-0 rounded-3xl shadow-xl" />
          <div className="min-w-0 flex-1">
            <div className="h-display truncate text-2xl font-bold">{p.firstName} {p.lastName}</div>
            <div className="text-sm text-muted">Age {p.age} · {STAGE_NAME[stageOf(p.age)]} · {g.year}</div>
            <div className="truncate text-sm text-muted">{c.flag} {p.city}, {c.name}</div>
            <div className="mt-1 truncate text-sm font-medium">{status}</div>
          </div>
        </div>
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {p.generation > 1 && <Chip tone="info">Generation {p.generation}</Chip>}
          <Chip>{TIER_NAME[p.background.wealthTier]} roots</Chip>
          {p.traits.map((t) => <Chip key={t}>{traitById(t)?.icon} {traitById(t)?.name}</Chip>)}
          {p.conditions.map((x) => <Chip key={x} tone="bad">🩺 {x}</Chip>)}
        </div>
      </Card>

      <AgeButton big />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Stats</SectionTitle>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">{STATS.map((k) => <StatBar key={k} stat={k} value={p.stats[k]} />)}</div>
        </Card>
        <Card>
          <SectionTitle right={<span className="text-xs text-muted">refills each year</span>} icon={<Zap size={16} className="text-warn" />}>Energy</SectionTitle>
          <div className="mb-1 flex items-baseline gap-1"><span className="text-3xl font-extrabold tabular-nums">{p.energy}</span><span className="text-muted">/ {energyMax} this year</span></div>
          <Meter value={p.energy} max={energyMax} color="linear-gradient(90deg,#fbbf24,#fb923c)" label="Energy" />
          <p className="mt-2 text-xs text-muted">Activities and time with loved ones use energy. Spend it before you age up.</p>
          <button className="btn btn-sm mt-3" onClick={() => nav('/play/actions/activities')}>Choose activities</button>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle right={<button className="btn btn-ghost btn-sm" onClick={() => nav('/play/actions/finance')}>Manage</button>}>Money</SectionTitle>
          <div className="mb-2 text-3xl font-extrabold tabular-nums"><Money usd={nw} country={p.countryId} /></div>
          <KV k="Cash" v={<Money usd={p.fin.cash} country={p.countryId} />} />
          <KV k="Savings" v={<Money usd={p.fin.savings} country={p.countryId} />} />
          <KV k="Liquid after debts" v={<Money usd={liquid(g)} country={p.countryId} />} />
          {debt > 0 && <KV k="Debt" v={<span className="text-bad"><Money usd={debt} country={p.countryId} /></span>} />}
          {p.fin.trust > 0 && <KV k="Trust fund (until 18)" v={<Money usd={p.fin.trust} country={p.countryId} />} />}
          {rep && (
            <div className="mt-2 rounded-2xl bg-black/10 p-3 text-sm">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Last year (age {rep.age})</div>
              <KV k="Net result" v={<span className={rep.net >= 0 ? 'text-good' : 'text-bad'}><Money usd={rep.net} country={p.countryId} signed /></span>} />
              {rep.hardship && <p className="text-xs text-bad">You struggled to cover your costs.</p>}
            </div>
          )}
        </Card>
        <Card>
          <SectionTitle right={<button className="btn btn-ghost btn-sm" onClick={() => nav('/play/journal')}>Journal</button>}>Recent</SectionTitle>
          {p.journal.length === 0 ? <p className="text-sm text-muted">Your story begins here. Age up to start living.</p> : (
            <ul className="space-y-2">
              {[...p.journal].slice(-6).reverse().map((j) => (
                <li key={j.id} className="flex gap-2.5 text-sm"><span className="mt-0.5 w-8 shrink-0 text-right text-xs font-bold tabular-nums text-muted">{j.age}</span><span className={cx(toneClass(j.tone), j.tone === 'neutral' && '!text-ink')}>{j.text}</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle>Snapshot</SectionTitle>
        <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
          <KV k="Education" v={<span className="text-xs">{highestDegreeName(p)}</span>} />
          <KV k="Income" v={job ? <Money usd={job.salary} country={p.countryId} compact /> : '—'} />
          <KV k="Friends" v={p.people.filter((x) => x.alive && x.relation === 'friend').length} />
          <KV k="Children" v={p.people.filter((x) => x.relation === 'child').length} />
        </div>
        <p className="mt-2 text-xs text-muted">Economy: {g.world.economy} · inflation {(g.world.inflation * 100).toFixed(1)}% · unemployment {(g.world.unemployment * 100).toFixed(1)}%</p>
      </Card>
    </div>
  );
}

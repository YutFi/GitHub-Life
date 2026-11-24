import { useMemo, useState } from 'react';
import { useGame } from '../../store/useGame';
import { useConfirmSetting, useDo, Row, ChanceChip } from './common';
import { Card, Chip, ConfirmButton, Money, SectionTitle, Segmented } from '../../components/ui';
import { DESTINATIONS, COUNTRIES, getCountry } from '../../engine/data/countries';
import { relocate, relocationCost, travel, tripCost, TRIP_STYLES, visaChance } from '../../engine/travel';
import type { TripStyle } from '../../engine/travel';

export function TravelPanel() {
  const g = useGame((s) => s.game)!;
  const run = useDo();
  const confirmSetting = useConfirmSetting();
  const [style, setStyle] = useState<TripStyle>('standard');
  const [mode, setMode] = useState<'trip' | 'move'>('trip');
  const [q, setQ] = useState('');
  const p = g.player; const cc = p.countryId;
  const dests = useMemo(() => DESTINATIONS.filter((d) => d.id !== cc && d.name.toLowerCase().includes(q.toLowerCase())), [cc, q]);
  const moves = COUNTRIES.filter((c) => c.id !== cc && c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <Segmented value={mode} onChange={setMode} options={[{ value: 'trip', label: '✈️ Holidays' }, { value: 'move', label: '📦 Move abroad' }]} />
      <input className="input" placeholder="Search countries…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search destinations" />
      {mode === 'trip' ? (
        <>
          <Card className="space-y-2"><div className="text-xs font-semibold text-muted">Travel style</div>
            <Segmented size="sm" value={style} onChange={setStyle} options={(Object.keys(TRIP_STYLES) as TripStyle[]).map((k) => ({ value: k, label: TRIP_STYLES[k].label }))} />
            <p className="text-xs text-muted">Costs are in your own currency and scale with the destination. One trip per year costs 1 energy. New countries give a bigger happiness boost.</p></Card>
          <div className="grid gap-2 md:grid-cols-2">
            {dests.map((d) => (
              <Row key={d.id} icon={d.flag} title={d.name} sub={<>{d.region || 'Popular'} · <Money usd={tripCost(g, d.id, style)} country={cc} compact /></>}
                right={<>{p.visited.includes(d.id) && <Chip tone="good">Visited</Chip>}<button className="btn btn-primary btn-sm" onClick={() => run((x) => travel(x, d.id, style))}>Go</button></>} />
            ))}
          </div>
          {p.visited.length > 0 && <p className="text-xs text-muted">🌍 Countries visited: {p.visited.length}</p>}
        </>
      ) : (
        <>
          <Card><p className="text-sm text-muted">Moving abroad changes your wages, cost of living, taxes, healthcare and the currency you see. You need a visa; your education, experience and wealth improve the odds. Your job will end if you move. Family may be left behind.</p></Card>
          <div className="grid gap-2 md:grid-cols-2">
            {moves.map((c) => (
              <Row key={c.id} icon={c.flag} title={c.name} sub={<>{c.currency} · {c.healthcare} healthcare · cost <Money usd={relocationCost(g, c.id)} country={cc} compact /></>}
                right={<><ChanceChip chance={visaChance(g, c.id)} /><ConfirmButton className="btn btn-primary btn-sm" title={`Move to ${c.name}?`} body={<>Relocation costs <Money usd={relocationCost(g, c.id)} country={cc} compact />. Your visa chance is {Math.round(visaChance(g, c.id) * 100)}%. You will leave your current job.</>} confirmLabel="Apply to move" skip={!confirmSetting} danger={false} onConfirm={() => run((x) => relocate(x, c.id))}>Move</ConfirmButton></>} />
            ))}
          </div>
          <p className="text-xs text-muted">Currently living in {getCountry(cc).flag} {getCountry(cc).name}.</p>
        </>
      )}
    </div>
  );
}

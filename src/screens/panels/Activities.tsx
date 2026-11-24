import { useMemo } from 'react';
import { useGame } from '../../store/useGame';
import { useDo, Row, Notice } from './common';
import { Chip, Money, SectionTitle } from '../../components/ui';
import { doActivity, listActivities } from '../../engine/activities';
import { BALANCE } from '../../engine/config';

export function ActivitiesPanel() {
  const g = useGame((s) => s.game)!;
  const run = useDo();
  const p = g.player;
  const list = useMemo(() => listActivities(g), [g]);
  const groups = useMemo(() => {
    const m = new Map<string, typeof list>();
    for (const a of list) m.set(a.def.group, [...(m.get(a.def.group) ?? []), a]);
    return [...m.entries()];
  }, [list]);
  return (
    <div className="space-y-4">
      <Notice>⚡ Energy: <b>{p.energy}/{BALANCE.energyPerYear}</b>. Each activity can be done once a year. Choices have consequences — some are risky.</Notice>
      {groups.length === 0 && <Notice>Nothing to do yet. Age up for new opportunities.</Notice>}
      {groups.map(([name, items]) => (
        <div key={name}>
          <SectionTitle>{name}</SectionTitle>
          <div className="grid gap-2 md:grid-cols-2">
            {items.map((a) => (
              <Row key={a.def.id} dim={!a.available} icon={a.def.icon} title={a.def.name} sub={a.def.desc}
                right={<button className="btn btn-primary btn-sm" disabled={!a.available} onClick={() => run((x) => doActivity(x, a.def.id))}>{a.used ? 'Done' : 'Do it'}</button>}>
                <div className="flex flex-wrap gap-1.5"><Chip>⚡ {a.def.energy}</Chip>{a.cost > 0 && <Chip tone="bad">💵 <Money usd={a.cost} country={p.countryId} compact /></Chip>}{a.reason && !a.used && <Chip tone="bad">{a.reason}</Chip>}</div>
              </Row>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

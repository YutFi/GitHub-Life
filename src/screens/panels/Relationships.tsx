import { useState } from 'react';
import { useGame } from '../../store/useGame';
import { useConfirmSetting, useDo, Notice } from './common';
import { Card, Chip, ConfirmButton, Meter, SectionTitle } from '../../components/ui';
import { Avatar } from '../../components/Avatar';
import { acceptCandidate, breakUp, canDate, declineCandidate, divorce, fertilityInfo, growFamily, interact, interactionsFor, makeFriend, proposeMarriage, REL_LABEL, scoutRomance, WEDDINGS } from '../../engine/relationships';
import { partnerOf, personAge } from '../../engine/util';
import { traitById } from '../../engine/data/traits';
import { fmtMoney } from '../../engine/format';
import type { GameState, Person } from '../../engine/types';

function PersonCard({ g, per, open, onToggle }: { g: GameState; per: Person; open: boolean; onToggle: () => void }) {
  const run = useDo();
  const cc = g.player.countryId;
  const age = personAge(g, per);
  const acts = interactionsFor(g, per);
  const rel = REL_LABEL[per.relation];
  return (
    <div className={`card overflow-hidden ${!per.alive ? 'opacity-60' : ''}`}>
      <button className="flex w-full items-center gap-3 p-3 text-left" onClick={onToggle} aria-expanded={open}>
        <Avatar seed={per.id} gender={per.gender} age={age} size={48} dead={!per.alive} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{per.name}</div>
          <div className="truncate text-xs text-muted">{rel} · {per.alive ? `age ${age}` : `died ${per.deathYear ?? ''}`}{per.job ? ` · ${per.job}` : ''}</div>
          {per.alive && <div className="mt-1.5 grid grid-cols-2 gap-2"><div title={`Closeness ${Math.round(per.closeness)}`}><Meter value={per.closeness} color="linear-gradient(90deg,#f472b6,#fb7185)" label="Closeness" height={5} /></div><div title={`Trust ${Math.round(per.trust)}`}><Meter value={per.trust} color="linear-gradient(90deg,#22d3ee,#60a5fa)" label="Trust" height={5} /></div></div>}
        </div>
      </button>
      {open && (
        <div className="space-y-3 border-t border-line p-3">
          <div className="flex flex-wrap gap-1.5">
            <Chip>❤️ Closeness {Math.round(per.closeness)}</Chip><Chip>🤝 Trust {Math.round(per.trust)}</Chip>
            {(per.relation === 'partner' || per.relation === 'spouse' || per.relation === 'exPartner') && <Chip>💞 Compatibility {Math.round(per.compatibility)}%</Chip>}
            {per.traits.map((t) => <Chip key={t}>{traitById(t)?.icon} {traitById(t)?.name ?? t}</Chip>)}
          </div>
          {per.alive && per.wealth > 0 && ['partner', 'spouse', 'mother', 'father'].includes(per.relation) && <p className="text-xs text-muted">Estimated wealth: {fmtMoney(per.wealth, cc, true)}</p>}
          {per.history.length > 0 && <ul className="space-y-0.5 text-xs text-muted">{per.history.slice(-3).map((h, i) => <li key={i}>Age {h.age}: {h.text}</li>)}</ul>}
          {acts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {acts.map((a) => (
                <button key={a.kind} className="btn btn-sm" onClick={() => run((x) => interact(x, per.id, a.kind))}>{a.icon} {a.label}
                  <span className="text-muted">{a.energy ? ` ⚡${a.energy}` : ''}{a.cost ? ` · ${fmtMoney(a.cost, cc, true)}` : ''}</span></button>
              ))}
            </div>
          ) : <p className="text-xs text-muted">{per.alive ? 'There is nothing to do with them right now.' : 'Remembered.'}</p>}
        </div>
      )}
    </div>
  );
}

export function RelationshipsPanel() {
  const g = useGame((s) => s.game)!;
  const run = useDo();
  const confirmSetting = useConfirmSetting();
  const [openId, setOpenId] = useState<string | null>(null);
  const [wedding, setWedding] = useState(WEDDINGS[1].id);
  const [prenup, setPrenup] = useState(false);
  const p = g.player; const cc = p.countryId;
  const partner = partnerOf(p);
  const cand = g.candidate;
  const fert = fertilityInfo(g);
  const living = p.people.filter((x) => x.alive);
  const groups: [string, Person[]][] = [
    ['Partner', living.filter((x) => x.relation === 'spouse' || x.relation === 'partner')],
    ['Family', living.filter((x) => ['mother', 'father', 'guardian', 'sibling'].includes(x.relation))],
    ['Children', living.filter((x) => x.relation === 'child')],
    ['Friends', living.filter((x) => x.relation === 'friend')],
    ['Work', living.filter((x) => x.relation === 'boss' || x.relation === 'coworker')],
    ['Exes', living.filter((x) => x.relation === 'exPartner' || x.relation === 'exSpouse')],
  ];
  const passed = p.people.filter((x) => !x.alive);
  const toggle = (id: string) => setOpenId(openId === id ? null : id);
  const married = partner?.relation === 'spouse';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <SectionTitle>Friends</SectionTitle>
          <p className="text-sm text-muted">Good friends lift your happiness for life. Put yourself out there once a year.</p>
          <button className="btn btn-primary btn-sm" disabled={p.age < 3} onClick={() => run(makeFriend)}>🙂 Make a friend <span className="text-muted">⚡1</span></button>
        </Card>

        {canDate(p) ? (
          <Card className="space-y-3">
            <SectionTitle>Romance</SectionTitle>
            {partner ? (
              <>
                <div className="text-sm">{married ? '💍 Married to' : '💘 Dating'} <b>{partner.name}</b></div>
                <div className="flex flex-wrap gap-2">
                  {!married && p.age >= 18 && <a href="#marry" className="btn btn-sm">💍 Propose</a>}
                  {married
                    ? <ConfirmButton title="Divorce?" body="Divorce is costly and painful. Assets are divided, and children are affected." confirmLabel="File for divorce" skip={!confirmSetting} onConfirm={() => run(divorce)}>💔 Divorce</ConfirmButton>
                    : <ConfirmButton title={`End things with ${partner.name}?`} body="You will break up." confirmLabel="Break up" skip={!confirmSetting} onConfirm={() => run(breakUp)}>💔 Break up</ConfirmButton>}
                </div>
              </>
            ) : cand ? (
              <div className="space-y-2 rounded-2xl bg-black/10 p-3">
                <div className="flex items-center gap-3"><Avatar seed={cand.id} gender={cand.gender} age={personAge(g, cand)} size={52} /><div><div className="font-bold">{cand.name}</div><div className="text-xs text-muted">Age {personAge(g, cand)}{cand.job ? ` · ${cand.job}` : ''}</div></div></div>
                <div className="flex flex-wrap gap-1.5"><Chip tone={cand.compatibility >= 65 ? 'good' : cand.compatibility >= 45 ? 'info' : 'bad'}>💞 {Math.round(cand.compatibility)}% compatible</Chip>{cand.traits.map((t) => <Chip key={t}>{traitById(t)?.icon} {traitById(t)?.name}</Chip>)}</div>
                <div className="flex gap-2"><button className="btn btn-primary btn-sm flex-1" onClick={() => run(acceptCandidate)}>💘 Ask them out</button><button className="btn btn-sm flex-1" onClick={() => run(declineCandidate)}>Move on</button></div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted">You are single. Looks, confidence and social skills improve your odds.</p>
                <button className="btn btn-primary btn-sm" onClick={() => run(scoutRomance)}>🔍 Look for love <span className="text-muted">⚡1</span></button>
              </>
            )}
          </Card>
        ) : <Notice>Dating opens at age 14.</Notice>}
      </div>

      {partner && !married && p.age >= 18 && (
        <Card className="space-y-3"><div id="marry" /><SectionTitle>Propose to {partner.name.split(' ')[0]}</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-3">
            {WEDDINGS.map((w) => <button key={w.id} aria-pressed={wedding === w.id} onClick={() => setWedding(w.id)} className={`card !rounded-2xl p-3 text-left ${wedding === w.id ? '!border-brand ring-2 ring-brand/40' : ''}`}><div className="font-semibold">{w.name}</div><div className="text-xs text-muted">{fmtMoney(w.cost * g.world.priceIndex * 1, cc, true)} · joy +{w.happy}</div></button>)}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={prenup} onChange={(e) => setPrenup(e.target.checked)} /> Ask for a prenuptial agreement (protects your assets, can hurt trust)</label>
          <button className="btn btn-primary btn-sm" onClick={() => run((x) => proposeMarriage(x, wedding, prenup))}>💍 Propose</button>
        </Card>
      )}

      {partner && p.age >= 18 && (
        <Card className="space-y-3">
          <SectionTitle>Family planning</SectionTitle>
          <p className="text-sm text-muted">{fert.natural ? `Chance of conceiving this year: about ${Math.round(fert.chance * 100)}%.` : fert.reason ?? 'Natural conception is not possible.'} Children cost money every year until they are grown.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-sm" disabled={!fert.natural} onClick={() => run((x) => growFamily(x, 'natural'))}>👶 Try for a baby</button>
            <button className="btn btn-sm" onClick={() => run((x) => growFamily(x, 'adopt'))}>🤲 Adopt a child</button>
          </div>
        </Card>
      )}

      {groups.filter(([, l]) => l.length).map(([name, list]) => (
        <div key={name}>
          <SectionTitle right={<Chip>{list.length}</Chip>}>{name}</SectionTitle>
          <div className="space-y-2">{list.map((per) => <PersonCard key={per.id} g={g} per={per} open={openId === per.id} onToggle={() => toggle(per.id)} />)}</div>
        </div>
      ))}
      {passed.length > 0 && (
        <div><SectionTitle>In loving memory</SectionTitle>
          <div className="space-y-2">{passed.map((per) => <PersonCard key={per.id} g={g} per={per} open={openId === per.id} onToggle={() => toggle(per.id)} />)}</div></div>
      )}
    </div>
  );
}

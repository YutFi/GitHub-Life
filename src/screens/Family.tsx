import { useGame } from '../store/useGame';
import { Avatar } from '../components/Avatar';
import { Card, Chip, Empty, KV, Money, PageHeader, SectionTitle } from '../components/ui';
import { buildFamilyTree, dynastyWealth } from '../engine/family';
import type { TreeNode } from '../engine/family';
import { getCountry } from '../engine/data/countries';

function Node({ n, self, small }: { n: TreeNode; self?: boolean; small?: boolean }) {
  const age = n.deathYear ? n.deathYear - n.birthYear : new Date().getFullYear() - n.birthYear;
  void age;
  return (
    <div className={`card flex w-36 shrink-0 flex-col items-center gap-1 p-2.5 text-center ${self ? '!border-brand ring-2 ring-brand/40' : ''} ${!n.alive ? 'opacity-60' : ''}`}>
      <Avatar seed={n.id} gender={n.gender} age={small ? 8 : 30} size={small ? 40 : 52} dead={!n.alive} />
      <div className="w-full truncate text-sm font-semibold">{n.name}</div>
      <div className="text-[0.68rem] uppercase tracking-wide text-muted">{n.relation}</div>
      <div className="text-[0.7rem] text-muted">{n.birthYear}{n.deathYear ? `–${n.deathYear}` : ''}</div>
      {n.note && <div className="w-full truncate text-[0.68rem] text-muted" title={n.note}>{n.note}</div>}
    </div>
  );
}
const Tier = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div><div className="mb-1.5 text-center text-[0.68rem] font-bold uppercase tracking-widest text-muted">{title}</div><div className="flex flex-wrap justify-center gap-2.5">{children}</div></div>
);

export function Family() {
  const g = useGame((s) => s.game)!;
  const t = buildFamilyTree(g);
  const d = g.dynasty;
  const cc = g.player.countryId;
  const grandkids = t.children.flatMap((c) => c.kids ?? []);
  return (
    <div className="space-y-4">
      <PageHeader title={`The ${d.surname} family`} sub={`Generation ${g.player.generation} · founded ${d.startedYear}`} />
      <Card className="overflow-x-auto">
        <div className="flex min-w-fit flex-col gap-5 py-1">
          {t.ancestors.length > 0 && <Tier title="Ancestors">{t.ancestors.slice(-6).map((a) => <div key={a.id} className="card w-36 p-2.5 text-center opacity-80"><div className="truncate text-sm font-semibold">{a.name}</div><div className="text-[0.7rem] text-muted">Gen {a.generation} · {a.birthYear}–{a.deathYear}</div></div>)}</Tier>}
          {t.parents.length > 0 && <Tier title="Parents">{t.parents.map((n) => <Node key={n.id} n={n} />)}</Tier>}
          <Tier title="You">
            {t.siblings.map((n) => <Node key={n.id} n={n} />)}
            <Node n={t.self} self />
            {t.spouse && <Node n={t.spouse} />}
            {t.exes.map((n) => <Node key={n.id} n={n} />)}
          </Tier>
          {t.children.length > 0 && <Tier title="Children">{t.children.map((n) => <Node key={n.id} n={n} />)}</Tier>}
          {grandkids.length > 0 && <Tier title="Grandchildren">{grandkids.map((n) => <Node key={n.id} n={n} small />)}</Tier>}
          {!t.parents.length && !t.siblings.length && !t.spouse && !t.children.length && <Empty icon="🌳">Your family tree will grow as your life unfolds.</Empty>}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><SectionTitle>Dynasty</SectionTitle>
          <KV k="Surname" v={d.surname} /><KV k="Generations lived" v={d.members.length} /><KV k="Wealth passed down" v={<Money usd={dynastyWealth(g)} country={cc} compact />} />
          <KV k="Living descendants" v={t.children.filter((c) => c.alive).length + grandkids.length} />
          <p className="mt-2 text-xs text-muted">When you die, one of your children can carry the family forward and inherit a share of your estate.</p></Card>
        <Card><SectionTitle>Past lives</SectionTitle>
          {d.members.length === 0 ? <p className="text-sm text-muted">You are the first of your line.</p> : (
            <div className="space-y-2">{[...d.members].reverse().map((m) => (
              <div key={m.id} className="rounded-2xl bg-black/10 p-2.5 text-sm"><div className="flex items-center justify-between gap-2"><b>{m.name}</b><Chip>Gen {m.generation}</Chip></div>
                <div className="text-xs text-muted">{getCountry(m.country).flag} {m.birthYear}–{m.deathYear} (age {m.ageAtDeath}) · {m.occupation} · {m.cause}</div>
                <div className="text-xs text-muted">Net worth <Money usd={m.netWorth} country={m.country} compact /> · {m.children.length} child{m.children.length === 1 ? '' : 'ren'} · {m.achievements} achievements</div></div>
            ))}</div>
          )}</Card>
      </div>
    </div>
  );
}

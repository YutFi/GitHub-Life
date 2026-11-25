import { useGame } from '../../store/useGame';
import { Notice, useDo } from './common';
import { Card, Chip, KV, Meter, Money, SectionTitle } from '../../components/ui';
import { facilityFor, isIncarcerated, jus, lawyerCost, paroleChance, paroleEligible, prisonAppeal, prisonCounselling, prisonExercise, prisonFriends, prisonGang, prisonParole, prisonStudy, prisonWork, prisonWriteHome, sentenceProgress, systemFor } from '../../engine/justice';
import type { ActionResult, GameState } from '../../engine/types';

type Act = { id: string; icon: string; label: string; hint: string; fn: (g: GameState) => ActionResult };

export function LawPanel() {
  const g = useGame((s) => s.game)!;
  const run = useDo();
  const p = g.player; const j = jus(p); const s = j.sentence; const sys = systemFor(g);
  const inside = isIncarcerated(g);
  const prog = sentenceProgress(g);
  const fac = s ? facilityFor(s) : undefined;

  if (inside && s && prog) {
    const acts: Act[] = [
      { id: 'pw', icon: '🛠️', label: 'Take a work detail', hint: 'Steady conduct, a small wage, trade skills', fn: prisonWork },
      { id: 'ps', icon: '📚', label: 'Attend classes', hint: 'Intelligence, and a certificate if you stick with it', fn: prisonStudy },
      { id: 'pe', icon: '🏋️', label: 'Exercise in the yard', hint: 'Health and respect', fn: prisonExercise },
      { id: 'pc', icon: '🧠', label: 'Counselling & reflection', hint: 'Conduct, mood and parole chances', fn: prisonCounselling },
      { id: 'pwh', icon: '✉️', label: 'Write home', hint: 'Keep relationships from fading', fn: prisonWriteHome },
      { id: 'pf', icon: '🤝', label: 'Make friends inside', hint: 'Respect among inmates, small risk', fn: prisonFriends },
      { id: 'pg', icon: '🕶️', label: s.gang ? 'Leave your group' : 'Join a group for protection', hint: s.gang ? 'Costs you, but conduct recovers' : 'Safer, but conduct drops', fn: prisonGang },
    ];
    const used = (id: string) => p.actions.includes(id);
    const cost = lawyerCost(g, s.severity);
    return (
      <div className="space-y-4">
        <Card>
          <SectionTitle right={<Chip tone="bad">⛓️ Incarcerated</Chip>}>{s.facility}</SectionTitle>
          {fac && <p className="text-sm text-muted">{fac.blurb}</p>}
          <div className="mt-3 grid grid-cols-2 gap-x-6 sm:grid-cols-4">
            <KV k="Convicted of" v={s.offence} />
            <KV k="Sentence" v={prog.life ? 'Life term' : `${s.years} yr`} />
            <KV k="Served" v={`${s.served} yr`} />
            <KV k="Left" v={prog.life ? 'Parole review' : `${prog.left} yr`} />
          </div>
          {!prog.life && <div className="mt-3"><Meter value={prog.pct} label="Sentence served" color="linear-gradient(90deg,#f59e0b,#22c55e)" /></div>}
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div><div className="mb-1 flex justify-between text-xs"><span className="text-muted">Conduct</span><b>{Math.round(s.conduct)}</b></div><Meter value={s.conduct} label="Conduct" /></div>
            <div><div className="mb-1 flex justify-between text-xs"><span className="text-muted">Respect inside</span><b>{Math.round(s.standing)}</b></div><Meter value={s.standing} color="var(--brand2)" label="Standing" /></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {fac?.programs.map((x) => <Chip key={x}>{x}</Chip>)}
            {s.gang && <Chip tone="bad">Group member</Chip>}
            {s.juvenile && <Chip>Youth facility</Chip>}
            {s.transferred && <Chip>Transferred from youth facility</Chip>}
          </div>
          <p className="mt-3 text-xs text-muted">Good conduct can earn early release ({sys.release.label}). Everything you do outside these walls is on hold until you are free. Work, study and keep your head down, or face more time.</p>
        </Card>

        <div>
          <SectionTitle right={<Chip>⚡ {p.energy} energy</Chip>}>Life inside</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {acts.map((a) => (
              <button key={a.id} className="card flex items-center gap-3 p-3 text-left disabled:opacity-50" disabled={used(a.id) || p.energy < 1} onClick={() => run(a.fn, { prison: true })}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-black/15 text-xl">{a.icon}</span>
                <span className="min-w-0"><span className="block font-semibold">{a.label}</span><span className="block text-xs text-muted">{used(a.id) ? 'Done this year' : a.hint}</span></span>
              </button>
            ))}
          </div>
        </div>

        <Card>
          <SectionTitle>Your case</SectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-sm" disabled={s.appealed || s.kind === 'rehab' || p.energy < 1} onClick={() => run(prisonAppeal, { prison: true })}>⚖️ Appeal your sentence · <Money usd={cost} country={p.countryId} compact /></button>
            <button className="btn btn-sm" disabled={!paroleEligible(g) || p.actions.includes('pp') || p.energy < 1} onClick={() => run(prisonParole, { prison: true })}>📄 Apply for early release</button>
            {paroleEligible(g) && <Chip tone={paroleChance(g) > 0.5 ? 'good' : 'info'}>{Math.round(paroleChance(g) * 100)}% chance</Chip>}
          </div>
          <p className="mt-2 text-xs text-muted">{s.appealed ? 'You have used your appeal.' : 'You can appeal once.'} {paroleEligible(g) ? '' : 'You can apply for early release once you have served enough of your term.'}</p>
        </Card>

        <Notice>Age up to let the year pass. Releases, transfers and incidents inside happen as time goes on.</Notice>
      </div>
    );
  }

  // ---- free (with or without a record)
  return (
    <div className="space-y-4">
      {s && (s.kind === 'probation' || s.kind === 'community') && (
        <Card>
          <SectionTitle right={<Chip tone="info">Under supervision</Chip>}>{s.facility}</SectionTitle>
          <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-3"><KV k="For" v={s.offence} /><KV k="Term" v={`${s.years} yr`} /><KV k="Served" v={`${s.served} yr`} /></div>
          <p className="mt-2 text-xs text-muted">Another offence while under supervision means a harsher sentence. Keep out of trouble until it ends.</p>
        </Card>
      )}
      <Card>
        <SectionTitle>Criminal record</SectionTitle>
        {j.record.length === 0 ? <p className="text-sm text-muted">Your record is clean. Keep it that way.</p> : (
          <div className="space-y-1.5">{[...j.record].reverse().map((r, i) => <div key={i} className="flex flex-wrap justify-between gap-2 text-sm"><span><b className="capitalize">{r.label}</b> <span className="text-muted">· age {r.age}</span></span><span className="text-xs text-muted">{r.outcome}</span></div>)}</div>
        )}
        {(p.flags.criminalRecord || p.flags.juvenileRecord) && <p className="mt-3 text-xs text-muted">{p.flags.criminalRecord ? 'A criminal record makes some careers off-limits, hurts job offers and can block visas.' : 'Juvenile records are kept apart and do not count against you as an adult.'}</p>}
      </Card>
      <Card>
        <SectionTitle>How justice works in {p.countryId.toUpperCase()}</SectionTitle>
        <div className="space-y-1.5 text-sm">
          <div><b>Age of criminal responsibility:</b> {sys.criminalAge}. <b>Juvenile system:</b> under {sys.juvenileMax} ({sys.juvenileCourt}).</div>
          <div><b>Youth:</b> {sys.juvenile.light.name}; serious cases: {sys.juvenile.heavy.name}.</div>
          {sys.youngAdult && <div><b>Young adults:</b> {sys.youngAdult.name}.</div>}
          <div><b>Adults:</b> {sys.adult.low.name}, {sys.adult.mid.name}, {sys.adult.high.name}.</div>
          <div><b>Drug offences:</b> {sys.drug.name}.</div>
          <div><b>Release:</b> {sys.release.label}.</div>
        </div>
      </Card>
    </div>
  );
}

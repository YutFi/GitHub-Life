import { useState } from 'react';
import { useGame } from '../../store/useGame';
import { useConfirmSetting, useDo, Row, ChanceChip, Notice } from './common';
import { Card, Chip, ConfirmButton, KV, Meter, Money, SectionTitle, Segmented } from '../../components/ui';
import { FIELDS } from '../../engine/data/careers';
import { applyScholarship, applyToDegree, availableDegrees, dropOut, gradeLetter, returnToSchool, setEffort, stageLabel, studyHarder } from '../../engine/education';
import { EDU_RANK } from '../../engine/data/careers';

export function EducationPanel() {
  const g = useGame((s) => s.game)!;
  const run = useDo();
  const confirmSetting = useConfirmSetting();
  const [showAll, setShowAll] = useState(false);
  const p = g.player; const e = p.edu;
  const rows = availableDegrees(g);
  const open = rows.filter((r) => r.ok);
  const locked = rows.filter((r) => !r.ok && r.reason && !['Too young', 'Already completed', 'Already studying', 'Too late to enrol', 'Already have this degree'].includes(r.reason));
  const canReturn = !e.stage && EDU_RANK[e.level] < EDU_RANK.secondary && p.age >= 17;
  const compulsory = p.age < 16 && e.stage !== 'bachelor';

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>{e.stage ? 'Currently studying' : 'Education'}</SectionTitle>
        {e.stage ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2"><b>{e.degreeName ?? stageLabel(p)}</b><Chip>{stageLabel(p)}</Chip>{e.schoolName && <Chip>🏫 {e.schoolName}</Chip>}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><div className="mb-1 flex justify-between text-xs"><span className="text-muted">This year's performance</span><b>{Math.round(e.grades)} · {gradeLetter(e.grades)}</b></div><Meter value={e.grades} label="Performance" /></div>
              <div><div className="mb-1 flex justify-between text-xs"><span className="text-muted">Average so far</span><b>{Math.round(e.avg)} · {gradeLetter(e.avg)}</b></div><Meter value={e.avg} color="var(--brand2)" label="Average" /></div>
            </div>
            <div><div className="mb-1 text-xs font-semibold text-muted">Study effort</div>
              <Segmented size="sm" value={e.effort} onChange={(v) => run((x) => setEffort(x, v), { quiet: true })} options={[{ value: 'low', label: 'Relaxed' }, { value: 'normal', label: 'Balanced' }, { value: 'high', label: 'Intense' }]} />
              <p className="mt-1 text-xs text-muted">Intense study lifts grades but drains happiness. Relaxed is easier on you but risks failing.</p></div>
            {e.scholarship && <Notice tone="good">🏆 {e.scholarship.name} covers {Math.round(e.scholarship.pct * 100)}% of tuition.</Notice>}
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-sm" onClick={() => run(studyHarder)}>📚 Study extra hard <span className="text-muted">(1 energy)</span></button>
              {['vocational', 'bachelor', 'master', 'doctorate'].includes(e.stage) && !e.scholarship && <button className="btn btn-sm" onClick={() => run(applyScholarship)}>🏆 Apply for a scholarship</button>}
              {!compulsory && <ConfirmButton title="Drop out?" body="You will leave your programme without finishing it. Debts remain and your happiness takes a hit." confirmLabel="Drop out" skip={!confirmSetting} onConfirm={() => run(dropOut)}>🚪 Drop out</ConfirmButton>}
            </div>
            {compulsory && <p className="text-xs text-muted">School is compulsory until age 16.</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <KV k="Highest qualification" v={e.degrees.length ? [...e.degrees].sort((a, b) => EDU_RANK[b.level] - EDU_RANK[a.level])[0].name : e.level === 'none' ? 'None yet' : e.level} />
            {e.dropouts > 0 && <KV k="Times dropped out" v={e.dropouts} />}
            {p.age < 5 && <p className="text-sm text-muted">Kindergarten starts at age 4–5.</p>}
            {canReturn && <button className="btn btn-primary btn-sm" onClick={() => run(returnToSchool)}>📖 Return to school</button>}
          </div>
        )}
      </Card>

      {e.degrees.length > 0 && (
        <Card>
          <SectionTitle>Qualifications</SectionTitle>
          <div className="space-y-2">{e.degrees.map((d) => <div key={d.id + d.age} className="flex items-center justify-between gap-2 text-sm"><span>{FIELDS[d.field]?.icon ?? '🎓'} <b>{d.name}</b> <span className="text-muted">· age {d.age}</span></span><span className="flex gap-1"><Chip tone="info">GPA {d.gpa.toFixed(1)}</Chip>{d.honors && <Chip tone="good">Honors</Chip>}</span></div>)}</div>
        </Card>
      )}

      {!e.stage && p.age >= 16 && (
        <div>
          <SectionTitle right={e.appliedThisYear ? <Chip tone="bad">Applied this year</Chip> : undefined}>Apply to a programme</SectionTitle>
          {open.length === 0 ? <Notice>No programmes are open to you right now. Finish secondary school or earn a prerequisite degree first.</Notice> : (
            <div className="space-y-2">
              {open.map((r) => (
                <Row key={r.def.id} icon={FIELDS[r.def.field]?.icon ?? '🎓'} title={r.def.name} sub={<>{r.def.level} · {r.def.years} year{r.def.years === 1 ? '' : 's'} · tuition <Money usd={r.tuition} country={p.countryId} compact />/yr</>}
                  right={<><ChanceChip chance={r.chance} /><button className="btn btn-primary btn-sm" disabled={e.appliedThisYear} onClick={() => run((x) => applyToDegree(x, r.def.id))}>Apply</button></>} />
              ))}
            </div>
          )}
          {locked.length > 0 && (
            <div className="mt-3">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAll(!showAll)}>{showAll ? 'Hide' : 'Show'} {locked.length} locked programme{locked.length === 1 ? '' : 's'}</button>
              {showAll && <div className="mt-2 space-y-2">{locked.map((r) => <Row key={r.def.id} dim icon="🔒" title={r.def.name} sub={r.reason} />)}</div>}
            </div>
          )}
          <p className="mt-3 text-xs text-muted">Student loans are issued automatically for tuition you cannot cover. Scholarships reduce it.</p>
        </div>
      )}
    </div>
  );
}

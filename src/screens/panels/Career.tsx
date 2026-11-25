import { useMemo, useState } from 'react';
import { useGame } from '../../store/useGame';
import { useConfirmSetting, useDo, Row, ChanceChip, Notice } from './common';
import { Card, Chip, ConfirmButton, KV, Meter, Money, SectionTitle, Segmented } from '../../components/ui';
import { askPromotion, askRaise, applyForJob, BUSINESS_SECTORS, BUSINESS_TIERS, canRetire, jobBoard, quitJob, retire, sellBusiness, setWorkEffort, startBusiness } from '../../engine/career';
import { careerById } from '../../engine/data/careers';
import { creatorAds, creatorCollab, creatorGear, creatorPost, fmtAudience, gearCost, GEAR_NAME, isCreator, nextTier } from '../../engine/creator';
import { isTertiary } from '../../engine/career';
import { CareerTree } from './CareerTree';
import { wageScale } from '../../engine/util';

export function CareerPanel() {
  const g = useGame((s) => s.game)!;
  const run = useDo();
  const confirmSetting = useConfirmSetting();
  const p = g.player; const c = p.career; const job = c.job;
  const [industry, setIndustry] = useState('all');
  const [eligibleOnly, setEligibleOnly] = useState(true);
  const [q, setQ] = useState('');
  const [view, setView] = useState<'board' | 'tree'>('board');
  const [sector, setSector] = useState(Object.keys(BUSINESS_SECTORS)[0]);
  const [tier, setTier] = useState(0);
  const [bname, setBname] = useState('');
  const board = useMemo(() => jobBoard(g), [g]);
  const industries = useMemo(() => ['all', ...Array.from(new Set(board.map((b) => b.def.industry)))], [board]);
  const shown = board.filter((b) => (industry === 'all' || b.def.industry === industry) && (!eligibleOnly || b.eligible) && (!q || b.def.title.toLowerCase().includes(q.toLowerCase())) && b.def.id !== 'entrepreneur')
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.startSalary - a.startSalary);
  const ret = canRetire(g);
  const def = job ? careerById(job.careerId) : null;
  const biz = c.business;
  const bizCost = Math.round(BUSINESS_TIERS[tier].invest * wageScale(g));

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>{job ? 'Current job' : c.retired ? 'Retired' : 'Employment'}</SectionTitle>
        {job ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-black/15 text-2xl">{def?.icon ?? '💼'}</div>
              <div className="min-w-0"><div className="truncate text-lg font-bold">{job.title}</div><div className="text-sm text-muted">{isCreator(def) ? (c.niche ?? 'creator') : job.company}{job.partTime ? (job.reducedForStudy ? ' · part-time while studying' : ' · part-time') : def?.freelance ? ' · freelance' : ''}</div></div></div>
            <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
              <KV k="Salary" v={<Money usd={job.salary} country={p.countryId} compact />} />
              <KV k="Years here" v={job.years} />
              <KV k="Level" v={`${job.level + 1}`} />
              <KV k="Warnings" v={<span className={job.warnings ? 'text-bad' : ''}>{job.warnings}</span>} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><div className="mb-1 flex justify-between text-xs"><span className="text-muted">Performance</span><b>{Math.round(job.performance)}</b></div><Meter value={job.performance} label="Performance" /></div>
              <div><div className="mb-1 flex justify-between text-xs"><span className="text-muted">Job satisfaction</span><b>{Math.round(job.satisfaction)}</b></div><Meter value={job.satisfaction} color="var(--brand2)" label="Satisfaction" /></div>
            </div>
            <div><div className="mb-1 text-xs font-semibold text-muted">Work effort</div>
              <Segmented size="sm" value={c.effort} onChange={(v) => run((x) => setWorkEffort(x, v), { quiet: true })} options={[{ value: 'low', label: 'Coast' }, { value: 'normal', label: 'Steady' }, { value: 'high', label: 'Go all in' }]} />
              <p className="mt-1 text-xs text-muted">More effort means better reviews and faster promotions, at a cost to health and happiness.</p></div>
            {c.lastReview && <Notice>📝 Last review (age {c.lastReview.age}): {c.lastReview.text}</Notice>}
            <div className="flex flex-wrap gap-2">
              {!isCreator(def) && <button className="btn btn-sm" onClick={() => run(askRaise)}>💰 Ask for a raise</button>}
              {!isCreator(def) && <button className="btn btn-sm" onClick={() => run(askPromotion)}>📈 Ask for a promotion</button>}
              <ConfirmButton title="Quit your job?" body={`You will leave ${job.company} and lose your salary until you find new work.`} confirmLabel="Quit" skip={!confirmSetting} onConfirm={() => run(quitJob)}>🚪 Quit</ConfirmButton>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">{c.retired ? `You retired at ${c.retiredAge}. Your pension and savings fund your life.` : biz ? 'You are running your own company.' : p.age < 14 ? 'You are too young to work.' : p.edu.stage ? 'You are studying. Students can work part-time or freelance, but not full-time.' : 'You are not employed. Browse the job board below.'}</p>
        )}
        {!c.retired && (job || biz || p.age >= 35) && (
          <div className="mt-3 border-t border-line pt-3">
            <ConfirmButton title="Retire?" body={ret.early ? 'Your investments cover your expenses. You will stop working for good.' : 'You will stop working and live off your pension and savings.'} confirmLabel="Retire" danger={false} skip={!confirmSetting} disabled={!ret.ok} onConfirm={() => run((x) => retire(x))}>🏖️ Retire</ConfirmButton>
            {!ret.ok && ret.reason && <span className="ml-2 text-xs text-muted">{ret.reason}</span>}
          </div>
        )}
      </Card>

      {job && def && isCreator(def) && (
        <Card>
          <SectionTitle right={<Chip>{c.niche ?? 'general'}</Chip>}>🎬 Creator studio</SectionTitle>
          <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
            <KV k="Audience" v={fmtAudience(c.audience ?? 0)} />
            <KV k="Next level" v={nextTier(c.audience ?? 0) ? fmtAudience(nextTier(c.audience ?? 0)!) : 'Top'} />
            <KV k="Income / yr" v={<Money usd={job.salary} country={p.countryId} compact />} />
            <KV k="Gear" v={GEAR_NAME[c.gear ?? 0]} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn btn-sm" onClick={() => run(creatorPost)}>📸 Post content · ⚡1</button>
            <button className="btn btn-sm" onClick={() => run(creatorCollab)}>🤝 Collaborate · ⚡1</button>
            <button className="btn btn-sm" disabled={(c.gear ?? 0) >= 3} onClick={() => run(creatorGear)}>🎥 Upgrade gear{(c.gear ?? 0) < 3 ? <> · <Money usd={gearCost(g)} country={p.countryId} compact /></> : ''}</button>
            <button className="btn btn-sm" onClick={() => run(creatorAds)}>📢 Run ads</button>
          </div>
          <p className="mt-2 text-xs text-muted">Your income follows your audience. Post consistently, collaborate, and hope for a viral moment. Controversy and neglect can cost you followers.</p>
        </Card>
      )}

      {c.history.length > 0 && (
        <Card><SectionTitle>Career history</SectionTitle>
          <div className="space-y-1.5">{[...c.history].reverse().map((h, i) => <div key={i} className="flex flex-wrap justify-between gap-2 text-sm"><span><b>{h.title}</b> <span className="text-muted">· {h.company}</span></span><span className="text-xs text-muted">{h.startAge}–{h.endAge ?? 'now'}{h.endReason ? ` · ${h.endReason}` : ''}</span></div>)}</div></Card>
      )}

      {p.age >= 18 && (
        <Card>
          <SectionTitle>🏢 Your business</SectionTitle>
          {biz ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2"><b className="text-lg">{biz.name}</b><Chip>{biz.sector}</Chip><Chip>{biz.employees} staff</Chip><Chip>Year {biz.age}</Chip></div>
              <div className="grid grid-cols-2 gap-x-6"><KV k="Revenue" v={<Money usd={biz.revenue} country={p.countryId} compact />} /><KV k="Last profit" v={<span className={biz.profit >= 0 ? 'text-good' : 'text-bad'}><Money usd={biz.profit} country={p.countryId} compact signed /></span>} /><KV k="Capital" v={<Money usd={biz.capital} country={p.countryId} compact />} /><KV k="Invested" v={<Money usd={biz.invested} country={p.countryId} compact />} /></div>
              <ConfirmButton title="Sell the business?" body="You receive its estimated value and stop being the owner." confirmLabel="Sell" skip={!confirmSetting} onConfirm={() => run(sellBusiness)}>🤝 Sell business</ConfirmButton>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted">Be your own boss. Risky, but the upside has no ceiling. Requires 2 energy and cash up front.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1 block text-xs font-semibold text-muted" htmlFor="sector">Sector</label><select id="sector" className="input" value={sector} onChange={(e) => setSector(e.target.value)}>{Object.keys(BUSINESS_SECTORS).map((s) => <option key={s}>{s}</option>)}</select></div>
                <div><label className="mb-1 block text-xs font-semibold text-muted" htmlFor="bname">Name (optional)</label><input id="bname" className="input" maxLength={30} value={bname} onChange={(e) => setBname(e.target.value)} placeholder="Auto-generated" /></div>
              </div>
              <Segmented value={tier} onChange={setTier} options={BUSINESS_TIERS.map((t, i) => ({ value: i, label: t.name }))} />
              <button className="btn btn-primary btn-sm" disabled={p.fin.cash < bizCost} onClick={() => run((x) => startBusiness(x, sector, tier, bname.trim()))}>🚀 Launch for <Money usd={bizCost} country={p.countryId} compact /></button>
              {p.fin.cash < bizCost && <span className="ml-2 text-xs text-muted">Not enough cash</span>}
            </div>
          )}
        </Card>
      )}

      {!c.retired && p.age >= 14 && (
        <div>
          <SectionTitle right={<Chip>{c.appsThisYear} applied this year</Chip>}>Jobs</SectionTitle>
          <div className="mb-3"><Segmented size="sm" value={view} onChange={setView} options={[{ value: 'board', label: '📋 Job board' }, { value: 'tree', label: '🌳 Career tree' }]} /></div>
          {isTertiary(p) && <div className="mb-3"><Notice>🎓 You are a student, so you can only take part-time, campus or freelance work. Full-time jobs open up when you finish your studies.</Notice></div>}
          {view === 'tree' ? <CareerTree /> : (<>
          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input className="input" placeholder="Search jobs…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search jobs" />
            <select className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} aria-label="Industry">{industries.map((i) => <option key={i} value={i}>{i === 'all' ? 'All industries' : i}</option>)}</select>
            <label className="btn btn-sm cursor-pointer"><input type="checkbox" className="mr-1" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} /> Qualified only</label>
          </div>
          {shown.length === 0 ? <Notice>No matching jobs. {eligibleOnly ? 'Try turning off “Qualified only” to see what each job requires.' : ''}</Notice> : (
            <div className="space-y-2">
              {shown.slice(0, 60).map((b) => (
                <Row key={b.def.id} dim={!b.eligible} icon={b.def.icon} title={b.def.title}
                  sub={b.eligible ? <>{b.def.industry} · from <Money usd={b.startSalary} country={p.countryId} compact />/yr{b.def.partTime ? ' · part-time' : b.def.freelance ? ' · freelance' : ''}</> : <span className="text-bad">{b.reasons.join(' · ')}</span>}
                  right={b.eligible ? <><ChanceChip chance={b.chance} /><button className="btn btn-primary btn-sm" onClick={() => run((x) => applyForJob(x, b.def.id))}>Apply</button></> : <Chip>Locked</Chip>} />
              ))}
            </div>
          )}
          </>)}
        </div>
      )}
    </div>
  );
}

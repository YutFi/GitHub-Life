import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Dices, Play, RefreshCw } from 'lucide-react';
import { useGame } from '../store/useGame';
import { COUNTRIES, getCountry } from '../engine/data/countries';
import { randomFirstName, randomSurname } from '../engine/data/names';
import { TRAITS, traitById } from '../engine/data/traits';
import { randomTraits } from '../engine/people';
import { TIER_NAME } from '../engine/people';
import { BACKGROUND_LABELS, randomNewLifeOptions, rollStats } from '../engine/character';
import { listSlots, SLOT_COUNT } from '../engine/save';
import type { Background, Difficulty, Gender, NewGameOptions, Stats } from '../engine/types';
import { Avatar } from '../components/Avatar';
import { Card, Chip, ConfirmButton, PageHeader, Segmented, StatBar, cx } from '../components/ui';

const STEPS = ['Identity', 'Birthplace', 'Family', 'Traits', 'Start'];
const TIER_ICON = ['', '🥫', '🧰', '🏠', '🏡', '🏰'];
const TIER_DESC = ['', 'Money is tight. You will have to fight for every opportunity.', 'Steady work, little spare cash.', 'Comfortable and stable.', 'Private schools and security.', 'Wealth, connections and pressure.'];
const DIFF: { v: Difficulty; label: string; hint: string }[] = [
  { v: 'easy', label: 'Easy', hint: 'Gentler events, cheaper life, longer lives.' },
  { v: 'normal', label: 'Normal', hint: 'The intended experience.' },
  { v: 'hard', label: 'Hard', hint: 'Harsher events, costlier life, recessions bite.' },
];

type Form = Omit<NewGameOptions, 'stats'>;

export function NewLife() {
  const nav = useNavigate();
  const startNew = useGame((s) => s.startNew);
  const meta = useGame((s) => s.meta);
  const slots = useMemo(() => listSlots(), []);
  const firstEmpty = slots.find((s) => s.empty)?.slot ?? 1;
  const [step, setStep] = useState(0);
  const [slot, setSlot] = useState(firstEmpty);
  const [form, setForm] = useState<Form>(() => {
    const r = randomNewLifeOptions({ difficulty: meta.settings.defaultDifficulty, slot: firstEmpty });
    return { ...r };
  });
  const [stats, setStats] = useState<Stats>(() => rollStats(form.traits, form.wealthTier));
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const country = getCountry(form.countryId);
  const takenSlot = slots.find((s) => s.slot === slot && !s.empty);

  const rerollStats = (traits: string[] = form.traits, tier: number = form.wealthTier) => setStats(rollStats(traits, tier));
  const setCountry = (id: string) => {
    const c = getCountry(id);
    set({ countryId: id, city: c.cities[0], firstName: randomFirstName(c.names, form.gender), lastName: randomSurname(c.names) });
  };
  const setGender = (gender: Gender) => set({ gender, firstName: randomFirstName(country.names, gender) });
  const randomize = () => {
    const r = randomNewLifeOptions({ difficulty: form.difficulty, slot });
    setForm(r);
    setStats(rollStats(r.traits, r.wealthTier));
  };
  const toggleTrait = (id: string) => {
    let traits = form.traits.includes(id) ? form.traits.filter((t) => t !== id) : [...form.traits, id];
    const def = traitById(id);
    if (!form.traits.includes(id)) {
      traits = traits.filter((t) => t === id || !(def?.conflicts?.includes(t) || traitById(t)?.conflicts?.includes(id)));
      if (traits.length > 4) traits = [...traits.slice(0, 3), id];
    }
    set({ traits });
    rerollStats(traits);
  };

  const valid = form.firstName.trim().length > 0 && form.lastName.trim().length > 0 && form.birthYear >= 1940 && form.birthYear <= 2026;
  const start = () => {
    startNew({ ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim(), slot, stats });
    nav('/play');
  };

  const age = new Date().getFullYear() - form.birthYear;
  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-5">
      <PageHeader title="New life" sub={`Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`}
        right={<div className="flex gap-2"><button className="btn btn-sm" onClick={randomize} title="Randomize everything"><Dices size={16} /> Random</button><button className="btn btn-sm btn-ghost" onClick={() => nav('/')}>Cancel</button></div>} />
      <div className="mb-5 flex gap-1.5" aria-hidden>{STEPS.map((s, i) => <div key={s} className={cx('h-1.5 flex-1 rounded-full', i <= step ? 'bg-brand' : 'bg-black/20')} />)}</div>

      <div className="anim-up" key={step}>
        {step === 0 && (
          <Card className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar seed={`${form.firstName}${form.lastName}${form.gender}`} gender={form.gender} age={22} size={84} />
              <div className="text-sm text-muted">Every character gets a unique look that changes as they age.</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold text-muted" htmlFor="fn">First name</label><input id="fn" className="input" value={form.firstName} maxLength={24} onChange={(e) => set({ firstName: e.target.value })} /></div>
              <div><label className="mb-1 block text-xs font-semibold text-muted" htmlFor="ln">Family name</label><input id="ln" className="input" value={form.lastName} maxLength={24} onChange={(e) => set({ lastName: e.target.value })} /></div>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-muted">Gender</div>
              <Segmented value={form.gender} onChange={setGender} options={[{ value: 'male', label: '♂ Male' }, { value: 'female', label: '♀ Female' }, { value: 'nonbinary', label: '⚧ Non-binary' }]} />
            </div>
            <button className="btn btn-sm" onClick={() => set({ firstName: randomFirstName(country.names, form.gender), lastName: randomSurname(country.names) })}><RefreshCw size={14} /> Suggest a name</button>
          </Card>
        )}

        {step === 1 && (
          <Card className="space-y-4">
            <div>
              <div className="mb-2 text-xs font-semibold text-muted">Country</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {COUNTRIES.map((c) => (
                  <button key={c.id} onClick={() => setCountry(c.id)} aria-pressed={c.id === form.countryId}
                    className={cx('btn !justify-start !rounded-2xl !px-3 text-left', c.id === form.countryId && '!border-brand !bg-brand/20')}>
                    <span className="text-xl" aria-hidden>{c.flag}</span><span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">{country.name}: currency {country.currency}, {country.healthcare} healthcare, life expectancy ≈ {country.lifeExpectancy}. Wages and prices follow the real gap between countries.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold text-muted" htmlFor="city">City</label>
                <select id="city" className="input" value={form.city} onChange={(e) => set({ city: e.target.value })}>{country.cities.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-semibold text-muted" htmlFor="by">Birth year (1940–2026)</label>
                <input id="by" type="number" className="input" min={1940} max={2026} value={form.birthYear} onChange={(e) => set({ birthYear: Math.max(1940, Math.min(2026, Number(e.target.value) || 2000)) })} /></div>
            </div>
            <p className="text-xs text-muted">{age >= 0 ? `Born in ${form.birthYear}, you would be ${age} today.` : ''} Historic eras shape the world economy you live through: booms, recessions and inflation all play out year by year.</p>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-2.5">
              {[1, 2, 3, 4, 5].map((t) => (
                <button key={t} aria-pressed={form.wealthTier === t} onClick={() => { set({ wealthTier: t as Form['wealthTier'] }); rerollStats(form.traits, t); }}
                  className={cx('card flex items-center gap-3 p-3.5 text-left transition', form.wealthTier === t && '!border-brand ring-2 ring-brand/40')}>
                  <span className="text-3xl" aria-hidden>{TIER_ICON[t]}</span>
                  <span><span className="block font-bold">{TIER_NAME[t]}</span><span className="block text-xs text-muted">{TIER_DESC[t]}</span></span>
                </button>
              ))}
            </div>
            <Card>
              <div className="mb-2 text-xs font-semibold text-muted">Household</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(BACKGROUND_LABELS) as Background['household'][]).map((h) => (
                  <button key={h} aria-pressed={form.household === h} className={cx('btn !justify-start !rounded-2xl', form.household === h && '!border-brand !bg-brand/20')} onClick={() => set({ household: h })}>{BACKGROUND_LABELS[h]}</button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold">Personality <span className="font-normal text-muted">({form.traits.length}/4)</span></div>
                <button className="btn btn-sm" onClick={() => { const t = randomTraits(3); set({ traits: t }); rerollStats(t); }}><Dices size={14} /> Reroll traits</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRAITS.map((t) => (
                  <button key={t.id} title={t.desc} aria-pressed={form.traits.includes(t.id)} onClick={() => toggleTrait(t.id)}
                    className={cx('chip !px-3 !py-1.5 text-sm transition', form.traits.includes(t.id) && '!border-brand !bg-brand/25 !text-ink')}>
                    <span aria-hidden>{t.icon}</span> {t.name}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted">{form.traits.map((id) => { const t = traitById(id); return t ? <div key={id}><b className="text-ink">{t.name}:</b> {t.desc}</div> : null; })}</div>
            </Card>
            <Card>
              <div className="mb-3 flex items-center justify-between"><div className="text-sm font-semibold">Starting stats</div><button className="btn btn-sm" onClick={() => rerollStats()}><RefreshCw size={14} /> Reroll</button></div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">{(Object.keys(stats) as (keyof Stats)[]).map((k) => <StatBar key={k} stat={k} value={stats[k]} />)}</div>
              <p className="mt-3 text-xs text-muted">Stats shift over a lifetime. Genes from your parents also nudge them as you grow.</p>
            </Card>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Card className="flex items-center gap-4">
              <Avatar seed={`${form.firstName}${form.lastName}${form.gender}`} gender={form.gender} age={1} size={72} />
              <div className="min-w-0">
                <div className="h-display text-xl font-bold">{form.firstName} {form.lastName}</div>
                <div className="text-sm text-muted">{country.flag} {form.city}, {country.name} · born {form.birthYear}</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5"><Chip>{TIER_ICON[form.wealthTier]} {TIER_NAME[form.wealthTier]}</Chip>{form.traits.map((t) => <Chip key={t}>{traitById(t)?.icon} {traitById(t)?.name}</Chip>)}</div>
              </div>
            </Card>
            <Card>
              <div className="mb-2 text-xs font-semibold text-muted">Difficulty</div>
              <Segmented value={form.difficulty} onChange={(d) => set({ difficulty: d })} options={DIFF.map((d) => ({ value: d.v, label: d.label }))} />
              <p className="mt-2 text-xs text-muted">{DIFF.find((d) => d.v === form.difficulty)?.hint} You can fine-tune the balance later in Settings.</p>
            </Card>
            <Card>
              <div className="mb-2 text-xs font-semibold text-muted">Save slot</div>
              <div className="grid gap-2">
                {Array.from({ length: SLOT_COUNT }, (_, i) => i + 1).map((n) => {
                  const s = slots.find((x) => x.slot === n);
                  return (
                    <button key={n} aria-pressed={slot === n} onClick={() => setSlot(n)} className={cx('btn !justify-between !rounded-2xl', slot === n && '!border-brand !bg-brand/20')}>
                      <span>Slot {n}</span><span className="text-xs text-muted">{s?.empty ? 'Empty' : s?.corrupted ? 'Damaged save' : `${s?.name} · age ${s?.age}`}</span>
                    </button>
                  );
                })}
              </div>
              {takenSlot && <p className="mt-2 text-xs font-semibold text-bad">⚠ Slot {slot} already holds {takenSlot.name}. Starting here will overwrite it.</p>}
            </Card>
          </div>
        )}
      </div>

      <div className="safe-b fixed inset-x-0 bottom-0 z-20 border-t border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl gap-2">
          <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</button>
          {step < STEPS.length - 1
            ? <button className="btn btn-primary flex-1" disabled={step === 0 && !valid} onClick={() => setStep(step + 1)}>Next <ArrowRight size={16} /></button>
            : takenSlot
              ? <ConfirmButton className="btn btn-primary flex-1" title="Overwrite this save?" body={<>Slot {slot} holds <b>{takenSlot.name}</b>. Starting a new life here replaces it permanently.</>} confirmLabel="Overwrite & start" skip={!meta.settings.confirmDestructive} onConfirm={start} disabled={!valid}><Play size={16} /> Begin life</ConfirmButton>
              : <button className="btn btn-primary flex-1" disabled={!valid} onClick={start} data-testid="begin"><Play size={16} /> Begin life</button>}
        </div>
      </div>
    </div>
  );
}

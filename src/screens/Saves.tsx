import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Play, Save, Trash2, Upload } from 'lucide-react';
import { useGame } from '../store/useGame';
import { deleteSlot, listSlots, SLOT_COUNT } from '../engine/save';
import { fmtMoney } from '../engine/format';
import { Card, Chip, ConfirmButton, Modal, PageHeader, SectionTitle } from '../components/ui';

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Saves() {
  const nav = useNavigate();
  const game = useGame((s) => s.game);
  const meta = useGame((s) => s.meta);
  const loadSlot = useGame((s) => s.loadSlot);
  const saveNow = useGame((s) => s.saveNow);
  const exportJson = useGame((s) => s.exportJson);
  const importJson = useGame((s) => s.importJson);
  const toast = useGame((s) => s.toast);
  const [tick, setTick] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [text, setText] = useState('');
  const [target, setTarget] = useState(1);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  void tick;
  const slots = listSlots();
  const refresh = () => setTick((n) => n + 1);

  const open = (slot: number) => {
    const r = loadSlot(slot);
    if (!r.ok) { toast(r.error ?? 'Could not load that save.', 'bad'); refresh(); return; }
    nav(useGame.getState().game?.phase === 'dead' ? '/death' : '/play');
  };
  const doImport = () => {
    const r = importJson(text, target);
    if (!r.ok) { setErr(r.error ?? 'That file could not be read.'); return; }
    setImportOpen(false); setText(''); setErr(''); refresh();
    toast(`Imported into slot ${target}.`, 'good', '📥');
  };
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 8_000_000) { setErr('That file is too large to be a LifeVerse save.'); return; }
    setText(await f.text()); setErr('');
  };
  const exp = () => { const e = exportJson(); if (e) download(e.name, e.text); };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-10 pt-5">
      <button className="btn btn-ghost btn-sm mb-2" onClick={() => nav(-1)}><ArrowLeft size={16} /> Back</button>
      <PageHeader title="Saves" sub="Five local slots. Export a file to back up or move a life to another device."
        right={<button className="btn btn-sm" onClick={() => { setTarget(slots.find((s) => s.empty)?.slot ?? 1); setErr(''); setText(''); setImportOpen(true); }}><Upload size={15} /> Import</button>} />

      {game && (
        <Card className="mb-4">
          <div className="mb-2.5 text-sm"><b>{game.player.firstName} {game.player.lastName}</b> <span className="text-muted">· slot {game.slot} · autosave {meta.settings.autosave ? 'on' : 'off'}</span></div>
          <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-sm" onClick={() => { saveNow(); refresh(); }}><Save size={15} /> Save now</button>
          <button className="btn btn-sm" onClick={exp}><Download size={15} /> Export JSON</button>
          </div>
        </Card>
      )}

      <SectionTitle>Slots</SectionTitle>
      <div className="space-y-2.5">
        {Array.from({ length: SLOT_COUNT }, (_, i) => slots[i]).map((s) => (
          <Card key={s.slot} className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface text-lg font-bold">{s.slot}</div>
            <div className="min-w-0 flex-1">
              {s.empty ? <div className="text-sm text-muted">Empty slot</div> : s.corrupted ? (
                <div><div className="text-sm font-semibold text-bad">Damaged save</div><div className="text-xs text-muted">{s.recoverable ? 'A backup copy exists and will be loaded.' : 'No backup could be read.'}</div></div>
              ) : (
                <div>
                  <div className="font-bold leading-snug">{s.name}{game?.slot === s.slot && <Chip tone="info" className="ml-2">Current</Chip>}</div>
                  <div className="text-xs text-muted">{s.flag} Age {s.age} · {s.year} · {fmtMoney(s.netWorth ?? 0, s.countryId ?? 'us', true)} · Gen {s.generation}{s.alive ? '' : ' · Deceased'}</div>
                  {s.updatedAt && <div className="text-[0.7rem] text-muted">{new Date(s.updatedAt).toLocaleString()}</div>}
                </div>
              )}
            </div>
            {!s.empty && (
              <div className="flex gap-1.5">
                {(!s.corrupted || s.recoverable) && <button className="btn btn-sm btn-primary" onClick={() => open(s.slot)}><Play size={14} /> Load</button>}
                <ConfirmButton title={`Delete slot ${s.slot}?`} body="This save and its backup are removed permanently." confirmLabel="Delete" skip={!meta.settings.confirmDestructive && false} onConfirm={() => { if (game?.slot === s.slot) useGame.getState().leave(); deleteSlot(s.slot); refresh(); toast('Save deleted.', 'info', '🗑️'); }}><Trash2 size={14} /></ConfirmButton>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import a save" wide footer={<div className="flex gap-2"><button className="btn flex-1" onClick={() => setImportOpen(false)}>Cancel</button><button className="btn btn-primary flex-1" disabled={!text.trim()} onClick={doImport}>Import</button></div>}>
        <div className="space-y-3">
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <button className="btn w-full" onClick={() => fileRef.current?.click()}><Upload size={15} /> Choose a .json file</button>
          <textarea className="input min-h-32 font-mono text-xs" placeholder="…or paste exported JSON here" value={text} onChange={(e) => { setText(e.target.value); setErr(''); }} />
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="tslot">Import into slot</label>
            <select id="tslot" className="input" value={target} onChange={(e) => setTarget(Number(e.target.value))}>
              {slots.map((s) => <option key={s.slot} value={s.slot}>Slot {s.slot} — {s.empty ? 'empty' : s.corrupted ? 'damaged (will be replaced)' : `${s.name} (will be replaced)`}</option>)}
            </select>
          </div>
          {err && <p className="rounded-xl border border-bad/40 bg-bad/10 p-2.5 text-sm text-bad" role="alert">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}

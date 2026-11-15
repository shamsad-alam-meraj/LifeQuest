'use client';

import { useMemo, useState } from 'react';
import { downloadCsv } from '../export/csv';
import { Select } from '../ui/Select';
import type { Ctx } from './types';

export function Journal({ state, toast }: Ctx) {
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('all');
  const [onlyNotes, setOnlyNotes] = useState(false);

  const entries = useMemo(() => state.quests.filter((x) => x.status === 'completed' && x.completedAt).sort((a, b) => b.completedAt!.localeCompare(a.completedAt!)), [state.quests]);
  const skillName = (id: string) => state.skills.find((k) => k.id === id)?.name ?? '';
  const shown = entries.filter((e) => (skill === 'all' || e.skillId === skill) && (!onlyNotes || e.reflection) && `${e.title} ${e.action} ${e.reflection ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));

  async function exportPdf() {
    try { await (await import('../export/pdf')).downloadPdf(state, shown, 'Journal', 'lifequest-journal.pdf'); toast(shown.length ? 'PDF downloaded.' : 'PDF downloaded (no entries yet).'); }
    catch { toast('Could not create the PDF. Please try again.'); }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl">Journal</h1><p className="mt-1 text-ink2">Proof of what you actually did. {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}.</p></div><div className="flex gap-2"><button className="btn" onClick={() => void exportPdf()}>Export PDF</button><button className="btn" onClick={() => { downloadCsv(state, shown, 'lifequest-journal.csv'); toast(shown.length ? 'CSV downloaded.' : 'CSV downloaded (no entries yet).'); }}>Export CSV</button></div></div>
      <div className="card grid items-end gap-4 sm:grid-cols-[1fr_240px_auto]">
        <label className="field">Search<input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles and reflections" /></label>
        <Select label="Skill" value={skill} onChange={setSkill} options={[{ value: 'all', label: 'All skills' }, ...state.skills.map((k) => ({ value: k.id, label: k.name }))]} />
        <label className="flex min-h-11 items-center gap-2 text-sm text-ink2"><input type="checkbox" className="size-4 accent-violet" checked={onlyNotes} onChange={(e) => setOnlyNotes(e.target.checked)} />With reflections</label>
      </div>
      {shown.length === 0 && <div className="card text-center text-ink2">{entries.length ? 'No entries match your filters.' : 'Complete a quest and write a reflection. It will appear here.'}</div>}
      <ol className="m-0 grid list-none gap-3 p-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        {shown.map((e) => (
          <li key={e.id} className="card flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3"><h2 className="text-base">{e.title}</h2><time className="shrink-0 text-xs text-ink3" dateTime={e.completedAt}>{e.completedAt!.slice(0, 10)}</time></div>
            <p className="text-sm text-ink2">{e.action}</p>
            {e.reflection && <blockquote className="m-0 border-l-2 border-gold/60 pl-3 text-sm italic">{e.reflection}</blockquote>}
            <p className="flex gap-2 text-xs"><span className="pill">{skillName(e.skillId)}</span><span className="pill text-gold">+{e.xp} XP</span></p>
          </li>
        ))}
      </ol>
    </div>
  );
}

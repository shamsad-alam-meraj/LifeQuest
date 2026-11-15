'use client';

import AppLink from '../components/AppLink';
import { levelFromXp, levelProgress, streakDays, titleForLevel, totalXp } from '@lifequest/core';
import { Fox } from '../ui/Fox';
import { Heatmap } from './Heatmap';
import { GearCard } from './GearCard';
import { Insights } from './Insights';
import { renderShareCard } from '../ui/shareCard';
import { skinFor, type Ctx } from './types';

function JourneyMap({ states }: { states: ('completed' | 'active' | 'abandoned')[] }) {
  const nodes = states.filter((s) => s !== 'abandoned');
  const n = nodes.length;
  if (!n) return null;
  const pts = nodes.map((_, i) => ({ x: n === 1 ? 50 : 8 + (i / (n - 1)) * 84, y: 50 + (i % 2 ? 22 : -22) }));
  const current = nodes.findIndex((s) => s === 'active');
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="h-44 w-full" role="img" aria-label={`Journey map: ${nodes.filter((s) => s === 'completed').length} of ${n} quests complete`}>
      <path d={d} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1.6" strokeDasharray="2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={i === current ? 5.2 : 4} fill={nodes[i] === 'completed' ? '#4ade80' : i === current ? '#fbbf24' : '#2a2563'} stroke="rgba(255,255,255,.5)" strokeWidth=".8" />
          {nodes[i] === 'completed' && <path d={`M${p.x - 1.8} ${p.y} l1.4 1.5 l2.6 -3`} stroke="#052e16" strokeWidth="1" fill="none" strokeLinecap="round" />}
          {i === n - 1 && <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="7">🏰</text>}
        </g>
      ))}
    </svg>
  );
}

export function Journey({ state, setState, toast }: Ctx) {
  const xp = totalXp(state);
  const p = levelProgress(xp);
  const latest = state.adventures[0];
  const latestQuests = latest ? state.quests.filter((q) => q.adventureId === latest.id) : [];
  const skills = [...state.skills].sort((a, b) => b.xp - a.xp);

  async function share() {
    try {
      const blob = await renderShareCard({ name: state.profile!.name, title: titleForLevel(p.level), level: p.level, xp, streak: streakDays(state), quests: state.quests.filter((q) => q.status === 'completed').length, skills: state.skills });
      const file = new File([blob], 'lifequest-progress.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'My LifeQuest progress' }); return; }
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: 'lifequest-progress.png' }).click();
      URL.revokeObjectURL(url);
      toast('Progress card saved as an image.');
    } catch (e) { if ((e as Error).name !== 'AbortError') toast('Could not create the share card.'); }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Your Journey</h1>
        <div className="flex gap-2"><AppLink href="/app/journal" className="btn no-underline">📖 Journal</AppLink><button className="btn btn-primary" onClick={() => void share()}>Share progress</button></div>
      </div>
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
      <section className="card bg-grad-violet flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center rounded-full border-2 border-gold bg-bg2"><Fox size={64} gear={state.equipped} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white/70">{titleForLevel(p.level)}</p>
          <p className="font-display text-2xl">Level {p.level}</p>
          <div className="bar my-2"><i style={{ width: `${p.fraction * 100}%` }} /></div>
          <p className="text-xs text-white/80">{p.intoLevel}/{p.forNext} XP · {xp} total</p>
        </div>
      </section>

      {latest ? (
        <section className="card" aria-label="Journey map">
          <h2 className="text-lg">{latest.title}</h2>
          <JourneyMap states={latestQuests.map((q) => q.status)} />
        </section>
      ) : <section className="card grid place-items-center text-center text-ink2">Your journey map appears once you start an adventure.</section>}
      </div>

      <section className="card" aria-label="Hero gear"><h2 className="mb-4 text-lg">Hero gear</h2><GearCard state={state} setState={setState} /></section>

      <section className="card" aria-label="Insights"><Insights state={state} /></section>

      <section className="card" aria-label="Activity"><Heatmap state={state} /></section>

      <section aria-labelledby="skills">
        <h2 id="skills" className="mb-3 text-xl">Skills</h2>
        {skills.length === 0 && <div className="card text-center text-ink2">Skills appear as you create adventures and complete quests.</div>}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {skills.map((k, i) => {
            const sp = levelProgress(k.xp);
            const done = state.quests.filter((q) => q.skillId === k.id && q.status === 'completed');
            return (
              <div key={k.id} className={`rounded-2xl border border-white/15 p-4 ${skinFor(i)}`}>
                <div className="flex items-center justify-between"><p className="font-display text-lg">{k.icon} {k.name}</p><span className="pill">Lv {levelFromXp(k.xp)}</span></div>
                <div className="bar my-2.5"><i style={{ width: `${sp.fraction * 100}%` }} /></div>
                <p className="text-xs text-white/80">{sp.intoLevel}/{sp.forNext} XP · {done.length} quests</p>
                {done.length > 0 && <ul className="m-0 mt-2 list-none space-y-1 p-0 text-xs text-white/75">{done.slice(-3).reverse().map((q) => <li key={q.id} className="truncate">✓ {q.title}{q.reflection ? ` — ${q.reflection}` : ''}</li>)}</ul>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

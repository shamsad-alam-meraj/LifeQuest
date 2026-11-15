'use client';

import { totalXp, weeklyXp, type GameState } from '@lifequest/core';

export function Insights({ state }: { state: GameState }) {
  const weeks = weeklyXp(state, 8);
  const max = Math.max(1, ...weeks.map((w) => w.xp));
  const thisWeek = weeks.at(-1)?.xp ?? 0;
  const best = Math.max(...weeks.map((w) => w.xp));
  const total = Math.max(1, totalXp(state));
  const share = [...state.skills].filter((k) => k.xp > 0).sort((a, b) => b.xp - a.xp);
  const COLORS = ['bg-violet', 'bg-blue-500', 'bg-teal', 'bg-gold', 'bg-pink-400', 'bg-orange-400'];
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="mb-3 flex items-baseline justify-between"><h2 className="text-lg">XP per week</h2><span className="text-xs text-ink2">{thisWeek} this week · best {best}</span></div>
        <div role="img" aria-label={`Weekly XP for the last 8 weeks: ${weeks.map((w) => `${w.label} ${w.xp}`).join(', ')}`} className="flex h-36 items-end gap-2">
          {weeks.map((w, i) => (
            <div key={w.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`Week of ${w.label}: ${w.xp} XP`}>
              <span className="text-[10px] text-ink3">{w.xp || ''}</span>
              <div className={`w-full rounded-t-md ${i === weeks.length - 1 ? 'bg-grad-gold' : 'bg-white/20'}`} style={{ height: `${Math.max(w.xp ? 6 : 2, (w.xp / max) * 100)}%` }} />
              <span className="text-[10px] text-ink3">{w.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-baseline justify-between"><h2 className="text-lg">Where your time goes</h2><span className="text-xs text-ink2">{state.focusMinutes ?? 0} focus min</span></div>
        {share.length === 0 ? <p className="text-sm text-ink2">Complete quests to see your skill balance.</p> : (
          <>
            <div role="img" aria-label={`Skill share: ${share.map((k) => `${k.name} ${Math.round((k.xp / total) * 100)}%`).join(', ')}`} className="flex h-4 overflow-hidden rounded-full bg-black/40">
              {share.map((k, i) => <div key={k.id} className={COLORS[i % COLORS.length]} style={{ width: `${(k.xp / total) * 100}%` }} />)}
            </div>
            <ul className="m-0 mt-3 grid list-none grid-cols-2 gap-x-4 gap-y-1.5 p-0 text-sm">
              {share.map((k, i) => <li key={k.id} className="flex items-center gap-2"><span className={`size-2.5 shrink-0 rounded-full ${COLORS[i % COLORS.length]}`} /><span className="truncate">{k.name}</span><span className="ml-auto text-ink2">{Math.round((k.xp / total) * 100)}%</span></li>)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

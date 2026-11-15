'use client';

import { GEAR, equipGear, levelFromXp, totalXp } from '@lifequest/core';
import { Fox } from '../ui/Fox';
import type { Ctx } from './types';

export function GearCard({ state, setState }: Pick<Ctx, 'state' | 'setState'>) {
  const level = levelFromXp(totalXp(state));
  const eq = state.equipped ?? {};
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="grid size-36 shrink-0 place-items-center rounded-3xl border border-line bg-black/25"><Fox size={128} gear={eq} /></div>
      <div className="grid w-full flex-1 gap-2 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        {GEAR.map((g) => {
          const locked = g.level > level; const on = eq[g.slot] === g.id;
          return (
            <button key={g.id} disabled={locked} onClick={() => setState((s) => equipGear(s, g.id, level))} aria-pressed={on}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${on ? 'border-gold/60 bg-gold/10' : 'border-line bg-white/5'} ${locked ? 'opacity-45' : 'hover:bg-white/10'}`}>
              <span className="text-2xl">{locked ? '🔒' : g.icon}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{g.name}</span><span className="text-xs text-ink2">{locked ? `Reach level ${g.level}` : on ? 'Equipped' : 'Tap to equip'}</span></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

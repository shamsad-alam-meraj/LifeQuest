'use client';

import { ACHIEVEMENTS } from '@lifequest/core';
import { Icon } from '../ui/Icon';
import type { Ctx } from './types';

export function Trophies({ state }: Ctx) {
  const got = new Map(state.achievements.map((a) => [a.id, a]));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between"><h1 className="text-3xl">Trophies</h1><span className="text-sm text-ink2">{got.size}/{ACHIEVEMENTS.length} unlocked</span></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
        {ACHIEVEMENTS.map((a) => {
          const u = got.get(a.id);
          return (
            <div key={a.id} className={`card flex flex-col items-center gap-1 text-center ${u ? 'border-gold/40' : 'opacity-50'}`}>
              <div className="text-4xl">{u ? a.icon : <span className="text-ink3"><Icon name="lock" size={34} /></span>}</div>
              <p className="font-display font-semibold">{a.title}</p>
              <p className="text-xs text-ink2">{a.description}</p>
              {u && <p className="text-xs text-gold">{u.unlockedAt.slice(0, 10)}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

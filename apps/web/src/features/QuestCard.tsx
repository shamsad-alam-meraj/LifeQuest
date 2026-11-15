'use client';

import type { Quest } from '@lifequest/core';
import { Icon } from '../ui/Icon';
import { skinFor } from './types';

interface Props {
  q: Quest;
  skillName: string;
  skillIndex: number;
  locked?: boolean;
  rerolling?: boolean;
  onOpen?: () => void;
  onReroll?: () => void;
  onFocus?: () => void;
}

const KIND = { daily: ['🌅', 'Daily'], boss: ['🐉', 'Boss'], custom: ['🛠️', 'Mine'] } as const;

export function QuestCard({ q, skillName, skillIndex, locked, rerolling, onOpen, onReroll, onFocus }: Props) {
  const done = q.status === 'completed';
  const kind = q.kind && q.kind !== 'normal' ? KIND[q.kind] : null;
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-3.5 shadow-lg sm:p-4 ${q.kind === 'boss' ? 'border-gold/60 ring-1 ring-gold/30' : 'border-white/15'} ${skinFor(skillIndex)} ${done ? 'opacity-60' : locked ? 'opacity-55 saturate-50' : ''}`}>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-display text-base font-semibold sm:text-lg">
          {kind && <span className="pill shrink-0 py-0.5 text-[11px]">{kind[0]} {kind[1]}</span>}
          <span className="truncate">{q.title}</span>
        </p>
        <p className="mt-0.5 text-sm text-white/80">{q.action}</p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span className="pill"><span className="text-gold">+{q.xp} XP</span></span><span className="pill capitalize">{q.difficulty}</span><span className="pill">{skillName}</span></p>
        {locked && <p className="mt-2 text-xs text-white/70">🔒 Complete the quest before this one to unlock it.</p>}
        {q.reflection && <p className="mt-2 text-xs text-white/70 italic">“{q.reflection}”</p>}
      </div>
      <div className="flex shrink-0 flex-col items-center gap-2">
        <button onClick={onOpen} disabled={done || locked || !onOpen} aria-label={done ? `${q.title} completed` : locked ? `${q.title} is locked` : `Complete ${q.title}`} className={`grid size-11 place-items-center rounded-xl border-2 transition ${done ? 'border-good bg-good text-bg' : locked ? 'border-white/30 text-white/60' : 'border-white/60 hover:border-white hover:bg-white/15'}`}>
          {done ? <Icon name="check" size={22} /> : locked ? <Icon name="lock" size={18} /> : null}
        </button>
        {onFocus && q.status === 'active' && !locked && (
          <button onClick={onFocus} title="Start a focus timer" aria-label={`Focus timer for ${q.title}`} className="grid size-8 place-items-center rounded-lg text-base text-white/70 hover:bg-white/15 hover:text-white">⏱</button>
        )}
        {onReroll && q.status === 'active' && !locked && (
          <button onClick={onReroll} disabled={rerolling} title="Re-roll this quest" aria-label={`Re-roll ${q.title}`} className={`grid size-8 place-items-center rounded-lg text-white/70 hover:bg-white/15 hover:text-white disabled:opacity-50 ${rerolling ? 'animate-spin' : ''}`}><Icon name="dice" size={17} /></button>
        )}
      </div>
    </div>
  );
}

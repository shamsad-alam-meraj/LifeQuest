'use client';

import { completeQuest, levelFromXp, streakDays, totalXp, type Quest } from '@lifequest/core';
import { useState } from 'react';
import { Confetti } from '../ui/Confetti';
import { Fox } from '../ui/Fox';
import { Modal } from '../ui/Modal';
import type { Ctx } from './types';

const REASON = { 'daily-limit': 'Daily limit reached. Go enjoy the rest of your day!', 'not-active': 'This quest is no longer active.', 'not-found': 'Quest not found.', locked: 'Finish the earlier quests in this adventure first.' } as const;

interface Result { xp: number; streak: number; levelUp: number | null; achievements: string[]; shield: boolean }

export function CompleteFlow({ quest, ctx, onClose }: { quest: Quest; ctx: Ctx; onClose: () => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [res, setRes] = useState<Result | null>(null);

  function submit() {
    const before = levelFromXp(totalXp(ctx.state));
    const r = completeQuest(ctx.state, quest.id, text);
    if (!r.ok) return setError(REASON[r.reason]);
    const after = levelFromXp(totalXp(r.state));
    ctx.setState(r.state);
    setRes({ xp: r.xp, streak: streakDays(r.state), levelUp: after > before ? after : null, achievements: r.newAchievements, shield: r.shieldEarned });
  }

  if (res) {
    return (
      <Modal onClose={onClose} label="Quest complete">
        <Confetti />
        <div className="relative text-center">
          <p className="mx-auto w-fit rounded-xl border border-line bg-white/10 px-5 py-1.5 font-display text-lg">Quest Complete</p>
          <p className="mt-2 text-sm text-ink2">{quest.title}</p>
          <p className="my-3 font-display text-7xl font-bold text-grad-gold">+{res.xp}<span className="text-4xl"> xp</span></p>
          <p className="text-sm text-ink2">🔥 {res.streak}-day streak{res.levelUp ? ` · ⭐ Level ${res.levelUp} reached!` : ''}</p>
          <div className="flex justify-center py-3"><Fox size={150} cheer /></div>
          {res.shield && <p className="mb-3 rounded-xl border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal">🛡️ Streak shield earned! It will save one missed day.</p>}
          {res.achievements.length > 0 && <p className="mb-4 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">🏆 Unlocked: {res.achievements.join(', ')}</p>}
          <button className="btn btn-primary btn-lg w-full" onClick={onClose}>Awesome!</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} label="Complete quest">
      <h2 className="text-xl">{quest.title}</h2>
      <p className="mt-1 text-sm text-ink2 italic">{quest.story}</p>
      <p className="mt-3 text-sm">{quest.action}</p>
      <label className="field mt-4">What did you actually do or learn? <small>optional, but it becomes your record</small>
        <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} />
      </label>
      <p role="alert" className="mt-2 min-h-5 text-sm text-bad">{error}</p>
      <div className="mt-2 flex gap-3"><button className="btn flex-1" onClick={onClose}>Not yet</button><button className="btn btn-gold flex-1" onClick={submit}>I did it!</button></div>
    </Modal>
  );
}

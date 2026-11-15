'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { notificationsSupported } from './device';
import type { Quest } from '@lifequest/core';

const OPTIONS = [10, 25, 45, 60];
const fmt = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

/** Date-based countdown (accurate even when the tab is throttled). Reports focused minutes via onDone. */
export function FocusTimer({ quest, onClose, onDone }: { quest: Quest; onClose: () => void; onDone: (minutes: number) => void }) {
  const [minutes, setMinutes] = useState(25);
  const [phase, setPhase] = useState<'pick' | 'run' | 'pause' | 'done'>('pick');
  const [left, setLeft] = useState(0);
  const endsAt = useRef(0);
  const total = useRef(0);

  useEffect(() => {
    if (phase !== 'run') return;
    const tick = () => {
      const l = endsAt.current - Date.now();
      setLeft(l);
      if (l <= 0) {
        setPhase('done');
        if (notificationsSupported() && Notification.permission === 'granted') new Notification('Focus complete ⏱️', { body: quest.title, icon: './icon.svg' });
      }
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [phase, quest.title]);

  useEffect(() => {
    if (phase === 'run' || phase === 'pause') { const prev = document.title; document.title = `⏱ ${fmt(left)} · LifeQuest`; return () => { document.title = prev; }; }
  }, [phase, left]);

  const start = () => { total.current = minutes * 60000; endsAt.current = Date.now() + total.current; setLeft(total.current); setPhase('run'); };
  const pause = () => { setLeft(endsAt.current - Date.now()); setPhase('pause'); };
  const resume = () => { endsAt.current = Date.now() + left; setPhase('run'); };
  const elapsedMin = () => Math.floor((total.current - Math.max(0, phase === 'run' ? endsAt.current - Date.now() : left)) / 60000);
  const pct = total.current ? Math.min(100, ((total.current - left) / total.current) * 100) : 0;

  return (
    <Modal onClose={onClose} label="Focus timer">
      <h2 className="text-xl">Focus: {quest.title}</h2>
      <p className="mt-1 text-sm text-ink2">{quest.action}</p>
      {phase === 'pick' && (
        <div className="mt-5 flex flex-col gap-4">
          <div role="radiogroup" aria-label="Duration" className="grid grid-cols-4 gap-2">
            {OPTIONS.map((m) => <button key={m} role="radio" aria-checked={minutes === m} onClick={() => setMinutes(m)} className={`btn px-0 ${minutes === m ? 'border-gold/60 bg-gold/15 text-gold' : ''}`}>{m}m</button>)}
          </div>
          <button className="btn btn-gold btn-lg" onClick={start}>Start focusing</button>
          <p className="text-xs text-ink3">Put your phone away and do the real thing. The timer just keeps you honest.</p>
        </div>
      )}
      {(phase === 'run' || phase === 'pause') && (
        <div className="mt-5 flex flex-col items-center gap-4 text-center">
          <p className="font-display text-7xl tabular-nums" aria-live="off">{fmt(left)}</p>
          <div className="bar w-full"><i style={{ width: `${pct}%` }} /></div>
          <div className="flex w-full gap-3">
            <button className="btn flex-1" onClick={phase === 'run' ? pause : resume}>{phase === 'run' ? 'Pause' : 'Resume'}</button>
            <button className="btn btn-primary flex-1" onClick={() => onDone(elapsedMin())}>Finish & complete</button>
          </div>
          <button className="btn btn-ghost text-sm" onClick={onClose}>Cancel session</button>
        </div>
      )}
      {phase === 'done' && (
        <div className="mt-5 flex flex-col items-center gap-4 text-center">
          <p className="text-5xl">🎉</p><p className="font-display text-2xl">Time’s up!</p>
          <p className="text-sm text-ink2">You focused for {minutes} minutes. Did you finish the quest?</p>
          <div className="flex w-full gap-3"><button className="btn flex-1" onClick={() => onDone(minutes)}>Not quite, log time</button><button className="btn btn-gold flex-1" onClick={() => onDone(minutes)}>Complete quest</button></div>
        </div>
      )}
    </Modal>
  );
}

'use client';

import { activityByDay, type GameState } from '@lifequest/core';
import { useEffect, useRef } from 'react';

const WEEKS = 52;
const SHADES = ['bg-white/6', 'bg-gold/30', 'bg-gold/55', 'bg-gold/80', 'bg-gold'];

export function Heatmap({ state, now = new Date() }: { state: GameState; now?: Date }) {
  const scroller = useRef<HTMLDivElement>(null);
  // on narrow screens the grid scrolls; start at the most recent weeks
  useEffect(() => { const el = scroller.current; if (el) el.scrollLeft = el.scrollWidth; }, []);
  const counts = activityByDay(state);
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (WEEKS * 7 - 1) - end.getUTCDay()); // align first column to Sunday
  const cells: { day: string; n: number; future: boolean }[] = [];
  for (const d = new Date(start); cells.length < (WEEKS + 1) * 7; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    cells.push({ day, n: counts[day] ?? 0, future: d > end });
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between"><h2 className="text-lg">Activity</h2><span className="text-xs text-ink2">{total} quests completed</span></div>
      <div ref={scroller} className="overflow-x-auto pb-1">
        <div
          role="img"
          aria-label={`Activity heatmap: ${total} quests completed in the last year`}
          className="grid w-full min-w-[560px] gap-[3px]"
          style={{ gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, auto)', gridTemplateColumns: `repeat(${WEEKS + 1}, minmax(8px, 1fr))` }}
        >
          {cells.map((c) => (
            <div key={c.day} title={`${c.n} quest${c.n === 1 ? '' : 's'} on ${c.day}`} className={`aspect-square w-full rounded-[3px] ${c.future ? 'opacity-0' : SHADES[Math.min(4, c.n)]}`} />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-ink3">Less {SHADES.map((s) => <span key={s} className={`size-3 rounded-[3px] ${s}`} />)} More</div>
    </div>
  );
}

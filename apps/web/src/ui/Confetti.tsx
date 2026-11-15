'use client';

import { useMemo } from 'react';

const COLORS = ['#fbbf24', '#a855f7', '#3b82f6', '#14b8a6', '#f472b6', '#fb923c'];

export function Confetti({ count = 46 }: { count?: number }) {
  const bits = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 2.2 + Math.random() * 1.8,
      color: COLORS[i % COLORS.length],
      rot: Math.random() * 360,
      w: 6 + Math.random() * 6,
    })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
      {bits.map((b, i) => (
        <i key={i} className="absolute -top-5 animate-fall rounded-xs opacity-95" style={{ left: `${b.left}%`, background: b.color, width: b.w, height: b.w * 1.6, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, transform: `rotate(${b.rot}deg)` }} />
      ))}
    </div>
  );
}

import type { GameState, Quest } from './types';

export const dayKey = (iso: string): string => iso.slice(0, 10);

export function totalXp(s: GameState): number {
  return s.skills.reduce((n, k) => n + k.xp, 0);
}

export function completedOn(s: GameState, day: string): Quest[] {
  return s.quests.filter((q) => q.status === 'completed' && q.completedAt && dayKey(q.completedAt) === day);
}

/** Consecutive days (ending today or yesterday) with at least one completed quest. */
export function streakDays(s: GameState, now: Date = new Date()): number {
  const days = new Set([...s.quests.filter((q) => q.completedAt).map((q) => dayKey(q.completedAt!)), ...(s.frozenDays ?? [])]);
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor.toISOString()))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let n = 0;
  while (days.has(dayKey(cursor.toISOString()))) {
    n++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return n;
}

/** XP earned per ISO week (Monday start, UTC) for the last `weeks` weeks, oldest first. */
export function weeklyXp(s: GameState, weeks = 8, now: Date = new Date()): { label: string; xp: number }[] {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const out: { label: string; xp: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(monday); start.setUTCDate(start.getUTCDate() - 7 * i);
    const end = new Date(start); end.setUTCDate(end.getUTCDate() + 7);
    const xp = s.quests.reduce((n, q) => (q.status === 'completed' && q.completedAt && q.completedAt >= start.toISOString() && q.completedAt < end.toISOString() ? n + q.xp : n), 0);
    out.push({ label: start.toISOString().slice(5, 10), xp });
  }
  return out;
}

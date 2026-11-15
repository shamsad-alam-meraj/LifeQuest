import type { Difficulty } from './types';

export const DIFFICULTY_XP: Record<Difficulty, number> = {
  easy: 20,
  medium: 50,
  hard: 100,
  epic: 250,
};

/** Total XP required to reach `level` (level 1 = 0 XP). Gentle quadratic curve. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 50 * (level - 1) * level;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  intoLevel: number;
  forNext: number;
  fraction: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const forNext = xpForLevel(level + 1) - base;
  const intoLevel = xp - base;
  return { level, intoLevel, forNext, fraction: forNext ? intoLevel / forNext : 0 };
}

export const TITLES = ['Newcomer', 'Apprentice', 'Adept', 'Veteran', 'Master', 'Legend'];

export function titleForLevel(level: number): string {
  return TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 3))] ?? 'Newcomer';
}

import { z } from 'zod';
import type { GameState } from '@lifequest/core';
import { AppError } from './errors';

const str = (max: number) => z.string().max(max);
const difficulty = z.enum(['easy', 'medium', 'hard', 'epic']);

const Quest = z.object({
  id: str(64), adventureId: str(64), title: str(200), story: str(800), action: str(800), skillId: str(80),
  difficulty, xp: z.number().int().min(0).max(5000), status: z.enum(['active', 'completed', 'abandoned']),
  kind: z.enum(['normal', 'daily', 'boss', 'custom']).optional(),
  createdAt: str(40), completedAt: str(40).optional(), reflection: str(1000).optional(),
});

const GameStateSchema = z.object({
  version: z.literal(1),
  profile: z.object({
    name: str(40), interests: z.array(str(60)).max(10), goals: z.array(str(120)).max(10),
    dailyQuestLimit: z.number().int().min(1).max(8), reminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  }).nullable(),
  skills: z.array(z.object({ id: str(80), name: str(60), icon: str(16), xp: z.number().int().min(0) })).max(200),
  adventures: z.array(z.object({ id: str(64), title: str(200), premise: str(800), goal: str(300), createdAt: str(40) })).max(500),
  quests: z.array(Quest).max(5000),
  achievements: z.array(z.object({ id: str(64), title: str(100), description: str(300), icon: str(16), unlockedAt: str(40) })).max(100),
  lastDailyOn: str(10).optional(), lastBossWeek: str(10).optional(),
  rerolls: z.object({ day: str(10), n: z.number().int().min(0).max(100) }).optional(),
  shields: z.number().int().min(0).max(2).optional(), frozenDays: z.array(str(10)).max(400).optional(),
  shieldAwardedOn: str(10).optional(), shieldsUsed: z.number().int().min(0).max(10000).optional(),
  focusMinutes: z.number().int().min(0).max(1_000_000).optional(), equipped: z.record(z.string().max(20), z.string().max(40)).optional(),
});

export const MAX_SAVE_BYTES = 1_500_000;

/** Validates and strips a client-supplied save. Unknown fields are dropped; sizes and types are enforced. */
export function parseSave(raw: unknown): GameState {
  let size = 0;
  try { size = JSON.stringify(raw)?.length ?? 0; } catch { throw new AppError('Invalid save data.'); }
  if (size > MAX_SAVE_BYTES) throw new AppError('Save is too large to sync.');
  const r = GameStateSchema.safeParse(raw);
  if (!r.success) throw new AppError('Invalid save data.');
  return r.data as GameState;
}

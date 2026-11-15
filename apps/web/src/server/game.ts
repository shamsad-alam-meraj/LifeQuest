import { eq } from 'drizzle-orm';
import { levelFromXp, sanitizeState, streakDays, totalXp, type GameState } from '@lifequest/core';
import { gameSaves, profiles } from '../db/schema';
import { AppError } from './errors';
import { syncGuildContribution } from './guild';
import type { DB } from './types';
import { parseSave } from './validate';

export async function loadSave(db: DB, userId: string): Promise<GameState | null> {
  const [row] = await db.select({ state: gameSaves.state }).from(gameSaves).where(eq(gameSaves.userId, userId));
  return (row?.state as GameState | undefined) ?? null;
}

const MIN_INTERVAL_MS = 1000;

/**
 * Persist a client save. Everything is derived or verified server-side: the payload is schema-validated and
 * size-capped, quest/skill XP is recomputed, and leaderboard stats come from the verified state, never from the client.
 */
export async function saveGame(db: DB, userId: string, raw: unknown, now = new Date()): Promise<string> {
  const state = sanitizeState(parseSave(raw));
  const xp = totalXp(state);

  return db.transaction(async (tx) => {
    const [prev] = await tx.select({ at: gameSaves.updatedAt }).from(gameSaves).where(eq(gameSaves.userId, userId));
    if (prev && now.getTime() - prev.at.getTime() < MIN_INTERVAL_MS && now.getTime() >= prev.at.getTime()) throw new AppError('Saving too quickly. Please retry in a moment.', 'rate_limited');

    await tx.insert(gameSaves).values({ userId, state, updatedAt: now }).onConflictDoUpdate({ target: gameSaves.userId, set: { state, updatedAt: now } });
    const stats = { displayName: (state.profile?.name?.trim() || 'Adventurer').slice(0, 40), level: levelFromXp(xp), totalXp: xp, streak: streakDays(state, now), updatedAt: now };
    await tx.insert(profiles).values({ userId, ...stats }).onConflictDoUpdate({ target: profiles.userId, set: stats });
    await syncGuildContribution(tx as unknown as DB, userId, state, now);
    return now.toISOString();
  });
}

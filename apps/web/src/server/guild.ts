import { randomInt } from 'node:crypto';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { weekKey, type GameState } from '@lifequest/core';
import { guildContributions, guildMembers, guildMissions, guilds, profiles } from '../db/schema';
import type { GuildOverview } from '../lib/types';
import { AppError } from './errors';
import type { DB } from './types';

export const MAX_GUILD_MEMBERS = 30;
export const MAX_WEEKLY_CONTRIBUTION = 50;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

const newCode = () => Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');

async function ensureMission(db: DB, guildId: string, now: Date) {
  const week = weekKey(now);
  const find = async () => (await db.select().from(guildMissions).where(and(eq(guildMissions.guildId, guildId), eq(guildMissions.week, week))))[0];
  const existing = await find();
  if (existing) return existing;
  const [{ n } = { n: 1 }] = await db.select({ n: count() }).from(guildMembers).where(eq(guildMembers.guildId, guildId));
  await db.insert(guildMissions).values({ guildId, week, title: 'Weekly Gathering: complete quests together', target: 10 + 5 * Math.max(n, 1) }).onConflictDoNothing();
  return (await find())!;
}

export async function guildOverview(db: DB, userId: string, now = new Date()): Promise<GuildOverview | null> {
  const [mem] = await db.select().from(guildMembers).where(eq(guildMembers.userId, userId));
  if (!mem) return null;
  const [guild] = await db.select().from(guilds).where(eq(guilds.id, mem.guildId));
  if (!guild) return null;
  const mission = await ensureMission(db, guild.id, now);
  const rows = await db.select({ userId: guildMembers.userId, name: profiles.displayName, level: profiles.level, xp: profiles.totalXp, streak: profiles.streak })
    .from(guildMembers).leftJoin(profiles, eq(profiles.userId, guildMembers.userId)).where(eq(guildMembers.guildId, guild.id)).orderBy(desc(sql`coalesce(${profiles.totalXp}, 0)`));
  const [mine] = await db.select({ amount: guildContributions.amount }).from(guildContributions).where(and(eq(guildContributions.missionId, mission.id), eq(guildContributions.userId, userId)));
  return {
    guild: { id: guild.id, name: guild.name, invite_code: guild.inviteCode },
    members: rows.map((r) => ({ name: r.name ?? 'Adventurer', level: r.level ?? 1, xp: r.xp ?? 0, streak: r.streak ?? 0, is_me: r.userId === userId })),
    mission: { title: mission.title, target: mission.target, progress: mission.progress, week: mission.week, my_amount: mine?.amount ?? 0 },
  };
}

export async function createGuild(db: DB, userId: string, rawName: string, now = new Date()): Promise<GuildOverview> {
  const name = rawName.trim();
  if (name.length < 3 || name.length > 40) throw new AppError('Guild name must be 3-40 characters.');
  return db.transaction(async (tx) => {
    const t = tx as unknown as DB;
    if ((await t.select().from(guildMembers).where(eq(guildMembers.userId, userId))).length) throw new AppError('You are already in a guild.', 'conflict');
    let guildId: string | undefined;
    for (let i = 0; i < 6 && !guildId; i++) {
      const [g] = await t.insert(guilds).values({ name, inviteCode: newCode(), ownerId: userId }).onConflictDoNothing().returning({ id: guilds.id });
      guildId = g?.id;
    }
    if (!guildId) throw new AppError('Could not create a guild. Please try again.', 'unavailable');
    await t.insert(guildMembers).values({ userId, guildId, joinedAt: now });
    await ensureMission(t, guildId, now);
    return (await guildOverview(t, userId, now))!;
  });
}

export async function joinGuild(db: DB, userId: string, rawCode: string, now = new Date()): Promise<GuildOverview> {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,8}$/.test(code)) throw new AppError('Invalid invite code.');
  return db.transaction(async (tx) => {
    const t = tx as unknown as DB;
    if ((await t.select().from(guildMembers).where(eq(guildMembers.userId, userId))).length) throw new AppError('You are already in a guild.', 'conflict');
    const [guild] = await t.select().from(guilds).where(eq(guilds.inviteCode, code)).for('update'); // serialises concurrent joins
    if (!guild) throw new AppError('Invalid invite code.');
    const [{ n } = { n: 0 }] = await t.select({ n: count() }).from(guildMembers).where(eq(guildMembers.guildId, guild.id));
    if (n >= MAX_GUILD_MEMBERS) throw new AppError('This guild is full.', 'conflict');
    await t.insert(guildMembers).values({ userId, guildId: guild.id, joinedAt: now });
    return (await guildOverview(t, userId, now))!;
  });
}

export async function leaveGuild(db: DB, userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const t = tx as unknown as DB;
    const [mem] = await t.select().from(guildMembers).where(eq(guildMembers.userId, userId));
    if (!mem) return;
    await t.delete(guildMembers).where(eq(guildMembers.userId, userId));
    const [{ n } = { n: 0 }] = await t.select({ n: count() }).from(guildMembers).where(eq(guildMembers.guildId, mem.guildId));
    if (n === 0) await t.delete(guilds).where(eq(guilds.id, mem.guildId)); // cascades missions + contributions
  });
}

/**
 * Called on every save: a member's weekly contribution is the number of quests in their (server-verified) save completed
 * this ISO week, after they joined. It is idempotent and capped, so there is no endpoint that can be replayed to inflate a mission.
 */
export async function syncGuildContribution(db: DB, userId: string, state: GameState, now: Date): Promise<void> {
  const [mem] = await db.select().from(guildMembers).where(eq(guildMembers.userId, userId));
  if (!mem) return;
  const mission = await ensureMission(db, mem.guildId, now);
  const wk = weekKey(now);
  const joined = mem.joinedAt.toISOString();
  const completed = state.quests.filter((q) => q.status === 'completed' && q.completedAt && q.completedAt >= joined && weekKey(new Date(q.completedAt)) === wk).length;
  const amount = Math.min(completed, MAX_WEEKLY_CONTRIBUTION);
  await db.insert(guildContributions).values({ missionId: mission.id, userId, amount }).onConflictDoUpdate({ target: [guildContributions.missionId, guildContributions.userId], set: { amount } });
  await db.update(guildMissions).set({ progress: sql`(select coalesce(sum(${guildContributions.amount}), 0) from ${guildContributions} where ${guildContributions.missionId} = ${mission.id})` }).where(eq(guildMissions.id, mission.id));
}

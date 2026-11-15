import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { addAdventure, completeQuest, createProfile, emptyState, fallbackAdventure, type GameState } from '@lifequest/core';
import * as schema from '../db/schema';
import { AppError } from './errors';
import { loadSave, saveGame } from './game';
import { createGuild, guildOverview, joinGuild, leaveGuild, MAX_GUILD_MEMBERS } from './guild';
import { cleanUserAgent, getClientIp } from './ip';
import { LIMITS, isRateLimited, purgeOldEvents, recentLogins, recordLoginEvent } from './loginEvents';
import type { DB } from './types';
import { parseSave } from './validate';

let db: DB;
let pg: PGlite;
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const T0 = new Date('2026-03-04T10:00:00Z'); // Wednesday, ISO week 10

beforeAll(async () => {
  pg = new PGlite();
  // stand-in for Supabase's auth.users so the real migrations (incl. the FK migration) apply unchanged
  await pg.exec('create schema auth; create table auth.users (id uuid primary key);');
  const d = drizzle(pg, { schema });
  await migrate(d, { migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)) });
  db = d as unknown as DB;
  for (let i = 1; i <= 90; i++) await pg.exec(`insert into auth.users (id) values ('${uid(i)}')`);
});

const play = (days: string[], name = 'Hero'): GameState => {
  let s = addAdventure(createProfile(emptyState(), { name, interests: [], goals: [], dailyQuestLimit: 8 }), 'g', fallbackAdventure('g'));
  for (const [i, d] of days.entries()) { const r = completeQuest(s, s.quests[i]!.id, 'did it', new Date(`${d}T10:00:00Z`)); if (!r.ok) throw new Error(r.reason); s = r.state; }
  return s;
};

describe('schema', () => {
  it('enables row level security on every table (publishable key can read nothing)', async () => {
    const r = await pg.query<{ relname: string; relrowsecurity: boolean }>(`select relname, relrowsecurity from pg_class where relname in ('game_saves','profiles','guilds','guild_members','guild_missions','guild_contributions','login_events')`);
    expect(r.rows).toHaveLength(7);
    expect(r.rows.every((x) => x.relrowsecurity)).toBe(true);
  });
});

describe('saveGame / loadSave', () => {
  it('round-trips a save and derives leaderboard stats server-side', async () => {
    const s = play(['2026-03-02', '2026-03-03']);
    await saveGame(db, uid(1), s, T0);
    const loaded = await loadSave(db, uid(1));
    expect(loaded?.quests.filter((q) => q.status === 'completed')).toHaveLength(2);
    const [p] = (await pg.query<{ display_name: string; total_xp: number; streak: number }>(`select * from profiles where user_id='${uid(1)}'`)).rows;
    expect(p!.display_name).toBe('Hero'); expect(p!.total_xp).toBe(40); expect(p!.streak).toBe(2);
  });
  it('forces cheated XP back to legitimate values', async () => {
    const s = play(['2026-03-02']);
    const cheated = { ...s, quests: s.quests.map((q) => ({ ...q, xp: 4999 })) };
    await saveGame(db, uid(2), cheated, T0);
    expect((await loadSave(db, uid(2)))!.quests.every((q) => q.xp < 300)).toBe(true);
    const [p] = (await pg.query<{ total_xp: number }>(`select total_xp from profiles where user_id='${uid(2)}'`)).rows;
    expect(p!.total_xp).toBe(20);
  });
  it('rejects malformed, oversized and unknown-field payloads safely', async () => {
    expect(() => parseSave({ version: 2 })).toThrow(AppError);
    expect(() => parseSave('nope')).toThrow(AppError);
    expect(() => parseSave({ ...emptyState(), quests: Array.from({ length: 5001 }, () => ({})) })).toThrow(AppError);
    const stripped = parseSave({ ...emptyState(), evil: '<script>' }) as unknown as Record<string, unknown>;
    expect(stripped.evil).toBeUndefined();
    await expect(saveGame(db, uid(3), { version: 1 }, T0)).rejects.toBeInstanceOf(AppError);
  });
  it('throttles saves faster than once a second', async () => {
    await saveGame(db, uid(4), emptyState(), T0);
    await expect(saveGame(db, uid(4), emptyState(), new Date(T0.getTime() + 300))).rejects.toThrow(/too quickly/);
    await expect(saveGame(db, uid(4), emptyState(), new Date(T0.getTime() + 2000))).resolves.toBeTruthy();
  });
  it('returns null when nothing is saved', async () => { expect(await loadSave(db, uid(30))).toBeNull(); });
});

describe('guilds', () => {
  it('create, join, leaderboard and idempotent mission contributions', async () => {
    const g = await createGuild(db, uid(10), '  The Ramblers ', T0);
    expect(g.guild.name).toBe('The Ramblers'); expect(g.guild.invite_code).toMatch(/^[A-Z2-9]{6}$/);
    expect(g.mission.target).toBe(15); expect(g.mission.progress).toBe(0);
    const joined = await joinGuild(db, uid(11), g.guild.invite_code.toLowerCase(), T0);
    expect(joined.members).toHaveLength(2);

    await saveGame(db, uid(10), play(['2026-03-04', '2026-03-04'], 'Alice'), T0);
    await saveGame(db, uid(11), play(['2026-03-04'], 'Bob'), T0);
    let o = (await guildOverview(db, uid(10), T0))!;
    expect(o.mission.progress).toBe(3); expect(o.mission.my_amount).toBe(2);
    expect(o.members.map((m) => m.name).sort()).toEqual(['Alice', 'Bob']);
    expect(o.members.find((m) => m.is_me)!.name).toBe('Alice');

    await saveGame(db, uid(10), play(['2026-03-04', '2026-03-04'], 'Alice'), new Date(T0.getTime() + 5000)); // replay: no inflation
    o = (await guildOverview(db, uid(10), T0))!;
    expect(o.mission.progress).toBe(3);
  });
  it('does not count quests completed before joining or in another week', async () => {
    const g = await createGuild(db, uid(12), 'Late Joiners', T0);
    await joinGuild(db, uid(13), g.guild.invite_code, new Date('2026-03-04T12:00:00Z'));
    const s = play(['2026-02-20', '2026-03-03']); // other week / before joining
    await saveGame(db, uid(13), s, new Date('2026-03-05T10:00:00Z'));
    expect((await guildOverview(db, uid(13), new Date('2026-03-05T10:00:00Z')))!.mission.my_amount).toBe(0);
  });
  it('enforces one guild per player, valid names/codes and the member cap', async () => {
    await expect(createGuild(db, uid(10), 'Another One')).rejects.toThrow(/already in a guild/);
    await expect(createGuild(db, uid(14), 'ab')).rejects.toThrow(/3-40/);
    await expect(joinGuild(db, uid(14), 'ZZZZZZ')).rejects.toThrow(/Invalid invite code/);
    await expect(joinGuild(db, uid(14), "'; drop table")).rejects.toThrow(/Invalid invite code/);
    const g = await createGuild(db, uid(15), 'Full House', T0);
    for (let i = 16; i < 15 + MAX_GUILD_MEMBERS; i++) await joinGuild(db, uid(i), g.guild.invite_code);
    await expect(joinGuild(db, uid(15 + MAX_GUILD_MEMBERS), g.guild.invite_code)).rejects.toThrow(/full/);
  });
  it('deletes an empty guild when the last member leaves', async () => {
    const g = await createGuild(db, uid(80), 'Short Lived', T0);
    await leaveGuild(db, uid(80));
    expect(await guildOverview(db, uid(80))).toBeNull();
    const left = await pg.query(`select 1 from guilds where id='${g.guild.id}'`);
    expect(left.rows).toHaveLength(0);
    await expect(leaveGuild(db, uid(80))).resolves.toBeUndefined(); // idempotent
  });
});

describe('login tracking', () => {
  const ev = (event: 'otp_requested' | 'login_failed' | 'login_success', email = 'a@b.co', ip: string | null = '203.0.113.7', userId: string | null = null) => ({ email, event, ip, userAgent: 'UA', userId });

  it('records events with ip, user agent and a normalised email, and lists a user\'s history newest first', async () => {
    await recordLoginEvent(db, ev('otp_requested', 'Me@Example.com'), new Date('2026-03-01T10:00:00Z'));
    await recordLoginEvent(db, ev('login_success', 'Me@Example.com', '198.51.100.9', uid(20)), new Date('2026-03-01T10:01:00Z'));
    await recordLoginEvent(db, { ...ev('login_success', 'Me@Example.com', '198.51.100.10', uid(20)) }, new Date('2026-03-02T10:01:00Z'));
    const h = await recentLogins(db, uid(20));
    expect(h.map((x) => x.ip)).toEqual(['198.51.100.10', '198.51.100.9']);
    expect(h[0]).toMatchObject({ event: 'login_success', userAgent: 'UA' });
    const [row] = (await pg.query<{ email: string }>(`select email from login_events where ip='198.51.100.9'`)).rows;
    expect(row!.email).toBe('me@example.com');
  });
  it('rate-limits code requests per email and per IP within 10 minutes', async () => {
    const now = new Date('2026-03-10T10:00:00Z');
    for (let i = 0; i < LIMITS.otpPerEmail; i++) await recordLoginEvent(db, ev('otp_requested', 'spam@x.co', `192.0.2.${i}`), now);
    expect(await isRateLimited(db, 'otp', { email: 'spam@x.co', ip: '192.0.2.200' }, now)).toBe(true);
    expect(await isRateLimited(db, 'otp', { email: 'other@x.co', ip: '192.0.2.200' }, now)).toBe(false);
    for (let i = 0; i < LIMITS.otpPerIp; i++) await recordLoginEvent(db, ev('otp_requested', `u${i}@x.co`, '192.0.2.99'), now);
    expect(await isRateLimited(db, 'otp', { email: 'fresh@x.co', ip: '192.0.2.99' }, now)).toBe(true);
    expect(await isRateLimited(db, 'otp', { email: 'spam@x.co', ip: null }, new Date(now.getTime() + 11 * 60_000))).toBe(false); // window expired
  });
  it('rate-limits wrong-code attempts (brute force) separately', async () => {
    const now = new Date('2026-03-11T10:00:00Z');
    for (let i = 0; i < LIMITS.failedPerEmail; i++) await recordLoginEvent(db, ev('login_failed', 'victim@x.co', `192.0.2.${100 + i}`), now);
    expect(await isRateLimited(db, 'verify', { email: 'victim@x.co', ip: '192.0.2.250' }, now)).toBe(true);
    expect(await isRateLimited(db, 'otp', { email: 'victim@x.co', ip: '192.0.2.250' }, now)).toBe(false);
  });
  it('purges events past the retention window', async () => {
    await recordLoginEvent(db, ev('login_success', 'old@x.co', '192.0.2.1', uid(21)), new Date('2025-01-01T00:00:00Z'));
    await purgeOldEvents(db, 90, new Date('2026-03-10T00:00:00Z'));
    const r = await pg.query(`select 1 from login_events where email='old@x.co'`);
    expect(r.rows).toHaveLength(0);
  });
  it('keeps the audit row (user nulled) when an account is deleted', async () => {
    await recordLoginEvent(db, ev('login_success', 'gone@x.co', '192.0.2.5', uid(22)), T0);
    await pg.exec(`delete from auth.users where id='${uid(22)}'`);
    const r = await pg.query<{ user_id: string | null }>(`select user_id from login_events where email='gone@x.co'`);
    expect(r.rows).toHaveLength(1); expect(r.rows[0]!.user_id).toBeNull();
  });
});

describe('client ip extraction', () => {
  const h = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null });
  it('prefers the platform header, takes the first hop, and strips ports/brackets', () => {
    expect(getClientIp(h({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }))).toBe('203.0.113.5');
    expect(getClientIp(h({ 'x-vercel-forwarded-for': '198.51.100.1', 'x-forwarded-for': '1.1.1.1' }))).toBe('198.51.100.1');
    expect(getClientIp(h({ 'x-forwarded-for': '203.0.113.5:4711' }))).toBe('203.0.113.5');
    expect(getClientIp(h({ 'x-forwarded-for': '[2001:db8::1]:443' }))).toBe('2001:db8::1');
    expect(getClientIp(h({ 'x-real-ip': '2001:db8::2' }))).toBe('2001:db8::2');
  });
  it('rejects garbage and missing headers', () => {
    expect(getClientIp(h({ 'x-forwarded-for': "1.1.1.1'; drop table" }))).toBeNull();
    expect(getClientIp(h({ 'x-forwarded-for': 'not-an-ip' }))).toBeNull();
    expect(getClientIp(h({}))).toBeNull();
    expect(cleanUserAgent('x'.repeat(500))).toHaveLength(300);
    expect(cleanUserAgent(null)).toBeNull();
  });
});

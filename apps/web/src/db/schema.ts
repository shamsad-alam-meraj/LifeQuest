import { sql } from 'drizzle-orm';
import { bigserial, index, integer, jsonb, pgTable, primaryKey, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

/**
 * user_id columns reference Supabase's auth.users. Those foreign keys live in the hand-written
 * migration drizzle/0001_auth_foreign_keys.sql (Drizzle must not try to create Supabase's own tables).
 */
const now = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const gameSaves = pgTable('game_saves', {
  userId: uuid('user_id').primaryKey(),
  state: jsonb('state').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const profiles = pgTable('profiles', {
  userId: uuid('user_id').primaryKey(),
  displayName: text('display_name').notNull(),
  level: integer('level').notNull().default(1),
  totalXp: integer('total_xp').notNull().default(0),
  streak: integer('streak').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const guilds = pgTable('guilds', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  ownerId: uuid('owner_id').notNull(),
  createdAt: now(),
}).enableRLS();

/** One guild per player (user_id is the primary key). */
export const guildMembers = pgTable('guild_members', {
  userId: uuid('user_id').primaryKey(),
  guildId: uuid('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('guild_members_guild_idx').on(t.guildId)]).enableRLS();

export const guildMissions = pgTable('guild_missions', {
  id: uuid('id').primaryKey().defaultRandom(),
  guildId: uuid('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
  week: text('week').notNull(),
  title: text('title').notNull(),
  target: integer('target').notNull(),
  progress: integer('progress').notNull().default(0),
}, (t) => [unique('guild_missions_guild_week').on(t.guildId, t.week)]).enableRLS();

export const guildContributions = pgTable('guild_contributions', {
  missionId: uuid('mission_id').notNull().references(() => guildMissions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  amount: integer('amount').notNull().default(0),
}, (t) => [primaryKey({ columns: [t.missionId, t.userId] })]).enableRLS();

/** Append-only audit trail of authentication activity. user_id is kept (nulled) if the account is deleted. */
export const loginEvents = pgTable('login_events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id'),
  email: text('email').notNull(),
  event: text('event').notNull(), // otp_requested | otp_blocked | login_success | login_failed | logout
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (t) => [
  index('login_events_ip_idx').on(t.ip, t.createdAt),
  index('login_events_email_idx').on(t.email, t.createdAt),
  index('login_events_user_idx').on(t.userId, t.createdAt),
]).enableRLS();

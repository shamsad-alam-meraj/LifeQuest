import { and, count, desc, eq, gte, lt } from 'drizzle-orm';
import { loginEvents } from '../db/schema';
import type { LoginEntry } from '../lib/types';
import type { DB } from './types';

export type LoginEventType = 'otp_requested' | 'otp_blocked' | 'login_success' | 'login_failed' | 'login_blocked' | 'logout';

/** Raw IPs and user agents are kept for this long, then deleted. */
export const RETENTION_DAYS = 90;
const WINDOW_MS = 10 * 60 * 1000;
export const LIMITS = {
  otpPerEmail: 5, otpPerIp: 20, // code requests per 10 min
  failedPerEmail: 8, failedPerIp: 15, // wrong codes per 10 min
};

export interface EventInput { userId?: string | null; email: string; event: LoginEventType; ip: string | null; userAgent: string | null }

export async function recordLoginEvent(db: DB, e: EventInput, now = new Date()): Promise<void> {
  await db.insert(loginEvents).values({ userId: e.userId ?? null, email: e.email.toLowerCase().slice(0, 254), event: e.event, ip: e.ip, userAgent: e.userAgent, createdAt: now });
  if (Math.random() < 0.02) await purgeOldEvents(db, RETENTION_DAYS, now); // opportunistic retention, no cron needed
}

export async function purgeOldEvents(db: DB, days = RETENTION_DAYS, now = new Date()): Promise<void> {
  await db.delete(loginEvents).where(lt(loginEvents.createdAt, new Date(now.getTime() - days * 86_400_000)));
}

async function countSince(db: DB, event: LoginEventType, by: { email?: string; ip?: string | null }, now: Date): Promise<number> {
  const col = by.email ? loginEvents.email : loginEvents.ip;
  const val = by.email ? by.email.toLowerCase() : by.ip;
  if (!val) return 0;
  const [r] = await db.select({ n: count() }).from(loginEvents).where(and(eq(col, val), eq(loginEvents.event, event), gte(loginEvents.createdAt, new Date(now.getTime() - WINDOW_MS))));
  return r?.n ?? 0;
}

/** DB-backed throttle for code requests ('otp') and wrong-code attempts ('verify'), per email and per IP. */
export async function isRateLimited(db: DB, kind: 'otp' | 'verify', who: { email: string; ip: string | null }, now = new Date()): Promise<boolean> {
  const event: LoginEventType = kind === 'otp' ? 'otp_requested' : 'login_failed';
  const [maxEmail, maxIp] = kind === 'otp' ? [LIMITS.otpPerEmail, LIMITS.otpPerIp] : [LIMITS.failedPerEmail, LIMITS.failedPerIp];
  if ((await countSince(db, event, { email: who.email }, now)) >= maxEmail) return true;
  return (await countSince(db, event, { ip: who.ip }, now)) >= maxIp;
}

export async function recentLogins(db: DB, userId: string, limit = 10): Promise<LoginEntry[]> {
  const rows = await db.select().from(loginEvents).where(and(eq(loginEvents.userId, userId))).orderBy(desc(loginEvents.createdAt), desc(loginEvents.id)).limit(limit);
  return rows.map((r) => ({ event: r.event, ip: r.ip, userAgent: r.userAgent, at: r.createdAt.toISOString() }));
}

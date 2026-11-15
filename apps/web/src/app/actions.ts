'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { getDb } from '../db/client';
import { createClient, getSessionUser } from '../lib/supabase';
import type { GuildOverview, LoginEntry, Result } from '../lib/types';
import { AppError } from '../server/errors';
import { loadSave, saveGame } from '../server/game';
import { createGuild, guildOverview, joinGuild, leaveGuild } from '../server/guild';
import { cleanUserAgent, getClientIp } from '../server/ip';
import { sendLoginEmail } from '../server/authEmail';
import { isRateLimited, recentLogins, recordLoginEvent, type LoginEventType } from '../server/loginEvents';
import type { DB } from '../server/types';
import type { GameState } from '@lifequest/core';

const Email = z.string().trim().toLowerCase().email().max(254);
const Code = z.string().trim().regex(/^\d{4,10}$/);

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try { return { ok: true, data: await fn() }; }
  catch (e) {
    if (e instanceof AppError) return { ok: false, error: e.message };
    console.error('[action]', e);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}

/** Where the email link should land. Supabase only honours it if it is in the project's Redirect URLs allow-list. */
async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

async function requestInfo() {
  const h = await headers();
  return { ip: getClientIp(h), userAgent: cleanUserAgent(h.get('user-agent')) };
}

/** Login tracking is mandatory by default: without a database there is nowhere to record sign-ins, so sign-in is refused. */
const trackingRequired = () => process.env.LOGIN_TRACKING !== 'optional';
function requireTrackingDb(db: DB | null) {
  if (!db && trackingRequired()) throw new AppError('Sign-in is temporarily unavailable. Please try again later.', 'unavailable');
}

/** Audit logging must never take authentication down once it is running, so failures are logged and swallowed. */
async function track(db: DB | null, e: { email: string; event: LoginEventType; userId?: string | null }) {
  if (!db) return;
  try { await recordLoginEvent(db, { ...e, ...(await requestInfo()) }); }
  catch (err) { console.error('[login-tracking] failed to record event', e.event, err); }
}

async function rateLimited(db: DB | null, kind: 'otp' | 'verify', email: string): Promise<boolean> {
  if (!db) return false;
  try { return await isRateLimited(db, kind, { email, ip: (await requestInfo()).ip }); }
  catch (err) { console.error('[rate-limit] check failed', err); return false; }
}

/* ---------------------------- authentication ---------------------------- */

export async function sendCodeAction(rawEmail: string): Promise<Result<null>> {
  return run(async () => {
    const parsed = Email.safeParse(rawEmail);
    if (!parsed.success) throw new AppError('Enter a valid email address.');
    const email = parsed.data;
    const supabase = await createClient();
    if (!supabase) throw new AppError('Sign-in is not configured on this site.', 'unavailable');
    const db = getDb();
    requireTrackingDb(db);

    if (await rateLimited(db, 'otp', email)) {
      await track(db, { email, event: 'login_blocked' });
      throw new AppError('Too many attempts. Please wait a few minutes and try again.', 'rate_limited');
    }
    await track(db, { email, event: 'otp_requested' });

    // Preferred: send the email ourselves over SMTP (needs SMTP_* and SUPABASE_SECRET_KEY). Otherwise Supabase sends it.
    try { if (await sendLoginEmail(email, await siteOrigin())) return null; }
    catch (e) { console.error('[auth] SMTP sign-in email failed:', e); throw new AppError('Could not send the code. Please try again.'); }

    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: `${await siteOrigin()}/auth/confirm` } });
    if (error) {
      console.error('[auth] signInWithOtp failed:', error.status, error.code, error.message); // visible in the server log / Vercel logs
      if (error.code === 'over_email_send_rate_limit' || error.status === 429)
        throw new AppError('Too many sign-in emails were requested. Please wait a while and use the most recent email you received.', 'rate_limited');
      if (error.code === 'email_address_not_authorized')
        throw new AppError('Sign-in emails can’t be sent to this address yet because the site’s email provider isn’t fully set up.', 'unavailable');
      throw new AppError('Could not send the code. Please try again.');
    }
    return null;
  });
}

export async function verifyCodeAction(rawEmail: string, rawCode: string): Promise<Result<{ email: string }>> {
  return run(async () => {
    const e = Email.safeParse(rawEmail), c = Code.safeParse(rawCode);
    if (!e.success || !c.success) throw new AppError('That code is invalid or has expired.');
    const email = e.data;
    const supabase = await createClient();
    if (!supabase) throw new AppError('Sign-in is not configured on this site.', 'unavailable');
    const db = getDb();
    requireTrackingDb(db);

    if (await rateLimited(db, 'verify', email)) {
      await track(db, { email, event: 'login_blocked' });
      throw new AppError('Too many wrong codes. Please wait a few minutes and request a new code.', 'rate_limited');
    }
    const { data, error } = await supabase.auth.verifyOtp({ email, token: c.data, type: 'email' });
    if (error || !data.user) {
      await track(db, { email, event: 'login_failed' });
      throw new AppError('That code is invalid or has expired.');
    }
    await track(db, { email, event: 'login_success', userId: data.user.id });
    return { email };
  });
}

export async function signOutAction(): Promise<Result<null>> {
  return run(async () => {
    const user = await getSessionUser();
    const supabase = await createClient();
    if (user) await track(getDb(), { email: user.email, event: 'logout', userId: user.id });
    await supabase?.auth.signOut();
    return null;
  });
}

/* ------------------------------- game data ------------------------------- */

async function authed(): Promise<{ userId: string; db: DB }> {
  const user = await getSessionUser();
  if (!user) throw new AppError('Please sign in.', 'forbidden');
  const db = getDb();
  if (!db) throw new AppError('Cloud sync is not configured on this site.', 'unavailable');
  return { userId: user.id, db }; // identity always comes from the verified session, never from client input
}

export const loadSaveAction = async (): Promise<Result<GameState | null>> => run(async () => { const { userId, db } = await authed(); return loadSave(db, userId); });
export const saveGameAction = async (state: unknown): Promise<Result<string>> => run(async () => { const { userId, db } = await authed(); return saveGame(db, userId, state); });
export const guildAction = async (): Promise<Result<GuildOverview | null>> => run(async () => { const { userId, db } = await authed(); return guildOverview(db, userId); });
export const createGuildAction = async (name: string): Promise<Result<GuildOverview>> => run(async () => { const { userId, db } = await authed(); return createGuild(db, userId, String(name)); });
export const joinGuildAction = async (code: string): Promise<Result<GuildOverview>> => run(async () => { const { userId, db } = await authed(); return joinGuild(db, userId, String(code)); });
export const leaveGuildAction = async (): Promise<Result<null>> => run(async () => { const { userId, db } = await authed(); await leaveGuild(db, userId); return null; });
export const recentLoginsAction = async (): Promise<Result<LoginEntry[]>> => run(async () => { const { userId, db } = await authed(); return recentLogins(db, userId, 10); });

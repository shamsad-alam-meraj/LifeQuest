import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '../../../db/client';
import { createClient } from '../../../lib/supabase';
import { cleanUserAgent, getClientIp } from '../../../server/ip';
import { recordLoginEvent } from '../../../server/loginEvents';
import { safeNextPath, type LinkError } from '../../../server/redirect';

const TYPES = new Set<EmailOtpType>(['email', 'magiclink', 'signup']);

/**
 * Landing point for the sign-in link in the email. Supports both link styles:
 *  - ?token_hash=…&type=email  (works in any browser/device; recommended email template)
 *  - ?code=…                   (PKCE, from Supabase's default link; must be opened in the same browser)
 * On success the session cookie is set and the sign-in is logged like a code login.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const fail = (e: LinkError) => NextResponse.redirect(new URL(`/login?error=${e}`, url.origin));
  const next = safeNextPath(url.searchParams.get('next'));
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const code = url.searchParams.get('code');

  const supabase = await createClient();
  const db = getDb();
  if (!supabase) return fail('unavailable');
  if (!db && process.env.LOGIN_TRACKING !== 'optional') return fail('unavailable');

  let userId: string | null = null, email = '(link)';
  let error: { message: string } | null = null;

  if (tokenHash && type && TYPES.has(type)) {
    const r = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    error = r.error; userId = r.data.user?.id ?? null; email = r.data.user?.email ?? email;
  } else if (code) {
    const r = await supabase.auth.exchangeCodeForSession(code);
    error = r.error; userId = r.data.user?.id ?? null; email = r.data.user?.email ?? email;
  } else {
    return fail('link');
  }

  if (db) {
    try { await recordLoginEvent(db, { email, userId, event: error || !userId ? 'login_failed' : 'login_success', ip: getClientIp(request.headers), userAgent: cleanUserAgent(request.headers.get('user-agent')) }); }
    catch (e) { console.error('[login-tracking] link login', e); }
  }
  if (error || !userId) return fail(/code verifier/i.test(error?.message ?? '') ? 'browser' : 'link');
  return NextResponse.redirect(new URL(next, url.origin));
}

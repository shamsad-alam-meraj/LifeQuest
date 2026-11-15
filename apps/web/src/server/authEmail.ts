import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient } from '../lib/supabaseAdmin';
import { buildLoginEmail, sendMail, smtpConfig, type Mail, type SmtpConfig } from './mailer';

export interface AuthEmailDeps {
  admin: Pick<SupabaseClient, 'auth'> | null;
  smtp: SmtpConfig | null;
  send: (mail: Mail, config: SmtpConfig) => Promise<void>;
}

const real = (): AuthEmailDeps => ({ admin: adminClient(), smtp: smtpConfig(), send: (m, c) => sendMail(m, c) });

/**
 * Sends the sign-in email (code + link) ourselves over SMTP.
 * Supabase generates the one-time code without emailing it; we deliver it. Verification is unchanged
 * (supabase.auth.verifyOtp), so sessions, tracking and rate limiting behave exactly as before.
 * Returns false when SMTP or the secret key is not configured so the caller can fall back to Supabase's own email.
 */
export async function sendLoginEmail(email: string, origin: string, deps: AuthEmailDeps = real()): Promise<boolean> {
  const { admin, smtp, send } = deps;
  if (!admin || !smtp) return false;

  const generate = () => admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: `${origin}/auth/confirm` } });
  let res = await generate();
  if (res.error && /not.?found/i.test(`${res.error.code ?? ''} ${res.error.message}`)) {
    const created = await admin.auth.admin.createUser({ email, email_confirm: true }); // first-time sign-in creates the account
    if (created.error && !/already|exists|registered/i.test(created.error.message)) throw created.error;
    res = await generate();
  }
  const props = res.data?.properties;
  if (res.error || !props?.email_otp || !props.hashed_token) throw res.error ?? new Error('Supabase returned no sign-in code');

  const link = `${origin}/auth/confirm?token_hash=${encodeURIComponent(props.hashed_token)}&type=email`;
  await send({ to: email, ...buildLoginEmail({ code: props.email_otp, link }) }, smtp);
  return true;
}

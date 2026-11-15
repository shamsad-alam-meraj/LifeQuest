import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Login } from '../../features/auth/Login';
import { getDb } from '../../db/client';
import { getSessionUser, supabaseConfig } from '../../lib/supabase';
import { LINK_ERRORS, type LinkError } from '../../server/redirect';

export const metadata: Metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (await getSessionUser()) redirect('/app');
  const e = process.env;
  const otpLength = Number(e.OTP_LENGTH ?? e.NEXT_PUBLIC_OTP_LENGTH ?? e.VITE_OTP_LENGTH) || 8; // Supabase's current default Email OTP Length
  return <Login authEnabled={!!supabaseConfig() && (!!getDb() || process.env.LOGIN_TRACKING === 'optional')} otpLength={otpLength} initialError={error && error in LINK_ERRORS ? LINK_ERRORS[error as LinkError] : ''} />;
}

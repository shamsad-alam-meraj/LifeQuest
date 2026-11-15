import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Login } from '../../features/auth/Login';
import { getDb } from '../../db/client';
import { getSessionUser, supabaseConfig } from '../../lib/supabase';
import { LINK_ERRORS, type LinkError } from '../../server/redirect';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (await getSessionUser()) redirect('/app');
  return <Login authEnabled={!!supabaseConfig() && (!!getDb() || process.env.LOGIN_TRACKING === 'optional')} initialError={error && error in LINK_ERRORS ? LINK_ERRORS[error as LinkError] : ''} />;
}

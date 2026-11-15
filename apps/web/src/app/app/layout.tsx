import type { Metadata } from 'next';
import { getDb } from '../../db/client';
import { AppShell } from '../../features/AppShell';
import { getSessionUser, supabaseConfig } from '../../lib/supabase';

export const metadata: Metadata = { title: 'Your quest', robots: { index: false } };
export const dynamic = 'force-dynamic';

/** Runs once per visit to /app (layouts are not re-rendered on tab changes), so tab switches don't re-query Supabase. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <AppShell user={user} cloudEnabled={!!supabaseConfig() && !!getDb()}>
      {children}
    </AppShell>
  );
}

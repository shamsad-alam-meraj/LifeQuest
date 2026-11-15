import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Accepts the Next.js names and the earlier Vite names so existing env files keep working. */
export function supabaseConfig(): { url: string; key: string } | null {
  const e = process.env;
  const url = e.NEXT_PUBLIC_SUPABASE_URL ?? e.SUPABASE_URL ?? e.VITE_SUPABASE_URL;
  const key = e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? e.SUPABASE_PUBLISHABLE_KEY ?? e.VITE_SUPABASE_PUBLISHABLE_KEY ?? e.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? e.VITE_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

/** Server-side Supabase client bound to the request's cookies (session lives in httpOnly cookies, not localStorage). */
export async function createClient() {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const store = await cookies();
  return createServerClient(cfg.url, cfg.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* called from a Server Component: the proxy refreshes the session instead */ }
      },
    },
  });
}

export interface SessionUser { id: string; email: string }

/** The verified signed-in user (validated against Supabase Auth, not just decoded from the cookie), or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return data.user?.email ? { id: data.user.id, email: data.user.email } : null;
  } catch { return null; }
}

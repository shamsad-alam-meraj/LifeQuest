import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './supabase';

/**
 * Privileged Supabase client (server only). Needs the project's SECRET key (Project Settings > API Keys > Secret keys,
 * `sb_secret_...`, or the legacy service_role key). Never expose it to the browser: no NEXT_PUBLIC_ prefix.
 * Used only to generate sign-in codes so we can email them ourselves over SMTP.
 */
export function adminClient(env: Record<string, string | undefined> = process.env): SupabaseClient | null {
  const cfg = supabaseConfig();
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!cfg || !key) return null;
  return createClient(cfg.url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

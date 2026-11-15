import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | null | undefined;

/** Lazy singleton. Null when DATABASE_URL is not configured, so the app still runs as a guest app. */
export function getDb(): Db | null {
  if (cached !== undefined) return cached;
  const url = process.env.DATABASE_URL;
  if (!url || url.includes('[YOUR-PASSWORD]')) return (cached = null);
  // prepare:false is required for Supabase's transaction-mode pooler (port 6543)
  const client = postgres(url, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 });
  return (cached = drizzle(client, { schema }));
}

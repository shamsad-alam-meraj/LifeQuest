// Applies pending Drizzle migrations. Runs before `next build` on Vercel production deploys (see package.json "vercel-build").
// Fails the build loudly if a migration fails, so code that needs a new schema is never deployed against the old one.
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { decide } from './migrate-lib.mjs';

const d = decide(process.env);
if (!d.run) {
  console.log(`[migrate] skipped: ${d.reason}`);
  if (d.warn) console.warn('[migrate] warning: no database configured, so no migrations were applied.');
  process.exit(0);
}

console.log(`[migrate] applying pending migrations (${d.reason})...`);
// prepare:false is required by Supabase's transaction-mode pooler (port 6543)
const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 20, onnotice: () => {} });
try {
  const started = Date.now();
  await migrate(drizzle(client), { migrationsFolder: new URL('../drizzle', import.meta.url).pathname });
  console.log(`[migrate] done in ${Date.now() - started} ms (database is up to date)`);
} catch (err) {
  // never print the connection string; show only the safe parts of the error
  const scrub = (m) => String(m ?? '').split(process.env.DATABASE_URL).join('***');
  const cause = err?.cause ? ` | cause: ${err.cause.code ?? ''} ${scrub(err.cause.message)}` : '';
  console.error(`[migrate] FAILED: ${err?.code ?? ''} ${scrub(err?.message ?? err)}${cause}`);
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}

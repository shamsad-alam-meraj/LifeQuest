/**
 * Decides whether this build should apply database migrations.
 * Production deploys migrate automatically; preview deploys never touch the database unless opted in,
 * and a missing DATABASE_URL skips (the app then runs without cloud features) instead of failing the build.
 */
export function decide(env) {
  if (env.SKIP_MIGRATIONS === '1' || env.SKIP_MIGRATIONS === 'true') return { run: false, reason: 'SKIP_MIGRATIONS is set' };
  const url = env.DATABASE_URL;
  if (!url || url.includes('[YOUR-PASSWORD]')) return { run: false, reason: 'DATABASE_URL is not set', warn: true };
  const target = env.VERCEL_ENV; // production | preview | development (set by Vercel; unset locally and in CI)
  if (!target) return { run: false, reason: 'not a Vercel build (run `npm run db:migrate` manually)' };
  if (target === 'production') return { run: true, reason: 'production deploy' };
  if (env.MIGRATE_ON_PREVIEW === 'true') return { run: true, reason: `${target} deploy with MIGRATE_ON_PREVIEW=true` };
  return { run: false, reason: `${target} deploy (previews never migrate; set MIGRATE_ON_PREVIEW=true to opt in)` };
}

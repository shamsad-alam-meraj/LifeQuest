// Checks where Supabase will send email-link clicks, without sending any email.
// Usage: npm run check:auth [-w @lifequest/web] [-- https://your-site]
// It calls Supabase's /auth/v1/verify with a bogus token and reads the redirect target: Supabase only honours our
// redirect_to when it is on the "Redirect URLs" allow-list, otherwise it falls back to the project's "Site URL".
import { pathToFileURL } from 'node:url';

/** Pure decision, exported for tests. */
export function evaluate(location, site) {
  if (!location) return { ok: false, reason: 'Supabase returned no redirect' };
  let got;
  try { got = new URL(location).origin; } catch { return { ok: false, reason: `unreadable redirect: ${location}` }; }
  const want = new URL(site).origin;
  return got === want ? { ok: true, reason: `links go to ${got}` } : { ok: false, reason: `links go to ${got} instead of ${want}`, got, want };
}

async function main() {
  try { process.loadEnvFile(new URL('../.env.local', import.meta.url).pathname); } catch { /* env may come from the shell */ }
  const e = process.env;
  const base = e.NEXT_PUBLIC_SUPABASE_URL ?? e.SUPABASE_URL ?? e.VITE_SUPABASE_URL;
  const key = e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? e.SUPABASE_PUBLISHABLE_KEY ?? e.VITE_SUPABASE_PUBLISHABLE_KEY;
  const site = (process.argv[2] ?? e.NEXT_PUBLIC_SITE_URL ?? 'https://life-quest-io.vercel.app').replace(/\/+$/, '');
  if (!base || !key) { console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (e.g. in apps/web/.env.local).'); process.exit(2); }

  const res = await fetch(`${base}/auth/v1/verify?token=check-only&type=magiclink&redirect_to=${encodeURIComponent(`${site}/auth/confirm`)}`, { redirect: 'manual', headers: { apikey: key } });
  const r = evaluate(res.headers.get('location'), site);
  if (r.ok) { console.log(`PASS: ${r.reason}`); return; }
  console.error(`FAIL: ${r.reason}\n\nIn Supabase > Authentication > URL Configuration:\n  1. Site URL = ${site}\n  2. Redirect URLs: add ${site}/**  (and http://localhost:3000/** for local development)\nThen run this check again.`);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((err) => { console.error('check failed:', err.message); process.exit(2); });

# Testing LifeQuest

## 0. Automated
```bash
npm run verify     # typecheck + all tests + production build
```
56 tests: game engine, AI parsing, exports, and **server logic against an in-memory Postgres (PGlite) running the real Drizzle migrations**: saves + XP anti-cheat, guilds (cap, one-per-player, idempotent missions), login tracking (events, IP parsing, rate limits, retention, audit survives account deletion), RLS enabled on all tables.
These do **not** cover the UI or real Supabase/email, so do the passes below.

## 1. Guest mode (no setup)
```bash
npm run dev        # http://localhost:3000
```
Open `/app` → create a hero → generate a quest → complete it. Everything in the feature table below except sign-in, sync, guilds and "Recent sign-in activity" works as a guest. With no Supabase/DB env vars `/login` explains that sign-in isn't set up.

| Area | Expected |
|---|---|
| Landing `/` | responsive 360 → 1920px, no horizontal scroll |
| Quests | unlock in order; daily cap; re-roll max 2/day |
| Daily / Boss / custom quest | 1.5× / 3× / 0.5× XP |
| Focus timer ⏱ | opens complete dialog afterwards |
| Journey / Journal | gear, insights, full-width heatmap, search |
| Export | PDF + CSV download, also with no data |
| Tabs | switching is instant (no network); browser Back works |

## 2. Real login, sync, guilds and login tracking
Needs the setup in [CLOUD.md](CLOUD.md) (env vars, email template, `npm run db:migrate`).

1. `/login` → enter your email → code arrives → paste it → you land on `/app`. Settings shows your email.
2. **Tracking:** Settings → Profile → *Recent sign-in activity* lists "Code requested" and "Signed in" with your IP and device. Also check the `login_events` table in Supabase (Table editor).
3. **Wrong code:** enter a wrong code: red boxes + message; a `login_failed` row appears. Eight wrong codes in 10 min for one email → "Too many wrong codes".
4. **Code spam:** request a code 6 times quickly → the 6th is blocked (`login_blocked` row).
5. **Sync:** sign in on a second browser with the same email → your hero appears. Complete different quests on each, refresh both: merged, nothing lost.
6. **Guilds:** account A creates a guild and shares the code; account B (another email) joins. Complete quests on both, save (wait ~3 s), refresh the Guild page: mission progress and leaderboard update.
7. **RLS check:** with only the publishable key, `GET {SUPABASE_URL}/rest/v1/game_saves` must return `[]` (or an auth error), never data.
8. **Sign out:** `logout` event recorded; `/app` shows guest mode again.

## 3. Production build locally
```bash
npm run build && npm run start     # http://localhost:3000
```
DevTools → Application → Service Workers is registered; static assets are served from cache.

## 4. Production smoke test (after the Vercel deploy)
1. Landing loads, fonts render, no console errors; `/privacy` loads.
2. Sign in with a real email on desktop **and** a phone.
3. Create + complete a quest, refresh: still there; second device shows it.
4. `login_events` in Supabase shows your **real IP** (not `null`, not a Vercel internal IP).
5. Export a PDF and a CSV. Install the app (browser install icon).

## Troubleshooting
| Symptom | Likely cause |
|---|---|
| `/login` says "Email sign-in isn't set up" | `DATABASE_URL` missing/placeholder (tracking is mandatory) or Supabase vars missing; restart `next dev`/redeploy |
| "Sign-in is temporarily unavailable" | database not configured or unreachable |
| No email arrives at all | Supabase's built-in sender allows ~2/hour: configure SMTP (CLOUD.md). Check spam. Server log shows `[auth] ...failed` with the cause |
| Email has a link, no code | template missing `{{ .Token }}`: edit **Magic Link and Confirm signup** templates (see CLOUD.md) |
| Clicking the email link doesn't sign me in | `http://localhost:3000/**` (or your domain) missing from Supabase Redirect URLs, or the link was opened in a different browser (use the `token_hash` template) |
| "Too many attempts" | our rate limit (10 min window) or Supabase's email limit → custom SMTP |
| `db:migrate` hangs/fails | pooler blocked or wrong password (URL-encode special characters) → paste the SQL files in the SQL editor |
| IP column empty | self-hosted without a proxy setting `x-forwarded-for` |
| "Bus error" from vite/vitest/next | corrupted native download → `rm -rf node_modules package-lock.json && npm install` |

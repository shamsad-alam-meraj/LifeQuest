# Deploying to Vercel

## 1. Environment variables
There is **no `.env` in the repo** (git-ignored). Template: `apps/web/.env.example`.

**Locally:** `apps/web/.env.local` (inside `apps/web/`, next to `next.config.ts`):
```bash
cp apps/web/.env.example apps/web/.env.local   # then edit
```

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | for login/sync/guilds | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | for login/sync/guilds | the publishable key (`sb_publishable_…`). Never the secret/`service_role` key |
| `DATABASE_URL` | for login/sync/guilds | **Transaction pooler** string (port 6543) with your DB password. **Server-only: never prefix with `NEXT_PUBLIC_`.** Mark it *Sensitive* in Vercel |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SUPABASE_SECRET_KEY` | optional | send sign-in emails over your own SMTP (see CLOUD.md). All five are needed; mark `SMTP_PASS` and `SUPABASE_SECRET_KEY` *Sensitive* |
| `OTP_LENGTH` | no | must match Supabase "Email OTP Length" (default 6) |
| `LOGIN_TRACKING` | no | `optional` disables the "tracking is mandatory" rule (not recommended) |

Without `DATABASE_URL` sign-in is disabled (login tracking is mandatory) and the app runs as a guest app.
The old `VITE_SUPABASE_*` names are still read as a fallback.

## 2. Deploy
1. Push to GitHub → Vercel → **Add New → Project** → import.
2. **Root Directory: `apps/web`** (keep *Include source files outside of the Root Directory* enabled: the shared `packages/*` live at the repo root). Framework preset: Next.js (auto).
3. **Node.js 22.x** (Project Settings → General). Node 20 works but Supabase's SDK has deprecated it.
4. Add the env vars above for **Production and Preview**. Env changes need a **redeploy**.
5. Run the migrations against the production database **once**: `npm run db:migrate` from your machine with the production `DATABASE_URL` (or paste the SQL files from `apps/web/drizzle/` into the Supabase SQL editor).
6. Deploy.

## 3. Supabase settings
- *Authentication → URL Configuration*: Site URL = your Vercel URL; add preview/custom domains to Redirect URLs.
- *Email Templates → Magic Link* contains `{{ .Token }}`.
- Custom **SMTP** (Resend/Brevo free tiers): the default sender is limited to a few emails per hour.

## 4. After deploy
Run the "Production smoke test" in [TESTING.md](TESTING.md).

## Notes
- Real routes: `/` (landing), `/login`, `/app/*`, `/privacy`. No rewrites needed.
- The service worker caches static assets only (never pages: they can contain account data), so a cold start offline needs a network.
- IP logging: Vercel sets `x-forwarded-for` itself, so the recorded IP is trustworthy there.

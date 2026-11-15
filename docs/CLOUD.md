# Database, auth & guilds (Next.js + Drizzle + Supabase)

Everything cloud-related is optional. With no env vars the app is a fully working guest app (progress saved in the browser).

## What lives where
| Concern | Implementation |
|---|---|
| Passwordless login | Supabase Auth email one-time codes, called from **server actions** (`apps/web/src/app/actions.ts`). The session is an httpOnly cookie managed by `@supabase/ssr`; `src/proxy.ts` refreshes it. |
| Data access | **Drizzle ORM** over `postgres` → Supabase's transaction pooler (`DATABASE_URL`). Schema: `apps/web/src/db/schema.ts`. Migrations: `apps/web/drizzle/`. |
| Business logic | `apps/web/src/server/*` (save/validate, guilds, login tracking). Takes the DB as a parameter, so it is tested against an in-memory Postgres (PGlite) with the real migrations. |
| Game rules | `packages/core` (framework-free; also used server-side to verify saves). |

## One-time setup
1. **Auth** (Supabase dashboard): *Authentication → Providers → Email* enabled. The sign-in screen accepts any 6 to 10 digit code, so *Email OTP Length* needs no matching app setting (Supabase's default is 8).
   - **Email templates**: edit **both** *Magic Link* (existing users) **and** *Confirm signup* (first-time users: our login creates accounts on first use). Without `{{ .Token }}` the email has only a link and no code. Recommended body, which supports both the code and a working link:
     ```html
     <h2>Your LifeQuest sign-in code</h2>
     <p>Enter this code on the sign-in page:</p>
     <p style="font-size:28px;letter-spacing:6px"><b>{{ .Token }}</b></p>
     <p>Or <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">click here to sign in</a> (works on any device).</p>
     ```
     (In the *Confirm signup* template use `&type=signup`.)
   - After saving these, run `npm run check:auth`: it asks Supabase where links will go (no email is sent) and prints PASS or FAIL.
   - **Redirect URLs** (*Authentication → URL Configuration*): set *Site URL* to your production URL and add `http://localhost:3000/**` plus your Vercel preview/production domains to *Redirect URLs*. The link in the email goes to `/auth/confirm` on the site that requested the code; Supabase ignores redirect targets that aren't on this list.
   - Both styles are handled by `/auth/confirm`: `token_hash` links work in any browser; Supabase's default `ConfirmationURL` links (PKCE) must be opened in the **same browser** that requested the code.
   - **Sending the emails yourself (recommended; removes Supabase's ~2 emails/hour limit).** Two options:
     1. *No code:* Supabase → *Authentication → Emails → SMTP Settings* → enable custom SMTP and enter your provider's host, port, user, password and sender. (Gmail: `smtp.gmail.com`, port 465, an App Password.)
     2. *In the app:* set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` **and** `SUPABASE_SECRET_KEY` (Supabase → Project Settings → API Keys → *Secret keys*). The server then asks Supabase to *generate* the one-time code (no email), emails it over your SMTP with a branded template (code + one-click link), and verification is unchanged. If any of the five is missing, the app falls back to Supabase's own email. The secret key is powerful and server-only: store it as a *Sensitive* env var, never with a `NEXT_PUBLIC_` prefix. The login rate limits above still apply, since Supabase's own email limits no longer protect you.
2. **Database password**: *Project Settings → Database* (reset it if you don't know it). Put it in `apps/web/.env.local` as `DATABASE_URL` using the **Transaction pooler** string (port 6543). URL-encode special characters in the password.
3. **Create the tables**:
   ```bash
   npm run db:migrate
   ```
   If your network blocks the pooler, paste `apps/web/drizzle/0000_*.sql` then `0001_auth_foreign_keys.sql` into the Supabase SQL editor, in that order.
4. `npm run dev`.

Changing the schema: edit `src/db/schema.ts` → `npm run db:generate` → commit the new SQL → merge to `main`. Production deploys apply pending migrations automatically (see [DEPLOY.md](DEPLOY.md)); locally use `npm run db:migrate`.

## Tables
`game_saves`, `profiles` (leaderboard stats), `guilds`, `guild_members` (one guild per player), `guild_missions`, `guild_contributions`, `login_events` (audit log).

## Security model
- **Row-level security is enabled on every table with no policies.** The browser-visible publishable key therefore cannot read or write anything through Supabase's REST API. Only our server (which connects with the database role) touches data.
- Because the server bypasses RLS, **authorization is in code**: every action takes the user id from the verified session (`supabase.auth.getUser()`), never from request input.
- Saves are validated (zod), size-capped (1.5 MB), stripped of unknown fields, throttled (1/s), and **quest/skill XP is recomputed server-side**; leaderboard level/XP/streak are derived from the verified save, not client-reported.
- **Guild missions** have no "contribute" endpoint to replay: a member's weekly contribution is computed on each save from quests completed this ISO week *after joining*, idempotent and capped at 50.
- Guild joins lock the guild row (`FOR UPDATE`) so the 30-member cap can't be raced.

## Login tracking
Every sign-in attempt writes a `login_events` row: `otp_requested`, `login_success`, `login_failed`, `login_blocked`, `logout`, with **email, user id (when known), IP address, user agent, timestamp**.
- IP comes from `x-vercel-forwarded-for` / `x-forwarded-for` / `x-real-ip` (validated as a real IP). On Vercel these are set by the platform. **If you self-host, put the app behind a proxy that overwrites them, or clients can spoof their IP.**
- Used for **rate limiting**: max 5 code requests per email and 20 per IP per 10 min; max 8 wrong codes per email and 15 per IP per 10 min.
- Users see their own last 10 events (with IP and device) in *Settings → Profile → Recent sign-in activity*.
- **Retention: 90 days**, purged opportunistically on writes. `/privacy` discloses this. IP addresses are personal data under GDPR/UK-GDPR: keep the notice accurate and honor deletion requests (deleting a Supabase user nulls `user_id` on their rows; delete by email to remove them fully).
- **Mandatory by default**: if `DATABASE_URL` is missing, sign-in is refused (`LOGIN_TRACKING=optional` turns this off for experiments). If a single write fails while the database is up, the login still succeeds and the error is logged.

## Honest limits
- Quest completion is still honor-system; the server bounds what a cheater can gain (XP clamped, contributions capped) but cannot know a quest really happened in real life.
- Reminders fire only while the app/PWA is open (no push server).
- Free-tier Supabase projects pause after a week of inactivity.

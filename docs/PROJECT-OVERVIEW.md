# LifeQuest: project overview

A one-page summary for reviewers, recruiters and contributors.

## The problem
Habit trackers count checkmarks and gamified apps keep you inside the app. LifeQuest asks: *can a game push people out into their real lives instead?*

## The solution
An AI Game Master converts a real goal into an adventure of concrete 10-90 minute offline quests. Players log what they actually did; the game turns that into XP, skill levels, streaks and achievements, with guilds and weekly co-op missions on top. Rewards are capped per day on purpose.

## At a glance
| | |
|---|---|
| Type | Full-stack web app, open source (MIT), free-tier infrastructure |
| Languages | TypeScript throughout (~4,200 lines across 3 workspaces) |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, accessible, responsive 360px → ultrawide |
| Backend | Next.js server actions, Drizzle ORM, Supabase Postgres and Auth |
| Testing | 58 automated tests, including integration tests against an in-memory Postgres (PGlite) running the real migrations |
| Deploy | Vercel + Supabase, env-driven; runs as a guest app with zero configuration |

## Architecture
```
Browser (React)  ──server actions──►  Next.js server  ──Drizzle──►  Supabase Postgres
   │ local-first game state              │ validates + verifies         (RLS on, no policies)
   │ AI calls with the player's key      └─ Supabase Auth (cookie session)
   ▼
@lifequest/core  (pure game rules, shared by client and server)
@lifequest/ai    (providers, prompts, validation, offline fallback)
```
- **Monorepo of three packages.** The game rules live in a framework-free package used by both the UI and the server's save verification.
- **Local-first.** Play works offline as a guest; signed-in players sync, and two devices merge deterministically (union of quests, completed beats active, skill XP recomputed), so no progress is lost.

## Engineering decisions worth discussing
1. **Server-side verification instead of trusting the client.** Saves are schema-validated (zod), size-capped, throttled, and quest/skill XP is recomputed from difficulty and kind. Leaderboard stats are derived from the verified save. Guild mission progress has no "contribute" endpoint to replay: it is computed idempotently from the save and capped.
2. **Defense in depth on the database.** Row-level security is enabled on every table with no policies, so the browser-visible key can read nothing; the server authorises every action from the verified session, never from request input.
3. **Login tracking and abuse prevention.** Every sign-in attempt is logged (time, IP, device) and used for DB-backed rate limiting per email and per IP (code requests and wrong-code attempts). Retention is 90 days, users can see their own history, and a privacy page discloses it. The audit log survives account deletion with the user id nulled.
4. **Testable server code.** Business logic takes the database as a parameter, so the same code runs against Postgres in production and PGlite in tests: guilds (member cap, one-per-player, join races), idempotent contributions, rate limits, retention, and RLS are all covered.
5. **Passwordless auth that works both ways.** One-time code *and* email link (token-hash, any device) are supported; open-redirect-safe `next` handling; CSV export neutralises formula injection.
6. **Performance and privacy in the PWA.** Tab switching uses `history.pushState` (instant, no server round trip); the service worker caches static assets only, never pages that could contain account data; jsPDF is loaded on demand.
7. **Honest trade-offs.** Quest completion is honour-system by nature (the server bounds what a cheater can gain but cannot know a quest happened). Documented in `docs/CLOUD.md`.

## Résumé bullets (adapt to your role)
- Built **LifeQuest**, a full-stack gamified life-progression platform (Next.js 16, React 19, TypeScript, Tailwind v4, Drizzle ORM, Supabase) with AI-generated quests, guilds, passwordless OTP auth and cloud sync, deployed on free tiers.
- Designed server-side save verification (schema validation, XP recomputation, idempotent capped guild contributions) and Postgres row-level security so a public client key exposes no data.
- Implemented DB-backed login auditing and per-email/per-IP rate limiting with 90-day retention and a user-visible sign-in history.
- Shipped a local-first sync model with deterministic multi-device merging; authored 58 tests including PGlite integration tests that run the production migrations.
- Delivered a responsive, accessible UI (phone to ultrawide), installable PWA, and PDF/CSV export.

## Links
- Live demo: _add your Vercel URL_
- Source: _add your GitHub URL_
- Docs: [README](../README.md) · [Architecture](ARCHITECTURE.md) · [Cloud & security](CLOUD.md) · [Deploy](DEPLOY.md) · [Testing](TESTING.md)

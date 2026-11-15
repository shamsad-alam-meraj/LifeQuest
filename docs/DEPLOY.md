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
| `LOGIN_TRACKING` | no | `optional` disables the "tracking is mandatory" rule (not recommended) |

Without `DATABASE_URL` sign-in is disabled (login tracking is mandatory) and the app runs as a guest app.
The old `VITE_SUPABASE_*` names are still read as a fallback.

## 2. Deploy
1. Push to GitHub → Vercel → **Add New → Project** → import.
2. **Root Directory: `apps/web`** (keep *Include source files outside of the Root Directory* enabled: the shared `packages/*` live at the repo root). Framework preset: Next.js (auto).
3. **Node.js**: `apps/web/package.json` declares `"node": ">=22"`, so Vercel uses its newest supported LTS (24.x) automatically. You can also pin it in Project Settings → General. Node 20 is no longer supported by the project.
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

## CI/CD (GitHub Actions)

| Workflow | When | What it does |
|---|---|---|
| `ci.yml` | every PR and push to `main` | **verify**: `npm ci`, typecheck, tests, production build. **vercel-parity**: installs only `apps/web` and builds with no env vars, exactly like Vercel, so a "works locally, fails on Vercel" break is caught before deploy |
| `migrate.yml` | manual only | runs the same migration by hand (e.g. to migrate without deploying); uses the repo secret `DATABASE_URL` |
| `deploy.yml` | optional, off by default | deploys with the Vercel CLI after CI passes |

**Default setup (recommended): Vercel's Git integration is the CD.** Every push to `main` deploys to production and every PR gets a preview. Make CI a gate by turning on branch protection for `main` (*Settings → Branches → Require status checks*: `Typecheck, test, build` and `Build like Vercel`) and merging through pull requests.


**Deploy from Actions instead of Vercel's Git integration** (only deploys after CI is green):
1. Create a Vercel token (Account Settings → Tokens). Run `npx vercel link` once in the repo to get `orgId` and `projectId` from `.vercel/project.json`.
2. Repo secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Repo variable: `VERCEL_CLI_DEPLOY` = `true`.
3. In the Vercel project, disable automatic production deploys from Git (otherwise every push deploys twice).

### Database migrations run on every production deploy
`apps/web/vercel.json` sets the build command to `npm run vercel-build`, which runs `scripts/migrate.mjs` and then `next build`. So each deploy applies any pending Drizzle migrations to the database **before** the new code is built and released.

- **Production only.** Preview deployments never touch the database (set `MIGRATE_ON_PREVIEW=true` to opt in). Local builds and CI never migrate either.
- **Needs `DATABASE_URL` in Vercel for the *Production* environment.** If it is missing the step is skipped with a warning and the app runs without cloud features.
- **A failed migration fails the deploy**, so code that needs a new schema is never released against the old one. The log shows `[migrate] FAILED: ...` (the connection string is never printed).
- It is idempotent: when nothing is pending it connects, finds nothing to do and continues (about 1-2 s).
- Escape hatch: set `SKIP_MIGRATIONS=1` for a deploy.

Workflow for a schema change: edit `src/db/schema.ts` → `npm run db:generate` → commit the new SQL file → merge to `main` → the deploy migrates automatically. Because the migration runs *before* the new code is live (and the old code keeps serving until then), prefer **additive, backwards-compatible** migrations (add columns/tables, backfill, and only drop things in a later release). A destructive migration would break the still-running old code during the deploy window.

### Why the first Vercel deploy failed
Vercel installs only the `apps/web` workspace, so root-only dev dependencies (`vitest`) were missing, and Next's build type-checks every `.ts` file it can see, including `*.test.ts`. Fix: `apps/web/tsconfig.json` now excludes tests from the app build, and `tsconfig.typecheck.json` keeps type-checking them in `npm run typecheck` and CI.

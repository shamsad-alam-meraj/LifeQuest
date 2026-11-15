# ⚔️ LifeQuest

[![CI](https://github.com/shamsad-alam-meraj/LifeQuest/actions/workflows/ci.yml/badge.svg)](https://github.com/shamsad-alam-meraj/LifeQuest/actions/workflows/ci.yml)

**Make real life feel like an adventure worth progressing through.**

LifeQuest is an open-source, AI-powered progression game for real life. Tell it a goal ("run a 5k", "learn guitar") and an AI Game Master turns it into an adventure of concrete, offline quests. Completing them earns XP, levels skills, keeps streaks and unlocks achievements. Friends can team up in guilds for weekly co-op missions.

> The game should make real life more meaningful, not make people spend more time inside the game.
> Quests are offline actions, rewards are capped per day, and progress is tied to what you actually did.

**Live demo:** https://life-quest-io.vercel.app · **Author:** [Shamsad Alam Meraj](https://shamsad.vercel.app)

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Drizzle ORM · Supabase (Postgres + Auth) · Vitest · Vercel. Everything runs on free tiers.

## Features

- **AI Game Master** with bring-your-own free key (Gemini, Groq, OpenRouter) and an offline fallback, so it always works
- **Progression:** XP and levels, skill trees, quests that unlock in order, streaks, 12 achievements, hero gear for the mascot
- **Variety:** daily quest (1.5× XP), weekly boss (3× XP), re-rolls, write-your-own quests, focus timer
- **Insight:** journal with search, weekly XP chart, activity heatmap, shareable progress card, PDF/CSV export
- **Guilds:** leaderboard and a weekly co-op mission, validated server-side
- **Passwordless login:** emailed one-time code (or link) via Supabase Auth, with a security log, rate limiting and visible sign-in history
- **Local-first:** playable as a guest with zero setup; cloud sync merges devices without losing progress
- **Production polish:** responsive landing page and app (phone → ultrawide), accessible UI, installable PWA, reminders

## Quick start

Requires **Node.js 22 or newer** (24 LTS recommended; `.nvmrc` pins 24, so `nvm use` picks it).

```bash
npm install
npm run dev          # http://localhost:3000, works immediately as a guest
```

Cloud features (login, sync, guilds) are optional: copy `apps/web/.env.example` to `apps/web/.env.local`, fill it in, then `npm run db:migrate`. Full steps in [docs/CLOUD.md](docs/CLOUD.md).

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm test` | all unit + integration tests |
| `npm run verify` | typecheck + tests + production build |
| `npm run db:generate` / `db:migrate` | create / apply Drizzle migrations |

## Repository layout

| Path | Purpose |
|---|---|
| `packages/core` | Game rules: XP, quests, unlock order, shields, gear, save merging and verification. Framework-free |
| `packages/ai` | AI provider adapters, prompts, JSON validation, offline fallback |
| `apps/web` | Next.js app: landing, game UI, server actions, auth, Drizzle schema and migrations |

## Documentation

- [Project overview](docs/PROJECT-OVERVIEW.md): what it is, how it is built, key engineering decisions
- [Architecture & roadmap](docs/ARCHITECTURE.md)
- [Database, auth, guilds & login tracking](docs/CLOUD.md)
- [Deploy to Vercel](docs/DEPLOY.md)
- [SEO & social sharing](docs/SEO.md)
- [Testing guide](docs/TESTING.md)

## Roadmap

1. **Personal Adventure** (done): AI quests, progression, personal world
2. **Social Adventure** (in progress): guilds and co-op missions shipped; community challenges next
3. **Living Universe:** shared worlds, simulations, community-made content
4. **Open Ecosystem:** public SDKs, plugins, self-hosting

## License

[MIT](LICENSE)

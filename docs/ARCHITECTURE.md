# LifeQuest architecture & roadmap

## Principles
1. **Real life first.** Quests are concrete offline actions (10-90 min). A daily reward cap prevents grinding.
2. **Progress = proof.** XP comes from completed real actions, with an optional reflection as the record.
3. **$0 and local-first.** Free tiers only (Vercel + Supabase), localStorage first, user-supplied free-tier AI keys. The server exists to verify and protect shared data, not to own gameplay.
4. **AI is optional.** Every AI path has a deterministic fallback; AI output is schema-validated (zod).
5. **Core is portable.** `@lifequest/core` has no DOM, React or network, so it can power CLI, mobile, servers and plugins later.

## Packages
```
apps/web (Next.js 16)  ──►  @lifequest/ai  ──►  @lifequest/core
   │   server: Drizzle ──► Supabase Postgres        ▲
   └────────────────────────────────────────────────┘ (core also verifies saves on the server)
```
- **core**: framework-free game rules (XP, quests, unlock order, daily/boss, shields, gear, merge, save sanitising).
- **ai**: provider adapters (Gemini/Groq/OpenRouter), prompts, JSON validation, offline fallback. Called from the browser with the player's own key.
- **web**: Next.js App Router. Client-side game shell (`features/`), server actions + Drizzle (`app/actions.ts`, `server/`, `db/`), Supabase SSR cookie auth (`lib/supabase.ts`, `proxy.ts`).

## Data model
`Adventure 1─* Quest *─1 Skill`; `Achievement` unlocked by predicates over `GameState`. Saves are versioned (`version: 1`) JSON for export/import and future migrations.

## Cloud (opt-in)
Local-first: localStorage is the source of truth for play. Signed-in players sync through server actions into Postgres via Drizzle; guilds and login tracking live server-side. See [CLOUD.md](CLOUD.md).

## Known limits (Phase 1)
- Quest completion is honor-system (no verification); reflections are the only proof.
- API keys live in localStorage: fine for personal free keys, not for shared devices.
- Cloud sync/guilds require a Supabase project; otherwise single device with manual export/import.

## Roadmap
| Phase | Scope | Key additions |
|---|---|---|
| 1 Personal Adventure | AI adventures, quests, XP, skill progression | **this repo today**; next: skill-tree prerequisites, difficulty adaptation, PWA/offline, weekly "boss" quests |
| 2 Social Adventure | Guilds, co-op missions, community challenges | Optional free backend (Supabase/Cloudflare D1), shared quest boards, privacy-first friend graph |
| 3 Living Universe | Shared worlds, simulations, community content | Content format for adventures, moderation, world state |
| 4 Open Ecosystem | SDKs, plugins, self-hosting, third-party platforms | Publish `core`/`ai` to npm, plugin API, Docker self-host, adventure marketplace spec |

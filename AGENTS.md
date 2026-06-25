# Agent Instructions — RoadRunners

Read this file first when working in this repository. It orients you to product intent, architecture, conventions, and what is done vs. still stubbed.

## Start here

| Resource | Purpose |
|----------|---------|
| **`docs/exploration/exploration-report.html`** | Interactive dependency graph — open in a browser. Best 5-minute architecture overview. |
| **`docs/tasks/01-product-journey.md`** | Product journey, choices, completion UX, map, coverage, and XP |
| **`docs/tasks/02-runtime-intelligence.md`** | AI, guides, scrims, workspace, Daytona, verification, and TTS |
| **`docs/tasks/03-platform-data.md`** | Shared contracts, Supabase, Auth, RLS, persistence, and migrations |
| **`docs/design/DESIGN.md`** | Design system — colors, typography, components |
| **`README.md`** | Setup, env vars, folder map |

Regenerate the graph after major structural changes:

```bash
node docs/exploration/extract-graph.js
```

## What this project is

**RoadRunners** is a hackathon MVP (Challenge **B1**: broken bridge from learning → earning). Users sign in, create a roadmap from a goal and interests, then follow an AI-guided learning journey with branching choices, optional track pivots, interactive workspaces, scrims, XP/level/streak gamification, and a visual journey map.

**Win criteria:** Demo guided exploration and career navigation — not curriculum depth.

## Stack (do not change without explicit user request)

- **Next.js 16** App Router · **TypeScript**
- **Supabase** — Auth, PostgreSQL, RLS
- **Tailwind CSS v4** + **shadcn/ui** (Base UI primitives)
- **Zod** — schemas in `lib/schemas/` are the source of truth for types
- **OpenAI + Gemini** generation adapters with validated fallback behavior

## Architecture at a glance

```
Request → proxy.ts → lib/supabase/middleware.ts (session + auth redirect)
       → app/**/page.tsx (RSC, fetches via lib/supabase/server.ts)
       → components/** (UI)
       → lib/actions/** (server actions: mutations)
       → Supabase PostgreSQL (RLS enforced)
       → /api/ai/next-node (validated LLM/fallback generation + persistence)
       → /api/runner/exec (optional Daytona execution)
       → /api/tts/scrim-caption (optional narrated scrim captions)
```

### Route map

| Route | Auth | Handler |
|-------|------|---------|
| `/` | public | `app/page.tsx` |
| `/login` | public | `app/login/page.tsx` → `LoginForm` |
| `/onboarding` | private | Redirect → `/roadmap/new` |
| `/roadmap/new` | private | Bubble creator — new roadmap |
| `/journey` | private | Dashboard — all roadmaps + progress |
| `/journey/[id]` | private | Current node + `ChoicePanel` |
| `/journey/[id]/map` | private | `JourneyMap` |
| `/journey/[id]/scrim/[scrimId]` | private | Curated timeline scrim |
| `/journey/[id]/scrims` | private | Saved scrim library |
| `/journey/[id]/my-scrim/[userScrimId]` | private | User-owned scrim |
| `/auth/callback` | public | OAuth / magic-link exchange |
| `/api/health` | public | Health check |
| `/api/ai/next-node` | private | Generate, validate, and persist next node |
| `/api/runner/exec` | private | Execute through configured runner |
| `/api/tts/scrim-caption` | private | Generate/cache caption narration |

Route constants live in **`lib/constants/routes.ts`**. The proxy treats `/onboarding` and `/journey/*` as private.

### Data model

Defined across **`supabase/migrations/001_initial.sql`** through **`004_scrim_sessions.sql`**:

- `profiles` — xp, level, streak, onboarding state
- `journeys` — user journey, `current_node_id`
- `journey_nodes` — content, skill_tag, `archived_at` for pivot soft-delete
- `journey_choices` — branching options per node
- `decisions` — UNIQUE `(journey_id, node_id)` for idempotency
- `skill_catalog` — seeded skills (~15–20)
- `lesson_scrims` — curated timeline scrims
- `user_workspace_snapshots` — latest recoverable workspace files
- `user_scrims` and `scrim_checkpoints` — saved scrims and timeline recovery
- `sandbox_sessions` — Daytona session references
- `tts_cache` — private TTS cache metadata

Zod contracts live in **`lib/schemas/`**. **`types/database.ts` is currently stale** relative to migrations 002–004 and must be synchronized by Task 3.

## Hotspots (most connected files)

These are the files most likely to break other things when changed:

1. `lib/utils.ts` — `cn()` used everywhere
2. `lib/constants/routes.ts` — all navigation paths
3. `lib/supabase/server.ts` — every server fetch/mutation
4. `components/ui/button.tsx` — primary UI primitive
5. `lib/actions/journey.ts` — choice submit, XP, streak, pivot

See **`docs/exploration/hotspots.md`** for the full ranked list.

## Conventions — follow these

### Code style

- Match existing patterns. Minimal diffs. No drive-by refactors.
- Server mutations → **`lib/actions/`** with `"use server"`.
- Validation → **`lib/schemas/`** Zod schemas; infer types with `z.infer`.
- Supabase access → **`createClient()`** from `lib/supabase/server.ts` on the server.
- Never expose LLM API keys via `NEXT_PUBLIC_*`.

### UI

- Use design tokens from **`docs/design/DESIGN.md`** (Trail Amber `#d97706`, Path Blue `#0066cc`, skill pastels).
- Reuse **`components/ui/*`** shadcn primitives before adding new ones.
- Layout shell: **`AppShell`** (TopNav + StickyProgressBar) for authenticated pages.
- Mobile-first; 44px touch targets on choice buttons.

### Feature folders

```
app/journey/       # journey pages
app/onboarding/    # onboarding page
components/journey/  # node card, choices, map
components/onboarding/
lib/actions/       # auth, onboarding, journey
lib/ai/            # generate-node (stub), fallback
lib/gamification/  # xp.ts, streak.ts
lib/schemas/       # Zod contracts
```

### Server action return types

Next.js 16 requires explicit return types on exported server actions that return values. Actions that redirect or return void are fine as-is.

## Implemented vs. not yet done

### Working (scaffold)

- Full route structure, proxy auth gate
- Login (Google + magic link actions), auth callback
- Onboarding wizard → profile upsert + journey insert
- Journey pages read from Supabase
- Choice submit + XP/streak update in `lib/actions/journey.ts`
- Pivot soft-archive logic (action exists; UI link may be incomplete)
- OpenAI/Gemini node generation with validated deterministic fallback
- Generated-node persistence through the `persist_generated_node` RPC
- Gamification helpers (`levelFromXp`, streak increment)
- Monaco/Sandpack/Pyodide workspace and timeline scrims
- Optional Daytona execution
- Workspace recovery, user scrims, and scrim recovery points
- ElevenLabs narration with Supabase Storage cache
- DB migrations, seed, and RLS policies
- Design system docs + preview HTML

### Not implemented / target gaps

- Derived frontier, prerequisite metadata, deferred offer history, and project-compatible pivots
- Provider-neutral guide streaming
- Daytona as the canonical multi-file runtime with protected web previews and restoration
- Structured objective verification, AI advisory separation, and user-confirmed completion
- Durable completion, verification evidence, and concept coverage
- Shared/distributed production rate limiting
- Full RLS and foreign-key-index audit
- Synchronize `types/database.ts`
- Automated tests and cross-user RLS tests

Choose the matching work package under `docs/tasks/` before implementing.

## Critical user flows

### Auth

`LoginForm` → `lib/actions/auth.ts` → Supabase → `/auth/callback` → proxy redirects to `/journey`.

### Onboarding

`OnboardingWizard` → `completeOnboarding` → upsert `profiles`, insert `journeys` → redirect to `/journey/[id]`.

### Journey choice

`ChoicePanel` → `submitChoiceAction` → insert `decisions` → award XP/streak → revalidate journey pages.

### AI node

Client/server mutation → validate → OpenAI/Gemini or fallback → `persist_generated_node` RPC → update current node → navigate.

## Safe to ignore (for most tasks)

Files with zero inbound imports (see **`docs/exploration/dead-areas.md`**):

- `components/ui/dialog.tsx`, `skeleton.tsx` — installed shadcn components not used yet
- `lib/schemas/index.ts`, `journey.ts`, `profile.ts`, `skill.ts` — barrel/types not imported yet (schemas used directly)
- `lib/supabase/client.ts` — no client-side Supabase usage yet
- `types/database.ts` — generated-style types, not imported and currently incomplete

Do not delete these preemptively; they are placeholders for upcoming work.

## Circular dependencies

None detected in the `@/` import graph. See **`docs/exploration/circular-deps.md`**.

## Commands

```bash
npm install
cp .env.example .env.local   # fill Supabase + optional OpenAI keys
npm run dev                  # http://localhost:3000
npm run build                # must pass before PR
```

Supabase: run every migration in `supabase/migrations/` in order, then `supabase/seed.sql`.

## Env vars

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Anon key (RLS protects data) |
| `CHIKKY_AI_API_KEY` | no | Server-only AI key (Chikky AI / Gemini / OpenAI) |
| `CHIKKY_AI_MODEL` | no | Model id, e.g. `gemini-2.0-flash` or `gpt-4.1-mini` |
| `CHIKKY_AI_PROVIDER` | no | `gemini` or `openai` (auto-inferred from model if omitted) |
| `DAYTONA_API_KEY` | no | Server-only; enables Daytona execution |
| `ELEVENLABS_API_KEY` | no | Server-only; enables narrated captions |
| `SUPABASE_SERVICE_ROLE_KEY` | conditional | Server-only; required for managed private TTS cache writes |

## What agents should NOT do

- Change stack (e.g. swap Supabase, add Prisma) without explicit user approval
- Add large new dependencies for the hackathon MVP scope
- Commit `.env.local` or secrets
- Force-push `main` without user request
- Over-engineer: prefer simple vertical journey map over react-flow
- Ignore RLS — all user data access must respect Supabase policies

## Onboarding paths by role

| Role | Start with |
|------|------------|
| Product/front-end | `docs/tasks/01-product-journey.md` → `docs/design/DESIGN.md` → `components/journey/*` |
| Runtime/AI | `docs/tasks/02-runtime-intelligence.md` → `app/api/*` → `lib/ai/*` → `lib/daytona/*` |
| Platform/database | `docs/tasks/03-platform-data.md` → `supabase/migrations/*` → `lib/supabase/*` |
| Auth | `proxy.ts` → `lib/supabase/middleware.ts` → `lib/actions/auth.ts` |

Full paths: **`docs/exploration/onboarding.md`**.

## GitHub

Remote: https://github.com/NachikethReddyY/roadrunners

Commit author should be `NachikethReddyY <y.nachiketh.reddy@gmail.com>`.

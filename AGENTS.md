# Agent Instructions — RoadRunners

Read this file first when working in this repository. It orients you to product intent, architecture, conventions, and what is done vs. still stubbed.

## Start here

| Resource | Purpose |
|----------|---------|
| **`docs/exploration/exploration-report.html`** | Interactive dependency graph — open in a browser. Best 5-minute architecture overview. |
| **`docs/handoff-roadrunner-hackathon.md`** | MVP spec, security checklist, data model, acceptance criteria |
| **`docs/preflight-plan.md`** | Locked foundation decisions (stack, folders, AI contract) |
| **`docs/design/DESIGN.md`** | Design system — colors, typography, components |
| **`README.md`** | Setup, env vars, folder map |

Regenerate the graph after major structural changes:

```bash
node docs/exploration/extract-graph.js
node ~/.claude/skills/codebase-explorer/scripts/generate-outputs.js docs/exploration
```

## What this project is

**RoadRunners** is a hackathon MVP (Challenge **B1**: broken bridge from learning → earning). Users sign in, complete a 2-step onboarding (goal + interests), then follow an AI-guided learning journey with branching choices, optional track pivots, XP/level/streak gamification, and a visual journey map.

**Win criteria:** Demo guided exploration and career navigation — not curriculum depth.

## Stack (do not change without explicit user request)

- **Next.js 16** App Router · **TypeScript**
- **Supabase** — Auth, PostgreSQL, RLS
- **Tailwind CSS v4** + **shadcn/ui** (Base UI primitives)
- **Zod** — schemas in `lib/schemas/` are the source of truth for types
- **OpenAI** dependency present; LLM integration is **not wired yet** (fallback only)

## Architecture at a glance

```
Request → middleware.ts → lib/supabase/middleware.ts (session + auth redirect)
       → app/**/page.tsx (RSC, fetches via lib/supabase/server.ts)
       → components/** (UI)
       → lib/actions/** (server actions: mutations)
       → Supabase PostgreSQL (RLS enforced)
       → /api/ai/next-node (LLM node generation — currently fallback stub)
```

### Route map

| Route | Auth | Handler |
|-------|------|---------|
| `/` | public | `app/page.tsx` |
| `/login` | public | `app/login/page.tsx` → `LoginForm` |
| `/onboarding` | private | `app/onboarding/page.tsx` → `completeOnboarding` |
| `/journey` | private | Journey list |
| `/journey/[id]` | private | Current node + `ChoicePanel` |
| `/journey/[id]/map` | private | `JourneyMap` |
| `/auth/callback` | public | OAuth / magic-link exchange |
| `/api/health` | public | Health check |
| `/api/ai/next-node` | private | AI node (fallback today) |

Route constants live in **`lib/constants/routes.ts`**. Middleware treats `/onboarding` and `/journey/*` as private.

### Data model

Defined in **`supabase/migrations/001_initial.sql`**:

- `profiles` — xp, level, streak, onboarding state
- `journeys` — user journey, `current_node_id`
- `journey_nodes` — content, skill_tag, `archived_at` for pivot soft-delete
- `journey_choices` — branching options per node
- `decisions` — UNIQUE `(journey_id, node_id)` for idempotency
- `skill_catalog` — seeded skills (~15–20)

Types mirror schemas in **`types/database.ts`** and **`lib/schemas/`**.

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

- Full route structure, middleware auth gate
- Login (Google + magic link actions), auth callback
- Onboarding wizard → profile upsert + journey insert
- Journey pages read from Supabase
- Choice submit + XP/streak update in `lib/actions/journey.ts`
- Pivot soft-archive logic (action exists; UI link may be incomplete)
- AI route returns **validated fallback** node (`lib/ai/fallback.ts`)
- Gamification helpers (`levelFromXp`, streak increment)
- DB migration + seed + RLS policies
- Design system docs + preview HTML

### Not implemented / TODO (from handoff)

- Real OpenAI/Gemini streaming in `/api/ai/next-node`
- Persist AI-generated nodes: stream → Zod validate → INSERT node + choices → UPDATE `current_node_id` → award XP (transactional)
- First AI node after onboarding (journey starts with no nodes today)
- Rate limiting on `/api/ai/next-node`
- Markdown sanitization (`rehype-sanitize`) before rendering AI content
- Pivot UI wired end-to-end (action exists)
- `generate-node.ts` is unused stub — wire or delete when implementing LLM
- Browser Supabase client (`lib/supabase/client.ts`) unused so far
- Tests (manual RLS smoke test recommended)

When implementing AI flow, read the **Persistence contract** section in `docs/handoff-roadrunner-hackathon.md`.

## Critical user flows

### Auth

`LoginForm` → `lib/actions/auth.ts` → Supabase → `/auth/callback` → middleware redirects to `/journey`.

### Onboarding

`OnboardingWizard` → `completeOnboarding` → upsert `profiles`, insert `journeys` → redirect to `/journey/[id]`.

### Journey choice

`ChoicePanel` → `submitChoiceAction` → insert `decisions` → award XP/streak → revalidate journey pages.

### AI node (target)

Client POST `/api/ai/next-node` → validate → LLM or fallback → persist node → navigate. Currently stops at fallback JSON response.

## Safe to ignore (for most tasks)

Files with zero inbound imports (see **`docs/exploration/dead-areas.md`**):

- `components/ui/dialog.tsx`, `skeleton.tsx` — installed shadcn components not used yet
- `lib/schemas/index.ts`, `journey.ts`, `profile.ts`, `skill.ts` — barrel/types not imported yet (schemas used directly)
- `lib/ai/generate-node.ts` — future LLM stub
- `lib/supabase/client.ts` — no client-side Supabase usage yet
- `types/database.ts` — generated-style types, not imported yet

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

Supabase: run `supabase/migrations/001_initial.sql` then `seed.sql` in your project SQL editor.

## Env vars

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Anon key (RLS protects data) |
| `OPENAI_API_KEY` | no | Server-only when LLM is wired |

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
| New engineer | `docs/handoff-roadrunner-hackathon.md` → `middleware.ts` → `lib/actions/journey.ts` → migration SQL |
| Frontend | `docs/design/DESIGN.md` → `app/layout.tsx` → `components/journey/*` |
| Backend / API | `lib/actions/*` → `app/api/ai/next-node/route.ts` → `lib/schemas/ai.ts` |
| Database | `supabase/migrations/001_initial.sql` → `lib/schemas/journey.ts` |
| Auth | `middleware.ts` → `lib/supabase/middleware.ts` → `lib/actions/auth.ts` |

Full paths: **`docs/exploration/onboarding.md`**.

## GitHub

Remote: https://github.com/NachikethReddyY/roadrunners

Commit author should be `NachikethReddyY <y.nachiketh.reddy@gmail.com>`.

# RoadRunners

AI-guided, gamified learning journeys — hackathon MVP for B1 (learning → earning).

**Agents:** read [`AGENTS.md`](./AGENTS.md) first. Interactive architecture map: [`docs/exploration/exploration-report.html`](./docs/exploration/exploration-report.html) (open in browser).

## Stack

- **Next.js 16** App Router
- **Supabase** Auth + PostgreSQL + RLS
- **Tailwind CSS v4** + shadcn/ui
- **Zod** schemas in `lib/schemas/`
- **OpenAI** (optional) via `/api/ai/next-node`

## Project structure

```
app/
  page.tsx                 # Landing (public)
  login/page.tsx           # Auth (public)
  onboarding/page.tsx      # Redirect → /roadmap/new
  roadmap/new/page.tsx     # Bubble creator (private)
  journey/
    page.tsx               # Roadmap dashboard + progress (private)
    [id]/page.tsx          # Current node view (private)
    [id]/map/page.tsx      # Journey map (private)
  auth/callback/route.ts   # OAuth / magic link callback
  api/
    health/route.ts
    ai/next-node/route.ts
components/
  brand/                   # Logo
  layout/                  # TopNav, AppShell, progress bar
  journey/                 # Node card, choices, map, continue
  roadmap/                 # Bubble creator
  auth/
  ui/                      # shadcn primitives
lib/
  actions/                 # Server actions
  ai/                      # LLM + fallback
  gamification/            # XP, streak
  schemas/                 # Zod (source of truth)
  supabase/                # Client helpers
  constants/
supabase/
  migrations/001_initial.sql
  seed.sql
docs/design/               # DESIGN.md + preview.html
docs/exploration/          # Graph explorer + agent onboarding docs
types/database.ts
proxy.ts
```

## Setup

1. Copy env: `cp .env.example .env.local`
2. Create a Supabase project, run every file in `supabase/migrations/` in order, then run `supabase/seed.sql`
3. Enable Google OAuth and/or email magic link in Supabase Auth
4. `npm install && npm run dev`

## Routes

| Route | Auth |
|-------|------|
| `/` | public |
| `/login` | public |
| `/onboarding` | private (redirect) |
| `/roadmap/new` | private |
| `/journey` | private |
| `/journey/[id]` | private |
| `/journey/[id]/map` | private |
| `/api/health` | public |
| `/api/ai/next-node` | private |

Product specification: `docs/PRDfinal.md` · Design system: `docs/design/DESIGN.md` · Preview: `docs/design/preview.html`

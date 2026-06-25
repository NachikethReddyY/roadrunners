# RoadRunners

AI-guided, gamified learning journeys — hackathon MVP for B1 (learning → earning).

**Agents:** read [`AGENTS.md`](./AGENTS.md) first. Interactive architecture map: [`docs/exploration/exploration-report.html`](./docs/exploration/exploration-report.html) (open in browser).

## Stack

- **Next.js 16** App Router
- **Supabase** Auth + PostgreSQL + RLS
- **Tailwind CSS v4** + shadcn/ui
- **Zod** schemas in `lib/schemas/`
- **OpenAI or Gemini** generation with validated fallback
- **Monaco + Sandpack/Pyodide** interactive workspace and timeline scrims
- **Daytona** optional server-side execution
- **ElevenLabs** optional caption narration

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
    [id]/scrim/            # Curated timeline scrims
    [id]/scrims/           # Saved scrim library
    [id]/my-scrim/         # User-owned scrims
  auth/callback/route.ts   # OAuth / magic link callback
  api/
    health/route.ts
    ai/next-node/route.ts
    runner/exec/route.ts
    tts/scrim-caption/route.ts
components/
  brand/                   # Logo
  layout/                  # TopNav, AppShell, progress bar
  journey/                 # Node card, choices, map, continue
  playground/              # Monaco, runtime, scrim player, console
  roadmap/                 # Bubble creator
  auth/
  ui/                      # shadcn primitives
lib/
  actions/                 # Server actions
  ai/                      # OpenAI/Gemini generation + fallback
  daytona/                 # Server sandbox adapter
  playground/              # Browser/Daytona execution helpers
  scrims/                  # Scrim loading
  tts/                     # ElevenLabs + private cache
  gamification/            # XP, streak
  schemas/                 # Zod (source of truth)
  supabase/                # Client helpers
  constants/
supabase/
  migrations/              # Ordered schema, playground, scrim, and sandbox SQL
  seed.sql
docs/tasks/                # Three parallel implementation work packages
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
| `/journey/[id]/scrim/[scrimId]` | private |
| `/journey/[id]/scrims` | private |
| `/journey/[id]/my-scrim/[userScrimId]` | private |
| `/api/health` | public |
| `/api/ai/next-node` | private |
| `/api/runner/exec` | private |
| `/api/tts/scrim-caption` | private |

Implementation work packages:

- `docs/tasks/01-product-journey.md`
- `docs/tasks/02-runtime-intelligence.md`
- `docs/tasks/03-platform-data.md`

Design system: `docs/design/DESIGN.md` · Preview: `docs/design/preview.html`

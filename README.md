# RoadRunners

RoadRunners is a hackathon MVP for Challenge B1: closing the broken bridge from learning to earning. It helps users turn a career goal into an AI-guided, branching learning journey with XP, streaks, pivots, a visual map, and narrated coding lessons called **CodeCasts**.

The product is optimized for demo clarity: guided exploration, career navigation, and hands-on practice matter more than deep curriculum coverage.

## What You Can Do

- Sign in with Supabase Auth using Google OAuth or email codes.
- Create a roadmap from a career goal and interest bubbles.
- Follow an AI-generated learning journey, with validated fallback content when AI is unavailable.
- Choose branches, pivot skills, earn XP, level up, and keep streaks.
- View progress on a journey dashboard and map.
- Open CodeCasts with editable code, checkpoints, optional narration, and optional Daytona-backed Python execution.

## Tech Stack

- **Next.js 16** App Router
- **React 19** and **TypeScript**
- **Supabase** Auth, PostgreSQL, Storage, and RLS
- **Tailwind CSS v4** with shadcn-style UI primitives
- **Zod** for validation and inferred types
- **OpenAI / Gemini-compatible AI flow** through server-only config
- **Sandpack, Monaco, Pyodide, and Daytona** for interactive coding
- **ElevenLabs** for optional CodeCast narration
- **Cloudflare R2** or Supabase Storage for narration audio cache

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You need Supabase environment variables before authenticated flows will work. AI, Daytona, SMTP, and ElevenLabs are optional depending on which features you want to demo.

## Environment Variables

Copy `.env.example` to `.env.local`, then fill in your own credentials. Never commit `.env.local`.

Required for core app:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key protected by RLS |
| `NEXT_PUBLIC_APP_URL` | App origin, usually `http://localhost:3000` locally |

Required for server-only privileged features:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for admin/storage operations |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Email code delivery through nodemailer |

Optional AI:

| Variable | Purpose |
| --- | --- |
| `CHIKKY_AI_API_KEY` | Server-only AI provider key |
| `CHIKKY_AI_MODEL` | Model id, for example `gemini-2.0-flash` or an OpenAI model |
| `CHIKKY_AI_PROVIDER` | `gemini` or `openai`; can be inferred from model in some flows |

Optional CodeCast features:

| Variable | Purpose |
| --- | --- |
| `SCRIM_RUNNER` | `browser`, `daytona`, or `auto` |
| `SCRIM_TTS_ENABLED` | Enables/disables narration |
| `SCRIM_MAX_CHECKPOINTS` | Saved checkpoint limit |
| `SCRIM_MAX_USER_SCRIMS_PER_JOURNEY` | User-created scrim limit per journey |
| `DAYTONA_API_KEY`, `DAYTONA_API_URL`, `DAYTONA_TARGET` | Daytona sandbox execution |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`, `ELEVENLABS_OUTPUT_FORMAT` | Narration generation |
| `TTS_STORAGE_BACKEND` | `supabase` by default, or `r2` for Cloudflare R2 |
| `TTS_STORAGE_BUCKET` | Supabase Storage bucket for cached MP3s |
| `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET` | R2 cache backend credentials |

## Supabase Setup

Create a Supabase project, then run the SQL files in order:

```text
supabase/migrations/001_initial.sql
supabase/migrations/002_persist_generated_node.sql
supabase/migrations/003_playground.sql
supabase/migrations/004_scrim_sessions.sql
supabase/seed.sql
```

For auth, enable the providers you want in Supabase. Google OAuth also needs redirect URLs for local and deployed environments.

For TTS caching, use either Supabase Storage or Cloudflare R2.

Supabase Storage default:

```env
TTS_STORAGE_BACKEND=supabase
TTS_STORAGE_BUCKET=tts-cache
```

Cloudflare R2:

```env
TTS_STORAGE_BACKEND=r2
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
CLOUDFLARE_R2_BUCKET=roadrunners-tts-cache
```

Create the R2 bucket in Cloudflare, then create an R2 API token with Object Read & Write access scoped to that bucket. Keep the bucket private; the app generates short-lived signed URLs for audio playback. See `docs/setup-scrim-tts-storage.md` for the full checklist.

## Scripts

```bash
npm run dev                 # Start the Next.js dev server
npm run build               # Build for production
npm run start               # Start the production build
npm run lint                # Run ESLint
npm run check:codecasts     # Check CodeCast env/setup readiness
npm run generate:trial-mp4  # Generate the trial CodeCast demo video
```

For a live R2 bucket smoke test after setting Cloudflare credentials:

```bash
TTS_STORAGE_BACKEND=r2 npm run check:codecasts -- --live-r2 --strict
```

## Folder Structure

This overview intentionally ignores `node_modules`.

```text
app/
  api/
    ai/next-node/           # Private AI node generation endpoint
    health/                 # Public health check
    runner/exec/            # Code execution endpoint
    tts/scrim-caption/      # CodeCast narration endpoint
  auth/                     # OAuth, magic-link, and verification routes
  journey/                  # Dashboard, node view, map, CodeCasts
  login/                    # Public login page
  onboarding/               # Private onboarding redirect
  roadmap/new/              # Goal + bubble creator
  layout.tsx                # Root layout
  page.tsx                  # Landing page

components/
  auth/                     # Login and OAuth controls
  brand/                    # Logo
  journey/                  # Node cards, choices, map, retry/continue forms
  layout/                   # App shell, nav, theme, progress
  onboarding/               # Onboarding wizard
  playground/               # CodeCast player, editor, console, file explorer
  roadmap/                  # Goal input and skill bubble UI
  ui/                       # Shared UI primitives

content/
  scrims/                   # Curated CodeCast JSON

docs/
  design/                   # Design system and logo assets
  exploration/              # Dependency graph, hotspots, onboarding notes
  handoff-roadrunner-hackathon.md
  product-roadmap.md
  setup-scrim-tts-storage.md

lib/
  actions/                  # Server actions for auth, journey, roadmap, CodeCasts
  ai/                       # AI config, generation, fallback, persistence helpers
  auth/                     # OTP and OAuth utilities
  config/                   # Runtime feature config
  constants/                # Route constants
  daytona/                  # Daytona client
  email/                    # SMTP helpers
  gamification/             # XP and streak logic
  journey/                  # Progress helpers
  playground/               # Execution, VFS, editor helpers
  roadmap/                  # Goal inference, bubble layout, filtering
  schemas/                  # Zod schemas and inferred contracts
  scrims/                   # CodeCast loading
  storage/                  # R2 signing/upload helpers
  supabase/                 # Server, client, admin, middleware helpers
  tts/                      # ElevenLabs integration
  utils.ts                  # Shared utilities

public/
  demo/                     # Demo media
  *.svg                     # Static icons

scripts/
  check-codecast-readiness.mjs
  generate-trial-scrim-demo.mjs

supabase/
  migrations/               # Database schema and RLS migrations
  seed.sql                  # Skill catalog seed data

types/
  database.ts               # Generated-style Supabase database types
```

## Key Routes

| Route | Auth | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/login` | Public | Sign in |
| `/onboarding` | Private | Redirects users into roadmap creation |
| `/roadmap/new` | Private | Goal and skill bubble creator |
| `/journey` | Private | Journey dashboard |
| `/journey/[id]` | Private | Current journey node |
| `/journey/[id]/map` | Private | Visual journey map |
| `/journey/[id]/scrims` | Private | User CodeCasts for a journey |
| `/api/health` | Public | Health check |
| `/api/ai/next-node` | Private | Generate and persist next learning node |
| `/api/runner/exec` | Private | Execute playground code |
| `/api/tts/scrim-caption` | Private | Generate or fetch narration audio |

## Architecture

```text
Request
  -> proxy.ts
  -> lib/supabase/middleware.ts
  -> app/** route or page
  -> lib/supabase/server.ts or lib/actions/**
  -> Supabase PostgreSQL with RLS
```

The journey flow is:

```text
Roadmap creator
  -> create journey
  -> generate/persist first node
  -> user chooses a branch
  -> decision + XP/streak update
  -> next node generation
  -> map/dashboard refresh
```

The CodeCast flow is:

```text
Curated or generated CodeCast
  -> playground shell
  -> browser runner or Daytona runner
  -> checkpoints/workspace snapshots in Supabase
  -> optional ElevenLabs narration cached in R2 or Supabase Storage
```

## Data Model

Core tables:

- `profiles`
- `journeys`
- `journey_nodes`
- `journey_choices`
- `decisions`
- `skill_catalog`

Interactive learning tables:

- `lesson_scrims`
- `user_workspace_snapshots`
- `user_scrims`
- `scrim_checkpoints`
- `tts_cache`
- `sandbox_sessions`

RLS is expected to protect user data. User-owned rows should always be scoped by `auth.uid()` directly or through the owning journey.

## Development Notes

- Read `AGENTS.md` before larger changes; it captures the project conventions and hackathon scope.
- Keep server mutations in `lib/actions/` and mark them with `"use server"`.
- Keep validation schemas in `lib/schemas/`; infer TypeScript types from Zod where practical.
- Use `createClient()` from `lib/supabase/server.ts` for server-side Supabase access.
- Do not expose server secrets through `NEXT_PUBLIC_*`.
- Reuse `components/ui/*` before introducing new primitives.
- Match the design system in `docs/design/DESIGN.md`.
- Keep changes scoped; this project is demo-oriented and intentionally lean.

## Useful Docs

- `AGENTS.md` - agent and contributor orientation
- `docs/handoff-roadrunner-hackathon.md` - MVP spec, acceptance criteria, and security notes
- `docs/product-roadmap.md` - product direction
- `docs/preflight-plan.md` - locked architectural decisions
- `docs/design/DESIGN.md` - design system
- `docs/exploration/exploration-report.html` - interactive dependency graph
- `docs/setup-scrim-tts-storage.md` - Supabase Storage, R2, TTS, and Daytona setup
- `docs/symposium-codecast-runbook.md` - demo script and fallback plan for CodeCasts

To regenerate the architecture graph after major structural changes:

```bash
node docs/exploration/extract-graph.js
node ~/.claude/skills/codebase-explorer/scripts/generate-outputs.js docs/exploration
```

## Current Known Gaps

- Real AI behavior depends on configured provider credentials; fallback content remains important.
- Rate limiting should be verified before public demo traffic.
- RLS should be smoke-tested with two separate users before deployment.
- Some integrations are optional and may degrade gracefully when keys are missing.

## Deployment Checklist

1. Run all migrations and seed data in Supabase.
2. Configure Supabase Auth providers and redirect URLs.
3. Add production environment variables in the hosting provider.
4. Configure either Cloudflare R2 or the private `tts-cache` Supabase Storage bucket if narration is enabled.
5. Run:

```bash
npm run lint
npm run build
```

6. Smoke test auth, roadmap creation, node generation, branch choice, journey map, and CodeCast save/resume.

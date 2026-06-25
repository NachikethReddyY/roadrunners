# Onboarding Paths — Learn the Codebase by Role

Open **`exploration-report.html`** and click a path in the sidebar to highlight it on the graph.

## New Engineer

1. Choose the relevant package:
   - `docs/tasks/01-product-journey.md`
   - `docs/tasks/02-runtime-intelligence.md`
   - `docs/tasks/03-platform-data.md`
2. `app/layout.tsx` — fonts, metadata, global CSS
3. `proxy.ts` + `lib/supabase/middleware.ts` — auth gate
4. `lib/constants/routes.ts` — route constants
5. `lib/supabase/server.ts` — server data access
6. `app/roadmap/new/page.tsx` — primary roadmap creation flow
7. `lib/actions/journey.ts` — core journey mutations
8. `supabase/migrations/` — complete data model + RLS

## Frontend

1. `docs/design/DESIGN.md` + `docs/design/preview.html`
2. `app/layout.tsx` + `app/globals.css`
3. `components/layout/app-shell.tsx` — authenticated layout
4. `components/journey/journey-node-card.tsx` — node presentation
5. `components/roadmap/goal-creator.tsx` — roadmap goal and skill bubbles
6. `components/journey/choice-panel.tsx` — branching UI
7. `components/playground/playground-shell.tsx` — workspace/scrim composition
8. `components/journey/journey-map.tsx` — progress visualization

## Backend / Server

1. `docs/tasks/02-runtime-intelligence.md`
2. `app/api/ai/next-node/route.ts`
3. `lib/ai/create-next-node.ts`
4. `lib/ai/generate-node.ts`
5. `lib/daytona/client.ts`
6. `app/api/runner/exec/route.ts`
7. `lib/schemas/ai.ts` + `lib/schemas/scrim.ts`

## Database

1. `docs/tasks/03-platform-data.md`
2. `supabase/migrations/001_initial.sql` through `004_scrim_sessions.sql`
3. `supabase/seed.sql`
4. `types/database.ts` — currently incomplete relative to later migrations
5. `lib/schemas/journey.ts`

## Authentication

1. `proxy.ts`
2. `lib/supabase/middleware.ts`
3. `lib/actions/auth.ts`
4. `app/auth/callback/route.ts`
5. `components/auth/login-form.tsx`

## Design / Brand

1. `docs/design/DESIGN.md`
2. `docs/design/preview.html`
3. `docs/design/logo-roadrunner.svg`
4. `components/brand/logo.tsx`

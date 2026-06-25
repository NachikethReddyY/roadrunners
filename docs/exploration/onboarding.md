# Onboarding Paths — Learn the Codebase by Role

Open **`exploration-report.html`** and click a path in the sidebar to highlight it on the graph.

## New Engineer

1. `docs/PRDfinal.md` — authoritative product scope and target architecture
2. `app/layout.tsx` — fonts, metadata, global CSS
3. `middleware.ts` + `lib/supabase/middleware.ts` — auth gate
4. `lib/constants/routes.ts` — route constants
5. `lib/supabase/server.ts` — server data access
6. `app/onboarding/page.tsx` — first private flow
7. `lib/actions/journey.ts` — core game loop mutations
8. `supabase/migrations/001_initial.sql` — data model + RLS

## Frontend

1. `docs/design/DESIGN.md` + `docs/design/preview.html`
2. `app/layout.tsx` + `app/globals.css`
3. `components/layout/app-shell.tsx` — authenticated layout
4. `components/journey/journey-node-card.tsx` — node presentation
5. `components/onboarding/onboarding-wizard.tsx` — 2-step form
6. `components/journey/choice-panel.tsx` — branching UI
7. `components/journey/journey-map.tsx` — progress visualization

## Backend / Server

1. `lib/actions/auth.ts`
2. `lib/actions/onboarding.ts`
3. `lib/actions/journey.ts`
4. `app/api/ai/next-node/route.ts`
5. `lib/schemas/ai.ts`
6. `lib/ai/fallback.ts` (today) → `lib/ai/generate-node.ts` (target)

## Database

1. `supabase/migrations/001_initial.sql`
2. `supabase/seed.sql`
3. `types/database.ts`
4. `lib/schemas/journey.ts`

## Authentication

1. `middleware.ts`
2. `lib/supabase/middleware.ts`
3. `lib/actions/auth.ts`
4. `app/auth/callback/route.ts`
5. `components/auth/login-form.tsx`

## Design / Brand

1. `docs/design/DESIGN.md`
2. `docs/design/preview.html`
3. `docs/design/logo-roadrunner.svg`
4. `components/brand/logo.tsx`

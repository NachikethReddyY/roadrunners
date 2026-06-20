# Critical Paths — End-to-End Flows

Traced from real imports and route handlers.

## Auth Flow

```
app/login/page.tsx
  → components/auth/login-form.tsx
  → lib/actions/auth.ts (signInWithGoogle, signInWithMagicLink)
  → app/auth/callback/route.ts
  → lib/supabase/server.ts
  → middleware.ts
  → lib/supabase/middleware.ts (session refresh + redirect)
```

Unauthenticated access to `/onboarding` or `/journey/*` redirects to `/login?next=...`.

## Onboarding → First Journey

```
app/onboarding/page.tsx
  → components/onboarding/onboarding-wizard.tsx
  → lib/actions/onboarding.ts (completeOnboarding)
  → lib/schemas/onboarding.ts (validation)
  → lib/supabase/server.ts
  → profiles (upsert) + journeys (insert)
  → redirect /journey/[id]
```

**Gap:** No first AI node is created yet — journey may have empty node list until LLM flow is wired.

## Journey Choice + XP

```
app/journey/[id]/page.tsx
  → components/journey/choice-panel.tsx
  → lib/actions/journey.ts (submitChoiceAction → submitChoice)
  → supabase: decisions INSERT, profiles UPDATE (xp, level, streak)
  → lib/gamification/xp.ts, streak.ts
```

Idempotency: duplicate decision on same node returns error code `23505`.

## AI Next Node (MVP — fallback only)

```
POST /api/ai/next-node
  → app/api/ai/next-node/route.ts
  → lib/schemas/ai.ts (request + output validation)
  → lib/ai/fallback.ts (deterministic node)
  → lib/supabase/server.ts (auth + journey ownership check)
```

**Target flow (not built):** stream LLM → validate → INSERT node + choices → UPDATE current_node_id → award XP.

## Pivot Track

```
lib/actions/journey.ts (pivotTrack)
  → soft-archive journey_nodes (set archived_at)
  → revalidate journey pages
  → (should trigger new AI node for pivotSkill — not wired)
```

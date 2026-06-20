# Critical Paths — End-to-End Flows

Traced from real imports and route handlers.

## Auth Flow

```
app/login/page.tsx
  → components/auth/login-form.tsx
  → lib/actions/auth.ts (signInWithGoogle, signInWithMagicLink)
  → app/auth/callback/route.ts
  → lib/supabase/server.ts
  → proxy.ts
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
  → lib/ai/create-next-node.ts
  → OpenAI/Gemini or validated fallback
  → persist_generated_node RPC (node + choices + current_node_id)
  → redirect /journey/[id]
```

## Journey Choice + XP

```
app/journey/[id]/page.tsx
  → components/journey/choice-panel.tsx
  → lib/actions/journey.ts (submitChoiceAction → submitChoice)
  → supabase: decisions INSERT, profiles UPDATE (xp, level, streak)
  → lib/gamification/xp.ts, streak.ts
```

Idempotency: duplicate decision on same node returns error code `23505`.

## AI Next Node

```
POST /api/ai/next-node
  → app/api/ai/next-node/route.ts
  → lib/supabase/server.ts (auth + journey ownership check)
  → lib/ai/create-next-node.ts
  → lib/ai/generate-node.ts (OpenAI first, Gemini alternative)
  → lib/schemas/ai.ts (output validation)
  → lib/ai/fallback.ts (provider failure/no-key path)
  → persist_generated_node RPC
```

## Pivot Track

```
lib/actions/journey.ts (pivotTrack)
  → soft-archive journey_nodes (set archived_at)
  → revalidate journey pages
  → (should trigger new AI node for pivotSkill — not wired)
```

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
app/roadmap/new/page.tsx
  → components/roadmap/goal-creator.tsx
  → lib/actions/roadmap.ts (createRoadmap)
  → lib/schemas/roadmap.ts (validation)
  → lib/supabase/server.ts
  → profiles (upsert) + journeys (insert)
  → lib/ai/create-next-node.ts
  → persist_generated_node RPC
  → redirect /journey
```

If first-node generation fails after journey creation, the dashboard exposes a retry flow.

## Journey Choice + XP

```
app/journey/[id]/page.tsx
  → components/journey/choice-panel.tsx
  → lib/actions/journey.ts (submitChoiceAction → submitChoice)
  → supabase: decisions INSERT, profiles UPDATE (xp, level, streak)
  → lib/gamification/xp.ts, streak.ts
  → lib/ai/create-next-node.ts
  → persist_generated_node RPC
```

Idempotency: duplicate decision on same node returns error code `23505`.

## AI Next Node

```
POST /api/ai/next-node
  → app/api/ai/next-node/route.ts
  → lib/schemas/ai.ts (request validation)
  → lib/ai/create-next-node.ts
  → lib/ai/generate-node.ts (OpenAI or Gemini)
  → lib/ai/fallback.ts on provider/validation failure
  → persist_generated_node RPC
```

Current rate limiting is process-local. The target work packages add frontier-aware generation, durable offer history, and production-grade limiting.

## Pivot Track

```
lib/actions/journey.ts (pivotTrack)
  → soft-archive journey_nodes (set archived_at)
  → lib/ai/create-next-node.ts with pivotSkill
  → persist generated pivot node
  → revalidate journey pages
```

**Product gap:** the current UI can request any catalog skill. The target requires every offered pivot to explain how it contributes to the existing project and to remain optional.

## Interactive Workspace and Scrim

```
app/journey/[id]/page.tsx or scrim route
  → components/playground/playground-shell.tsx
  → components/playground/code-workspace.tsx
  → browser runner or POST /api/runner/exec
  → lib/daytona/client.ts when configured
  → lib/actions/workspace.ts / lib/actions/scrim.ts for recovery
```

**Target gaps:** Daytona is not yet the complete canonical multi-file runtime, protected preview and structured verification are missing, and recovery is not yet automatically restored into a recreated sandbox.

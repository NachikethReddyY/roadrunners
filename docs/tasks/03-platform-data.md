# RoadRunners Task 3 — Platform Contracts, Supabase, Auth, and Persistence

> **Work package:** 3 of 3  
> **Suggested branch:** `task/platform-data`  
> **Primary outcome:** A secure, typed, transactionally sound Supabase platform that persists roadmap state, recovery data, verification evidence, completion, coverage, and sandbox references for the other two packages.  
> **May be developed independently:** Yes. This package owns the shared data contracts consumed during integration.

---

## 0. Instructions for the implementing agent

Read this file completely before changing code.

Also read:

- `AGENTS.md`
- every file in `supabase/migrations/`
- `supabase/seed.sql`
- current files under `lib/supabase/`, `lib/auth/`, `lib/email/`, and the owned schemas/actions
- current Supabase changelog and official documentation before implementing

Working rules:

1. Work only inside owned paths.
2. This task owns shared Zod/data contracts. Preserve compatibility where possible and document every breaking change.
3. Use the Supabase CLI `--help` before relying on a command. Create new migration files through `supabase migration new <name>` when the CLI is available.
4. Enable RLS on every user-data table in an exposed schema.
5. `TO authenticated` is not authorization by itself. Every policy needs the correct ownership predicate.
6. Use `(select auth.uid())` in policies where appropriate so identity is evaluated once.
7. UPDATE policies require both `USING` and `WITH CHECK`, and UPDATE also needs a SELECT policy.
8. Never authorize from `user_metadata`.
9. Never expose service-role or provider secrets to clients.
10. Index foreign keys and columns used in ownership/RLS checks.
11. Keep transactions short; do not perform model, Daytona, email, or TTS network calls while holding database locks.
12. Run database security/performance advisors where available and verify with real test queries.
13. Commit only owned files. Use author `NachikethReddyY <y.nachiketh.reddy@gmail.com>`.

Parallel-work protocol:

- Start from the same agreed base commit as Tasks 1 and 2.
- Do not merge either task branch into this branch while implementation is in progress.
- Shared frozen files are `package.json`, lockfiles, `app/layout.tsx`, `app/globals.css`, `components/ui/**`, `lib/constants/routes.ts`, top-level documentation, and exploration artifacts.
- Publish contract and migration changes in the handoff document; do not edit consumers owned by another task.
- Final integration order is Task 3, then Task 2, then Task 1, followed by one integration pass that resolves contract wiring and shared files.

---

## 1. Platform intent

Supabase is the durable source of truth.

It owns:

- authentication and profiles
- roadmaps and graph state
- generated checkpoints and choices
- decisions and offer history
- recovery snapshots
- scrims and scrim recovery points
- sandbox-session references
- verification evidence and completion records
- concept coverage
- XP/streak source events or authoritative updates
- TTS cache metadata

Daytona executes code but does not own durable progress. AI generates suggestions but does not own the graph. Frontend state does not become authoritative merely because it rendered successfully.

---

## 2. Current repository findings

Existing migrations provide:

- profiles, skill catalog, journeys, nodes, choices, and decisions
- `persist_generated_node`
- playground configuration
- curated scrims
- workspace snapshots
- user scrims and scrim checkpoints
- TTS metadata
- Daytona sandbox-session references
- RLS on existing public tables

Important gaps and risks:

- `types/database.ts` only models the initial tables and is stale relative to migrations 002–004.
- Existing RLS often uses `auth.uid()` directly rather than `(select auth.uid())`.
- Existing UPDATE policies generally lack `WITH CHECK`.
- Several child tables authorize only `user_id`; they do not always prove that referenced journey/node/scrim rows belong to the same user.
- Public-read catalog/scrim policies should remain deliberate and minimal.
- Foreign-key index coverage is incomplete and must be audited.
- `persist_generated_node` is redefined by later migrations; future changes should produce one new canonical migration rather than editing deployed history.
- There is no durable verification-evidence model.
- There is no distinct checkpoint-completion model.
- There is no concept-coverage model.
- There is no persisted choice-offer/deferred history sufficient for reliable frontier derivation.
- Current decisions combine choice and acknowledgment semantics.
- Current API rate limiting is process-local; a shared persistence seam may be needed, but avoid adding infrastructure unless required for the MVP.
- `.env.example` and the former unified PRD contained populated credential-like values. Templates must contain placeholders only, and exposed credentials must be rotated outside the repository.

---

## 3. Owned paths

This task has exclusive ownership of:

```text
supabase/**
types/database.ts

lib/supabase/**
lib/auth/**
lib/email/**

app/auth/**
app/login/**
app/onboarding/**
components/auth/**
components/onboarding/**

lib/actions/auth.ts
lib/actions/onboarding.ts

lib/schemas/auth.ts
lib/schemas/index.ts
lib/schemas/journey.ts
lib/schemas/onboarding.ts
lib/schemas/profile.ts
lib/schemas/roadmap.ts
lib/schemas/skill.ts

proxy.ts
.env.example
```

This task may create:

```text
lib/actions/completion.ts
lib/actions/coverage.ts
lib/actions/platform.ts
lib/data/**
lib/schemas/completion.ts
lib/schemas/coverage.ts
lib/schemas/frontier.ts
lib/schemas/platform.ts
supabase/tests/**
docs/handoffs/task-3-integration.md
```

Do not edit:

```text
app/page.tsx
app/roadmap/**
app/journey/**
app/api/ai/**
app/api/runner/**
app/api/tts/**
components/journey/**
components/roadmap/**
components/layout/**
components/playground/**
content/scrims/**
lib/actions/journey.ts
lib/actions/roadmap.ts
lib/actions/scrim.ts
lib/actions/workspace.ts
lib/ai/**
lib/config/scrim.ts
lib/daytona/**
lib/gamification/**
lib/journey/**
lib/playground/**
lib/roadmap/**
lib/scrims/**
lib/tts/**
lib/schemas/ai.ts
lib/schemas/playground.ts
lib/schemas/runner.ts
lib/schemas/scrim.ts
AGENTS.md
README.md
docs/tasks/**
docs/exploration/**
```

If Task 1 or Task 2 needs a platform change, implement it through a new owned action, repository function, schema, RPC, or migration. Do not edit their callers.

---

## 4. Frozen product contracts

### 4.1 Checkpoint and choice

One journey graph remains authoritative. Do not create a parallel roadmap model.

```ts
type FeatureChoice = {
  id: string;
  title: string;
  description: string;
  targetSkillTag: string;
  estimatedMinutes?: number;
  concepts: string[];
  prerequisites?: string[];
  suggestedMode?: "guide" | "scrim" | "build";
  availability: "unlocked" | "deferred" | "locked";
  projectContribution: string;
  isPivot: boolean;
};

type DerivedFrontier = {
  taken: string[];
  unlocked: string[];
  deferred: string[];
  locked: string[];
};
```

Frontier is derived from graph and records. It is not a separately editable source of truth.

### 4.2 Completion and verification

```ts
type Verdict = {
  runs: boolean;
  fulfills: boolean;
  reason: string;
  output?: string;
  objectiveFulfillment: "pass" | "fail" | "inconclusive";
  aiAdvisory?: {
    plausible: boolean;
    reason: string;
  };
  completionBasis?: "objective" | "user_confirmed";
  infrastructureError?: boolean;
};
```

Rules:

- Objective pass may create verified concept coverage.
- User-confirmed completion advances the roadmap but does not create verified coverage without objective evidence.
- Code that does not run cannot complete a build checkpoint.
- Infrastructure failure is not a user failure.
- AI advice is stored separately from objective evidence.

### 4.3 Coverage

```ts
type CoverageState = "introduced" | "practiced" | "verified";
```

Highest achieved state wins. Coverage is descriptive, not mastery.

Controlled initial tags:

```text
html-structure
css-layout
css-responsive
dom
events
functions
callbacks
promises
async-await
http
routing
json
rest
state-management
error-handling
modules
oop
closures
caching
auth
db-query
python-endpoint
cors
```

---

## 5. Required data design

Use the existing tables where they fit. Add the minimum normalized state needed for:

### 5.1 Node metadata

Represent or associate:

- checkpoint mode
- controlled concept tags
- prerequisite node IDs or concept tags
- feature/project outcome
- expected runtime or verification metadata

Preserve current `journey_nodes`, `journey_choices`, and parent relationships.

### 5.2 Choice offer history

Persist enough data to derive:

- choices offered
- choice selected
- choices deferred
- choices no longer relevant
- stable generated fingerprint

The system must prevent near-identical offers from appearing as new merely because a provider generated a new UUID.

### 5.3 Verification evidence

Persist objective evidence separately from AI advisory:

- command/entrypoint identity, not secrets
- exit code and timeout state
- bounded stdout/stderr summary
- test/probe assertion results
- infrastructure-error state
- AI plausibility and reason when present
- timestamps and checkpoint ownership

Do not store unrestricted full private source or unbounded process output by default.

### 5.4 Completion records

Create a distinct durable record for:

- checkpoint ID
- journey/user ownership
- basis: objective or user-confirmed
- linked verification evidence where applicable
- completion timestamp
- idempotency

Recovery snapshots, scrim recovery points, and completion records must remain separate concepts.

### 5.5 Coverage

Persist concept events or an equivalent defensible model from which highest coverage can be derived:

- guide/scrim exposure → introduced
- user edit or run → practiced
- objective feature pass → verified

Never promote user-confirmed completion alone to verified.

### 5.6 Sandbox and recovery

- Preserve latest recoverable workspace state.
- Allow expired Daytona sessions to be replaced without losing files.
- Keep sandbox IDs server-side.
- Store large or binary assets in private Supabase Storage rather than unbounded JSONB.
- Do not impose arbitrary product limits now; add monitored safeguards only when usage, cost, or latency requires them.

---

## 6. Platform operations

Expose typed server operations for other packages. Names may differ, but responsibilities must remain clear.

```ts
getRoadmapExperience(journeyId)
getDerivedFrontier(journeyId)
recordChoiceOffer(...)
submitRoadmapChoice(...)
saveRecoverySnapshot(...)
getLatestRecoverySnapshot(...)
recordVerificationEvidence(...)
completeCheckpoint(...)
getJourneyCoverage(journeyId)
getOrCreateSandboxReference(...)
expireSandboxReference(...)
```

Requirements:

- authenticate with verified server identity
- validate input/output with Zod
- enforce ownership in both application queries and RLS
- remain idempotent where retries are expected
- avoid partial graph updates
- keep external network calls outside database transactions

Use an RPC only when a short atomic database operation materially reduces partial state. Do not use `SECURITY DEFINER` as a shortcut around RLS. If genuinely required, place it in a non-exposed schema, set a safe `search_path`, check `auth.uid()` explicitly, and revoke default execution.

---

## 7. RLS and schema requirements

For every user-data table:

- enable RLS
- use `TO authenticated`
- include row ownership, not only role membership
- add `WITH CHECK` for UPDATE
- ensure SELECT policy exists for rows that must be updated
- index ownership and foreign-key columns used by policies
- test cross-user select, insert, update, and delete

For nested objects, prove ownership through the authoritative journey:

```sql
exists (
  select 1
  from public.journeys j
  where j.id = child.journey_id
    and j.user_id = (select auth.uid())
)
```

Do not trust a client-provided `user_id` alone when the same row references a journey, node, scrim, or sandbox.

Audit:

- missing foreign-key indexes
- duplicate or unused indexes
- `auth.uid()` evaluation pattern
- UPDATE policies without `WITH CHECK`
- functions callable by `PUBLIC`
- exposed tables without intentional grants and RLS
- storage policies required for upload/upsert/read

---

## 8. Auth and secret handling

- Keep Google OAuth and email code flows.
- Use verified server identity for authorization.
- Preserve safe redirect validation.
- OAuth credentials stay in Supabase, not public env vars.
- Service-role, SMTP, AI, Daytona, and TTS keys stay server-only.
- `.env.example` contains names, safe defaults, and placeholders only.
- Never commit `.env.local`.
- Rotate any credential that was previously committed or pasted into tracked documentation.

Required environment names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED

SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM

CHIKKY_AI_API_KEY
CHIKKY_AI_MODEL
CHIKKY_AI_PROVIDER
OPENAI_API_KEY
OPENAI_MODEL
GEMINI_API_KEY
GEMINI_MODEL

SCRIM_RUNNER
SCRIM_TTS_ENABLED
SCRIM_MAX_CHECKPOINTS
SCRIM_MAX_USER_SCRIMS_PER_JOURNEY

DAYTONA_API_KEY
DAYTONA_API_URL
DAYTONA_TARGET
DAYTONA_DEFAULT_LANGUAGE
DAYTONA_SANDBOX_TTL_MINUTES

ELEVENLABS_API_KEY
ELEVENLABS_VOICE_ID
ELEVENLABS_MODEL_ID
ELEVENLABS_OUTPUT_FORMAT
TTS_STORAGE_BUCKET
```

---

## 9. Migration and type workflow

1. Verify current Supabase CLI version and commands.
2. Review current Supabase changelog for relevant breaking changes.
3. Iterate against a local/test database.
4. Create one or more descriptive new migrations; do not rewrite already deployed migrations 001–004.
5. Add constraints safely and idempotently where migration conventions require it.
6. Add indexes for every new foreign key and RLS lookup path.
7. Run database advisors.
8. Regenerate or fully synchronize `types/database.ts`.
9. Verify migration ordering and fresh-database bootstrap with `supabase/seed.sql`.
10. Record any production backfill or rollout requirement.

Current setup order remains:

```text
001_initial.sql
002_persist_generated_node.sql
003_playground.sql
004_scrim_sessions.sql
<new migrations>
supabase/seed.sql
```

---

## 10. Acceptance criteria

- Fresh migration plus seed succeeds.
- Existing user journeys remain readable.
- `types/database.ts` matches all current tables, columns, enums/check domains, and RPCs used by code.
- User A cannot read or mutate User B’s roadmap, files, scrims, evidence, completion, coverage, or sandbox references.
- UPDATE policies include ownership checks on old and new rows.
- Nested references cannot be attached to another user’s journey by supplying the caller’s own `user_id`.
- Completion records are distinct from recovery state.
- Objective and user-confirmed completion are distinct.
- AI advisory is distinct from objective evidence.
- Frontier derives from graph, prerequisites, completion, and offer history.
- Coverage supports introduced, practiced, and verified.
- Generated node/choice persistence remains atomic and idempotent.
- Secrets are absent from tracked templates and documentation.
- Private TTS storage uses signed access.

---

## 11. Required tests

Database:

- fresh migration and seed
- migration from current schema
- generated node plus choices plus current-node update
- duplicate choice/completion retry
- offer-history deduplication
- objective completion
- user-confirmed completion
- coverage promotion rules
- expired sandbox replacement
- recovery-snapshot restore

RLS:

- anonymous denied from private tables
- owner CRUD where intended
- cross-user select/insert/update/delete denial
- nested foreign-row spoof denial
- public catalog and curated scrim reads only
- TTS metadata inaccessible to ordinary clients

Auth:

- Google callback
- email code issue/verify
- expired session
- unsafe redirect rejection

Performance/security:

- foreign-key index audit
- RLS advisor/security advisor
- bounded evidence/output storage
- no client bundle reference to service-role or server provider keys

---

## 12. Handoff requirements

Create `docs/handoffs/task-3-integration.md` containing:

- commit SHA
- migration names and ordering
- schema/RPC/action exports
- generated TypeScript contract changes
- operations Task 1 should call
- operations Task 2 should call
- backfill and deployment notes
- RLS test evidence
- advisor results
- lint/build/database-test results
- credentials that require rotation, named only by variable, never by value

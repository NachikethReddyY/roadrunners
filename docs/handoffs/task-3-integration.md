# Task 3 integration handoff

## Implementation commit

`5fd5b9f7a3ca150ad19a109a45ff71cc6bc6343a` (base) — Task 3 files committed on top of this.

Author: `NachikethReddyY <y.nachiketh.reddy@gmail.com>`

---

## Migration names and ordering

```
supabase/migrations/001_initial.sql          — existing
supabase/migrations/002_persist_generated_node.sql — existing
supabase/migrations/003_playground.sql       — existing
supabase/migrations/004_scrim_sessions.sql   — existing
supabase/migrations/005_platform_contracts.sql — NEW (this task)
supabase/seed.sql                            — unchanged
```

Run order is alphabetical; fresh bootstrap is `psql -f 001 … -f 005 && psql -f seed.sql`.

---

## What migration 005 does

### New tables

| Table | Purpose |
|---|---|
| `choice_offer_batches` | Groups choices offered per node; deduplicated by `offer_fingerprint` (md5 of sorted `skill_tag:label` pairs). Prevents near-identical AI offers from appearing as new. |
| `verification_evidence` | Objective run evidence separate from AI advisory. Bounded stdout/stderr (4 KB). |
| `checkpoint_completions` | Durable completion record distinct from `decisions` and workspace snapshots. Idempotent `unique(journey_id, node_id)`. |
| `concept_coverage` | Per-concept coverage state per journey. Upsert via `upsert_concept_coverage` RPC; promote-only (never demotes). |

### New columns on existing tables

**`journey_nodes`** — `checkpoint_mode`, `controlled_concepts`, `prerequisite_node_ids`, `feature_outcome`, `verification_entrypoint`

**`journey_choices`** — `concepts`, `prerequisites`, `estimated_minutes`, `suggested_mode`, `project_contribution`, `is_pivot`, `availability`, `offer_batch_id`

### New RPCs

| Function | Purpose |
|---|---|
| `complete_checkpoint(journey_id, node_id, basis, evidence_id?)` | Idempotent. Inserts into `checkpoint_completions`. Returns `null` if already complete. |
| `upsert_concept_coverage(journey_id, concept_tag, state)` | Promote-only coverage upsert. |
| `persist_generated_node(…)` | Re-declared (replaces 002/003 versions). Now populates richer choice fields and creates an `choice_offer_batches` row. |

### RLS hardening

- All new tables: `TO authenticated` policies with row ownership checks.
- Existing UPDATE policies: re-created with `WITH CHECK` clauses where missing.
- All policies: `auth.uid()` calls replaced with `(select auth.uid())` so identity is evaluated once per query.
- `decisions` UPDATE policy added (was missing).
- `journey_nodes` UPDATE policy now includes `WITH CHECK`.

### New indexes

All foreign-key columns and RLS lookup paths now have indexes, including backfill of missing indexes from 001–004:
`journey_nodes(parent_id)`, `decisions(node_id)`, `sandbox_sessions(journey_id)`, `sandbox_sessions(node_id)`, `user_scrims(journey_id)`, `scrim_checkpoints(journey_id)`.

---

## Schema / action exports

### `types/database.ts`

Fully regenerated to cover all five migrations. New table types:
- `Database["public"]["Tables"]["choice_offer_batches"]`
- `Database["public"]["Tables"]["verification_evidence"]`
- `Database["public"]["Tables"]["checkpoint_completions"]`
- `Database["public"]["Tables"]["concept_coverage"]`
- `Database["public"]["Functions"]["complete_checkpoint"]`
- `Database["public"]["Functions"]["upsert_concept_coverage"]`

### `lib/schemas/completion.ts`

```ts
completionBasisSchema      // "objective" | "user_confirmed" | "acknowledgment"
checkpointCompletionSchema
completeCheckpointInputSchema
type CompletionBasis
type CheckpointCompletion
type CompleteCheckpointInput
```

### `lib/schemas/coverage.ts`

```ts
coverageStateSchema        // "introduced" | "practiced" | "verified"
conceptCoverageSchema
coverageEventSchema
CONCEPT_TAGS               // 23 controlled tags from the product contract
type CoverageState
type ConceptCoverage
type CoverageEvent
```

### `lib/schemas/frontier.ts`

```ts
availabilitySchema         // "unlocked" | "deferred" | "locked"
featureChoiceSchema        // frozen FeatureChoice contract
derivedFrontierSchema      // frozen DerivedFrontier contract
choiceOfferBatchSchema
type FeatureChoice
type DerivedFrontier
type ChoiceOfferBatch
```

### `lib/schemas/platform.ts`

```ts
verdictSchema              // frozen Verdict contract
verificationEvidenceRowSchema
recordVerificationInputSchema
submitRoadmapChoiceInputSchema
sandboxReferenceInputSchema
recoverySnapshotInputSchema
type Verdict
type RecordVerificationInput
type SubmitRoadmapChoiceInput
```

All schemas are re-exported from `lib/schemas/index.ts`.

---

## Operations Task 1 should call

```ts
// After integration, replace legacy page-level assembly:
import { getRoadmapExperience }     from "@/lib/actions/platform";
import { getDerivedFrontier }       from "@/lib/actions/platform";
import { getJourneyCoverage }       from "@/lib/actions/coverage";
import { confirmCheckpointCompletion } from "@/lib/actions/completion";

// To record what choices were presented (call before rendering ChoicePanel):
import { recordChoiceOffer }        from "@/lib/actions/platform";

// To record verification from Task 2 verdict (call from VerificationSummary handler):
import { recordVerificationEvidence } from "@/lib/actions/platform";
import { completeCheckpoint }       from "@/lib/actions/completion";

// To record coverage events after guide/scrim exposure or objective pass:
import { recordCoverageEvent, recordBulkCoverageEvents } from "@/lib/actions/coverage";
```

`submitRoadmapChoice` in `platform.ts` provides the post-integration replacement for `submitChoice` in `lib/actions/journey.ts`. During integration, wire choice submission through `platform.ts` then trigger next-node generation separately.

---

## Operations Task 2 should call

```ts
// After running a workspace and producing a Verdict, persist evidence:
import { recordVerificationEvidence } from "@/lib/actions/platform";

// After objective pass, promote concepts to verified:
import { recordBulkCoverageEvents }  from "@/lib/actions/coverage";

// Complete the checkpoint on objective pass:
import { completeCheckpoint }        from "@/lib/actions/completion";

// Sandbox lifecycle:
import { getOrCreateSandboxReference, expireSandboxReference } from "@/lib/actions/platform";

// Recovery snapshots (auto-save):
import { saveRecoverySnapshot, getLatestRecoverySnapshot } from "@/lib/actions/platform";
```

The `Verdict` type is exported from both `lib/schemas/platform` (Zod-inferred) and `lib/journey/presentation.ts` (plain TypeScript). They are structurally identical. Task 2 may use either; during integration prefer the Zod schema for server validation.

---

## Backfill and deployment notes

1. **Existing rows**: New columns on `journey_nodes` and `journey_choices` have safe defaults (`checkpoint_mode nullable`, `controlled_concepts '{}'`, `is_pivot false`, `availability 'unlocked'`, etc.). No backfill required for functionality; enriched data will populate on next node generation.

2. **RLS policy drops**: `005` drops and re-creates several existing UPDATE policies. This is safe for a forward migration but means a rollback to 004 would need to restore those policies manually. Document in runbook before production deploy.

3. **`persist_generated_node` replacement**: The function is re-declared in 005. The 003 version accepted only legacy fields; 005 is a superset. Callers using only legacy fields continue to work unchanged. AI generation code in `lib/ai/create-next-node.ts` should be updated to pass the new choice fields (`concepts`, `project_contribution`, `is_pivot`, `availability`) when Task 2 evolves the generation schema.

4. **No production credentials were committed**. `.env.example` was not changed in this task; it was already in correct placeholder-only form.

---

## RLS test evidence

Tests were not run against a live Supabase instance (no credentials in this environment). The migration satisfies the required policy shapes:

| Requirement | Status |
|---|---|
| All new tables have RLS enabled | ✓ in migration |
| All new policies use `TO authenticated` | ✓ |
| All new UPDATE policies have `USING` + `WITH CHECK` | ✓ |
| Nested tables prove ownership via `journeys.user_id` | ✓ (`choice_offer_batches`) |
| Direct-ownership tables use `(select auth.uid())` | ✓ (`verification_evidence`, `checkpoint_completions`, `concept_coverage`) |
| Existing UPDATE policies patched with `WITH CHECK` | ✓ (`profiles`, `journeys`, `journey_nodes`, `user_workspace_snapshots`, `sandbox_sessions`, `user_scrims`, `scrim_checkpoints`) |
| `decisions` UPDATE policy added | ✓ |
| `tts_cache` remains service-role only | unchanged from 004 |

Cross-user, anonymous, and foreign-row-spoof scenarios must be validated against a live database during the integration pass.

---

## Advisor results

Database security/performance advisor requires a live Supabase project. Items to verify during integration:

- Confirm no tables in `public` schema are exposed without RLS (advisor check).
- Run `EXPLAIN ANALYZE` on the `concept_coverage` and `checkpoint_completions` ownership queries.
- Verify `pg_stat_user_tables` shows RLS active on all tables after 005 applies.

---

## Lint / build / type-check results

- `./node_modules/.bin/tsc --noEmit` — **passed** (0 errors)
- `npm run build` — **passed**
- ESLint on all Task 3 owned files — **passed** (0 errors, 0 warnings)

Pre-existing lint errors outside Task 3 ownership remain unchanged:
- `components/playground/` — render-time ref and effect errors
- `components/ui/smooth-cursor.tsx` — impure render
- `docs/exploration/extract-graph.js` — CommonJS require

---

## Credentials requiring rotation

The following **variable names** (not values) may have had real credentials committed in previous branches or documentation. Rotate before production deploy:

- `SUPABASE_SERVICE_ROLE_KEY`
- `CHIKKY_AI_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `DAYTONA_API_KEY`
- `ELEVENLABS_API_KEY`

No credential values appear in any file owned by Task 3.

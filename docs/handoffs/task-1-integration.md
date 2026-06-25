# Task 1 integration handoff

## Implementation commit

`4f4655346c29fa3476e48205fe5d5a5ada9374cf` — `implement product journey experience`

Author: `NachikethReddyY <y.nachiketh.reddy@gmail.com>`

## Owned files changed

- `app/page.tsx`
- `app/roadmap/new/page.tsx`
- `app/journey/page.tsx`
- `app/journey/[id]/page.tsx`
- `app/journey/[id]/map/page.tsx`
- `components/layout/app-shell.tsx`
- `components/layout/nav-dock.tsx`
- `components/layout/theme-toggle.tsx`
- `components/roadmap/goal-creator.tsx`
- `components/roadmap/goal-input.tsx`
- `components/journey/checkpoint-flow.tsx`
- `components/journey/choice-panel.tsx`
- `components/journey/continue-form.tsx`
- `components/journey/journey-map.tsx`
- `components/journey/journey-node-card.tsx`
- `components/journey/xp-toast.tsx`
- `components/guide/guide-panel.tsx`
- `components/coverage/coverage-summary.tsx`
- `components/verification/verification-summary.tsx`
- `lib/actions/roadmap.ts`
- `lib/actions/journey.ts`
- `lib/journey/frontier-view.ts`
- `lib/journey/presentation.ts`
- `lib/journey/presentation.test.mjs`
- `lib/journey/progress.ts`

## Product behavior implemented

- Roadmap creation keeps free text, bubbles, and `learn`/`become`, trims server input, validates three characters, reports catalog degradation, and distinguishes saving from completion.
- Successful creation opens the saved roadmap. First-checkpoint generation failure leaves a retryable saved roadmap.
- Dashboard supports empty, load failure/retry, fallback, partial, and populated roadmap states. Cards show goal, current checkpoint, recorded progress, fallback status, and available coverage.
- Current legacy node values map to guide, choice, build, and milestone checkpoint modes.
- Choice cards are capped at three and show outcome, estimate, concepts, availability, and project contribution. Locked and deferred choices are visible but not selectable.
- Choice submission is disabled across the full panel while pending. Duplicate decision inserts are treated idempotently and do not award duplicate XP.
- Pivot choices are secondary, explicit, capped at three, and explain how the new field contributes to the current project. A pivot is never automatic.
- Pivot generation now occurs before archival, preventing a provider failure from archiving the active path. Successful pivots preserve prior nodes as soft-archived history.
- Guide UI includes goals, sanitized content, expectations, progressive keyboard-operable hints, and an optional scrim transition with independent-authorship language.
- Verification UI separates execution, objective fulfillment, infrastructure state, AI advisory, output, and completion basis.
- Journey map shows parent relationships, current/completed/future/archived labels, completion basis, derived frontier counts, and introduced/practiced/verified coverage labels without color-only communication.
- XP feedback is compact and only appears after a recorded action. XP is not used in frontier derivation.
- Authenticated pages use `AppShell` with the existing compact progress bar.

## New components and exported props

### `GuidePanel`

```ts
type GuidePanelProps = {
  title?: string;
  markdown: string;
  goals?: string[];
  expectations?: string[];
  hints?: Array<{ level: 1 | 2 | 3; text: string }>;
  scrimHref?: string;
  className?: string;
};
```

### `VerificationSummary`

```ts
type VerificationSummaryProps = {
  verdict?: Verdict | null;
  confirmationControl?: React.ReactNode;
  className?: string;
};
```

### `CoverageSummary`

```ts
type CoverageSummaryProps = {
  items: Array<{
    concept: string;
    state: "introduced" | "practiced" | "verified";
  }>;
  compact?: boolean;
  className?: string;
};
```

### `CheckpointFlow`

```ts
type CheckpointFlowProps = {
  mode: "guide" | "scrim" | "build" | "choice" | "milestone";
  hasScrim?: boolean;
  className?: string;
};
```

### `ChoicePanel`

Existing legacy choice props remain accepted. Added optional presentation inputs:

```ts
{
  roadmapGoal?: string;
  currentSkillTag?: string;
  pivotChoices?: ChoicePresentationInput[];
}
```

`lib/journey/presentation.ts` exports the frozen `FeatureChoice`, `DerivedFrontier`, `CoverageState`, and `Verdict` shapes plus legacy adapters. `lib/journey/frontier-view.ts` exports `buildFrontierView` and `combineJourneyCoverage`.

## Assumed Task 2 runtime operations

- `getGuide({ journeyId, nodeId })` supplies validated `GuideStep` values. Consumers should map narrate/goal/hint/expect steps to `GuidePanel`.
- `verifyCheckpoint(...)` supplies the frozen `Verdict` to `VerificationSummary`.
- The interactive workspace view needs a composition seam before its next-choice footer so Task 1 can render verification and completion controls in this order:

  `workspace → run → verification → completion → next choices`

- Scrim return should navigate back to the independent workspace and must not emit checkpoint completion.

## Assumed Task 3 data operations

- `getRoadmapExperience(journeyId)` replaces legacy page-level row assembly and supplies checkpoint metadata and branch relationships.
- `submitRoadmapChoice({ journeyId, nodeId, choiceId })` replaces the legacy Task 1 action after integration.
- `confirmCheckpointCompletion({ journeyId, nodeId })` supplies the user-confirmation mutation.
- `getJourneyCoverage(journeyId)` replaces presentation-only coverage inference.
- Durable feature-choice fields must include availability, concepts, prerequisites, estimate, suggested mode, project contribution, and pivot status.
- Durable completion records must distinguish objective, user-confirmed, and acknowledgment-only checkpoints.

## Unresolved contract requests

1. Current persistence does not expose choice availability, prerequisites, controlled concepts, estimates, project contribution, pivot compatibility, deferred offer history, completion basis, objective evidence, or durable coverage. Task 1 uses conservative presentation adapters and never infers verified coverage.
2. Current decisions do not distinguish acknowledgment, objective completion, and user confirmation. Legacy map entries are labeled `Recorded activity`, not objective completion.
3. Build-checkpoint coverage is shown as practiced only when a legacy decision exists; non-build decisions remain introduced. Task 3 evidence must replace this inference.
4. The Task 2 `InteractiveNodeView` owns workspace and next-choice rendering in one component. Verification currently renders after that component because no slot/prop exists. Integration must add a footer seam or pass verdict/completion controls through the runtime component.
5. The current runtime allows `manual`/`tests` playground completion without a structured `Verdict`. Non-running-code prevention must be enforced by Task 2 verification plus Task 3 completion persistence before final acceptance.
6. User-confirmed completion is presentation-ready but cannot be wired until `confirmCheckpointCompletion` exists.
7. Platform-supplied compatible/deferred/locked pivot choices should replace the current three-item catalog fallback.
8. Regenerate exploration artifacts during the final integration pass; Task 1 did not edit frozen `docs/exploration/**`.

## Verification and manual test record

- `npm run build` — passed on June 25, 2026.
- `./node_modules/.bin/tsc --noEmit` — passed.
- Task 1 owned-path ESLint command — passed.
- `node --test --experimental-strip-types lib/journey/presentation.test.mjs` — 6 passed, 0 failed.
- Public route smoke test with a local unauthenticated Supabase stub:
  - `/` returned `200` and contained updated goal/choice/pivot content.
  - `/journey` returned `307` to `/login?next=%2Fjourney`.
  - `/roadmap/new` returned `307` to `/login?next=%2Froadmap%2Fnew`.
- Live signed-in Supabase, guide streaming, Daytona verification, completion persistence, narrow-viewport screenshots, and cross-user tests were not run because this checkout has no service credentials and Tasks 2/3 are not integrated.

## Repository-wide lint result

`npm run lint` is still blocked by pre-existing errors outside Task 1 ownership:

- `components/playground/code-workspace.tsx` — render-time ref access and declaration-order errors.
- `components/playground/playground-shell.tsx` — effect state update and render-time ref access.
- `components/playground/python-workspace.tsx` — synchronous effect state update.
- `components/ui/smooth-cursor.tsx` — impure `Date.now()` during render.
- `docs/exploration/extract-graph.js` — CommonJS `require()` lint errors.

Task 1 owned paths lint cleanly.

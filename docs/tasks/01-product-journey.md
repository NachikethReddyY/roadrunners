# RoadRunners Task 1 — Product Journey and Progress Experience

> **Work package:** 1 of 3  
> **Suggested branch:** `task/product-journey`  
> **Primary outcome:** A coherent user-facing roadmap experience from goal creation through choices, guided practice, completion, coverage, and the next checkpoint.  
> **May be developed independently:** Yes, subject to the frozen contracts and file ownership below.

---

## 0. Instructions for the implementing agent

Read this file completely before changing code.

Also read:

- `AGENTS.md`
- `docs/design/DESIGN.md`
- `docs/exploration/exploration-report.html`
- the current files listed under “Owned paths”

Working rules:

1. Work only inside the owned paths. Do not edit another task’s paths to make local compilation convenient.
2. Treat the cross-task contracts in this document as frozen. If a contract is missing or inadequate, add an item to `docs/handoffs/task-1-integration.md`; do not edit platform or runtime files.
3. Preserve the existing stack and design system.
4. Use existing shadcn/Base UI primitives and RoadRunners tokens before adding components.
5. Keep changes narrow. Do not reformat unrelated files.
6. User-facing language uses **roadmap**, **journey**, **checkpoint**, **choice**, **guide**, **scrim**, **workspace**, and **coverage**. Avoid exposing “sandbox session,” “frontier row,” or provider names except in troubleshooting.
7. The user authors the project code. A scrim is guidance, not proof that the user built the feature.
8. Run `npm run lint` and `npm run build` before handoff. If another task’s unmerged contract blocks the build, document the exact missing symbol and verify all owned files independently.
9. Commit only owned files. Use author `NachikethReddyY <y.nachiketh.reddy@gmail.com>`.

Parallel-work protocol:

- Start from the same agreed base commit as Tasks 2 and 3.
- Do not merge either task branch into this branch while implementation is in progress.
- Shared frozen files are `package.json`, lockfiles, `app/layout.tsx`, `app/globals.css`, `components/ui/**`, `lib/constants/routes.ts`, top-level documentation, and exploration artifacts.
- Request shared-file changes in the handoff document.
- Final integration order is Task 3, then Task 2, then Task 1, followed by one integration pass that resolves contract wiring and shared files.

---

## 1. Product intent

RoadRunners helps a beginner or early-career developer turn a broad goal into a branching, project-based learning roadmap.

The core experience is:

```text
Set a goal
  → receive up to three relevant feature choices
  → choose a direction
  → use a guide and optional timeline scrim
  → implement in the workspace
  → run and verify
  → complete the roadmap checkpoint
  → see coverage and next choices
```

Product pillars:

- **Choose your own journey:** the user controls branches and optional pivots.
- **Learn by building:** guidance leads into user-authored implementation.
- **Show credible progress:** completion and coverage reflect real activity without claiming mastery.
- **Keep exploration approachable:** infrastructure remains behind product language.

RoadRunners optimizes for guided exploration and demonstrable practice. It is not a certification or mastery system.

---

## 2. Fixed terminology and behavior

| Term | Required meaning |
|---|---|
| Roadmap / journey | The same persistent product object, stored as a journey. |
| Roadmap checkpoint | The user-facing name for a journey node. |
| Feature choice | A concrete project outcome, not merely a topic. |
| Branch | A new direction compatible with the current project. |
| Track pivot | A substantially different field or technology offered only when it can contribute to the current project. |
| Guide | Goals, hints, expectations, and context for a checkpoint. |
| Scrim | Optional timeline guidance. It does not count as independent authorship. |
| Recovery snapshot | Saved unfinished workspace state. It is not completion. |
| Completion record | Durable objective or user-confirmed completion of a checkpoint. |
| Frontier | A derived view of taken, unlocked, deferred, and locked possibilities. |
| Coverage | Introduced, practiced, or verified concepts. |
| XP | A secondary engagement reward. It never decides completion or unlocks. |

Required pivot behavior:

- A user may pivot into a completely different field.
- The pivot must have a concrete way to contribute to the current project.
- The user decides whether to take it.
- An incompatible pivot remains deferred or locked.
- Historical work remains visible and is never hard-deleted.

---

## 3. Current repository findings

The current UI already has:

- landing, login, roadmap creator, dashboard, journey detail, and journey map routes
- goal bubbles and generated roadmap titles
- choices, acknowledgment, XP, streaks, fallback badges, and pivot controls
- interactive-node rendering and links to curated scrims
- a simple journey map

Known product gaps:

- The pivot UI currently offers catalog skills directly; it does not explain how each pivot contributes to the current project.
- Current choices are topic-oriented in places and do not expose prerequisite, concept, estimate, or deferred state.
- The journey map is a simple vertical status list and does not show branch relationships, coverage, completion basis, or deferred choices.
- There is no first-class guide presentation.
- Completion UI does not distinguish objective pass, user confirmation, infrastructure error, and AI advisory.
- Coverage states are not shown.
- XP feedback exists but is more developed than credible completion evidence.
- Some repository documentation still describes generation as fallback-only even though real OpenAI/Gemini generation and persistence are wired.

Do not regress existing working flows while adding the target states.

---

## 4. Owned paths

This task has exclusive ownership of:

```text
app/page.tsx
app/roadmap/**
app/journey/page.tsx
app/journey/[id]/page.tsx
app/journey/[id]/map/**

components/brand/**
components/layout/**
components/roadmap/**
components/journey/**

lib/actions/roadmap.ts
lib/actions/journey.ts
lib/gamification/**
lib/journey/**
lib/roadmap/**
```

This task may create:

```text
components/guide/**
components/coverage/**
components/verification/**
lib/journey/frontier-view.ts
lib/journey/presentation.ts
docs/handoffs/task-1-integration.md
```

Do not edit:

```text
app/api/**
app/auth/**
app/login/**
app/onboarding/**
app/journey/[id]/scrim/**
app/journey/[id]/scrims/**
app/journey/[id]/my-scrim/**
components/auth/**
components/onboarding/**
components/playground/**
content/scrims/**
lib/ai/**
lib/daytona/**
lib/playground/**
lib/scrims/**
lib/tts/**
lib/supabase/**
lib/email/**
lib/auth/**
lib/actions/auth.ts
lib/actions/onboarding.ts
lib/actions/scrim.ts
lib/actions/workspace.ts
lib/schemas/**
supabase/**
types/database.ts
.env.example
AGENTS.md
README.md
docs/tasks/**
docs/exploration/**
```

`app/journey/[id]/page.tsx` may compose components owned by Task 2 after integration, but Task 1 must not edit those components.

---

## 5. Frozen cross-task contracts

Task 3 owns the final Zod schemas and persistence implementation. Task 2 owns runtime production of guides and verdicts. Build UI against these shapes without redefining incompatible variants.

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

type CoverageState = "introduced" | "practiced" | "verified";

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

Expected platform operations:

```ts
getRoadmapExperience(journeyId)
submitRoadmapChoice({ journeyId, nodeId, choiceId })
confirmCheckpointCompletion({ journeyId, nodeId })
getJourneyCoverage(journeyId)
```

Expected runtime operations:

```ts
getGuide({ journeyId, nodeId })
runWorkspace(...)
verifyCheckpoint(...)
```

If these operations are unavailable on this branch, isolate their use behind owned presentation helpers or component props. Do not create competing database access layers.

---

## 6. Required implementation

### 6.1 Roadmap creation and dashboard

- Keep free-text and skill-bubble goal creation.
- Validate at least three characters.
- Keep mode selection as `learn` or `become`.
- Show creation progress without implying the roadmap is ready before persistence succeeds.
- A generation fallback still creates a usable roadmap and is labeled “Suggested path.”
- Dashboard cards show title, goal, latest checkpoint, progress, and available completion/coverage summary.
- Empty, loading, retry, and authentication-expired states must be explicit.

### 6.2 Checkpoint presentation

Represent one graph with checkpoint modes:

- guide
- scrim
- build
- choice
- milestone

The UI may map current database values (`lesson`, `choice`, `interactive`, `milestone`) to these product modes until Task 3 completes schema evolution.

For a build-oriented checkpoint, present:

```text
Goal and context
  → optional guide
  → optional scrim
  → workspace
  → run
  → verification
  → completion
  → next choices
```

Not every checkpoint needs all stages. Orientation and milestones may use acknowledgment.

### 6.3 Choice and pivot experience

- Show one to three choices.
- Describe outcomes, expected time, concepts, and project contribution.
- Do not render a locked option as selectable.
- Allow relevant deferred choices to return.
- Visually distinguish a pivot from a normal branch without making it the dominant action.
- Every pivot card must explain how the new field contributes to the current project.
- Never move the user automatically.
- Choice submission must disable duplicate interaction and remain idempotent.

### 6.4 Guide and scrim transitions

- Present guide goals, narration, expectations, and progressive hints.
- Keep the first useful guide content visible while optional content loads.
- Link or transition into a scrim when one is available.
- Explain that scrim code is a reference and the user is responsible for their own implementation.
- After a scrim, return the user to their independent workspace rather than treating playback as feature completion.

### 6.5 Verification and completion UX

Display these separately:

- execution state
- objective fulfillment evidence
- AI plausibility advisory
- infrastructure availability
- completion basis

Rules:

1. Non-running build code cannot be completed.
2. Objective evidence is authoritative when it covers the requirement.
3. AI judgment is advisory only.
4. If code runs and the feature works for the user’s stated requirement, the user can confirm completion despite incomplete automation or negative AI advice.
5. Infrastructure failure is not user failure.
6. User-confirmed completion must be labeled differently from objective verification.

### 6.6 Journey map, frontier, and coverage

- A checkpoint is taken when objectively complete, user-confirmed, or acknowledged where no build is required.
- Show current, completed, archived, and future states without color-only communication.
- Preserve archived branch history.
- Show branch relationships if supplied by the platform contract.
- Show coverage as introduced, practiced, or verified.
- Never use “mastered,” “certified,” or employability-proof language.
- Objective completion may promote concepts to verified.
- User-confirmed completion advances the roadmap but does not make concepts verified without objective evidence.

### 6.7 XP and streaks

- Keep XP and streak feedback compact and secondary.
- XP must come from recorded events.
- XP must not determine frontier state or unlock a checkpoint.
- Objective completion may earn more than passive or user-confirmed activity.

---

## 7. UX and accessibility requirements

- Mobile-first.
- Minimum 44px touch targets.
- Full keyboard operation for choices, hints, completion, and map controls.
- Visible focus states.
- Captions remain available whenever narration exists.
- Do not rely on color alone.
- Preserve current design tokens: Trail Amber, Path Blue, and skill-category pastels.
- Use `AppShell` for authenticated product pages.
- Keep loading layout stable and avoid large content shifts.
- Make fallback, degraded runtime, and save states visible.

---

## 8. Acceptance criteria

- A signed-in user can create and reopen multiple roadmaps.
- Creation failure leaves a retryable roadmap rather than silently losing it.
- A checkpoint presents no more than three coherent choices.
- Each pivot explains its contribution to the current project.
- Incompatible pivots are not selectable.
- A guide and optional scrim lead into independent work.
- Scrim playback alone never produces “you built this.”
- Verification UI distinguishes runs, fulfills, advisory, infrastructure error, and completion basis.
- A working feature can be user-confirmed when automation is inconclusive.
- Non-running build code cannot be completed.
- Journey history survives branches and pivots.
- Coverage uses introduced, practiced, and verified only.
- XP does not control the path.
- Mobile and keyboard flows work.

---

## 9. Required tests

At minimum:

- roadmap creator validation and submit states
- dashboard empty, partial, fallback, and populated states
- one, two, and three choices
- duplicate choice submission prevention
- normal branch
- compatible pivot
- locked/deferred incompatible pivot
- guide loading and progressive hint reveal
- transition to and return from scrim/workspace
- objective pass presentation
- objective failure presentation
- AI disagreement with a working feature
- user-confirmed completion
- Daytona/infrastructure unavailable
- archived branch on map
- coverage-state rendering
- keyboard-only and narrow viewport smoke tests

---

## 10. Handoff requirements

Create `docs/handoffs/task-1-integration.md` containing:

- commit SHA
- owned files changed
- new components and exported props
- assumed Task 2 runtime operations
- assumed Task 3 data operations
- unresolved contract requests
- screenshots or a short manual test record
- lint/build results

Do not include secrets, source-file dumps, or unrelated refactors.

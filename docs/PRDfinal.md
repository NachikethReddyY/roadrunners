# RoadRunners — Unified Product Requirements Document

> **Version:** 1.1  
> **Date:** June 2026  
> **Status:** Authoritative product and implementation specification  
> **Product name:** RoadRunners

---

## 0. Purpose and authority

This document is the single source of truth for RoadRunners product intent, terminology, architecture, behavior, delivery order, and acceptance criteria.

It consolidates the original AI-guided roadmap concept with the interactive coding, timeline scrim, cloud sandbox, verification, checkpoint, voice, and coverage systems.

When this document conflicts with older planning material, this document wins. Implementation details still follow:

- `AGENTS.md` for repository conventions
- `docs/design/DESIGN.md` for visual design
- `docs/exploration/` for generated architecture analysis
- `supabase/migrations/` for the deployed database schema
- `lib/schemas/` for runtime validation and TypeScript contracts

The current repository contains both completed foundations and partially implemented target behavior. The “Current foundation” and delivery-phase sections distinguish what exists from what the unified product still requires.

---

## 1. Product summary

RoadRunners is an AI-guided, project-based learning platform where users create understandable learning **roadmaps**, choose what to build next, learn through interactive timeline-based scrims and contextual guidance, implement features in a persistent cloud workspace, and build a descriptive record of the concepts they practiced.

The product addresses the broken bridge from learning to earning:

- Traditional roadmaps tell users what exists but do not adapt.
- Tutorials often produce passive completion without independent work.
- Blank editors provide freedom without direction.
- RoadRunners combines direction, choice, practice, execution, and evidence.

The core loop is:

```text
Set a goal
  → receive a small set of relevant next choices
  → choose a feature or skill direction
  → use a guide and optional scrim
  → implement in a real workspace
  → run and verify the work
  → checkpoint progress
  → unlock the next choices
```

RoadRunners optimizes for guided exploration and demonstrable practice. It does not claim certification or mastery.

---

## 2. Product pillars

Every major requirement must support at least one pillar.

### P1 — Choose your own journey

Users control the direction of their roadmap. The system offers no more than three coherent next choices based on the existing journey graph, prior decisions, goal, practiced concepts, and available prerequisites.

Deferred options may return later. Users may branch or pivot without losing their prior history.

### P2 — Learn by building

Users do not only read generated lessons. They work in a real coding workspace, run their code in an isolated Daytona environment, inspect output or previews, and complete features through objective checks where possible.

Timeline scrims provide scaffolding, not automatic proof of independent ability.

### P3 — Show credible progress

RoadRunners records decisions, workspace recovery states, completed features, verification results, and concept coverage. It communicates what the user encountered and practiced without implying mastery.

### P4 — Keep exploration approachable

User-facing language remains simple: roadmap, journey, step, choice, project, checkpoint, and coverage. Infrastructure terms such as sandbox session, provider, snapshot row, and evidence source remain internal unless needed for troubleshooting.

---

## 3. Product terminology

| Term | Meaning |
|---|---|
| **Roadmap** | The user-facing container created from a goal. Stored as a `journeys` row. |
| **Journey** | The user’s progression through a roadmap. In the UI, roadmap and journey may be used naturally; they refer to the same persistent product object. |
| **Roadmap checkpoint / node** | One meaningful checkpoint in the roadmap graph. It may teach, guide, require a build, present choices, verify work, or summarize a milestone. Stored in `journey_nodes`. “Checkpoint” is the preferred user-facing term; “node” is the technical/data-model term. |
| **Feature** | A concrete outcome the user chooses to implement, such as “return JSON from an endpoint.” A feature is represented by a roadmap checkpoint rather than a separate product hierarchy. |
| **Choice** | One available next direction from the current node. Stored in `journey_choices`. |
| **Decision** | The user’s selected choice or acknowledged completion for a node. Stored in `decisions`. |
| **Branch** | A new direction that remains compatible with the current project and workspace. |
| **Track pivot** | A meaningful change in field, skill, or technology that is offered only when it can be incorporated into the current project. The user decides whether to pursue it. |
| **Guide** | Dynamically generated goals, narration, hints, expectations, entrypoint information, and concept metadata for a step. |
| **Scrim** | A timeline-based guided coding experience containing file, focus, caption, slide, and run events. |
| **Workspace** | The editor, file tree, terminal, run controls, and preview used for implementation. |
| **Sandbox session** | Internal technical execution state connecting a roadmap or activity to a Daytona sandbox. It is not the primary user-facing object. |
| **Recovery snapshot** | A save of current files, scrim position, and editor state used to recover unfinished work. It may be automatic and does not imply completion. |
| **Completion record** | A durable record that a roadmap checkpoint was completed through objective verification or explicit user confirmation. |
| **Verdict** | Structured verification output describing whether work runs and whether it fulfills the requested feature. |
| **Frontier** | A derived view of taken, unlocked, deferred, and locked possibilities. It is computed from the existing graph and records rather than maintained as an independent authority. |
| **Coverage** | Descriptive concept states across the journey: introduced, practiced, or verified. |
| **XP** | A bonus engagement layer awarded from authoritative product events. XP never determines completion or frontier state. |

---

## 4. Target users and primary jobs

### Primary user

A beginner or early-career developer who has a goal but needs help deciding what to learn, connecting concepts to projects, and maintaining momentum.

### Primary jobs

- “Help me turn a broad career or learning goal into something I can do now.”
- “Give me meaningful choices without making me design the entire curriculum.”
- “Teach me enough to begin, then let me build it myself.”
- “Tell me whether my work runs and satisfies the feature I chose.”
- “Let me change direction without treating previous work as wasted.”
- “Show me what I have actually encountered and practiced.”

---

## 5. End-to-end user experience

### 5.1 Entry and authentication

1. The landing page explains the learning-to-earning problem and RoadRunners’ choose-build-verify loop.
2. The user signs in through Supabase Auth using Google OAuth or an email flow.
3. Private routes require a valid session and all user data remains protected by RLS.

### 5.2 Roadmap creation

The first-time user lands on the bubble creator at `/roadmap/new`.

The central composer is:

```text
I want to [learn | become] [goal text] [Next]
```

Requirements:

- Goal text must contain at least three characters.
- Floating skill bubbles come from `skill_catalog`.
- Selecting a bubble fills the goal composer and sets the mode to `learn`.
- Category colors use the design-system skill tokens.
- Submitting creates the roadmap and its first interactive node.
- A Daytona sandbox is prewarmed asynchronously as part of roadmap creation.
- If generation fails, a validated fallback node still creates a usable roadmap.

### 5.3 Dashboard

`/journey` lists all active roadmaps.

Each card shows:

- title
- goal
- current skill or step
- progress
- latest activity
- verification/coverage summary when available

The dashboard includes a “Create roadmap” action. A user with no roadmaps is directed to `/roadmap/new`.

### 5.4 Unified journey loop

The preferred loop for a build-oriented roadmap checkpoint is:

```text
Goal and context
  → optional guide
  → optional timeline scrim
  → independent workspace
  → run
  → verify
  → complete the roadmap checkpoint
  → next choices
```

Not every roadmap checkpoint requires every stage:

- A short orientation node may only require acknowledgment.
- A guided node may include a scrim before independent editing.
- A build node requires execution and verification.
- A milestone node summarizes progress and coverage.
- A choice node focuses on selecting the next direction.

### 5.5 Branching and pivots

RoadRunners distinguishes two navigation outcomes:

1. **Branch:** Continue the current project with a compatible feature.
2. **Track pivot:** Offer a substantially different field, skill, or technology only when the path engine can explain how it contributes to the current project.

A pivot may be as broad as React to Swift, web to data, or frontend to AI, but it must produce a concrete project-compatible outcome. The user is never moved automatically: the pivot appears as an optional choice, and the user decides whether to pursue it.

If a requested field cannot yet be incorporated coherently, it remains deferred or locked rather than creating an unrelated project inside the roadmap.

Soft-archiving may hide abandoned future nodes, but historical decisions and completed work are never hard-deleted during a pivot.

---

## 6. Node and activity model

RoadRunners uses one journey graph rather than separate lesson and feature systems. Every node is a roadmap checkpoint; its mode determines what the user does at that checkpoint.

### 6.1 Node modes

The conceptual node modes are:

| Mode | Purpose | Typical completion |
|---|---|---|
| `guide` | Explain a goal and provide contextual hints | Acknowledgment or transition into practice |
| `scrim` | Timeline-based guided coding reference | User transitions into or resumes their own implementation |
| `build` | Independent implementation in the workspace | Objective pass or explicit user-confirmed completion |
| `choice` | Present up to three next directions | One idempotent decision |
| `milestone` | Summarize completed work and coverage | Acknowledgment |

The database may continue using existing `node_type` values while schemas and migrations evolve. The target contract must represent these modes without creating parallel node tables.

### 6.2 Feature choice contract

Each generated choice should include:

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
};
```

Requirements:

- Return one to three choices.
- Choices must be achievable at the current frontier.
- Choice descriptions describe an outcome, not only a topic.
- Every branch or pivot choice must explain how it extends the current project.
- Concept tags come from the controlled vocabulary.
- Generated IDs or stable fingerprints allow offer history to be recorded.

### 6.3 Guide supplement

Timeline scrims remain the primary guided-coding format. A lightweight guide stream supplements them for generated or contextual help.

```ts
type GuideStep =
  | { type: "narrate"; text: string }
  | { type: "goal"; text: string }
  | { type: "hint"; level: 1 | 2 | 3; text: string }
  | {
      type: "expect";
      stdoutContains?: string;
      httpProbe?: {
        port: number;
        path: string;
        bodyContains?: string;
      };
    }
  | { type: "entrypoint"; file: string }
  | { type: "concepts"; tags: string[] };
```

Guide rules:

- It is reference material, not a rigid script.
- Hints reveal progressively.
- Machine-readable expectations feed verification.
- Narration may use cached TTS.
- The first useful step should render before the complete guide is generated.

### 6.4 Timeline scrim contract

Scrims continue using timeline events:

```ts
type ScrimEvent =
  | { t: number; type: "files"; files: Record<string, string> }
  | { t: number; type: "focus"; path: string }
  | { t: number; type: "caption"; text: string; audioUrl?: string }
  | { t: number; type: "slide"; slideId: string }
  | { t: number; type: "run" };
```

Scrim rules:

- Playing a scrim may update visible files and editor focus.
- Pausing makes the workspace editable.
- Progress and files can be resumed across devices.
- Users can save customized scrims.
- A scrim is a guide and reference; the user remains responsible for building the project code.
- Scrim-provided code must not be counted as independently authored user work.
- Watching a scrim marks concepts as introduced, not verified.
- User edits after or during a scrim may mark concepts as practiced.

---

## 7. Frontier derivation and path engine

The frontier is derived from existing roadmap data. It is not stored as a separate source of truth.

```ts
type DerivedFrontier = {
  taken: string[];
  unlocked: string[];
  deferred: string[];
  locked: string[];
};
```

### 7.1 Derivation

- **Taken:** Roadmap checkpoints with an objective pass, explicit user-confirmed completion, or acknowledgment where no build is required.
- **Unlocked:** Current choices whose prerequisite concepts or nodes are satisfied.
- **Deferred:** Choices previously offered but not selected and still relevant.
- **Locked:** Known candidate features with unmet prerequisites.

### 7.2 Required metadata

The existing graph remains authoritative, but frontier derivation may require minimal metadata additions:

- concept tags on nodes or checkpoints
- prerequisite node IDs or concept tags
- offer history or stable choice fingerprints
- completion and verification state

These additions should extend `journey_nodes`, `journey_choices`, `decisions`, or closely related progression tables. They must not create a duplicate roadmap model.

### 7.3 Path generation

The path engine receives:

- roadmap goal
- interests
- current node
- recent graph context
- derived frontier
- concept coverage
- optional pivot target and its proposed contribution to the current project
- controlled skill and concept vocabularies

It returns at most three validated feature choices.

The engine must:

- never offer a known locked feature as immediately available
- allow deferred choices to resurface
- avoid duplicate or near-duplicate choices
- keep features small enough for one focused session
- require every branch and field pivot to extend the current project coherently
- defer or lock incompatible pivots until a valid project integration exists
- leave the final choice to the user
- use a deterministic fallback when the provider fails

---

## 8. Workspace and Daytona sandbox

### 8.1 Execution authority

Daytona is the canonical execution environment for RoadRunners build and verification flows.

It should support all required runtimes from a prepared base image, initially:

- Node.js
- Python
- shell utilities including `curl`
- browser or headless-browser tooling for web verification

Browser-based runners may remain as local previews, development aids, or degraded fallbacks, but they are not the authoritative source for verified completion.

### 8.2 Lifecycle

```text
Roadmap
  → active sandbox-session record
  → Daytona sandbox instance
  → files restored from the latest Supabase recovery snapshot
  → run / preview / verify
  → files and checkpoints persisted to Supabase
```

Requirements:

- Prewarm a sandbox when roadmap creation succeeds.
- Reuse the sandbox while it is active.
- Apply hard timeouts to every command.
- Use bounded resource and lifetime settings.
- Auto-stop idle sandboxes in normal operation.
- Disable or extend auto-stop only for controlled demos.
- Recreate expired sandboxes from the latest Supabase recovery snapshot.
- Never treat sandbox expiration as loss of the user’s roadmap.

### 8.3 Sandbox facade

```ts
interface Sandbox {
  writeFiles(files: { path: string; content: string }[]): Promise<void>;
  exec(
    command: string,
    options?: { cwd?: string; timeoutSec?: number }
  ): Promise<{ stdout: string; stderr?: string; exitCode: number }>;
  previewUrl(port: number): Promise<{ url: string; token?: string }>;
}
```

Daytona-specific SDK use stays inside the sandbox adapter. App logic consumes the facade.

### 8.4 Failure behavior

If Daytona is unavailable:

- preserve all editor files in Supabase
- retry only bounded transient failures
- allow guides and scrims to remain readable
- show execution as temporarily unavailable
- do not produce a failed verification verdict solely because infrastructure is unavailable
- do not award verification XP
- allow an explicit save-and-return-later action

---

## 9. Verification and completion

### 9.1 Verdict contract

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

### 9.2 Verification layers

#### Layer 1 — Execution

- Write the current files to Daytona.
- Run the configured entrypoint or command.
- Record stdout, stderr, exit code, and timeout state.
- `runs` is true only when the execution contract succeeds.

#### Layer 2 — Fulfillment

Use objective checks whenever possible:

- stdout contains a target
- tests pass
- HTTP probe returns successfully
- response body contains expected content
- expected file or export exists
- browser preview loads without console errors

For visual or frontend outcomes that cannot be fully asserted, one bounded model call may provide a plausibility judgment stored in `aiAdvisory`.

AI plausibility is advisory evidence only. It must be labeled clearly, must not be described as objective proof, and must never be the final authority over whether the user may continue.

The final progression decision follows this order:

1. The code must run in Daytona.
2. Objective tests, probes, and explicit user requirements determine fulfillment where they can.
3. AI may identify likely gaps or provide a plausibility opinion.
4. If the feature demonstrably works for the user’s stated requirement despite incomplete automated coverage or a negative AI opinion, the user may confirm completion and continue.

### 9.3 Progression behavior

- An objective pass creates the checkpoint’s completion record and unlocks full completion rewards.
- A user may confirm completion when the code runs and the feature works for their stated requirement, even when automated checks are incomplete or AI disagrees.
- User-confirmed completion is recorded distinctly from an objective pass and may receive different verification XP.
- Code that does not run cannot be marked complete as a build checkpoint; the user may save a recovery snapshot and return later.
- Infrastructure errors never count as user failure.
- Choice submission remains idempotent.

### 9.4 Guided versus independent work

Coverage and completion distinguish:

- content shown by a guide or scrim
- user-edited code
- successful execution
- verified fulfillment

RoadRunners must not claim “you built this” based only on watching a scrim. The user’s own implementation, successful run, and objective or user-confirmed completion are the basis for that claim.

---

## 10. Persistence and Supabase model

### 10.1 Storage decision

Supabase remains the durable source of truth for the MVP and near-term product.

It stores:

- authentication and profiles
- roadmaps and graph state
- generated nodes and choices
- decisions
- playground configuration
- workspace recovery snapshots
- scrim timelines and user scrims
- recovery and completion metadata and files
- sandbox-session references
- TTS cache metadata
- verification and coverage records as they are added

Daytona executes code; it does not own durable user progress.

### 10.2 Existing tables

| Table | Responsibility |
|---|---|
| `profiles` | User profile, onboarding state, XP, level, and streak |
| `skill_catalog` | Controlled skill vocabulary and visual category |
| `journeys` | User-facing roadmaps |
| `journey_nodes` | Roadmap steps, parent graph, content, type, and playground configuration |
| `journey_choices` | Branching options from a node |
| `decisions` | Idempotent user choice or completion record per node |
| `lesson_scrims` | Curated timeline-based scrims |
| `user_workspace_snapshots` | Latest recovery state for node or scrim workspaces |
| `user_scrims` | User-owned saved scrim variants |
| `scrim_checkpoints` | Internal timeline and file recovery points |
| `sandbox_sessions` | Mapping to active Daytona sandboxes |
| `tts_cache` | Server-managed TTS storage metadata |

### 10.3 Target persistence additions

Future migrations should add only what the unified behavior requires, likely:

- verification evidence and result
- checkpoint completion status
- concept tags and coverage state
- prerequisite metadata
- offered/deferred choice history
- sandbox restoration metadata if current records are insufficient

Exact schema changes must follow repository migration conventions and preserve RLS.

### 10.4 Workspace storage policy

RoadRunners does not impose arbitrary product limits before usage requires them. Use Supabase Database and Storage as needed while keeping the implementation observable and recoverable.

- Store practical text workspaces in the existing JSONB model.
- Store binary or large assets in private Supabase Storage.
- Monitor workspace size, snapshot growth, database row size, storage use, and restoration latency.
- Prefer incremental or pruned recovery history when real usage becomes excessive.
- Introduce configurable safeguards only when measured usage, cost, performance, or provider constraints justify them.
- Never discard the latest recoverable user work silently.
- Surface actionable warnings before rejecting or pruning user data.

### 10.5 Recovery and completion terminology

- **Roadmap checkpoint:** the user-facing journey node.
- **Workspace recovery snapshot:** automatic or manual file/editor recovery state, currently represented by `user_workspace_snapshots`.
- **Scrim recovery point:** timeline and file resume state, currently represented internally by `scrim_checkpoints`.
- **Completion record:** objective-pass or user-confirmed completion of a roadmap checkpoint.

Database table names may retain existing terminology for compatibility, but UI copy, schemas, and analytics must keep recovery state separate from roadmap checkpoint completion.

---

## 11. Authentication, RLS, and security

### 11.1 Authentication

- Supabase Auth supports Google OAuth and email authentication.
- Server-side authorization uses `getUser()` or equivalent verified identity.
- Middleware refreshes sessions and protects private routes.

### 11.2 Row-level security

- Enable RLS on every user-data table in an exposed schema.
- A user may only access their own profile, roadmaps, decisions, workspaces, scrims, checkpoints, and sandbox-session records.
- Nested records derive ownership through `journeys.user_id`.
- Public catalog or lesson reads must be intentionally scoped.
- Update policies require ownership checks for both existing and resulting rows.

### 11.3 Secrets

The following remain server-only:

- Supabase service-role key
- LLM provider keys
- Daytona key
- ElevenLabs key
- SMTP credentials

No secret may use a `NEXT_PUBLIC_` prefix.

### 11.4 Generated content and code

- Validate all model output with Zod after the complete structured response is available.
- Sanitize generated Markdown with `rehype-sanitize`.
- Run user and generated code only inside isolated Daytona sandboxes.
- Apply execution timeouts and rate limits.
- Do not expose arbitrary internal sandbox URLs without access controls.
- Keep TTS assets in private storage and serve signed URLs.

### 11.5 Transactional and idempotent behavior

The node-persistence flow is:

```text
generate
  → complete structured response
  → Zod validation
  → insert node and choices
  → update current node
  → record completion/XP when applicable
```

Mutations must avoid duplicate decisions, duplicate checkpoints, and partial graph updates.

---

## 12. AI and voice provider architecture

### 12.1 Generation provider

All generation flows use a provider-neutral interface:

```ts
interface GenProvider {
  generate(request: {
    system?: string;
    messages: { role: "user" | "assistant"; content: string }[];
    stream?: boolean;
    json?: boolean;
    maxTokens?: number;
  }): Promise<string> | AsyncIterable<string>;
}
```

Generation responsibilities include:

- roadmap title
- next-node and feature choices
- guide steps
- hints
- bounded plausibility verification

Only provider adapters import vendor-specific SDKs.

### 12.2 Canonical environment convention

The existing RoadRunners convention remains canonical:

```text
CHIKKY_AI_PROVIDER
CHIKKY_AI_MODEL
CHIKKY_AI_API_KEY
```

Do not introduce a parallel `GEN_PROVIDER` configuration unless a deliberate migration removes the old convention.

### 12.3 Voice provider

Voice uses a replaceable adapter, with ElevenLabs as the current implementation.

Requirements:

- narration is optional
- cached audio is preferred
- cache metadata lives in Supabase
- MP3 files live in private Supabase Storage
- authenticated clients receive short-lived signed URLs
- unavailable TTS never blocks learning or completion

---

## 13. Coverage and progression

### 13.1 Coverage states

Each concept may have one of these highest-achieved states:

| State | Meaning |
|---|---|
| `introduced` | Appeared in a guide, lesson, or scrim |
| `practiced` | The user edited or ran code related to the concept |
| `verified` | A completed feature involving the concept passed objective verification |

Coverage is descriptive. The UI must not label it as mastery, certification, or employability proof.

### 13.2 Concept vocabulary

Initial controlled tags:

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

The vocabulary may be extended deliberately through schema and prompt updates. Models must not invent arbitrary tags in persisted output.

### 13.3 XP and streaks

XP is awarded from real events:

- selecting or exploring a path
- finishing a scrim
- successful execution
- objective or user-confirmed feature completion
- milestone completion
- streak maintenance

Rules:

- Completion records remain authoritative.
- XP does not unlock nodes directly.
- Objective completion earns more XP than passive consumption.
- User-confirmed completion may earn less verification XP than an objective pass.
- User-confirmed completion advances the roadmap but does not promote concept coverage to `verified` without objective evidence.
- Streak calculations use UTC day boundaries and `last_activity_at`.

---

## 14. Routes and runtime contracts

### 14.1 Current application routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Authentication |
| `/onboarding` | Private | Redirect/compatibility route |
| `/roadmap/new` | Private | Bubble roadmap creator |
| `/journey` | Private | Roadmap dashboard |
| `/journey/[id]` | Private | Current journey step |
| `/journey/[id]/map` | Private | Journey graph |
| `/journey/[id]/scrim/[scrimId]` | Private | Curated scrim |
| `/journey/[id]/scrims` | Private | User scrim library |
| `/journey/[id]/my-scrim/[userScrimId]` | Private | Saved user scrim |
| `/api/ai/next-node` | Private | Generate or return the next node |
| `/api/runner/exec` | Private | Execute files through the configured runner |
| `/api/tts/scrim-caption` | Private | Generate or retrieve narration |
| `/api/health` | Public | Health check |

### 14.2 Target API surface

The target behavior may be implemented through current routes, server actions, or focused additions:

| Operation | Contract |
|---|---|
| Create roadmap | Goal and interests → journey, first node, sandbox prewarm |
| Generate path | Journey ID → up to three validated choices |
| Stream guide | Journey/node/feature context → NDJSON `GuideStep` stream |
| Execute | Journey, sandbox session, files, entrypoint → stdout/stderr/exit code |
| Preview | Journey and port → protected preview URL |
| Verify | Journey, checkpoint/node, files, expectations → objective evidence plus optional AI advisory |
| Save workspace | Journey/node/scrim and files → recovery snapshot |
| Complete checkpoint | Journey/node/evidence/user confirmation → completion and coverage update |
| Get coverage | Journey ID → concepts and states |

All runtime boundaries must use Zod validation.

---

## 15. Functional modules

The modules describe ownership boundaries, not necessarily top-level folders.

### M0 — Shared schemas and contracts

Owns Zod schemas and inferred TypeScript types for nodes, choices, scrims, workspaces, guides, verdicts, checkpoints, and coverage.

**Done when:** All route and action boundaries validate input and output through shared contracts.

### M1 — Roadmap creator and dashboard

Owns goal capture, skill bubbles, roadmap creation, title generation, first-node creation, and roadmap listing.

**Done when:** A signed-in user can create and reopen multiple roadmaps.

### M2 — Generation provider

Owns provider adapters, configuration, structured output, streaming normalization, and fallback behavior.

**Done when:** Provider/model changes do not require path, guide, or verification logic changes.

### M3 — Path engine

Owns frontier derivation, choice generation, prerequisite checks, deferred resurfacing, and pivot classification.

**Done when:** The same roadmap state consistently produces coherent, achievable choices.

### M4 — Guide and scrim system

Owns dynamic guide steps, curated timeline scrims, captions, slides, progressive hints, and transitions into independent work.

**Done when:** Users can learn through a scrim, pause, edit, resume, and request contextual hints.

### M5 — Daytona sandbox orchestration

Owns sandbox creation, reuse, restoration, execution, preview, timeout, and lifecycle policies.

**Done when:** Supported projects run in Daytona and expired sandboxes restore from Supabase state.

### M6 — Verification

Owns execution checks, test/probe assertions, frontend checks, bounded AI plausibility advice, user-confirmed completion, and evidence persistence.

**Done when:** Broken implementations fail, valid implementations pass, and infrastructure errors remain distinct.

### M7 — Editor and workspace

Owns Monaco, file navigation, terminal, preview, file persistence, and save-state feedback.

**Done when:** Edits survive refresh and can be executed, previewed, and restored.

### M8 — Progression, coverage, and XP

Owns roadmap checkpoint completion records, concept-state aggregation, map status, XP events, levels, and streaks.

**Done when:** Verified work updates the roadmap, coverage, and rewards without conflating them.

### M9 — Voice and audio cache

Owns TTS generation, provider adapter, storage cache, signed URLs, and narration controls.

**Done when:** Captions can be narrated and repeated playback uses cached audio.

### M10 — Session and persistence

Owns authenticated reads/writes, RLS-compatible data access, recovery snapshots, scrim saves, sandbox references, and storage lifecycle.

**Done when:** User data persists across sessions and cross-user access is denied.

---

## 16. Non-functional requirements

### Performance

- No more than three choices are generated per step.
- Stream guides and long model output where it improves perceived latency.
- Prewarm Daytona during roadmap or node setup.
- Parallelize independent generation, sandbox, and TTS work.
- Avoid blocking the UI on optional narration.

### Reliability

- Autosave workspace state after a short debounce.
- Preserve files before destructive transitions.
- Use deterministic fallback nodes and choices.
- Restore expired sandboxes from Supabase.
- Bound retries and execution duration.

### Accessibility

- Mobile-first responsive layouts.
- Minimum 44px touch targets for choices and primary controls.
- Full keyboard operation for roadmap choices and workspace controls.
- Visible focus states.
- Captions remain available when narration is enabled.
- Do not rely on color alone for node or verdict state.

### Cost

- Auto-stop idle sandboxes.
- Reuse active sandbox sessions.
- Cache narration.
- Limit model context and output.
- Monitor checkpoint history and workspace payloads; add safeguards only when actual usage justifies them.

### Observability

Record enough server-side context to diagnose:

- generation fallback use
- validation failure
- sandbox creation and restoration failure
- execution timeout
- verification evidence, AI advisory, user confirmation, and failure reason
- TTS cache hit/miss

Logs must not contain secrets or full private source files by default.

---

## 17. Product states and UX requirements

Every major flow must define:

- empty
- loading
- success
- recoverable error
- unrecoverable error
- authentication expired
- degraded infrastructure

Specific requirements:

- AI fallback nodes carry a “Suggested path” indicator.
- Choice buttons disable after submission.
- Verification displays running, fulfillment evidence, AI advisory, user confirmation, and reason separately.
- Daytona outages show “execution unavailable,” not “your code failed.”
- Workspace save state is visible.
- Archived branches remain visible in the map when useful but are visually de-emphasized.
- Pivot remains secondary to the primary next choices.

---

## 18. Scope and delivery phases

### Current foundation

The repository already includes:

- Next.js application shell and authenticated routes
- Supabase Auth, PostgreSQL, and RLS
- bubble roadmap creator
- roadmap dashboard and journey map
- generated and fallback nodes
- branching decisions, XP, streak, and pivot actions
- interactive playground and Monaco editor
- browser execution support
- optional Daytona Python execution
- timeline scrims and user scrim saves
- workspace recovery snapshots and scrim recovery points
- ElevenLabs narration and Supabase Storage caching
- sanitized Markdown

### Phase 1 — Unify contracts and terminology

- Adopt this document and RoadRunners naming everywhere.
- Define unified node/activity schemas.
- Separate recovery snapshots, roadmap checkpoints, and completion records.
- Add concept and verification contracts.
- Keep existing routes operational.

### Phase 2 — Daytona as canonical runtime

- Expand Daytona execution to all supported templates.
- Add preview orchestration.
- Prewarm per roadmap.
- Restore sandboxes from Supabase files.
- Keep browser execution only as a degraded or development path.

### Phase 3 — Verification and credible completion

- Implement verdict persistence.
- Add objective tests, output checks, and HTTP probes.
- Add bounded frontend AI plausibility advice.
- Distinguish objective passes from user-confirmed completion.

### Phase 4 — Derived frontier and coverage

- Add prerequisite and offer-history metadata.
- Derive frontier from existing graph records.
- Generate choices from the frontier.
- Track introduced, practiced, and verified concepts.

### Phase 5 — Polish and demo safety

- Rehearse a deterministic money path.
- Cache required narration.
- Prepare fallback choices and scrims.
- Test sandbox recreation.
- Complete accessibility and mobile checks.

---

## 19. Acceptance criteria

### Roadmap creation

- A signed-in user can create a roadmap from free text or a skill bubble.
- The system creates a title, first usable node, and sandbox prewarm request.
- Provider failure results in a validated fallback, not a broken roadmap.

### Choice and path

- Each step offers no more than three choices.
- Choices are persisted or fingerprinted sufficiently to derive deferred state.
- Known unmet prerequisites prevent a feature from being presented as immediately available.
- Every offered pivot explains how the new field contributes to the current project.
- Incompatible pivots remain deferred or locked until they can be incorporated.
- The user decides whether to take any pivot.

### Scrim and guide

- A scrim can play file, focus, caption, slide, and run events.
- Pausing allows editing.
- Progress resumes after refresh.
- Hints can supplement a scrim without replacing its timeline.

### Workspace and sandbox

- Workspace files autosave to Supabase.
- Supported code executes in Daytona with a timeout.
- Web output can be previewed.
- An expired sandbox can be recreated from the latest recovery snapshot.

### Verification

- Verdicts distinguish `runs` from `fulfills`.
- Deliberately broken implementations fail appropriate checks.
- Frontend AI plausibility is labeled as advisory and cannot block a working feature by itself.
- Infrastructure failure does not produce a user-failure verdict.
- Users can confirm completion when code runs and satisfies their requirement despite incomplete automation or contrary AI advice.
- Non-running build code cannot be completed; it can only be saved for recovery.

### Progress and coverage

- Objective or user-confirmed completion creates a completion record for the roadmap checkpoint.
- Coverage distinguishes introduced, practiced, and verified.
- XP is awarded from recorded events but does not control frontier state.
- The journey map reflects decisions and archived pivots.

### Security

- User A cannot read or mutate User B’s roadmap, files, scrims, checkpoints, or sandbox records.
- Provider, Daytona, TTS, SMTP, and service-role secrets remain server-side.
- Generated Markdown is sanitized.
- Model and API inputs are validated.
- Code execution is isolated and rate-limited.

---

## 20. Required QA matrix

### Authentication and RLS

- Google and email sign-in
- expired session handling
- cross-user journey access denial
- cross-user workspace/scrim/checkpoint denial
- service-role key absent from browser bundles

### Generation

- valid structured response
- malformed response triggers fallback
- duplicate choices rejected or normalized
- one to three choices enforced
- unknown concept tags rejected

### Workspace

- save and restore files
- multiple files and active-file state
- large-workspace monitoring and graceful storage behavior
- sandbox expiry and recreation
- timeout and non-zero exit behavior

### Verification

- passing stdout assertion
- failing stdout assertion
- passing HTTP probe
- broken server
- frontend console error
- AI plausibility advisory labeling
- user confirmation when objective automation is incomplete
- AI disagreement does not block a working feature
- Daytona outage

### Scrims and TTS

- pause/save/resume
- customized user scrim
- caption playback
- TTS cache miss then hit
- narration disabled or provider unavailable

### Progression

- idempotent decision
- objective checkpoint completion
- user-confirmed checkpoint completion
- branch
- track pivot
- incompatible pivot remains deferred or locked
- coverage-state promotion
- XP and streak update

---

## 21. Demo path

The stable demo path should show all three core pillars:

1. Land on RoadRunners and explain the learning-to-earning problem.
2. Sign in and create “I want to become a full-stack developer.”
3. Use a React or web skill bubble.
4. Open the generated roadmap and choose from up to three feature outcomes.
5. Use a short timeline scrim or contextual guide.
6. Modify the implementation in Monaco.
7. Run it in Daytona and show terminal or preview output.
8. Verify the feature.
9. Show the completed roadmap checkpoint, XP feedback, and concept coverage.
10. Show the next choices and a possible pivot.
11. Open the journey map to show the accumulated branch.

The preferred deterministic build task is a small web feature with an objective HTTP or output assertion.

---

## 22. Out of scope

Unless explicitly reprioritized:

- payments
- leaderboards
- employer matching
- formal certificates
- claims of skill mastery
- multiplayer editing
- offline execution
- arbitrary unbounded package installation
- multi-turn autonomous verification agents
- a full curriculum CMS
- production git export and repository hosting
- custom sandbox preview domains

---

## 23. Risks and explicit tradeoffs

| Risk | Decision |
|---|---|
| Sandbox latency interrupts the loop | Prewarm, reuse, stream other work, and restore predictably |
| Daytona cost grows with usage | Auto-stop, bounded TTL, and roadmap-level reuse |
| Workspace storage grows too large | Monitor real usage, use Storage for large/binary assets, prune redundant recovery history, and add limits only when justified |
| Generated paths become incoherent | Derive frontier, constrain vocabulary, validate prerequisites, and keep fallbacks |
| Frontend verification overclaims correctness | Keep AI plausibility advisory, preserve objective evidence separately, and allow user confirmation for working requirements |
| Scrims look like independent work | Track introduced, practiced, and verified states separately |
| Large pivots corrupt project coherence | Offer them only when they have a concrete role in the current project; otherwise defer or lock them |
| XP distracts from meaningful progress | Keep XP subordinate to completion and verification records |
| Provider-specific code spreads | Keep vendor SDKs inside adapters |
| Documentation drifts from implementation | Maintain this PRD as authoritative and update Current/Target sections together |

---

## 24. Environment and operational requirements

The PRD preserves the complete environment inventory from the former planning and setup documents. `.env.example` remains the executable configuration template. Values shown here are names and intended roles only; secrets must never be committed.

### Core application and Supabase

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED
```

- `SUPABASE_SERVICE_ROLE_KEY` is server-only and is currently required for server-managed private TTS cache uploads.
- `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` controls whether the Google sign-in option is shown; provider credentials remain configured in Supabase.

### Canonical RoadRunners generation provider

```text
CHIKKY_AI_API_KEY
CHIKKY_AI_MODEL
CHIKKY_AI_PROVIDER
```

These are the canonical application-level generation variables. Provider adapters may internally consume vendor-specific keys, but application logic must not develop a second configuration path.

### Optional provider-adapter keys

Retain support for adapters that use their native provider credentials:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
GOOGLE_API_KEY
XAI_API_KEY
MISTRAL_API_KEY
```

The former generic names are reserved for a deliberate future migration and must not silently compete with the canonical `CHIKKY_AI_*` contract:

```text
GEN_PROVIDER
GEN_MODEL
VOICE_PROVIDER
VOICE_MODEL
```

If these are introduced, the migration must define precedence, update `.env.example`, and remove ambiguity in one release.

### Scrim and workspace behavior

```text
SCRIM_RUNNER
SCRIM_TTS_ENABLED
SCRIM_MAX_CHECKPOINTS
SCRIM_MAX_USER_SCRIMS_PER_JOURNEY
```

- `SCRIM_RUNNER` is a compatibility switch during the Daytona transition. The target production mode routes authoritative execution through Daytona.
- Existing checkpoint-count variables remain supported for current scrim recovery behavior. They are operational defaults, not permanent product-level storage limits.

### Daytona

```text
DAYTONA_API_KEY
DAYTONA_API_URL
DAYTONA_TARGET
DAYTONA_DEFAULT_LANGUAGE
DAYTONA_SANDBOX_TTL_MINUTES
```

### Email authentication

```text
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM
```

All SMTP variables are server-only.

### TTS and private audio cache

```text
ELEVENLABS_API_KEY
ELEVENLABS_VOICE_ID
ELEVENLABS_MODEL_ID
ELEVENLABS_OUTPUT_FORMAT
TTS_STORAGE_BUCKET
```

TTS remains optional for the learning flow. The default bucket name is `tts-cache`, it must be private, and playback uses signed URLs.

### Operational setup

1. Run the current Supabase files in order: `001_initial.sql`, `002_persist_generated_node.sql`, `003_playground.sql`, `004_scrim_sessions.sql`, then `supabase/seed.sql`.
2. Configure Supabase Auth providers and redirect URLs.
3. Create a private `tts-cache` Supabase Storage bucket.
4. Configure Daytona API access and runtime settings.
5. Configure the selected generation and voice provider credentials.
6. Add the same server-only variables to the production host.
7. Copy `.env.example` to `.env.local` for local development.
8. Never commit `.env.local`.

---

## 25. Build principles

- Preserve the existing Next.js, Supabase, Tailwind, shadcn/ui, Zod, and Daytona stack.
- Prefer vertical product slices over isolated infrastructure work.
- Reuse existing journey and scrim systems rather than creating parallel models.
- Keep user language approachable and infrastructure language internal.
- Use simple, inspectable contracts.
- Make completion evidence honest.
- Treat fallback behavior as a product requirement.
- Keep mobile usability and RLS security in the definition of done.

---

*RoadRunners Unified PRD v1.1 — roadmap choice, timeline learning, cloud building, verification, and descriptive coverage in one product.*


# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rlrnzopqpacnwrmvanif.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscm56b3BxcGFjbndybXZhbmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5Mjg1MzUsImV4cCI6MjA5NzUwNDUzNX0.S_ouZ8HsiLncZNkwfZhVdKUouNM_5mmXnlUON2n8yps
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscm56b3BxcGFjbndybXZhbmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTkyODUzNSwiZXhwIjoyMDk3NTA0NTM1fQ.A6Uu5C5BhTeueSHZaue_IkB7smvEZ1VJY3r9TqmDmoo

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth — show buttons in the login UI (credentials live in Supabase, not here)
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true

# Google OAuth setup (credentials go in Supabase, not .env):
# Google Cloud → Credentials → OAuth 2.0 Client ID → type MUST be "Web application"
#   Authorized JavaScript origins: http://localhost:3000
#   Authorized redirect URI (only this one): https://rlrnzopqpacnwrmvanif.supabase.co/auth/v1/callback
# Supabase → Auth → Providers → Google:
#   Client IDs: paste ONLY the Web client ID (not Android/iOS IDs)
#   Client Secret: paste the matching Web client secret (no spaces)
# Supabase → Auth → URL Configuration → Redirect URLs:
#   http://localhost:3000/auth/callback

# Chikky AI (server-only — never NEXT_PUBLIC_)
CHIKKY_AI_API_KEY=AQ.Ab8RN6L4xIVvdWKjEQnYUlJx6wwPu-L1ePu9DKiGPRd1wAPsnw
CHIKKY_AI_MODEL=gemini-2.5-flash
CHIKKY_AI_PROVIDER=gemini

# SMTP (server-only — email sign-in codes via nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ynrdevs@gmail.com
SMTP_PASS=zxidhcyulrcfvhga
SMTP_FROM=RoadRunners <ynrdevs@gmail.com>

DAYTONA_API_KEY=dtn_36b7dacae72f59d4d1360b5136dab16efc6d24c2c7b6b001635b8f178d68e3ba
DATONA_URL=https://app.daytona.io/api
DAYTONA_TARGET=us
DAYTONA_DEFAULT_LANGUAGE=python
DAYTONA_SANDBOX_TTL_MINUTES=30

# ── Scrim runtime ─────────────────────────────────────────────
# browser = Sandpack/Pyodide only (default, no credits)
# daytona = server sandboxes for python (+ future go/shell)
# auto    = browser for react/vanilla, daytona for python
SCRIM_RUNNER=auto
SCRIM_TTS_ENABLED=true
SCRIM_MAX_CHECKPOINTS=5
SCRIM_MAX_USER_SCRIMS_PER_JOURNEY=20

# ── ElevenLabs (server-only — scrim caption narration) ────────
# https://elevenlabs.io/app/settings/api-keys
ELEVENLABS_API_KEY=sk_965ad1d0798f70995ad3d586d84b014beb5094dda3328936
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128

# Optional: Supabase Storage bucket for TTS cache (defaults to tts-cache)
TTS_STORAGE_BUCKET=tts-cache

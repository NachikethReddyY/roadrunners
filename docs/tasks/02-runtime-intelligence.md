# RoadRunners Task 2 — AI, Scrims, Workspace, Daytona, and Verification

> **Work package:** 2 of 3  
> **Suggested branch:** `task/runtime-intelligence`  
> **Primary outcome:** A provider-neutral guidance and execution system where users can learn through optional scrims, author code in a persistent workspace, run it in Daytona, and receive honest verification.  
> **May be developed independently:** Yes, subject to the frozen contracts and file ownership below.

---

## 0. Instructions for the implementing agent

Read this file completely before changing code.

Also read:

- `AGENTS.md`
- `docs/design/DESIGN.md`
- `docs/exploration/exploration-report.html`
- current runtime, AI, scrim, and playground files

Working rules:

1. Work only inside owned paths.
2. Do not create or alter Supabase migrations. Record persistence needs in `docs/handoffs/task-2-integration.md`.
3. Use shared Zod schemas at every HTTP boundary. This task owns only its listed schema files.
4. Daytona is the canonical production execution environment. Browser runners may remain development or degraded fallbacks.
5. AI plausibility is advisory, never the final completion authority.
6. Scrims guide the user; they do not prove independent authorship.
7. Apply command timeouts, bounded retries, authenticated ownership checks, and server-side secret handling.
8. Do not add a second top-level AI configuration convention. `CHIKKY_AI_*` remains canonical.
9. Never log full private source files or secrets.
10. Run `npm run lint` and `npm run build`. Document external-service tests separately when credentials are unavailable.
11. Commit only owned files. Use author `NachikethReddyY <y.nachiketh.reddy@gmail.com>`.

Parallel-work protocol:

- Start from the same agreed base commit as Tasks 1 and 3.
- Do not merge either task branch into this branch while implementation is in progress.
- Shared frozen files are `package.json`, lockfiles, `app/layout.tsx`, `app/globals.css`, `components/ui/**`, `lib/constants/routes.ts`, top-level documentation, and exploration artifacts.
- Request dependencies, route constants, or new shared primitives in the handoff document.
- Final integration order is Task 3, then Task 2, then Task 1, followed by one integration pass that resolves contract wiring and shared files.

---

## 1. Product intent

This package delivers the central build loop:

```text
Feature goal
  → contextual guide
  → optional timeline scrim
  → user-authored workspace edits
  → Daytona run or preview
  → objective verification
  → optional AI plausibility advisory
  → objective or user-confirmed completion through the platform contract
```

The code must run and satisfy the user’s requirement. AI can assess plausibility or identify likely gaps, but it cannot overrule demonstrably working behavior.

---

## 2. Current repository findings

Already implemented:

- OpenAI and Gemini generation adapters through `CHIKKY_AI_*`
- validated fallback nodes
- generated-node persistence through `persist_generated_node`
- Monaco, Sandpack, Pyodide, virtual files, console, and scrim playback
- workspace snapshot and scrim checkpoint actions
- optional Daytona execution
- ElevenLabs caption narration with Supabase Storage caching
- in-memory per-instance rate limiting on AI, runner, and TTS routes

Important gaps and risks:

- Daytona currently uses `codeRun` on one selected file after uploads; it is not yet a complete multi-file command/preview sandbox facade.
- There is no protected web preview orchestration.
- Browser execution is still treated as normal behavior under `SCRIM_RUNNER=auto`.
- Sandbox restoration from the latest durable workspace snapshot is incomplete.
- Sandbox prewarming is not connected to roadmap creation.
- Verification is mostly local/manual or output-target logic and is not persisted as structured evidence.
- AI generation does not yet consume a derived frontier, prerequisite metadata, offer history, or controlled concept coverage.
- There is no guide NDJSON stream.
- Rate limits are process-local and reset across instances.
- TTS can fall back to a large inline data URL; production should prefer private storage and signed URLs.
- `lib/schemas/runner.ts` and `lib/schemas/scrim.ts` represent overlapping runner contracts and need one intentional boundary.

---

## 3. Owned paths

This task has exclusive ownership of:

```text
app/api/ai/**
app/api/runner/**
app/api/tts/**

app/journey/[id]/scrim/**
app/journey/[id]/scrims/**
app/journey/[id]/my-scrim/**

components/playground/**
content/scrims/**

lib/ai/**
lib/config/scrim.ts
lib/daytona/**
lib/playground/**
lib/scrims/**
lib/tts/**

lib/actions/scrim.ts
lib/actions/workspace.ts

lib/schemas/ai.ts
lib/schemas/playground.ts
lib/schemas/runner.ts
lib/schemas/scrim.ts
```

This task may create:

```text
app/api/guide/**
app/api/verify/**
app/api/preview/**
lib/guide/**
lib/verification/**
lib/providers/**
lib/schemas/guide.ts
lib/schemas/verification.ts
docs/handoffs/task-2-integration.md
```

Do not edit:

```text
app/page.tsx
app/roadmap/**
app/journey/page.tsx
app/journey/[id]/page.tsx
app/journey/[id]/map/**
app/auth/**
app/login/**
app/onboarding/**
components/journey/**
components/roadmap/**
components/layout/**
components/auth/**
components/onboarding/**
lib/actions/journey.ts
lib/actions/roadmap.ts
lib/actions/auth.ts
lib/actions/onboarding.ts
lib/auth/**
lib/email/**
lib/gamification/**
lib/journey/**
lib/roadmap/**
lib/supabase/**
lib/schemas/auth.ts
lib/schemas/journey.ts
lib/schemas/onboarding.ts
lib/schemas/profile.ts
lib/schemas/roadmap.ts
lib/schemas/skill.ts
supabase/**
types/database.ts
.env.example
AGENTS.md
README.md
docs/tasks/**
docs/exploration/**
```

---

## 4. Frozen cross-task contracts

### 4.1 Feature and frontier input

Task 3 supplies persisted state; Task 1 displays it.

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

Generation receives the roadmap goal, interests, current node, recent graph context, derived frontier, concept coverage, optional pivot target, and controlled vocabularies. It returns at most three validated choices.

### 4.2 Guide contract

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

The stream format is NDJSON, one validated `GuideStep` per line.

### 4.3 Scrim contract

```ts
type ScrimEvent =
  | { t: number; type: "files"; files: Record<string, string> }
  | { t: number; type: "focus"; path: string }
  | { t: number; type: "caption"; text: string; audioUrl?: string }
  | { t: number; type: "slide"; slideId: string }
  | { t: number; type: "run" };
```

### 4.4 Sandbox contract

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

Daytona SDK details must remain inside the adapter.

### 4.5 Verification contract

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

Task 3 owns durable evidence and completion persistence. This task returns validated evidence and verdict payloads.

---

## 5. Required implementation

### 5.1 Provider-neutral generation

- Keep `CHIKKY_AI_PROVIDER`, `CHIKKY_AI_MODEL`, and `CHIKKY_AI_API_KEY` canonical.
- Keep native adapter fallback support where already implemented.
- Encapsulate OpenAI/Gemini SDK calls.
- Validate complete structured output with Zod.
- Restrict choices to one through three.
- Reject unknown persisted concept tags.
- Avoid duplicate or near-duplicate choices.
- Require an explicit `projectContribution` for every branch and pivot.
- Never offer known locked work as immediately available.
- Use deterministic fallback content when the provider fails or validation rejects output.
- Preserve the “Suggested path” signal.

### 5.2 Guide generation

- Add a provider-neutral guide generator.
- Stream NDJSON where practical.
- Render or emit the first useful step before optional narration completes.
- Use progressive hint levels.
- Include machine-readable expectations for verification.
- Guide failure must not destroy or block an existing checkpoint.

### 5.3 Scrim behavior

- Preserve file, focus, caption, slide, and run events.
- Pausing makes files editable.
- Resume timeline and files from durable recovery state.
- Allow user-owned scrim variants.
- Track the distinction between scrim-provided files and later user edits in emitted metadata where feasible.
- Watching marks concepts introduced; user edits/runs may support practiced state; only objective feature verification supports verified.

### 5.4 Daytona as canonical runtime

Support initially:

- Node.js
- Python
- shell and `curl`
- web preview/headless-browser checks

Lifecycle:

```text
Roadmap or activity
  → platform sandbox-session reference
  → Daytona sandbox
  → restore latest files
  → run / preview / verify
  → persist recovery state and evidence through platform operations
```

Requirements:

- Reuse a valid active sandbox.
- Create when missing or expired.
- Restore files before execution.
- Apply hard command timeouts.
- Use bounded resource and lifetime settings.
- Refresh expiry on legitimate use.
- Auto-stop/delete idle sandboxes in normal operation.
- Return infrastructure errors distinctly.
- Never treat sandbox expiry as loss of user work.
- Provide protected preview URLs; do not expose an unrestricted internal URL.
- Keep browser runners only as explicit development or degraded behavior.

### 5.5 Verification

Layer 1 — execution:

- entrypoint/command
- stdout
- stderr
- exit code
- timeout state

Layer 2 — objective fulfillment:

- stdout assertions
- tests
- HTTP probes
- response-body checks
- expected file/export checks
- browser load and console-error checks

AI advisory:

- at most one bounded model call when objective checks cannot cover a visual/frontend requirement
- labeled as plausibility only
- persisted separately by Task 3
- cannot independently block a working feature

Progression rules returned to consumers:

1. `runs` is false when the execution contract fails.
2. Infrastructure failures set `infrastructureError` rather than blaming user code.
3. Objective pass sets `fulfills` true.
4. Inconclusive automation may still allow Task 1 to request user-confirmed completion if code runs.
5. Non-running code cannot produce a completion-eligible verdict.

### 5.6 TTS

- ElevenLabs remains replaceable behind an adapter.
- Narration remains optional.
- Prefer cached private-storage audio.
- Return short-lived signed URLs.
- Do not block guide, scrim, execution, or completion when TTS fails.
- Avoid production inline audio data URLs except as an explicitly bounded development fallback.

### 5.7 API reliability and security

- Require authenticated users for AI, guide, runner, preview, verify, and TTS routes.
- Validate input and output.
- Confirm journey/node/session ownership through Task 3-compatible access patterns.
- Replace or clearly isolate process-local rate limiting so production can adopt a shared limiter.
- Bound request bodies, model output, commands, and retries based on measured runtime constraints.
- Sanitize generated Markdown before display; current `rehype-sanitize` dependency remains required.
- Do not return provider errors containing secrets or full upstream payloads.

---

## 6. Environment contract

Variable names only; never commit values.

```text
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

Reserved names such as `GEN_PROVIDER`, `GEN_MODEL`, `VOICE_PROVIDER`, and `VOICE_MODEL` must not silently compete with current configuration.

---

## 7. Acceptance criteria

- Provider failure returns validated fallback content.
- Generation returns no more than three coherent feature outcomes.
- Pivot output always explains project contribution.
- Guide steps validate individually and can stream.
- Scrims pause, edit, save, and resume.
- User edits remain distinct from scrim-provided content.
- Supported projects execute in Daytona.
- Multi-file workspaces are restored before execution.
- Web projects have a protected preview path.
- Expired sandboxes recreate from durable state.
- Verdicts separate execution, objective fulfillment, AI advisory, and infrastructure error.
- Deliberately broken code fails the relevant objective check.
- AI disagreement cannot block a working feature by itself.
- TTS failure does not block the learning loop.
- All routes are authenticated, validated, bounded, and secret-safe.

---

## 8. Required tests

Unit/contract:

- provider selection and fallback
- malformed generation output
- one-to-three choice enforcement
- unknown concept rejection
- NDJSON guide parsing
- scrim event application
- verdict construction
- timeout and infrastructure-error mapping
- TTS cache key stability

Integration:

- Daytona create, reuse, expiry, and recreation
- multi-file Node and Python execution
- non-zero exit and timeout
- HTTP probe pass/fail
- frontend console error
- preview access control
- workspace restore
- TTS cache miss then hit
- unauthenticated and cross-user requests
- production rate-limit adapter behavior or documented seam

Manual:

- scrim playback → pause → user edit → run → verify
- browser/degraded mode clearly distinguished from authoritative Daytona execution

---

## 9. Handoff requirements

Create `docs/handoffs/task-2-integration.md` containing:

- commit SHA
- owned files changed
- API endpoints and request/response schemas
- persistence operations required from Task 3
- component props consumed by Task 1
- environment names added or removed
- external-service test matrix
- lint/build results
- unresolved risks

Never include credential values, signed URLs, private source dumps, or provider response bodies.

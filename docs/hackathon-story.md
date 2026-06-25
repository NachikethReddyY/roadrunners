# RoadRunners

> **Tagline:** Scrimba-style CodeCasts inside a branching AI roadmap — so you learn by building, not by tabbing between YouTube and VS Code.

## Inspiration

The junior ladder is gone. Bootcamps hand you a certificate; job listings demand three years of experience. The gap between *learning* and *earning* is wider than it's ever been — and most tools make it worse.

**Tutorial hell is the default.** You watch a forty-minute video, copy code into VS Code, tab back to the tutorial, lose your place, forget what the instructor just said, and repeat. Modern editors are incredible at *writing* code — autocomplete, refactors, terminals, extensions — but they were never built to *teach*. There is no narrated walkthrough baked into the workspace. No audio overview while the editor updates in sync. No pause-and-try moment where the lesson stops and *you* take over. Learning stays slower than it should be because the medium fights you: passive video on one screen, active coding on another, with nothing connecting them.

We wanted a place where **AI can teach properly** — not as a chat sidebar that spits answers, but as a guided experience inside the environment where you actually build. That led us to Scrimba. We studied how they teach: one timeline, code that appears step by step, narration that matches what's on screen, and challenges where playback stops until you do the work. We reverse-engineered that teaching process — sync, pause, challenge gates, voiced captions — then asked what they don't give you: **a map**. Scrimba is a lesson; RoadRunners is a journey. We added branching roadmaps so learners aren't locked to one curriculum. You pick your goal, choose what to build next, pivot when your interests change, and still get Scrimba-quality "watch → understand → type → run" moments along the way.

The broader inspiration was HackTheBox — per-user environments you build *inside* — crossed with choose-your-own-adventure branching. You write real code in a real sandbox. An AI checks your work. No gatekeeping, no prescribed order, no conveyor belt.

Underneath it all is a design choice we kept coming back to: **most AI products build a harness for the model to do work** (write the PR, pass the tests, ship the feature). RoadRunners builds a **harness for the model to teach you** — bounded steps, synced narration, challenge gates, frontier state, verification that proves *you* ran the code. The AI is on a leash, but the leash points at the learner, not the codebase.

## What it does

RoadRunners is a non-linear, project-based coding platform where **you choose what to build at every step** — and **learn the way your brain actually works**: hear it, see it, type it, run it.

1. **Choose your own journey.** Pick a platform and language, state a goal, then choose from a small set of currently-valid features to build next. Deferred options resurface later. No locked syllabi — just a roadmap you can see and steer.

2. **CodeCasts: Scrimba-style lessons inside the editor.** Narrated coding lessons play through a synced timeline — captions, slides, code appearing line by line, auto-run at the right moment. Optional ElevenLabs voiceover with baked audio for demo reliability. When a **challenge** hits, audio stops, the editor unlocks, and you must edit and run (or consciously skip). This is the feature VS Code will never ship: teaching and coding in one surface, with audio overview so you're not decoding a silent diff.

3. **Code what you want — the harness checks your work.** Outside CodeCasts, you write your own implementation in a cloud sandbox (Monaco + live terminal, Daytona-backed bash when configured). A verification layer runs your code, probes it, and gives an honest verdict — built to confirm *your* progress, not to auto-complete the project for you.

4. **See everything you covered.** After each verified checkpoint, a coverage map shows the programming concepts you've actually exercised — descriptively, not as a grade.

Gamification keeps momentum: XP, levels, streaks, and a visual journey map that branches when you pivot (e.g. React → Swift). Every step is yours to own.

## How we built it

**Frontend:** Next.js 16 App Router, Tailwind CSS v4, shadcn/ui, Monaco embedded in the workspace. A full design system (Trail Amber, stroke SVG icons, warm dark mode, 44px touch targets) lives in `docs/design/DESIGN.md`.

**CodeCast pipeline:** Timeline events (`files`, `focus`, `caption`, `slide`, `run`, `challenge`) drive the player. The scrim player syncs code edits, slides, and auto-run to a single clock — `requestAnimationFrame` when a full lesson MP3 is playing, so narration and screen never drift. Challenges pause playback, show a skip dialog on resume, and complete when the learner runs their code. Public demo at `/test` (Hello Python) works without sign-in.

**Voice with ElevenLabs:** CodeCasts are meant to be *heard*, not read in silence. We use [ElevenLabs](https://elevenlabs.io) server-side (`ELEVENLABS_API_KEY` never touches the client) to generate MP3 narration from caption text. Each caption carries optional `speech` copy tuned for TTS — `print()` becomes “print, open parenthesis”; f-strings and variable names are spoken naturally instead of read as symbols. Two generation paths:

- **Bake-time (demo-safe):** `npm run bake:scrim-narration` sends the full lesson script to ElevenLabs once, stitches the MP3 (including pause padding at challenges), and writes to `public/audio/scrims/`. The `/test` demo plays these files directly — no API call, no auth, no demo-day latency.
- **Runtime (signed-in):** `POST /api/tts/scrim-caption` calls ElevenLabs on first play, caches the MP3 in Supabase Storage or Cloudflare R2 (content-addressed by voice + text hash), and returns a signed URL. Replay is free and instant.

Learners toggle narration with the headphones control; the player drives timeline position from the lesson audio so code appears in step with the voice.

**Backend:** Supabase PostgreSQL + RLS. Provider-agnostic `GenProvider` for journey AI — swap `CHIKKY_AI_PROVIDER` with one env var. TTS cache metadata lives in the `tts_cache` table; object storage holds the actual MP3s.

**Sandbox:** Daytona cloud sandboxes, prewarmed on goal submit. Fat base image: Node, Python, headless browser. `writeFiles → exec → previewUrl → snapshot` lifecycle, hard timeouts, demo-safe fallbacks to in-browser Pyodide when Daytona isn't configured.

**The teaching harness (not an agent harness):** We treat the product as **harness engineering for pedagogy**. An agentic coding harness optimizes for autonomy: more tool calls, more files changed, merge when green. Ours optimizes for **human learning**:

- **CodeCast timeline** — the model doesn't freestyle; it follows `files → caption → run → challenge` events synced to audio. The harness is the player.
- **Frontier state** — the path engine reads `{ taken, unlocked, deferred, locked }`, not chat history. The model proposes ≤3 next features; it cannot skip prerequisites or dump a whole curriculum.
- **Two-tier verification** — objective run + probe first; one bounded semantic judgment only when needed. The harness says *whether you learned*, not *whether the AI finished*.
- **Challenge gates** — playback stops; the human must type, run, or explicitly skip. The harness refuses to narrate past practice.

Same LLMs and sandboxes as the agentic world — different contract. **Constrain the AI so the human does the learning.**

**Data model:** `profiles`, `journeys`, `journey_nodes`, `journey_choices`, `decisions`, `skill_catalog`, plus `lesson_scrims`, `scrim_checkpoints`, `user_scrims` for save/resume. Code stays in the sandbox; checkpoints capture timeline position and files.

## Challenges we ran into

- **Integration seams show.** CodeCasts, journey choices, Daytona runs, verification, and coverage are real — but they don't always feel like one product yet. `/test` is public; the signed-in journey is a different path. Voice, sandbox, and roadmap sometimes need separate toggles and env vars. We shipped vertical slices; polish is what's left.
- **Tutorial hell isn't a content problem — it's a medium problem.** Fixing it meant owning the player, the timeline, and the editor in one app. We couldn't bolt narration onto Monaco; we had to build a scrim engine.
- **Audio and screen must share one clock.** Browser `timeupdate` was too coarse; lesson playback drifted from code updates. We moved to `requestAnimationFrame` sync so captions, file patches, and runs land on time.
- **Sandbox cold-start latency.** Prewarm on goal submit, not on Run. Hide the wait behind onboarding.
- **Verification that doesn't hallucinate.** Objective execution first; semantic judgment only when needed, one bounded call.
- **Frontier coherence without chat history.** Typed `{ taken, unlocked, deferred, locked }` frontier state.
- **Demo-safe voice.** Bake MP3s for the money path; R2 or Supabase for cache; fall back gracefully.
- **Editors teach vs. editors edit.** VS Code optimizes for professionals who already know the syntax. We optimized for learners who need narration, pacing, and a challenge gate — then handed them a real terminal when they're ready.

## Accomplishments that we're proud of

- **A teaching harness, not a coding agent** — AI constrained by timeline, frontier, verification, and challenge gates so the human stays in the loop.
- **Escaping tutorial hell** with in-editor CodeCasts — audio, timeline, challenges — not another passive video tab.
- **Scrimba's teaching loop, plus roadmaps** — reverse-engineered sync-and-challenge pedagogy, added non-linear journeys and pivots on top.
- **Genuinely non-linear paths** driven by real execution, not quizzes or scrubbing.
- **Two-tier verification** with honest labeling in the UI.
- **Provider-agnostic AI** — swap LLM or TTS with env vars.
- **Full design system** with explicit empty/loading/error states.
- **Pivot tracks** — soft-archive orphaned subtrees; the map tells a true story.

## What we learned

- **Harness engineering has two flavors.** Agent harnesses maximize what the model can do alone. A **teaching harness** maximizes what the *learner* must do — run code, pass probes, sit through challenges, choose the next feature. We learned to design contracts (timeline schema, frontier types, verdict tiers) that keep the AI useful without letting it become a homework-completion bot.

- **Constraints are a feature.** The CodeCast player, ElevenLabs `speech` text, challenge pause, and single-call verification felt limiting at first. They're why demos stay predictable and why learners actually practice instead of watching the model type.

- **The best IDE for learning isn't the best IDE for shipping.** Learners need pause, voice, and forced practice. Professionals need speed. We chose the learner — even when that meant a wonkier, more integrated-by-hand stack than a single polished IDE extension.

- **Frontier state beats conversation history.** Path engines that read chat drift. A typed `{ taken, unlocked, deferred, locked }` frontier is smaller, auditable, and exactly what a teaching harness needs to offer the *right* next step.

- **Voice is part of the harness, not wallpaper.** ElevenLabs narration is gated behind the same clock as code edits. Bake MP3s for demos; cache at runtime for signed-in users. Without audio, you're back to tutorial hell — silent diffs and tab-switching.

- **Vertical slices ship; integration is the hard second half.** We proved CodeCasts, roadmaps, sandboxes, and verification separately. Honest takeaway: the hackathon MVP works, but the glue — one flow from onboarding → CodeCast → build → verify → next choice without context switches — still needs work.

- **Scrimba proved the pedagogy; we proved the harness.** One lesson is craft. A branching roadmap with AI bounded by frontier + verification is systems design.

## What's next for RoadRunners

**Theme: smoother, more integrated, less wonky.** The pieces exist; the product should feel like one continuous journey.

- **Unify the flows** — one signed-in path where CodeCasts, workspace, verification, and next-choice panels share state without jumping between routes, modes, or runner fallbacks (Pyodide vs Daytona).
- **Seamless voice** — narration on by default when available; fewer manual headphones toggles; generated lessons wired through the same bake + cache pipeline as Hello Python.
- **Tighter challenge → verify loop** — after a CodeCast challenge or a build step, verification and coverage should appear in-place, not as a separate mental model.
- **Cross-session resume** — checkpoints and user scrims are started; persistent sandbox + timeline resume across days so learners don't lose progress.
- **More CodeCasts** — JS/React lessons on the same timeline + ElevenLabs pipeline.
- **Polish the journey map** — richer branching visualization, clearer pivot and archived-branch story.
- **Later:** employer-facing coverage, cohorts, adaptive difficulty — after the core loop feels smooth.

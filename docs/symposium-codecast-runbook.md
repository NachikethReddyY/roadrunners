# Symposium CodeCast Runbook

Use this as the quick demo guide for RoadRunners' interactive learning features.

## Demo Name

Call the experience **CodeCasts**.

Internal files, routes, and database tables may still say `scrim`; that was the original implementation name. In the product UI and spoken demo, use CodeCast.

## Pre-Demo Checks

Run:

```bash
npm run check:codecasts
npm run lint
npx tsc --noEmit
npm run build
```

If Cloudflare R2 is enabled:

```bash
TTS_STORAGE_BACKEND=r2 npm run check:codecasts -- --live-r2 --strict
```

Expected local result before R2 is switched on:

- Supabase env is present.
- ElevenLabs is present if voiceover is part of the demo.
- Daytona is present if server Python sandboxes are part of the demo.
- `TTS_STORAGE_BACKEND=supabase` is acceptable until the Cloudflare R2 bucket/token are created.

## Demo Path

1. Open RoadRunners and sign in.
2. Create or open a journey.
3. On the current journey page, click **CodeCasts** or a **CodeCast: ...** pill.
4. Start with the Python CodeCast because it shows the full story: narration, timeline, editor, terminal, and execution.
5. Click Play.
6. Pause midway and explain that pause mode unlocks editing.
7. Change the name or message in the editor.
8. Click Run.
9. Save progress or use **Save CodeCast**.
10. Refresh/reopen to show resume.

## What Each Feature Proves

### Code Editor Experience

The CodeCast workspace combines:

- Monaco editor
- file explorer
- tabs
- terminal
- slide notes
- timeline player
- run controls

When the CodeCast plays, the editor is read-only and follows the lesson. When paused, users can edit and run the code themselves.

### Voice Over / Narration

Caption events can be spoken through ElevenLabs. The app asks for audio through `/api/tts/scrim-caption`, then caches MP3s so repeated captions do not spend credits again.

Cache backend:

- Supabase Storage by default
- Cloudflare R2 when `TTS_STORAGE_BACKEND=r2`

The bucket stays private. The app returns short-lived signed URLs.

### Save States & Resume

Save/resume uses Supabase:

- `scrim_checkpoints` stores timeline, files, and active file.
- `user_scrims` stores saved CodeCasts.
- `user_workspace_snapshots` stores editable workspace state.

Pausing auto-saves. Manual save gives the user confidence before refresh or device switch.

### Daytona Sandboxes

Python CodeCasts use Daytona when:

```bash
SCRIM_RUNNER=auto
DAYTONA_API_KEY=...
```

If Daytona is missing, unauthenticated, or unavailable, the app falls back to browser Python through Pyodide. This keeps the demo reliable while still allowing a real Daytona-backed path when configured.

## Fallback Script

If narration fails:

> The CodeCast still works interactively. Voiceover is optional and server-side; we cache it in Storage/R2 when credentials are available.

If Daytona fails:

> The editor falls back to browser execution, so learners can keep coding. Daytona upgrades Python runs to a server sandbox when the key is present.

If R2 is not set up:

> Supabase Storage is the default cache today. R2 support is wired and has a live smoke-test command; switching is an environment change after the bucket/token are created.

If auth or Supabase is slow:

> Use `/test` for the public CodeCast preview. It exercises the editor, timeline, terminal, and Pyodide fallback without auth.

## Public Preview

The public preview route is:

```text
/test
```

It is useful for projector checks because it does not require login. It should:

- render the Python CodeCast
- play the timeline
- auto-run the scripted Python
- print `Hello, learner!`
- print `Welcome to Python on RoadRunners`

## Final Demo Checklist

```text
[ ] npm run check:codecasts
[ ] npm run build
[ ] /test preview works on projector
[ ] Signed-in journey opens CodeCasts page
[ ] Python CodeCast plays
[ ] Pause enables editing
[ ] Run prints terminal output
[ ] Save checkpoint works
[ ] Refresh resumes timeline/files
[ ] Listen works if ElevenLabs is enabled
[ ] R2 live smoke test passes if TTS_STORAGE_BACKEND=r2
```

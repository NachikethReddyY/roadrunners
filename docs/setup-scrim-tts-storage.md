# Your Setup Checklist - CodeCasts, TTS Cache, Daytona, R2

What you need to do outside the codebase: Supabase, environment variables, an optional audio cache bucket, and optional API keys. The app code is wired; these steps turn the features on.

## Quick Mental Model

- **CodeCasts**: narrated coding lessons with play/pause, editable code, save/resume, and a library.
- **Save/resume**: Supabase database tables store checkpoints, user CodeCasts, and workspace snapshots.
- **Narration**: ElevenLabs generates MP3s once, then the app caches them in Cloudflare R2 or Supabase Storage.
- **Daytona**: optional server sandboxes for Python execution. JS/React lessons keep using the browser.

Internal routes and table names still use `scrim` because that was the original implementation name.

## 1. Supabase - Run Migrations

In Supabase Dashboard -> your project -> SQL Editor, run in order:

```text
supabase/migrations/001_initial.sql
supabase/migrations/002_persist_generated_node.sql
supabase/migrations/003_playground.sql
supabase/migrations/004_scrim_sessions.sql
supabase/seed.sql
```

Migration `004_scrim_sessions.sql` adds:

- `user_scrims`
- `scrim_checkpoints`
- `tts_cache`
- `sandbox_sessions`

## 2. Supabase - API Keys

Dashboard -> Settings -> API:

| Copy into `.env.local` | Where |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key, server only |

The service role key is required for the TTS cache metadata table and for Supabase Storage if you use that backend. Never expose it through `NEXT_PUBLIC_*`.

## 3. Pick A TTS Cache Backend

Cloudflare R2 is recommended for the Symposium demo. Supabase Storage still works and remains the default.

### Option A: Cloudflare R2

1. Cloudflare Dashboard -> R2 Object Storage -> create a bucket named `roadrunners-tts-cache`.
2. Keep the bucket private.
3. Create an R2 API token with Object Read & Write access scoped to that bucket.
4. Copy the Account ID, Access Key ID, and Secret Access Key into `.env.local`.

```bash
TTS_STORAGE_BACKEND=r2
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_R2_BUCKET=roadrunners-tts-cache
```

The app uploads MP3s through R2's S3-compatible API and returns short-lived signed URLs for playback. The bucket does not need to be public.

Useful Cloudflare docs:

- R2 bucket creation: `https://developers.cloudflare.com/r2/buckets/create-buckets/`
- R2 API tokens: `https://developers.cloudflare.com/r2/api/tokens/`

### Option B: Supabase Storage

1. Supabase Dashboard -> Storage -> New bucket.
2. Name: `tts-cache`, or set `TTS_STORAGE_BUCKET` to another name.
3. Public bucket: off.
4. Create bucket.

```bash
TTS_STORAGE_BACKEND=supabase
TTS_STORAGE_BUCKET=tts-cache
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

No extra Storage RLS policies are required for the MVP because uploads and signed URLs happen through the server.

## 4. `.env.local`

```bash
cp .env.example .env.local
```

Minimum for CodeCast save/resume:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Narration:

```bash
SCRIM_TTS_ENABLED=true
ELEVENLABS_API_KEY=your-key-here
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128
```

Disable narration:

```bash
SCRIM_TTS_ENABLED=false
```

Daytona:

```bash
SCRIM_RUNNER=auto
DAYTONA_API_KEY=your-key
DAYTONA_API_URL=https://app.daytona.io/api
# Use a target enabled for your Daytona organization.
# If "us" is unavailable for class container, choose another allowed target.
DAYTONA_TARGET=us
DAYTONA_SANDBOX_TTL_MINUTES=30
```

Browser-only execution:

```bash
SCRIM_RUNNER=browser
```

Limits:

```bash
SCRIM_MAX_CHECKPOINTS=5
SCRIM_MAX_USER_SCRIMS_PER_JOURNEY=20
```

## 5. Install And Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, sign in, open a journey, then choose a CodeCast.

## 6. Verify Each Feature

Before clicking through the app, run the local readiness check:

```bash
npm run check:codecasts
```

For a stricter pre-demo gate that exits nonzero on missing required values:

```bash
npm run check:codecasts -- --strict
```

After switching to R2, run the live bucket smoke test:

```bash
TTS_STORAGE_BACKEND=r2 npm run check:codecasts -- --live-r2 --strict
```

The live test uploads a tiny text object to the configured R2 bucket and reads it back through the same signed URL path the app uses for narration audio.

### CodeCast Save And Resume

- [ ] Open `/journey/{id}/scrim/{scrimId}`.
- [ ] Pause the lesson. Progress should auto-save.
- [ ] Change code while paused and tap save.
- [ ] Refresh the page. Timeline and files should resume from the latest checkpoint.
- [ ] Use **Save CodeCast**. It should appear under `/journey/{id}/scrims`.

### Narration

- [ ] Set `ELEVENLABS_API_KEY` and `SCRIM_TTS_ENABLED=true`.
- [ ] Tap the headphones button.
- [ ] Play a captioned lesson. Audio should play with the caption.
- [ ] Confirm an MP3 appears in R2 or Supabase Storage after the first play.
- [ ] Replay the same caption. It should use the cached file instead of regenerating.

### Daytona

- [ ] Set `DAYTONA_API_KEY` and `SCRIM_RUNNER=auto` or `daytona`.
- [ ] Open a Python CodeCast.
- [ ] Click Run.
- [ ] `POST /api/runner/exec` should return 200, not 501.

## 7. Production Deploy

Add the same env vars in your hosting provider:

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Narration: `SCRIM_TTS_ENABLED`, `ELEVENLABS_*`
- Cache backend: either `TTS_STORAGE_BACKEND=r2` plus `CLOUDFLARE_R2_*`, or `TTS_STORAGE_BACKEND=supabase` plus `TTS_STORAGE_BUCKET`
- Daytona: `SCRIM_RUNNER`, `DAYTONA_*`

Redeploy after changing env vars.

## 8. Troubleshooting

| Symptom | Likely fix |
| --- | --- |
| Save CodeCast / checkpoint fails | Run migration `004_scrim_sessions.sql` |
| Listen button missing | Set `ELEVENLABS_API_KEY`; keep `SCRIM_TTS_ENABLED=true` |
| TTS works but regenerates every time | Check `tts_cache`, storage credentials, and bucket name |
| R2 upload fails | Check account ID, bucket name, and Object Read & Write token scope |
| Supabase Storage empty but TTS plays | App fell back to inline audio; check service role key and bucket |
| Python run uses browser only | Set `DAYTONA_API_KEY`; avoid `SCRIM_RUNNER=browser` |
| Daytona says `region US is not available to the organization for class container` | `DAYTONA_TARGET=us` is not enabled for your Daytona organization. Pick an allowed Daytona target, or set `SCRIM_RUNNER=browser` for a reliable demo fallback. |
| 401 on `/api/tts/scrim-caption` | Sign in again |

## 9. Security Reminders

- Never commit `.env.local`.
- Never expose `ELEVENLABS_API_KEY`, `DAYTONA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or R2 secrets in `NEXT_PUBLIC_*`.
- Keep R2 and Supabase Storage buckets private.
- Use scoped R2 tokens instead of account-wide write tokens when possible.

## One-Page Checklist

```text
[ ] Supabase migrations 001-004 + seed
[ ] .env.local: Supabase URL, anon key, service role key
[ ] R2 bucket + scoped R2 token, or private Supabase tts-cache bucket
[ ] .env.local: ELEVENLABS_API_KEY if using Listen
[ ] .env.local: DAYTONA_API_KEY if demoing Python server runs
[ ] npm install && npm run dev
[ ] npm run check:codecasts
[ ] Test CodeCast save/resume + CodeCasts page
[ ] Test Listen + confirm MP3 appears in selected cache backend
[ ] Test Python Run with Daytona when enabled
[ ] Production: same env vars on host
```

For the spoken demo path and fallback script, use `docs/symposium-codecast-runbook.md`.

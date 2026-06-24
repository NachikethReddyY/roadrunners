# Your setup checklist — Scrims, TTS audio cache, Daytona

What **you** need to do outside the codebase: Supabase, env vars, storage bucket, and optional API keys. The app code is already wired; these steps turn it on.

---

## Quick mental model

- **Scrims** (save/resume, library) → Supabase **database** tables
- **TTS MP3s** (listen while learning) → generated once, stored in **Supabase Storage** (cloud), reused on phone + laptop — **not** on your computer
- **Daytona** (optional) → server Python sandboxes; JS/React still use the browser by default

---

## 1. Supabase — run migrations

In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**, run **in order**:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_persist_generated_node.sql`
3. `supabase/migrations/003_playground.sql`
4. `supabase/migrations/004_scrim_sessions.sql` ← scrim checkpoints, user scrims, TTS cache metadata, Daytona sessions
5. `supabase/seed.sql` (if you haven’t already)

**004 adds:** `user_scrims`, `scrim_checkpoints`, `tts_cache`, `sandbox_sessions`

---

## 2. Supabase — API keys for `.env.local`

Dashboard → **Settings** → **API**:

| Copy into `.env.local` | Where |
|------------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key (server only — never commit, never `NEXT_PUBLIC_`) |

The **service role key** is required for uploading TTS MP3s to Storage. Without it, narration may still work but audio won’t persist in the cloud (more ElevenLabs credits over time).

---

## 3. Supabase Storage — TTS MP3 bucket (important for phone + laptop)

This is how the same MP3 is reused everywhere without regenerating.

1. Dashboard → **Storage** → **New bucket**
2. Name: `tts-cache` (or another name — if so, set `TTS_STORAGE_BUCKET` in `.env.local`)
3. **Public bucket: OFF** (private)
4. Create bucket

You do **not** need public URLs. The app uploads via service role and gives logged-in users **short-lived signed URLs** (~1 hour) to play audio.

No extra Storage RLS policies are required for the MVP: uploads go through the server with the service role, not the browser.

---

## 4. `.env.local` — copy from `.env.example`

```bash
cp .env.example .env.local
```

### Minimum to use scrims (save / resume / library)

Already covered if Supabase + migrations are done. No extra keys.

### TTS narration (ElevenLabs + cloud cache)

```bash
SCRIM_TTS_ENABLED=true
ELEVENLABS_API_KEY=your-key-here
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb   # optional; change at elevenlabs.io voice library
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128
TTS_STORAGE_BUCKET=tts-cache
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get ElevenLabs key: [elevenlabs.io → Settings → API Keys](https://elevenlabs.io/app/settings/api-keys)

To disable narration entirely:

```bash
SCRIM_TTS_ENABLED=false
```

### Daytona (optional — Python server runs)

Only needed if you want Python executed on Daytona instead of Pyodide in the browser.

```bash
SCRIM_RUNNER=auto          # python → Daytona when key set; JS/React → browser
DAYTONA_API_KEY=your-key
DAYTONA_API_URL=https://app.daytona.io/api
DAYTONA_TARGET=us
DAYTONA_SANDBOX_TTL_MINUTES=30
```

Get key: [app.daytona.io](https://app.daytona.io) → Settings → API Keys

Browser-only (no Daytona credits):

```bash
SCRIM_RUNNER=browser
```

**Note:** `DAYTONA_DEFAULT_LANGUAGE=python` in `.env.example` is unused today; lesson language comes from the scrim template (`python` / `javascript` / `typescript`).

### Scrim limits (optional)

```bash
SCRIM_MAX_CHECKPOINTS=5
SCRIM_MAX_USER_SCRIMS_PER_JOURNEY=20
```

---

## 5. Install and run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, sign in, open a journey → **Scrim: …** link or **Your scrims**.

---

## 6. Verify each feature

### Scrims — save & resume

- [ ] Open `/journey/{id}/scrim/{scrimId}`
- [ ] Pause the lesson → progress auto-saves (or tap **Save**)
- [ ] Refresh page → should resume timeline + files (“Resuming from saved progress”)
- [ ] **Save as scrim** → appears under `/journey/{id}/scrims`

### TTS — listen mode

- [ ] `ELEVENLABS_API_KEY` set, `SCRIM_TTS_ENABLED=true`
- [ ] On scrim player, tap **headphones** (Listen)
- [ ] Play lesson → caption audio plays
- [ ] Supabase → **Storage** → `tts-cache` → new `.mp3` files after first play
- [ ] Same caption on another device (same account) → should **not** call ElevenLabs again (check Storage; file already exists)

### Daytona (optional)

- [ ] `DAYTONA_API_KEY` set, `SCRIM_RUNNER=auto` or `daytona`
- [ ] Open a **Python** scrim, click **Run**
- [ ] Network tab: `POST /api/runner/exec` returns 200 (not 501)

---

## 7. Production deploy (Vercel etc.)

Add the same env vars in the hosting dashboard (not only `.env.local`):

- Required: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` (if using TTS cache)
- TTS: `ELEVENLABS_*`, `SCRIM_TTS_ENABLED`, `TTS_STORAGE_BUCKET`
- Optional: `DAYTONA_*`, `SCRIM_RUNNER`

Redeploy after changing env vars.

---

## 8. Cloudflare R2 — do you need it?

**Not for MVP.** Supabase Storage already caches MP3s in the cloud for all your devices.

Consider R2 later if:

- You outgrow Supabase free storage, or
- You want more headroom (~10GB free) and zero egress fees

Same idea: private bucket, server uploads, signed URLs after login. Would be a code change to swap the storage backend — not required for you to configure now.

---

## 9. Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| Save scrim / checkpoint fails | Run migration `004_scrim_sessions.sql` |
| Listen button missing | `SCRIM_TTS_ENABLED` not `false`; page needs `ttsAvailable` (ElevenLabs key set) |
| TTS works once, regenerates every time | `SUPABASE_SERVICE_ROLE_KEY` missing/wrong; or `tts-cache` bucket missing |
| Storage empty but TTS plays | Fallback inline audio (no persistent cache) — fix service role + bucket |
| Python run uses browser only | No `DAYTONA_API_KEY` or `SCRIM_RUNNER=browser` |
| 401 on `/api/tts/scrim-caption` | Not signed in |

---

## 10. Security reminders

- Never commit `.env.local`
- Never put `ELEVENLABS_API_KEY`, `DAYTONA_API_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_*`
- Keep `tts-cache` bucket **private**

---

## One-page checklist

```
[ ] Migrations 001–004 + seed in Supabase SQL Editor
[ ] .env.local: SUPABASE URL, anon key, service role key
[ ] Storage bucket: tts-cache (private)
[ ] .env.local: ELEVENLABS_API_KEY (if using Listen)
[ ] .env.local: DAYTONA_API_KEY (optional, Python server runs)
[ ] npm install && npm run dev
[ ] Test scrim save/resume + Your scrims page
[ ] Test Listen + confirm MP3 appears in Storage
[ ] Production: same env vars on host
```

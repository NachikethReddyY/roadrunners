#!/usr/bin/env node
/**
 * Bake ElevenLabs MP3s for scrim captions → public/audio/scrims/{slug}/
 * Updates content/scrims/{slug}.json with audio_url on each caption event.
 *
 * Usage: npm run bake:scrim-audio -- hello-python
 * Requires ELEVENLABS_API_KEY in .env (loaded via dotenv not installed — read .env manually)
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2] ?? "hello-python";
const root = process.cwd();
const jsonPath = join(root, "content", "scrims", `${slug}.json`);
const outDir = join(root, "public", "audio", "scrims", slug);

function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env"), "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env */
  }
}

loadEnv();

const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || "JBFqnCBsd6RMkjVDRZzb";
const modelId = process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_multilingual_v2";
const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT?.trim() || "mp3_44100_128";

if (!apiKey) {
  console.error("ELEVENLABS_API_KEY missing in .env");
  process.exit(1);
}

const scrim = JSON.parse(readFileSync(jsonPath, "utf-8"));
const events = scrim.timeline?.events ?? [];
mkdirSync(outDir, { recursive: true });

let idx = 0;
for (const event of events) {
  if (event.type !== "caption") continue;
  const speech = event.speech ?? event.text;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({ text: speech, model_id: modelId }),
    }
  );
  if (!res.ok) {
    console.error(`TTS failed for caption ${idx}:`, await res.text());
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const hash = createHash("sha256").update(speech).digest("hex").slice(0, 12);
  const filename = `${idx}-${hash}.mp3`;
  writeFileSync(join(outDir, filename), buf);
  event.audio_url = `/audio/scrims/${slug}/${filename}`;
  console.log(`✓ ${filename} — ${speech.slice(0, 60)}…`);
  idx += 1;
}

writeFileSync(jsonPath, JSON.stringify(scrim, null, 2) + "\n");
console.log(`\nUpdated ${jsonPath} with ${idx} audio_url entries`);

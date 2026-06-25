#!/usr/bin/env node
/**
 * Bake one continuous ElevenLabs MP3 for a CodeCast narration script.
 *
 * Usage: npm run bake:scrim-narration -- hello-python
 */
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const slug = process.argv[2] ?? "hello-python";
const root = process.cwd();
const jsonPath = join(root, "content", "scrims", `${slug}.json`);
const outDir = join(root, "public", "audio", "scrims", slug);

function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env"), "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* optional */
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
const baseScript = scrim.narration?.script?.trim();
if (!baseScript) {
  console.error(`No narration.script found in ${jsonPath}`);
  process.exit(1);
}

const allScrimFiles = readdirSync(join(root, "content", "scrims"))
  .filter((name) => name.endsWith(".json"))
  .map((name) => {
    const raw = JSON.parse(readFileSync(join(root, "content", "scrims", name), "utf-8"));
    return { slug: raw.slug, title: raw.title };
  });

function inferNextSessionTopic(currentScrim) {
  const explicit =
    currentScrim.narration?.next_session_topic?.trim() ||
    currentScrim.next_session_topic?.trim();
  if (explicit) return explicit;

  const index = allScrimFiles.findIndex((item) => item.slug === currentScrim.slug);
  if (index >= 0 && allScrimFiles[index + 1]?.title) {
    return allScrimFiles[index + 1].title;
  }

  return null;
}

const challengeCount =
  scrim.timeline?.events?.filter((event) => event.type === "challenge").length ?? 0;
const extraPauseMs = challengeCount * 5000;
const nextSessionTopic = inferNextSessionTopic(scrim);
const outroLine = nextSessionTopic
  ? ` In the next session, we are going to learn about ${nextSessionTopic}.`
  : "";
const finalScript = `${baseScript}${outroLine}`.trim();
const maxEventTime = Math.max(
  ...(scrim.timeline?.events?.map((event) => event.t) ?? [0]),
  0
);
const extendedDurationMs = maxEventTime + extraPauseMs;

mkdirSync(outDir, { recursive: true });

const res = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`,
  {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: finalScript,
      model_id: modelId,
      voice_settings: {
        stability: 0.58,
        similarity_boost: 0.76,
        style: 0.12,
        use_speaker_boost: true,
      },
    }),
  }
);

if (!res.ok) {
  console.error("TTS failed:", await res.text());
  process.exit(1);
}

const spokenBuf = Buffer.from(await res.arrayBuffer());
const hash = createHash("sha256")
  .update(JSON.stringify({ finalScript, extraPauseMs }))
  .digest("hex")
  .slice(0, 12);
const filename = `lesson-${hash}.mp3`;
const outPath = join(outDir, filename);

if (extraPauseMs > 0) {
  if (!ffmpegPath) {
    console.error("ffmpeg-static is missing; cannot append challenge pause audio");
    process.exit(1);
  }

  const tempDir = mkdtempSync(join(tmpdir(), "rr-scrim-narration-"));
  const spokenPath = join(tempDir, "spoken.mp3");
  writeFileSync(spokenPath, spokenBuf);

  try {
    execFileSync(
      ffmpegPath,
      [
        "-y",
        "-i",
        spokenPath,
        "-f",
        "lavfi",
        "-t",
        String(extraPauseMs / 1000),
        "-i",
        "anullsrc=r=44100:cl=stereo",
        "-filter_complex",
        "[0:a][1:a]concat=n=2:v=0:a=1[a]",
        "-map",
        "[a]",
        "-b:a",
        "128k",
        outPath,
      ],
      { stdio: "ignore" }
    );
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
} else {
  writeFileSync(outPath, spokenBuf);
}

scrim.narration.audio_url = `/audio/scrims/${slug}/${filename}`;
scrim.duration_ms = extendedDurationMs;
scrim.timeline.durationMs = extendedDurationMs;
writeFileSync(jsonPath, JSON.stringify(scrim, null, 2) + "\n");

console.log(`Wrote ${filename}`);
console.log(`Updated ${jsonPath}`);

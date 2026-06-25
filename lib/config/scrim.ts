export type ScrimRunner = "browser" | "daytona" | "auto";
export type TtsStorageBackend = "supabase" | "r2";

function parseRunner(value: string | undefined): ScrimRunner {
  if (value === "daytona" || value === "auto") return value;
  return "browser";
}

export const scrimConfig = {
  runner: parseRunner(process.env.SCRIM_RUNNER),
  ttsEnabled: process.env.SCRIM_TTS_ENABLED !== "false",
  maxCheckpoints: Math.max(1, Number(process.env.SCRIM_MAX_CHECKPOINTS) || 5),
  maxUserScrimsPerJourney: Math.max(
    1,
    Number(process.env.SCRIM_MAX_USER_SCRIMS_PER_JOURNEY) || 20
  ),
  daytona: {
    apiKey: process.env.DAYTONA_API_KEY ?? "",
    apiUrl: process.env.DAYTONA_API_URL ?? "https://app.daytona.io/api",
    target: process.env.DAYTONA_TARGET ?? "us",
    defaultLanguage: process.env.DAYTONA_DEFAULT_LANGUAGE ?? "python",
    sandboxTtlMinutes: Math.max(
      5,
      Number(process.env.DAYTONA_SANDBOX_TTL_MINUTES) || 30
    ),
  },
  tts: {
    apiKey: process.env.ELEVENLABS_API_KEY ?? "",
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb",
    modelId: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
    outputFormat: process.env.ELEVENLABS_OUTPUT_FORMAT ?? "mp3_44100_128",
    storageBackend:
      process.env.TTS_STORAGE_BACKEND === "r2" ? "r2" : "supabase",
    storageBucket: process.env.TTS_STORAGE_BUCKET ?? "tts-cache",
    r2: {
      accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? "",
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "",
      bucket: process.env.CLOUDFLARE_R2_BUCKET ?? "roadrunners-tts-cache",
    },
  },
} as const;

export function shouldUseDaytona(): boolean {
  if (!isDaytonaConfigured()) return false;
  const { runner } = scrimConfig;
  return runner === "daytona" || runner === "auto";
}

export function isDaytonaConfigured(): boolean {
  return Boolean(scrimConfig.daytona.apiKey);
}

export function isTtsConfigured(): boolean {
  return scrimConfig.ttsEnabled && Boolean(scrimConfig.tts.apiKey);
}

export function isR2Configured(): boolean {
  const { r2 } = scrimConfig.tts;
  return Boolean(
    r2.accountId && r2.accessKeyId && r2.secretAccessKey && r2.bucket
  );
}

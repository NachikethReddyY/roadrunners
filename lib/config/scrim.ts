export type ScrimRunner = "browser" | "daytona" | "auto";

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
    storageBucket: process.env.TTS_STORAGE_BUCKET ?? "tts-cache",
  },
} as const;

export function shouldUseDaytona(template: string): boolean {
  const { runner } = scrimConfig;
  if (runner === "browser") return false;
  if (runner === "daytona") return true;
  return template === "python";
}

export function isDaytonaConfigured(): boolean {
  return Boolean(scrimConfig.daytona.apiKey);
}

export function isTtsConfigured(): boolean {
  return scrimConfig.ttsEnabled && Boolean(scrimConfig.tts.apiKey);
}

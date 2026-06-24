import { createHash } from "crypto";
import { scrimConfig, isTtsConfigured } from "@/lib/config/scrim";
import { createAdminClient } from "@/lib/supabase/admin";

export function ttsCacheKey(voiceId: string, text: string): string {
  return createHash("sha256").update(`${voiceId}:${text}`).digest("hex");
}

export async function synthesizeCaption(text: string, voiceId?: string): Promise<Buffer> {
  const { apiKey, modelId, outputFormat } = scrimConfig.tts;
  const voice = voiceId ?? scrimConfig.tts.voiceId;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=${outputFormat}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${detail}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export async function getOrCreateCaptionAudio(
  text: string,
  voiceId?: string
): Promise<{ audioUrl: string; cached: boolean }> {
  if (!isTtsConfigured()) {
    throw new Error("TTS is not configured");
  }

  const voice = voiceId ?? scrimConfig.tts.voiceId;
  const cacheKey = ttsCacheKey(voice, text);
  const bucket = scrimConfig.tts.storageBucket;
  const storagePath = `${cacheKey}.mp3`;

  try {
    const admin = createAdminClient();
    const { data: cached } = await admin
      .from("tts_cache")
      .select("storage_path")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached?.storage_path) {
      const { data: signed } = await admin.storage
        .from(bucket)
        .createSignedUrl(cached.storage_path, 3600);
      if (signed?.signedUrl) {
        return { audioUrl: signed.signedUrl, cached: true };
      }
    }

    const audio = await synthesizeCaption(text, voice);

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(storagePath, audio, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (!uploadError) {
      await admin.from("tts_cache").upsert({
        cache_key: cacheKey,
        storage_path: storagePath,
        voice_id: voice,
        text_hash: createHash("sha256").update(text).digest("hex"),
      });

      const { data: signed } = await admin.storage
        .from(bucket)
        .createSignedUrl(storagePath, 3600);
      if (signed?.signedUrl) {
        return { audioUrl: signed.signedUrl, cached: false };
      }
    }
  } catch {
    // ponytail: fall through to inline data URL if Storage/admin unavailable
  }

  const audio = await synthesizeCaption(text, voice);
  const dataUrl = `data:audio/mpeg;base64,${audio.toString("base64")}`;
  return { audioUrl: dataUrl, cached: false };
}

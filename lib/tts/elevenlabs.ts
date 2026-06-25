import { createHash } from "crypto";
import { captionToSpeechText } from "@/lib/tts/speech-text";
import { isR2Configured, scrimConfig, isTtsConfigured } from "@/lib/config/scrim";
import { createR2SignedUrl, uploadR2Object } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";

export function ttsCacheKey(voiceId: string, text: string): string {
  return createHash("sha256").update(`${voiceId}:${text}`).digest("hex");
}

export async function synthesizeCaption(
  text: string,
  voiceId?: string,
  speechText?: string
): Promise<Buffer> {
  const { apiKey, modelId, outputFormat } = scrimConfig.tts;
  const voice = voiceId ?? scrimConfig.tts.voiceId;
  const spoken = speechText ?? captionToSpeechText(text);

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
        text: spoken,
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
  voiceId?: string,
  speechText?: string
): Promise<{ audioUrl: string; cached: boolean }> {
  if (!isTtsConfigured()) {
    throw new Error("TTS is not configured");
  }

  const voice = voiceId ?? scrimConfig.tts.voiceId;
  const spoken = speechText ?? captionToSpeechText(text);
  const cacheKey = ttsCacheKey(voice, spoken);
  const bucket = scrimConfig.tts.storageBucket;
  const storagePath = `${cacheKey}.mp3`;
  const useR2 = scrimConfig.tts.storageBackend === "r2" && isR2Configured();

  try {
    const admin = createAdminClient();
    const { data: cached } = await admin
      .from("tts_cache")
      .select("storage_path")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached?.storage_path) {
      if (useR2) {
        return {
          audioUrl: createR2SignedUrl(scrimConfig.tts.r2, cached.storage_path, 3600),
          cached: true,
        };
      } else {
        const { data: signed } = await admin.storage
          .from(bucket)
          .createSignedUrl(cached.storage_path, 3600);
        if (signed?.signedUrl) {
          return { audioUrl: signed.signedUrl, cached: true };
        }
      }
    }

    const audio = await synthesizeCaption(text, voice, spoken);
    let uploaded = false;

    if (useR2) {
      await uploadR2Object(scrimConfig.tts.r2, storagePath, audio, "audio/mpeg");
      uploaded = true;
    } else {
      const { error: uploadError } = await admin.storage
        .from(bucket)
        .upload(storagePath, audio, {
          contentType: "audio/mpeg",
          upsert: true,
        });
      uploaded = !uploadError;
    }

    if (uploaded) {
      await admin.from("tts_cache").upsert({
        cache_key: cacheKey,
        storage_path: storagePath,
        voice_id: voice,
        text_hash: createHash("sha256").update(spoken).digest("hex"),
      });

      if (useR2) {
        return {
          audioUrl: createR2SignedUrl(scrimConfig.tts.r2, storagePath, 3600),
          cached: false,
        };
      } else {
        const { data: signed } = await admin.storage
          .from(bucket)
          .createSignedUrl(storagePath, 3600);
        if (signed?.signedUrl) {
          return { audioUrl: signed.signedUrl, cached: false };
        }
      }
    }
  } catch {
    // ponytail: fall through to inline data URL if Storage/admin unavailable
  }

  const audio = await synthesizeCaption(text, voice);
  const dataUrl = `data:audio/mpeg;base64,${audio.toString("base64")}`;
  return { audioUrl: dataUrl, cached: false };
}

import { createHash } from "crypto";
import { isR2Configured, scrimConfig, isTtsConfigured } from "@/lib/config/scrim";
import { createR2SignedUrl, uploadR2Object } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { synthesizeCaption, ttsCacheKey } from "@/lib/tts/elevenlabs";

export async function getOrCreateNarrationAudio(
  script: string,
  voiceId?: string
): Promise<{ audioUrl: string; storagePath: string; cached: boolean }> {
  if (!isTtsConfigured()) {
    throw new Error("TTS is not configured");
  }

  const voice = voiceId ?? scrimConfig.tts.voiceId;
  const cacheKey = ttsCacheKey(voice, script);
  const bucket = scrimConfig.tts.storageBucket;
  const storagePath = `narration/${createHash("sha256").update(script).digest("hex")}.mp3`;
  const useR2 = scrimConfig.tts.storageBackend === "r2" && isR2Configured();
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
        storagePath: cached.storage_path,
        cached: true,
      };
    }

    const { data: signed } = await admin.storage
      .from(bucket)
      .createSignedUrl(cached.storage_path, 3600);
    if (signed?.signedUrl) {
      return {
        audioUrl: signed.signedUrl,
        storagePath: cached.storage_path,
        cached: true,
      };
    }
  }

  const audio = await synthesizeCaption(script, voice, script);

  if (useR2) {
    await uploadR2Object(scrimConfig.tts.r2, storagePath, audio, "audio/mpeg");
  } else {
    const { error } = await admin.storage.from(bucket).upload(storagePath, audio, {
      contentType: "audio/mpeg",
      upsert: true,
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  await admin.from("tts_cache").upsert({
    cache_key: cacheKey,
    storage_path: storagePath,
    voice_id: voice,
    text_hash: createHash("sha256").update(script).digest("hex"),
  });

  if (useR2) {
    return {
      audioUrl: createR2SignedUrl(scrimConfig.tts.r2, storagePath, 3600),
      storagePath,
      cached: false,
    };
  }

  const { data: signed } = await admin.storage
    .from(bucket)
    .createSignedUrl(storagePath, 3600);
  return {
    audioUrl: signed?.signedUrl ?? "",
    storagePath,
    cached: false,
  };
}

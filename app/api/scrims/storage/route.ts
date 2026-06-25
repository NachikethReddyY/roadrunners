import { NextResponse } from "next/server";
import { readdirSync } from "fs";
import path from "path";
import { scrimConfig, isR2Configured, isTtsConfigured } from "@/lib/config/scrim";
import { createR2SignedUrl } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type StaticAudioEntry = {
  slug: string;
  files: string[];
};

function listStaticScrimAudio(): StaticAudioEntry[] {
  const root = path.join(process.cwd(), "public", "audio", "scrims");

  try {
    const slugs = readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    return slugs.map((slug) => {
      const dir = path.join(root, slug);
      const files = readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => `/audio/scrims/${slug}/${entry.name}`)
        .sort();
      return { slug, files };
    });
  } catch {
    return [];
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const [lessonScrimsRes, userScrimsRes, checkpointsRes, ttsCacheRes] =
    await Promise.all([
      admin
        .from("lesson_scrims")
        .select("id, slug, title, skill_tag, template, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("user_scrims")
        .select("id, journey_id, title, skill_tag, template, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("scrim_checkpoints")
        .select("id, journey_id, node_id, lesson_scrim_id, user_scrim_id, timeline_ms, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("tts_cache")
        .select("cache_key, storage_path, voice_id, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const useR2 = scrimConfig.tts.storageBackend === "r2" && isR2Configured();
  const ttsCache =
    (ttsCacheRes.data ?? []).map((row) => ({
      ...row,
      signed_url:
        isTtsConfigured() && row.storage_path
          ? useR2
            ? createR2SignedUrl(scrimConfig.tts.r2, row.storage_path, 3600)
            : null
          : null,
    })) ?? [];

  if (!useR2 && isTtsConfigured()) {
    await Promise.all(
      ttsCache.map(async (row) => {
        if (!row.storage_path) return;
        const { data } = await admin.storage
          .from(scrimConfig.tts.storageBucket)
          .createSignedUrl(row.storage_path, 3600);
        row.signed_url = data?.signedUrl ?? null;
      })
    );
  }

  return NextResponse.json({
    storage: {
      lesson_scrims: "Supabase Postgres table public.lesson_scrims",
      user_scrims: "Supabase Postgres table public.user_scrims",
      scrim_checkpoints: "Supabase Postgres table public.scrim_checkpoints",
      tts_cache_index: "Supabase Postgres table public.tts_cache",
      tts_audio_backend:
        scrimConfig.tts.storageBackend === "r2" ? "Cloudflare R2" : "Supabase Storage",
      tts_audio_bucket:
        scrimConfig.tts.storageBackend === "r2"
          ? scrimConfig.tts.r2.bucket
          : scrimConfig.tts.storageBucket,
      baked_lesson_audio: "App static files under public/audio/scrims",
    },
    static_audio: listStaticScrimAudio(),
    lesson_scrims: lessonScrimsRes.data ?? [],
    user_scrims: userScrimsRes.data ?? [],
    scrim_checkpoints: checkpointsRes.data ?? [],
    tts_cache: ttsCache,
  });
}

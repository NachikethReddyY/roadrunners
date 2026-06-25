import { existsSync } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadScrimBySlug } from "@/lib/scrims/load-scrim";

const execFileAsync = promisify(execFile);

function audioPathExists(audioUrl?: string) {
  if (!audioUrl?.startsWith("/audio/")) return false;
  const localPath = path.join(process.cwd(), "public", audioUrl.replace(/^\/audio\//, "audio/"));
  return existsSync(localPath);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { scrimId?: string; slug?: string }
    | null;
  const scrimId = body?.scrimId;
  const slugInput = body?.slug;

  if (!scrimId && !slugInput) {
    return NextResponse.json({ error: "scrimId or slug required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const lessonQuery = scrimId
    ? admin.from("lesson_scrims").select("*").eq("id", scrimId).maybeSingle()
    : admin.from("lesson_scrims").select("*").eq("slug", slugInput!).maybeSingle();
  const { data: scrimRow, error } = await lessonQuery;

  if (error || !scrimRow) {
    return NextResponse.json({ error: "Scrim not found" }, { status: 404 });
  }

  const bundled = loadScrimBySlug(scrimRow.slug);
  if (!bundled) {
    return NextResponse.json(
      { error: `Bundled scrim content/scrims/${scrimRow.slug}.json not found` },
      { status: 404 }
    );
  }

  const captionAudioMissing = (bundled.timeline?.events ?? []).some(
    (event) =>
      event.type === "caption" && (!event.audio_url || !audioPathExists(event.audio_url))
  );
  const narrationAudioMissing =
    Boolean(bundled.narration?.script) &&
    (!bundled.narration?.audio_url || !audioPathExists(bundled.narration.audio_url));

  const generated: string[] = [];

  if (captionAudioMissing) {
    await execFileAsync("node", ["scripts/bake-scrim-audio.mjs", scrimRow.slug], {
      cwd: process.cwd(),
      env: process.env,
    });
    generated.push("caption-audio");
  }

  if (narrationAudioMissing) {
    await execFileAsync("node", ["scripts/bake-scrim-narration-audio.mjs", scrimRow.slug], {
      cwd: process.cwd(),
      env: process.env,
    });
    generated.push("narration-audio");
  }

  const refreshed = loadScrimBySlug(scrimRow.slug);
  if (!refreshed) {
    return NextResponse.json({ error: "Failed to reload prepared scrim" }, { status: 500 });
  }

  await admin
    .from("lesson_scrims")
    .update({
      title: refreshed.title,
      skill_tag: refreshed.skill_tag,
      template: refreshed.template,
      initial_files: refreshed.initial_files,
      timeline: refreshed.timeline,
      slides: refreshed.slides,
      duration_ms: refreshed.duration_ms,
    })
    .eq("id", scrimRow.id);

  return NextResponse.json({
    ok: true,
    scrimId: scrimRow.id,
    slug: scrimRow.slug,
    generated,
    ready: true,
  });
}

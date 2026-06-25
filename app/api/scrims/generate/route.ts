import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrimConfig, isTtsConfigured } from "@/lib/config/scrim";
import { createClient } from "@/lib/supabase/server";
import { generateCodecast } from "@/lib/ai/generate-codecast";
import { getOrCreateNarrationAudio } from "@/lib/tts/narration-audio";
import { scrimNarrationSchema } from "@/lib/schemas/playground";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | { journeyId?: string; nodeId?: string }
      | null;
    const journeyId = body?.journeyId;
    const nodeId = body?.nodeId;

    if (!journeyId) {
      return NextResponse.json({ error: "journeyId is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const [{ data: journey }, { data: profile }] = await Promise.all([
      admin
        .from("journeys")
        .select("id, title, goal, current_node_id")
        .eq("id", journeyId)
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("profiles")
        .select("interests")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    const targetNodeId = nodeId ?? journey.current_node_id;
    if (!targetNodeId) {
      return NextResponse.json({ error: "No current node to generate from" }, { status: 400 });
    }

    const [{ data: node }, { data: recentNodes }] = await Promise.all([
      admin
        .from("journey_nodes")
        .select("id, title, content_md, skill_tag, playground_config")
        .eq("id", targetNodeId)
        .eq("journey_id", journeyId)
        .maybeSingle(),
      admin
        .from("journey_nodes")
        .select("title, skill_tag")
        .eq("journey_id", journeyId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (!node) {
      return NextResponse.json({ error: "Checkpoint not found" }, { status: 404 });
    }

    const generated = await generateCodecast({
      goal: journey.goal ?? "Become hireable in tech",
      journeyTitle: journey.title,
      nodeTitle: node.title,
      nodeContent: node.content_md,
      skillTag: node.skill_tag,
      recentNodes: recentNodes ?? [],
      playground:
        node.playground_config &&
        typeof node.playground_config === "object" &&
        "template" in node.playground_config &&
        "files" in node.playground_config
          ? {
              template: node.playground_config.template as "vanilla" | "react-ts" | "python",
              files: node.playground_config.files as Record<string, string>,
              preview: Boolean(node.playground_config.preview),
            }
          : null,
    });

    let narration: Record<string, unknown> = {
      script: generated.narration.script,
      cues: generated.narration.cues,
      ...(generated.narration.next_session_topic
        ? { next_session_topic: generated.narration.next_session_topic }
        : {}),
    };

    if (isTtsConfigured()) {
      try {
        const narrationAudio = await getOrCreateNarrationAudio(generated.narration.script);
        narration = scrimNarrationSchema.parse({
          ...generated.narration,
          audio_url: narrationAudio.audioUrl,
          storage_path: narrationAudio.storagePath,
          storage_backend: scrimConfig.tts.storageBackend,
        });
      } catch (ttsError) {
        console.warn("[scrims/generate] TTS skipped:", ttsError);
      }
    }

    const { data: created, error } = await admin
      .from("user_scrims")
      .insert({
        user_id: user.id,
        journey_id: journeyId,
        source_node_id: node.id,
        title: generated.title,
        skill_tag: generated.skill_tag,
        template: generated.template,
        initial_files: generated.initial_files,
        timeline: generated.timeline,
        slides: generated.slides,
        narration,
        duration_ms: generated.duration_ms,
        resume_timeline_ms: 0,
      })
      .select("id")
      .single();

    if (error || !created) {
      return NextResponse.json(
        { error: error?.message ?? "Could not save generated CodeCast" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      userScrimId: created.id,
      route: `/journey/${journeyId}/my-scrim/${created.id}`,
    });
  } catch (err) {
    console.error("[scrims/generate]", err);
    const message =
      err instanceof Error ? err.message : "Could not generate CodeCast";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

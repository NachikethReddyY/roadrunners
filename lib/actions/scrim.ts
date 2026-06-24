"use server";

import { revalidatePath } from "next/cache";
import { scrimConfig } from "@/lib/config/scrim";
import { ROUTES } from "@/lib/constants/routes";
import {
  saveCheckpointSchema,
  saveUserScrimSchema,
  type SaveCheckpointInput,
  type SaveUserScrimInput,
} from "@/lib/schemas/scrim";
import { createClient } from "@/lib/supabase/server";

export type CheckpointRow = {
  id: string;
  timeline_ms: number;
  files: Record<string, string>;
  active_file: string | null;
  label: string | null;
  created_at: string;
};

export type UserScrimRow = {
  id: string;
  title: string;
  template: string;
  skill_tag: string | null;
  resume_timeline_ms: number;
  created_at: string;
};

async function pruneCheckpoints(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  journeyId: string,
  nodeId?: string,
  lessonScrimId?: string,
  userScrimId?: string
) {
  let query = supabase
    .from("scrim_checkpoints")
    .select("id")
    .eq("user_id", userId)
    .eq("journey_id", journeyId)
    .order("created_at", { ascending: false });

  if (nodeId) query = query.eq("node_id", nodeId);
  if (lessonScrimId) query = query.eq("lesson_scrim_id", lessonScrimId);
  if (userScrimId) query = query.eq("user_scrim_id", userScrimId);

  const { data: rows } = await query;
  const excess = (rows?.length ?? 0) - scrimConfig.maxCheckpoints;
  if (excess <= 0 || !rows) return;

  const toDelete = rows.slice(scrimConfig.maxCheckpoints).map((r) => r.id);
  await supabase.from("scrim_checkpoints").delete().in("id", toDelete);
}

export async function saveCheckpoint(
  input: SaveCheckpointInput
): Promise<{ ok: boolean; checkpointId?: string; error?: string }> {
  const parsed = saveCheckpointSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid checkpoint" };

  const { journeyId, nodeId, lessonScrimId, userScrimId, timelineMs, files, activeFile, label } =
    parsed.data;
  if (!nodeId && !lessonScrimId && !userScrimId) {
    return { ok: false, error: "nodeId, lessonScrimId, or userScrimId required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: journey } = await supabase
    .from("journeys")
    .select("id")
    .eq("id", journeyId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!journey) return { ok: false, error: "Journey not found" };

  const { data, error } = await supabase
    .from("scrim_checkpoints")
    .insert({
      user_id: user.id,
      journey_id: journeyId,
      node_id: nodeId ?? null,
      lesson_scrim_id: lessonScrimId ?? null,
      user_scrim_id: userScrimId ?? null,
      timeline_ms: timelineMs,
      files,
      active_file: activeFile ?? null,
      label: label ?? null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await pruneCheckpoints(
    supabase,
    user.id,
    journeyId,
    nodeId,
    lessonScrimId,
    userScrimId
  );
  revalidatePath(ROUTES.journeyScrims(journeyId));

  return { ok: true, checkpointId: data.id };
}

export async function loadLatestCheckpoint(input: {
  journeyId: string;
  nodeId?: string;
  lessonScrimId?: string;
  userScrimId?: string;
}): Promise<CheckpointRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("scrim_checkpoints")
    .select("id, timeline_ms, files, active_file, label, created_at")
    .eq("user_id", user.id)
    .eq("journey_id", input.journeyId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (input.nodeId) query = query.eq("node_id", input.nodeId);
  if (input.lessonScrimId) query = query.eq("lesson_scrim_id", input.lessonScrimId);
  if (input.userScrimId) query = query.eq("user_scrim_id", input.userScrimId);

  const { data } = await query.maybeSingle();
  if (!data) return null;

  return {
    ...data,
    files: data.files as Record<string, string>,
  };
}

export async function listCheckpoints(journeyId: string): Promise<CheckpointRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("scrim_checkpoints")
    .select("id, timeline_ms, files, active_file, label, created_at")
    .eq("user_id", user.id)
    .eq("journey_id", journeyId)
    .order("created_at", { ascending: false })
    .limit(scrimConfig.maxCheckpoints);

  return (data ?? []).map((row) => ({
    ...row,
    files: row.files as Record<string, string>,
  }));
}

export async function saveUserScrim(
  input: SaveUserScrimInput
): Promise<{ ok: boolean; scrimId?: string; error?: string }> {
  const parsed = saveUserScrimSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid scrim" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { journeyId } = parsed.data;
  const { data: journey } = await supabase
    .from("journeys")
    .select("id")
    .eq("id", journeyId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!journey) return { ok: false, error: "Journey not found" };

  const { count } = await supabase
    .from("user_scrims")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("journey_id", journeyId);

  if ((count ?? 0) >= scrimConfig.maxUserScrimsPerJourney) {
    return { ok: false, error: "Scrim limit reached for this journey" };
  }

  const row = parsed.data;
  const { data, error } = await supabase
    .from("user_scrims")
    .insert({
      user_id: user.id,
      journey_id: journeyId,
      source_node_id: row.sourceNodeId ?? null,
      source_lesson_scrim_id: row.sourceLessonScrimId ?? null,
      title: row.title,
      skill_tag: row.skillTag ?? null,
      template: row.template,
      initial_files: row.initialFiles,
      timeline: row.timeline,
      slides: row.slides,
      duration_ms: row.durationMs,
      resume_timeline_ms: row.resumeTimelineMs,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath(ROUTES.journeyScrims(journeyId));
  return { ok: true, scrimId: data.id };
}

export async function listUserScrims(journeyId: string): Promise<UserScrimRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_scrims")
    .select("id, title, template, skill_tag, resume_timeline_ms, created_at")
    .eq("user_id", user.id)
    .eq("journey_id", journeyId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function loadUserScrim(userScrimId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_scrims")
    .select("*")
    .eq("id", userScrimId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    journeyId: data.journey_id as string,
    title: data.title as string,
    skillTag: data.skill_tag as string | null,
    template: data.template as "vanilla" | "react-ts" | "python",
    initialFiles: data.initial_files as Record<string, string>,
    timeline: data.timeline,
    slides: data.slides,
    durationMs: data.duration_ms as number,
    resumeTimelineMs: data.resume_timeline_ms as number,
  };
}

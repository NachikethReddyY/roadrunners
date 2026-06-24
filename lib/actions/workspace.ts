"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

const saveSnapshotSchema = z.object({
  journeyId: z.string().uuid().optional(),
  nodeId: z.string().uuid().optional(),
  scrimId: z.string().uuid().optional(),
  files: z.record(z.string(), z.string()),
});

export async function saveWorkspaceSnapshot(
  input: z.infer<typeof saveSnapshotSchema>
): Promise<{ ok: boolean; error?: string }> {
  const parsed = saveSnapshotSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid snapshot" };

  const { journeyId, nodeId, scrimId, files } = parsed.data;
  if (!nodeId && !scrimId) {
    return { ok: false, error: "nodeId or scrimId required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const row = {
    user_id: user.id,
    journey_id: journeyId ?? null,
    node_id: nodeId ?? null,
    scrim_id: scrimId ?? null,
    files,
    updated_at: new Date().toISOString(),
  };

  const conflictKey = nodeId ? "user_id,node_id" : "user_id,scrim_id";

  const { error } = await supabase.from("user_workspace_snapshots").upsert(row, {
    onConflict: conflictKey,
  });

  if (error) return { ok: false, error: error.message };

  if (journeyId) {
    revalidatePath(ROUTES.journeyDetail(journeyId));
  }

  return { ok: true };
}

export async function loadWorkspaceSnapshot(input: {
  nodeId?: string;
  scrimId?: string;
}): Promise<{ files: Record<string, string> } | null> {
  const { nodeId, scrimId } = input;
  if (!nodeId && !scrimId) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("user_workspace_snapshots")
    .select("files")
    .eq("user_id", user.id);

  if (nodeId) query = query.eq("node_id", nodeId);
  if (scrimId) query = query.eq("scrim_id", scrimId);

  const { data } = await query.maybeSingle();
  if (!data) return null;

  return { files: data.files as Record<string, string> };
}

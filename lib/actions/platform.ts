"use server";

import { createClient } from "@/lib/supabase/server";
import {
  recordVerificationInputSchema,
  sandboxReferenceInputSchema,
  recoverySnapshotInputSchema,
  submitRoadmapChoiceInputSchema,
  type Verdict,
} from "@/lib/schemas/platform";
import type { DerivedFrontier } from "@/lib/schemas/frontier";

// ---------------------------------------------------------------------------
// getRoadmapExperience
// Returns the journey with its full node tree, choices, decisions, and
// completions for a single authoritative render.
// ---------------------------------------------------------------------------
export async function getRoadmapExperience(journeyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };

  const [
    { data: journey, error: journeyErr },
    { data: nodes, error: nodesErr },
    { data: choices, error: choicesErr },
    { data: decisions, error: decisionsErr },
    { data: completions, error: completionsErr },
  ] = await Promise.all([
    supabase
      .from("journeys")
      .select("*")
      .eq("id", journeyId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("journey_nodes")
      .select("*")
      .eq("journey_id", journeyId)
      .order("created_at", { ascending: true }),
    supabase
      .from("journey_choices")
      .select("*")
      .in(
        "node_id",
        // subquery approach: fetch after nodes, but simpler to fetch broadly then filter client-side
        // Defer to a later join if this becomes a performance concern.
        ([] as string[])
      ),
    supabase
      .from("decisions")
      .select("*")
      .eq("journey_id", journeyId),
    supabase
      .from("checkpoint_completions")
      .select("*")
      .eq("journey_id", journeyId),
  ]);

  const firstErr = journeyErr ?? nodesErr ?? decisionsErr ?? completionsErr;
  if (firstErr) return { error: firstErr.message };
  if (!journey) return { error: "Journey not found" };

  // Fetch choices for the nodes we got
  const nodeIds = (nodes ?? []).map((n) => n.id);
  let resolvedChoices = choices ?? [];
  if (nodeIds.length > 0 && !choicesErr) {
    const { data: fetchedChoices } = await supabase
      .from("journey_choices")
      .select("*")
      .in("node_id", nodeIds);
    resolvedChoices = fetchedChoices ?? [];
  }

  return {
    journey,
    nodes: nodes ?? [],
    choices: resolvedChoices,
    decisions: decisions ?? [],
    completions: completions ?? [],
  };
}

// ---------------------------------------------------------------------------
// getDerivedFrontier
// Derives frontier buckets from graph + completion records.
// ---------------------------------------------------------------------------
export async function getDerivedFrontier(
  journeyId: string
): Promise<{ error: string } | { frontier: DerivedFrontier }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const [
    { data: journey },
    { data: nodes },
    { data: completions },
  ] = await Promise.all([
    supabase
      .from("journeys")
      .select("current_node_id, status")
      .eq("id", journeyId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("journey_nodes")
      .select("id, parent_id, archived_at")
      .eq("journey_id", journeyId),
    supabase
      .from("checkpoint_completions")
      .select("node_id")
      .eq("journey_id", journeyId),
  ]);

  if (!journey) return { error: "Journey not found" };

  const takenSet = new Set((completions ?? []).map((c) => c.node_id));
  const currentId = journey.current_node_id;

  const taken: string[] = [];
  const unlocked: string[] = [];
  const deferred: string[] = [];
  const locked: string[] = [];

  for (const node of nodes ?? []) {
    if (takenSet.has(node.id)) {
      taken.push(node.id);
    } else if (node.archived_at) {
      deferred.push(node.id);
    } else if (node.id === currentId) {
      unlocked.push(node.id);
    } else {
      locked.push(node.id);
    }
  }

  return { frontier: { taken, unlocked, deferred, locked } };
}

// ---------------------------------------------------------------------------
// recordChoiceOffer
// Persists choices offered to a node. Idempotent via offer_fingerprint.
// ---------------------------------------------------------------------------
export async function recordChoiceOffer(input: {
  journeyId: string;
  nodeId: string;
  choices: Array<{
    id: string;
    label: string;
    targetSkillTag: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };

  // Fingerprint: sorted "skillTag:label" pairs joined
  const sorted = [...input.choices].sort((a, b) =>
    a.targetSkillTag.localeCompare(b.targetSkillTag)
  );
  const fingerprint = sorted
    .map((c) => `${c.targetSkillTag}:${c.label}`)
    .join("|");

  const { error } = await supabase.from("choice_offer_batches").upsert(
    {
      journey_id: input.journeyId,
      node_id: input.nodeId,
      offer_fingerprint: fingerprint,
    },
    { onConflict: "journey_id,node_id,offer_fingerprint" }
  );

  if (error) return { error: error.message };
  return { success: true as const };
}

// ---------------------------------------------------------------------------
// submitRoadmapChoice
// Records a choice decision. Does not trigger next-node generation —
// that remains in lib/actions/journey.ts until integration.
// ---------------------------------------------------------------------------
export async function submitRoadmapChoice(
  rawInput: unknown
): Promise<{ error: string } | { success: true; choiceId: string }> {
  const parsed = submitRoadmapChoiceInputSchema.safeParse(rawInput);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { journeyId, nodeId, choiceId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify ownership and that this choice belongs to the node
  const [{ data: journey }, { data: choice }] = await Promise.all([
    supabase
      .from("journeys")
      .select("current_node_id")
      .eq("id", journeyId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("journey_choices")
      .select("node_id, availability")
      .eq("id", choiceId)
      .eq("node_id", nodeId)
      .maybeSingle(),
  ]);

  if (!journey) return { error: "Journey not found" };
  if (!choice) return { error: "Choice not found" };
  if (choice.availability === "locked") return { error: "This choice is not available" };

  const { error } = await supabase.from("decisions").insert({
    journey_id: journeyId,
    node_id: nodeId,
    choice_id: choiceId,
  });

  if (error?.code === "23505") return { success: true, choiceId };
  if (error) return { error: error.message };

  return { success: true, choiceId };
}

// ---------------------------------------------------------------------------
// saveRecoverySnapshot
// Upserts workspace files for a node. Overwrites on (user_id, node_id).
// ---------------------------------------------------------------------------
export async function saveRecoverySnapshot(rawInput: unknown) {
  const parsed = recoverySnapshotInputSchema.safeParse(rawInput);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { journeyId, nodeId, files } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };

  const { error } = await supabase
    .from("user_workspace_snapshots")
    .upsert(
      {
        user_id: user.id,
        journey_id: journeyId,
        node_id: nodeId,
        files,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,node_id" }
    );

  if (error) return { error: error.message };
  return { success: true as const };
}

// ---------------------------------------------------------------------------
// getLatestRecoverySnapshot
// Returns the most recent workspace snapshot for a node.
// ---------------------------------------------------------------------------
export async function getLatestRecoverySnapshot(input: {
  journeyId: string;
  nodeId: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };

  const { data, error } = await supabase
    .from("user_workspace_snapshots")
    .select("files, updated_at")
    .eq("user_id", user.id)
    .eq("node_id", input.nodeId)
    .maybeSingle();

  if (error) return { error: error.message };
  return { snapshot: data ?? null };
}

// ---------------------------------------------------------------------------
// recordVerificationEvidence
// Persists objective evidence from a workspace run. AI advisory stored
// separately in the same row but never as the sole basis for completion.
// ---------------------------------------------------------------------------
export async function recordVerificationEvidence(
  rawInput: unknown
): Promise<{ error: string } | { evidenceId: string; verdict: Verdict }> {
  const parsed = recordVerificationInputSchema.safeParse(rawInput);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { journeyId, nodeId, verdict, entrypoint } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("verification_evidence")
    .insert({
      journey_id: journeyId,
      node_id: nodeId,
      user_id: user.id,
      runs: verdict.runs,
      objective_fulfillment: verdict.objectiveFulfillment,
      fulfills: verdict.fulfills,
      verification_reason: verdict.reason,
      infrastructure_error: verdict.infrastructureError ?? false,
      ai_plausible: verdict.aiAdvisory?.plausible ?? null,
      ai_reason: verdict.aiAdvisory?.reason ?? null,
      entrypoint: entrypoint ?? null,
      // Bound output to 4 KB to prevent unbounded storage
      stdout_summary: verdict.output ? verdict.output.slice(0, 4096) : null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { evidenceId: data.id, verdict };
}

// ---------------------------------------------------------------------------
// getOrCreateSandboxReference
// Returns existing non-expired sandbox or inserts a new one.
// Sandbox IDs remain server-side; clients never receive daytona_sandbox_id.
// ---------------------------------------------------------------------------
export async function getOrCreateSandboxReference(rawInput: unknown) {
  const parsed = sandboxReferenceInputSchema.safeParse(rawInput);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { journeyId, nodeId, daytonaSandboxId, expiresAt } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };

  // Return an existing live session if one exists
  const { data: existing } = await supabase
    .from("sandbox_sessions")
    .select("id, expires_at")
    .eq("user_id", user.id)
    .eq("node_id", nodeId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return { sessionId: existing.id };

  const { data, error } = await supabase
    .from("sandbox_sessions")
    .insert({
      user_id: user.id,
      journey_id: journeyId,
      node_id: nodeId,
      daytona_sandbox_id: daytonaSandboxId,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { sessionId: data.id };
}

// ---------------------------------------------------------------------------
// expireSandboxReference
// Marks a sandbox session as immediately expired so it can be replaced.
// ---------------------------------------------------------------------------
export async function expireSandboxReference(input: { sessionId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };

  const { error } = await supabase
    .from("sandbox_sessions")
    .update({ expires_at: new Date().toISOString() })
    .eq("id", input.sessionId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true as const };
}

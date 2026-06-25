"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants/routes";
import { completeCheckpointInputSchema } from "@/lib/schemas/completion";

// ---------------------------------------------------------------------------
// completeCheckpoint
// Creates a durable completion record via the complete_checkpoint RPC.
// Idempotent — safe to retry; subsequent calls for the same node do nothing.
// ---------------------------------------------------------------------------
export async function completeCheckpoint(rawInput: unknown) {
  const parsed = completeCheckpointInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { journeyId, nodeId, basis, verificationEvidenceId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase.rpc("complete_checkpoint", {
    p_journey_id: journeyId,
    p_node_id: nodeId,
    p_basis: basis,
    p_verification_evidence_id: verificationEvidenceId ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath(ROUTES.journeyDetail(journeyId));
  revalidatePath(ROUTES.journeyMap(journeyId));
  revalidatePath(ROUTES.journey);

  return { success: true as const, completionId: data as string | null };
}

// ---------------------------------------------------------------------------
// confirmCheckpointCompletion
// User-confirmed completion. Advances the roadmap without granting
// verified concept coverage (that requires objective evidence).
// ---------------------------------------------------------------------------
export async function confirmCheckpointCompletion(input: {
  journeyId: string;
  nodeId: string;
}) {
  return completeCheckpoint({
    journeyId: input.journeyId,
    nodeId: input.nodeId,
    basis: "user_confirmed",
  });
}

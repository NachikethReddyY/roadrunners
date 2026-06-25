"use server";

import { createClient } from "@/lib/supabase/server";
import { coverageEventSchema } from "@/lib/schemas/coverage";
import type { CoverageState } from "@/lib/schemas/coverage";

// ---------------------------------------------------------------------------
// getJourneyCoverage
// Returns all concept coverage records for a journey, keyed by concept_tag.
// ---------------------------------------------------------------------------
export async function getJourneyCoverage(journeyId: string): Promise<
  | { error: string }
  | { coverage: Array<{ concept_tag: string; coverage_state: CoverageState }> }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("concept_coverage")
    .select("concept_tag, coverage_state")
    .eq("journey_id", journeyId)
    .eq("user_id", user.id)
    .order("concept_tag");

  if (error) return { error: error.message };

  return {
    coverage: (data ?? []).map((row) => ({
      concept_tag: row.concept_tag,
      coverage_state: row.coverage_state as CoverageState,
    })),
  };
}

// ---------------------------------------------------------------------------
// recordCoverageEvent
// Promotes a concept's coverage state. Uses the upsert_concept_coverage RPC
// which enforces promote-only semantics (never demotes).
// ---------------------------------------------------------------------------
export async function recordCoverageEvent(rawInput: unknown) {
  const parsed = coverageEventSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { journeyId, conceptTag, state } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("upsert_concept_coverage", {
    p_journey_id: journeyId,
    p_concept_tag: conceptTag,
    p_state: state,
  });

  if (error) return { error: error.message };
  return { success: true as const };
}

// ---------------------------------------------------------------------------
// recordBulkCoverageEvents
// Convenience wrapper for promoting multiple concepts at once.
// Fires events in parallel; collects any errors.
// ---------------------------------------------------------------------------
export async function recordBulkCoverageEvents(
  events: Array<{ journeyId: string; conceptTag: string; state: CoverageState }>
) {
  const results = await Promise.all(
    events.map((e) =>
      recordCoverageEvent({ journeyId: e.journeyId, conceptTag: e.conceptTag, state: e.state })
    )
  );
  const errors = results
    .filter((r): r is { error: string } => "error" in r)
    .map((r) => r.error);
  if (errors.length > 0) return { error: errors.join("; ") };
  return { success: true as const };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { getFallbackNode } from "@/lib/ai/fallback";
import { generateNextNode } from "@/lib/ai/generate-node";
import { aiNodeOutputSchema, type AiNodeOutput } from "@/lib/schemas/ai";

type CreateNextNodeResult = {
  nodeId: string;
  node: AiNodeOutput;
  fallback: boolean;
};

export async function createAndPersistNextNode(
  supabase: SupabaseClient,
  input: { journeyId: string; userId: string; pivotSkill?: string }
): Promise<CreateNextNodeResult> {
  const { data: journey, error: journeyError } = await supabase
    .from("journeys")
    .select("id, goal, current_node_id")
    .eq("id", input.journeyId)
    .eq("user_id", input.userId)
    .single();

  if (journeyError || !journey) throw new Error("Journey not found");

  const [{ data: profile }, { data: recentNodes }, { data: skillCatalog }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("interests")
        .eq("user_id", input.userId)
        .maybeSingle(),
      supabase
        .from("journey_nodes")
        .select("title, skill_tag")
        .eq("journey_id", input.journeyId)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("skill_catalog").select("slug"),
    ]);

  const skillTags = skillCatalog?.map((s) => s.slug) ?? ["explore"];

  let fallback = false;
  let node: AiNodeOutput;

  try {
    node = await generateNextNode({
      goal: journey.goal ?? "Become hireable in tech",
      interests: profile?.interests ?? [],
      recentNodes: recentNodes ?? [],
      pivotSkill: input.pivotSkill,
      skillTags,
    });
  } catch {
    fallback = true;
    node = aiNodeOutputSchema.parse(
      getFallbackNode(input.pivotSkill ?? profile?.interests?.[0] ?? "explore")
    );
  }

  const { data: nodeId, error: persistError } = await supabase.rpc(
    "persist_generated_node",
    {
      p_journey_id: input.journeyId,
      p_parent_id: journey.current_node_id,
      p_node: node,
      p_is_fallback: fallback,
    }
  );

  if (persistError || typeof nodeId !== "string") {
    throw new Error(persistError?.message ?? "Could not persist generated node");
  }

  return { nodeId, node, fallback };
}

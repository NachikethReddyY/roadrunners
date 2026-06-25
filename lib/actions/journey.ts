"use server";

import { revalidatePath } from "next/cache";
import { createAndPersistNextNode } from "@/lib/ai/create-next-node";
import { ROUTES } from "@/lib/constants/routes";
import { nextStreakDays, shouldIncrementStreak } from "@/lib/gamification/streak";
import { levelFromXp } from "@/lib/gamification/xp";
import { createClient } from "@/lib/supabase/server";

export type JourneyActionState = {
  error?: string;
  success?: boolean;
  xpGain?: number;
} | null;

type JourneyActionResult = {
  error?: string;
  success?: boolean;
  xpGain?: number;
  pivotSkill?: string;
};

export async function submitChoice(input: {
  journeyId: string;
  nodeId: string;
  choiceId: string;
}): Promise<JourneyActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const [{ data: journey }, { data: choice }] = await Promise.all([
    supabase
      .from("journeys")
      .select("current_node_id")
      .eq("id", input.journeyId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("journey_choices")
      .select("node_id, target_skill_tag")
      .eq("id", input.choiceId)
      .eq("node_id", input.nodeId)
      .maybeSingle(),
  ]);

  if (!journey || journey.current_node_id !== input.nodeId || !choice) {
    return { error: "This choice is no longer available" };
  }

  const { error: decisionError } = await supabase.from("decisions").insert({
    journey_id: input.journeyId,
    node_id: input.nodeId,
    choice_id: input.choiceId,
    decided_at: new Date().toISOString(),
  });

  if (decisionError?.code === "23505") {
    return { success: true, xpGain: 0 };
  }
  if (decisionError) return { error: decisionError.message };

  const { data: node } = await supabase
    .from("journey_nodes")
    .select("xp_value")
    .eq("id", input.nodeId)
    .single();

  const xpGain = node?.xp_value ?? 50;
  await awardXp(user.id, xpGain);

  try {
    await createAndPersistNextNode(supabase, {
      journeyId: input.journeyId,
      userId: user.id,
      pivotSkill: choice?.target_skill_tag ?? undefined,
    });
  } catch (e) {
    revalidatePath(ROUTES.journeyDetail(input.journeyId));
    revalidatePath(ROUTES.journeyMap(input.journeyId));
    revalidatePath(ROUTES.journey);
    return {
      error: e instanceof Error ? e.message : "Could not generate next step",
      xpGain,
    };
  }

  revalidatePath(ROUTES.journeyDetail(input.journeyId));
  revalidatePath(ROUTES.journeyMap(input.journeyId));
  revalidatePath(ROUTES.journey);
  return { success: true, xpGain };
}

export async function acknowledgeNode(input: {
  journeyId: string;
  nodeId: string;
}): Promise<JourneyActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: journey } = await supabase
    .from("journeys")
    .select("current_node_id")
    .eq("id", input.journeyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!journey || journey.current_node_id !== input.nodeId) {
    return { error: "This checkpoint is no longer current" };
  }

  const { error } = await supabase.from("decisions").insert({
    journey_id: input.journeyId,
    node_id: input.nodeId,
    choice_id: null,
    decided_at: new Date().toISOString(),
  });

  if (error?.code === "23505") return { success: true, xpGain: 0 };
  if (error) return { error: error.message };

  const xpGain = 25;
  await awardXp(user.id, xpGain);

  try {
    await createAndPersistNextNode(supabase, {
      journeyId: input.journeyId,
      userId: user.id,
    });
  } catch (e) {
    revalidatePath(ROUTES.journeyDetail(input.journeyId));
    revalidatePath(ROUTES.journey);
    return { error: e instanceof Error ? e.message : "Could not generate next step", xpGain };
  }

  revalidatePath(ROUTES.journeyDetail(input.journeyId));
  revalidatePath(ROUTES.journeyMap(input.journeyId));
  revalidatePath(ROUTES.journey);
  return { success: true, xpGain };
}

export async function pivotTrack(input: {
  journeyId: string;
  pivotSkill: string;
}): Promise<JourneyActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const [{ data: journey }, { data: pivotSkill }] = await Promise.all([
    supabase
      .from("journeys")
      .select("current_node_id")
      .eq("id", input.journeyId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("skill_catalog")
      .select("slug")
      .eq("slug", input.pivotSkill)
      .maybeSingle(),
  ]);

  if (!journey?.current_node_id) return { error: "Journey not found" };
  if (!pivotSkill) return { error: "That pivot is not available" };

  try {
    const generated = await createAndPersistNextNode(supabase, {
      journeyId: input.journeyId,
      userId: user.id,
      pivotSkill: input.pivotSkill,
    });
    await supabase
      .from("journey_nodes")
      .update({ archived_at: new Date().toISOString() })
      .eq("journey_id", input.journeyId)
      .is("archived_at", null)
      .neq("id", generated.nodeId);
  } catch (e) {
    revalidatePath(ROUTES.journeyDetail(input.journeyId));
    return { error: e instanceof Error ? e.message : "Could not pivot track" };
  }

  revalidatePath(ROUTES.journeyDetail(input.journeyId));
  revalidatePath(ROUTES.journeyMap(input.journeyId));
  revalidatePath(ROUTES.journey);
  return { success: true, pivotSkill: input.pivotSkill };
}

export async function retryNextNode(input: {
  journeyId: string;
  nodeId: string;
}): Promise<JourneyActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: journey } = await supabase
    .from("journeys")
    .select("current_node_id")
    .eq("id", input.journeyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!journey) return { error: "Roadmap not found" };
  if (journey.current_node_id !== input.nodeId) {
    return { success: true };
  }

  const { data: decision } = await supabase
    .from("decisions")
    .select("choice_id")
    .eq("journey_id", input.journeyId)
    .eq("node_id", input.nodeId)
    .maybeSingle();

  if (!decision) return { error: "Complete this step before generating the next one" };

  let pivotSkill: string | undefined;
  if (decision.choice_id) {
    const { data: choice } = await supabase
      .from("journey_choices")
      .select("target_skill_tag")
      .eq("id", decision.choice_id)
      .maybeSingle();
    pivotSkill = choice?.target_skill_tag ?? undefined;
  }

  try {
    await createAndPersistNextNode(supabase, {
      journeyId: input.journeyId,
      userId: user.id,
      pivotSkill,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not generate next step" };
  }

  revalidatePath(ROUTES.journeyDetail(input.journeyId));
  revalidatePath(ROUTES.journeyMap(input.journeyId));
  revalidatePath(ROUTES.journey);
  return { success: true };
}

export async function submitChoiceFormAction(
  _prev: JourneyActionState,
  formData: FormData
): Promise<JourneyActionState> {
  const result = await submitChoice({
    journeyId: String(formData.get("journeyId") ?? ""),
    nodeId: String(formData.get("nodeId") ?? ""),
    choiceId: String(formData.get("choiceId") ?? ""),
  });

  if (result.error) return { error: result.error, xpGain: result.xpGain };
  return { success: true, xpGain: result.xpGain };
}

export async function acknowledgeNodeFormAction(
  _prev: JourneyActionState,
  formData: FormData
): Promise<JourneyActionState> {
  const result = await acknowledgeNode({
    journeyId: String(formData.get("journeyId") ?? ""),
    nodeId: String(formData.get("nodeId") ?? ""),
  });

  if (result.error) return { error: result.error, xpGain: result.xpGain };
  return { success: true, xpGain: result.xpGain };
}

export async function pivotTrackFormAction(
  _prev: JourneyActionState,
  formData: FormData
): Promise<JourneyActionState> {
  const result = await pivotTrack({
    journeyId: String(formData.get("journeyId") ?? ""),
    pivotSkill: String(formData.get("pivotSkill") ?? ""),
  });

  if (result.error) return { error: result.error };
  return { success: true };
}

export async function retryNextNodeFormAction(
  _prev: JourneyActionState,
  formData: FormData
): Promise<JourneyActionState> {
  const result = await retryNextNode({
    journeyId: String(formData.get("journeyId") ?? ""),
    nodeId: String(formData.get("nodeId") ?? ""),
  });

  if (result.error) return { error: result.error };
  return { success: true };
}

export async function submitChoiceAction(formData: FormData): Promise<void> {
  await submitChoiceFormAction(null, formData);
}

export async function acknowledgeNodeAction(formData: FormData): Promise<void> {
  await acknowledgeNodeFormAction(null, formData);
}

export async function pivotTrackAction(formData: FormData): Promise<void> {
  await pivotTrackFormAction(null, formData);
}

async function awardXp(userId: string, amount: number): Promise<void> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, streak_days, last_activity_at")
    .eq("user_id", userId)
    .single();

  const currentXp = profile?.xp ?? 0;
  const newXp = currentXp + amount;
  const now = new Date().toISOString();

  await supabase
    .from("profiles")
    .update({
      xp: newXp,
      level: levelFromXp(newXp),
      streak_days: shouldIncrementStreak(profile?.last_activity_at ?? null)
        ? nextStreakDays(
            profile?.last_activity_at ?? null,
            profile?.streak_days ?? 0
          )
        : profile?.streak_days ?? 0,
      last_activity_at: now,
      updated_at: now,
    })
    .eq("user_id", userId);
}

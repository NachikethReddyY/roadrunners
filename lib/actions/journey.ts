"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAndPersistNextNode } from "@/lib/ai/create-next-node";
import { ROUTES } from "@/lib/constants/routes";
import { nextStreakDays, shouldIncrementStreak } from "@/lib/gamification/streak";
import { levelFromXp } from "@/lib/gamification/xp";
import { createClient } from "@/lib/supabase/server";

export async function submitChoice(input: {
  journeyId: string;
  nodeId: string;
  choiceId: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: choice } = await supabase
    .from("journey_choices")
    .select("target_skill_tag")
    .eq("id", input.choiceId)
    .single();

  const { error: decisionError } = await supabase.from("decisions").insert({
    journey_id: input.journeyId,
    node_id: input.nodeId,
    choice_id: input.choiceId,
    decided_at: new Date().toISOString(),
  });

  if (decisionError?.code === "23505") {
    return { error: "Already decided on this node" };
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

export async function acknowledgeNode(input: { journeyId: string; nodeId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("decisions").insert({
    journey_id: input.journeyId,
    node_id: input.nodeId,
    choice_id: null,
    decided_at: new Date().toISOString(),
  });

  if (error?.code === "23505") return { error: "Already completed" };
  if (error) return { error: error.message };

  await awardXp(user.id, 25);

  try {
    await createAndPersistNextNode(supabase, {
      journeyId: input.journeyId,
      userId: user.id,
    });
  } catch (e) {
    revalidatePath(ROUTES.journeyDetail(input.journeyId));
    revalidatePath(ROUTES.journey);
    return { error: e instanceof Error ? e.message : "Could not generate next step" };
  }

  revalidatePath(ROUTES.journeyDetail(input.journeyId));
  revalidatePath(ROUTES.journeyMap(input.journeyId));
  revalidatePath(ROUTES.journey);
  return { success: true, xpGain: 25 };
}

export async function pivotTrack(input: { journeyId: string; pivotSkill: string }) {
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
    .single();

  if (!journey?.current_node_id) return { error: "Journey not found" };

  await supabase
    .from("journey_nodes")
    .update({ archived_at: new Date().toISOString() })
    .eq("journey_id", input.journeyId)
    .is("archived_at", null)
    .neq("id", journey.current_node_id);

  try {
    await createAndPersistNextNode(supabase, {
      journeyId: input.journeyId,
      userId: user.id,
      pivotSkill: input.pivotSkill,
    });
  } catch (e) {
    revalidatePath(ROUTES.journeyDetail(input.journeyId));
    return { error: e instanceof Error ? e.message : "Could not pivot track" };
  }

  revalidatePath(ROUTES.journeyDetail(input.journeyId));
  revalidatePath(ROUTES.journeyMap(input.journeyId));
  revalidatePath(ROUTES.journey);
  return { success: true, pivotSkill: input.pivotSkill };
}

export async function submitChoiceAction(formData: FormData): Promise<void> {
  const journeyId = String(formData.get("journeyId") ?? "");
  const nodeId = String(formData.get("nodeId") ?? "");
  const choiceId = String(formData.get("choiceId") ?? "");

  await submitChoice({ journeyId, nodeId, choiceId });
}

export async function acknowledgeNodeAction(formData: FormData): Promise<void> {
  const journeyId = String(formData.get("journeyId") ?? "");
  const nodeId = String(formData.get("nodeId") ?? "");

  await acknowledgeNode({ journeyId, nodeId });
}

export async function pivotTrackAction(formData: FormData): Promise<void> {
  const journeyId = String(formData.get("journeyId") ?? "");
  const pivotSkill = String(formData.get("pivotSkill") ?? "");

  await pivotTrack({ journeyId, pivotSkill });
}

async function awardXp(userId: string, amount: number) {
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

"use server";

import { revalidatePath } from "next/cache";
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

  revalidatePath(ROUTES.journeyDetail(input.journeyId));
  revalidatePath(ROUTES.journeyMap(input.journeyId));
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
  revalidatePath(ROUTES.journeyDetail(input.journeyId));
  return { success: true };
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

  revalidatePath(ROUTES.journeyDetail(input.journeyId));
  return { success: true, pivotSkill: input.pivotSkill };
}

export async function submitChoiceAction(formData: FormData): Promise<void> {
  const journeyId = String(formData.get("journeyId") ?? "");
  const nodeId = String(formData.get("nodeId") ?? "");
  const choiceId = String(formData.get("choiceId") ?? "");

  await submitChoice({ journeyId, nodeId, choiceId });
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

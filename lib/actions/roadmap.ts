"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAndPersistNextNode } from "@/lib/ai/create-next-node";
import { ROUTES } from "@/lib/constants/routes";
import { buildGoalText, inferInterestsFromText } from "@/lib/roadmap/infer-interests";
import { generateRoadmapTitle } from "@/lib/roadmap/generate-title";
import { createRoadmapSchema } from "@/lib/schemas/roadmap";
import { createClient } from "@/lib/supabase/server";

export type CreateRoadmapResult =
  | { error: string }
  | { success: true; journeyId: string };

export type CreateRoadmapFormState = CreateRoadmapResult | null;

export async function createRoadmap(formData: FormData): Promise<CreateRoadmapResult> {
  const parsed = createRoadmapSchema.safeParse({
    mode: formData.get("mode"),
    subject: formData.get("subject"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { mode, subject } = parsed.data;
  const goal = buildGoalText(mode, subject);
  const interests = inferInterestsFromText(goal, [subject]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.login);

  const title = await generateRoadmapTitle(mode, subject, goal);

  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: user.id,
    goal,
    interests,
    display_name: user.email?.split("@")[0] ?? "Runner",
    onboarding_complete: true,
    updated_at: new Date().toISOString(),
  });

  if (profileError) return { error: profileError.message };

  const { data: journey, error: journeyError } = await supabase
    .from("journeys")
    .insert({
      user_id: user.id,
      title,
      goal,
      status: "active",
    })
    .select("id")
    .single();

  if (journeyError || !journey) {
    return { error: journeyError?.message ?? "Could not create roadmap" };
  }

  try {
    await createAndPersistNextNode(supabase, {
      journeyId: journey.id,
      userId: user.id,
    });
  } catch {
    revalidatePath(ROUTES.journey);
    return { success: true, journeyId: journey.id };
  }

  revalidatePath(ROUTES.journey);
  return { success: true, journeyId: journey.id };
}

export async function createRoadmapFormAction(
  _prev: CreateRoadmapFormState,
  formData: FormData
): Promise<CreateRoadmapFormState> {
  const result = await createRoadmap(formData);
  if ("error" in result) return result;
  redirect(ROUTES.journey);
}

export async function createRoadmapAction(formData: FormData): Promise<void> {
  await createRoadmapFormAction(null, formData);
}

export async function retryFirstNode(journeyId: string): Promise<CreateRoadmapResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.login);

  const { data: journey } = await supabase
    .from("journeys")
    .select("id, current_node_id")
    .eq("id", journeyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!journey) return { error: "Roadmap not found" };
  if (journey.current_node_id) return { success: true, journeyId };

  try {
    await createAndPersistNextNode(supabase, {
      journeyId: journey.id,
      userId: user.id,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Generation failed" };
  }

  revalidatePath(ROUTES.journeyDetail(journeyId));
  revalidatePath(ROUTES.journey);
  return { success: true, journeyId };
}

export async function retryFirstNodeFormAction(
  _prev: CreateRoadmapFormState,
  formData: FormData
): Promise<CreateRoadmapFormState> {
  const journeyId = String(formData.get("journeyId") ?? "");
  const result = await retryFirstNode(journeyId);
  if ("error" in result) return result;
  revalidatePath(ROUTES.journeyDetail(journeyId));
  revalidatePath(ROUTES.journey);
  return result;
}

export async function retryFirstNodeAction(formData: FormData): Promise<void> {
  await retryFirstNodeFormAction(null, formData);
}

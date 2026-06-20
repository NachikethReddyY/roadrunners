"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { createAndPersistNextNode } from "@/lib/ai/create-next-node";
import { onboardingSchema } from "@/lib/schemas/onboarding";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(formData: FormData): Promise<void> {
  const parsed = onboardingSchema.safeParse({
    goal: formData.get("goal"),
    interests: formData.getAll("interests"),
    displayName: formData.get("displayName") || undefined,
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.login);

  const { goal, interests, displayName } = parsed.data;

  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: user.id,
    goal,
    interests,
    display_name: displayName ?? user.email?.split("@")[0] ?? "Runner",
    onboarding_complete: true,
    updated_at: new Date().toISOString(),
  });

  if (profileError) return;

  const { data: journey, error: journeyError } = await supabase
    .from("journeys")
    .insert({
      user_id: user.id,
      title: "My learning journey",
      goal,
      status: "active",
    })
    .select("id")
    .single();

  if (journeyError || !journey) return;

  try {
    await createAndPersistNextNode(supabase, {
      journeyId: journey.id,
      userId: user.id,
    });
  } catch {
    // The journey remains valid and can retry generation from its empty state.
  }

  revalidatePath(ROUTES.journey);
  redirect(ROUTES.journeyDetail(journey.id));
}

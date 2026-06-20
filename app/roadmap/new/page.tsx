import { redirect } from "next/navigation";
import { GoalCreator } from "@/components/roadmap/goal-creator";
import { AppShell } from "@/components/layout/app-shell";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

export default async function NewRoadmapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.login);

  const { data: skills } = await supabase
    .from("skill_catalog")
    .select("slug, name, category")
    .neq("slug", "explore")
    .order("name");

  return (
    <AppShell showProgress={false} fullBleed>
      <GoalCreator skills={skills ?? []} />
    </AppShell>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyJourneyCard } from "@/components/journey/journey-node-card";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

export default async function JourneyIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.login);

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level, streak_days, onboarding_complete")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_complete) redirect(ROUTES.onboarding);

  const { data: journeys } = await supabase
    .from("journeys")
    .select("id, title, goal, status, updated_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (journeys?.length === 1) {
    redirect(ROUTES.journeyDetail(journeys[0].id));
  }

  return (
    <AppShell
      level={profile?.level ?? 1}
      xp={profile?.xp ?? 0}
      streakDays={profile?.streak_days ?? 0}
    >
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Your journeys</h1>
          <p className="mt-2 text-muted-foreground">Pick up where you left off or start fresh.</p>
        </div>

        {!journeys?.length ? (
          <EmptyJourneyCard />
        ) : (
          <ul className="space-y-3">
            {journeys.map((journey) => (
              <li key={journey.id}>
                <Link
                  href={ROUTES.journeyDetail(journey.id)}
                  className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
                >
                  <h2 className="font-heading text-lg font-semibold">{journey.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{journey.goal}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link href={ROUTES.onboarding} className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
          Start new journey
        </Link>
      </div>
    </AppShell>
  );
}

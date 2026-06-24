import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardRetryForm } from "@/components/journey/dashboard-retry-form";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { computeJourneyProgress } from "@/lib/journey/progress";
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

  const { data: journeys } = await supabase
    .from("journeys")
    .select("id, title, goal, status, updated_at, current_node_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (!journeys?.length) {
    redirect(ROUTES.roadmapNew);
  }

  const journeyIds = journeys.map((j) => j.id);

  const [{ data: nodes }, { data: decisions }] = await Promise.all([
    supabase
      .from("journey_nodes")
      .select("journey_id")
      .in("journey_id", journeyIds)
      .is("archived_at", null),
    supabase.from("decisions").select("journey_id").in("journey_id", journeyIds),
  ]);

  const nodeCounts = new Map<string, number>();
  for (const n of nodes ?? []) {
    nodeCounts.set(n.journey_id, (nodeCounts.get(n.journey_id) ?? 0) + 1);
  }

  const decisionCounts = new Map<string, number>();
  for (const d of decisions ?? []) {
    decisionCounts.set(d.journey_id, (decisionCounts.get(d.journey_id) ?? 0) + 1);
  }

  return (
    <AppShell
      level={profile?.level ?? 1}
      xp={profile?.xp ?? 0}
      streakDays={profile?.streak_days ?? 0}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Your roadmaps</h1>
            <p className="mt-2 text-muted-foreground">Pick up where you left off or start fresh.</p>
          </div>
          <Link
            href={ROUTES.roadmapNew}
            className={buttonVariants({ className: "h-11 rounded-full px-6" })}
          >
            Create roadmap
          </Link>
        </div>

        <ul className="space-y-4">
          {journeys.map((journey) => {
            const progress = computeJourneyProgress(
              nodeCounts.get(journey.id) ?? 0,
              decisionCounts.get(journey.id) ?? 0
            );

            return (
              <li key={journey.id}>
                {journey.current_node_id ? (
                  <Link
                    href={ROUTES.journeyDetail(journey.id)}
                    className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
                  >
                    <JourneyCardContent
                      title={journey.title}
                      goal={journey.goal}
                      progress={progress}
                    />
                  </Link>
                ) : (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <JourneyCardContent
                      title={journey.title}
                      goal={journey.goal}
                      progress={progress}
                    />
                    <DashboardRetryForm journeyId={journey.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}

function JourneyCardContent({
  title,
  goal,
  progress,
}: {
  title: string;
  goal: string;
  progress: { percent: number; label: string };
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">{goal}</p>
        </div>
        <span className="shrink-0 text-sm font-medium text-primary">{progress.percent}%</span>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-[var(--canvas-parchment)] dark:bg-[var(--muted)]">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{progress.label}</p>
      </div>
    </>
  );
}

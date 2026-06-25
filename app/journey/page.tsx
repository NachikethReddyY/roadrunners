import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { CoverageSummary } from "@/components/coverage/coverage-summary";
import { DashboardRetryForm } from "@/components/journey/dashboard-retry-form";
import { EmptyJourneyCard } from "@/components/journey/journey-node-card";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { buildFrontierView, combineJourneyCoverage } from "@/lib/journey/frontier-view";
import { computeJourneyProgress } from "@/lib/journey/progress";
import { createClient } from "@/lib/supabase/server";

export default async function JourneyIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.login);

  const [{ data: profile }, journeysResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("xp, level, streak_days, onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("journeys")
      .select("id, title, goal, status, updated_at, current_node_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("updated_at", { ascending: false }),
  ]);

  if (journeysResult.error) {
    return (
      <AppShell
        level={profile?.level ?? 1}
        xp={profile?.xp ?? 0}
        streakDays={profile?.streak_days ?? 0}
      >
        <div className="rounded-xl border border-destructive/30 bg-red-50 p-5 dark:bg-red-950/20">
          <h1 className="font-heading text-xl font-semibold">Roadmaps could not be loaded</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your saved work is still in place. Retry the dashboard request.
          </p>
          <Link
            href={ROUTES.journey}
            className={buttonVariants({ variant: "outline", className: "mt-4 h-11 rounded-full" })}
          >
            Retry
          </Link>
        </div>
      </AppShell>
    );
  }

  const journeys = journeysResult.data ?? [];
  const journeyIds = journeys.map((journey) => journey.id);
  const [{ data: nodes }, { data: decisions }] = journeyIds.length
    ? await Promise.all([
        supabase
          .from("journey_nodes")
          .select(
            "id, journey_id, parent_id, title, content_md, skill_tag, node_type, is_fallback, archived_at, playground_config"
          )
          .in("journey_id", journeyIds)
          .order("created_at", { ascending: true }),
        supabase
          .from("decisions")
          .select("journey_id, node_id")
          .in("journey_id", journeyIds),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <AppShell
      level={profile?.level ?? 1}
      xp={profile?.xp ?? 0}
      streakDays={profile?.streak_days ?? 0}
    >
      <div className="space-y-6 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Journey dashboard
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Your roadmaps</h1>
            <p className="mt-2 text-muted-foreground">
              Reopen a roadmap, review credible progress, or start another direction.
            </p>
          </div>
          <Link
            href={ROUTES.roadmapNew}
            className={buttonVariants({ className: "h-11 rounded-full px-6" })}
          >
            Create roadmap
          </Link>
        </div>

        {journeys.length === 0 ? (
          <EmptyJourneyCard />
        ) : (
          <ul className="space-y-4">
            {journeys.map((journey) => {
              const journeyNodes = (nodes ?? []).filter((node) => node.journey_id === journey.id);
              const journeyDecisions = (decisions ?? []).filter(
                (decision) => decision.journey_id === journey.id
              );
              const decisionIds = new Set(journeyDecisions.map((decision) => decision.node_id));
              const currentNode = journeyNodes.find(
                (node) => node.id === journey.current_node_id
              );
              const activeNodeCount = journeyNodes.filter((node) => !node.archived_at).length;
              const progress = computeJourneyProgress(activeNodeCount, journeyDecisions.length);
              const view = buildFrontierView({
                nodes: journeyNodes,
                currentNodeId: journey.current_node_id,
                takenNodeIds: decisionIds,
              });
              const coverage = combineJourneyCoverage(view.nodes);
              const hasFallback = journeyNodes.some((node) => node.is_fallback);

              return (
                <li key={journey.id}>
                  <article className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-heading text-lg font-semibold">{journey.title}</h2>
                          {hasFallback && (
                            <span className="rounded-full border border-primary/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                              Suggested path
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{journey.goal}</p>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-primary">
                        {progress.percent}%
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div
                        className="h-2 overflow-hidden rounded-full bg-[var(--canvas-parchment)] dark:bg-muted"
                        role="progressbar"
                        aria-label={`${journey.title} progress`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress.percent}
                      >
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{progress.label}</p>
                    </div>

                    <div className="mt-4 grid gap-3 rounded-lg bg-muted/45 p-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Latest checkpoint
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {currentNode?.title ?? "Preparing the first checkpoint"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Coverage summary
                        </p>
                        <p className="mt-1 text-sm">
                          {coverage.length > 0
                            ? `${coverage.length} concept${coverage.length === 1 ? "" : "s"} introduced or practiced`
                            : "No coverage recorded yet"}
                        </p>
                      </div>
                    </div>

                    {coverage.length > 0 && (
                      <CoverageSummary items={coverage.slice(0, 5)} compact className="mt-4" />
                    )}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        Updated {new Date(journey.updated_at).toLocaleDateString()}
                      </p>
                      {journey.current_node_id ? (
                        <Link
                          href={ROUTES.journeyDetail(journey.id)}
                          className={buttonVariants({ className: "h-11 rounded-full px-5" })}
                        >
                          Open roadmap
                        </Link>
                      ) : (
                        <DashboardRetryForm journeyId={journey.id} />
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

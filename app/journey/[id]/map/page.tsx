import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { CoverageSummary } from "@/components/coverage/coverage-summary";
import { JourneyMap } from "@/components/journey/journey-map";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { buildFrontierView, combineJourneyCoverage } from "@/lib/journey/frontier-view";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function JourneyMapPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.login);

  const [{ data: profile }, { data: journey }] = await Promise.all([
    supabase
      .from("profiles")
      .select("xp, level, streak_days")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("journeys")
      .select("id, title, goal, current_node_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!journey) notFound();

  const [{ data: nodes }, { data: decisions }] = await Promise.all([
    supabase
      .from("journey_nodes")
      .select(
        "id, parent_id, title, content_md, skill_tag, node_type, archived_at, playground_config"
      )
      .eq("journey_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("decisions").select("node_id").eq("journey_id", id),
  ]);

  const view = buildFrontierView({
    nodes: nodes ?? [],
    currentNodeId: journey.current_node_id,
    takenNodeIds: (decisions ?? []).map((decision) => decision.node_id),
  });
  const coverage = combineJourneyCoverage(view.nodes);

  return (
    <AppShell
      fullBleed
      level={profile?.level ?? 1}
      xp={profile?.xp ?? 0}
      streakDays={profile?.streak_days ?? 0}
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-8 pb-28 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Journey map
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">{journey.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{journey.goal}</p>
          </div>
          <Link
            href={ROUTES.journeyDetail(id)}
            className={buttonVariants({ variant: "outline", className: "h-11 rounded-full" })}
          >
            Back to checkpoint
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {[
            ["Taken", view.frontier.taken.length],
            ["Current", view.frontier.unlocked.length],
            ["Deferred", view.frontier.deferred.length],
            ["Future", view.frontier.locked.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="font-heading mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section aria-labelledby="checkpoint-map-title">
            <h2 id="checkpoint-map-title" className="sr-only">
              Checkpoint relationships
            </h2>
            {view.nodes.length ? (
              <JourneyMap nodes={view.nodes} />
            ) : (
              <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
                Your roadmap will appear here after the first checkpoint is saved.
              </div>
            )}
          </section>

          <aside className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6">
            <CoverageSummary items={coverage} />
            <div className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              Archived branches remain visible. User-confirmed completion advances the roadmap but
              does not create verified coverage without objective evidence.
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

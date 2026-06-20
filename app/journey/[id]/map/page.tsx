import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { JourneyMap, type MapNode } from "@/components/journey/journey-map";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level, streak_days")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: journey } = await supabase
    .from("journeys")
    .select("id, title, current_node_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!journey) notFound();

  const [{ data: nodes }, { data: decisions }] = await Promise.all([
    supabase
      .from("journey_nodes")
      .select("id, title, archived_at")
      .eq("journey_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("decisions").select("node_id").eq("journey_id", id),
  ]);

  const decidedIds = new Set((decisions ?? []).map((d) => d.node_id));

  const mapNodes: MapNode[] = (nodes ?? []).map((n) => {
    let state: MapNode["state"] = "upcoming";
    if (n.archived_at) state = "archived";
    else if (n.id === journey.current_node_id) state = "current";
    else if (decidedIds.has(n.id)) state = "complete";
    return { id: n.id, title: n.title, state };
  });

  return (
    <AppShell
      level={profile?.level ?? 1}
      xp={profile?.xp ?? 0}
      streakDays={profile?.streak_days ?? 0}
    >
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Journey map
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{journey.title}</h1>
        </div>
        <Link
          href={ROUTES.journeyDetail(id)}
          className={buttonVariants({ variant: "outline", className: "rounded-full" })}
        >
          Back to step
        </Link>
      </div>

      {mapNodes.length ? (
        <JourneyMap nodes={mapNodes} />
      ) : (
        <p className="text-muted-foreground">Your path will appear here after the first node is generated.</p>
      )}
    </AppShell>
  );
}

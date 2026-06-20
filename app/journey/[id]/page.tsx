import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ChoicePanel } from "@/components/journey/choice-panel";
import { ContinueForm } from "@/components/journey/continue-form";
import {
  JourneyNodeCard,
  JourneyNodeSkeleton,
} from "@/components/journey/journey-node-card";
import { RetryNodeForm } from "@/components/journey/retry-node-form";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function JourneyDetailPage({ params }: PageProps) {
  const { id } = await params;
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

  if (!profile?.onboarding_complete) redirect(ROUTES.roadmapNew);

  const { data: journey } = await supabase
    .from("journeys")
    .select("id, title, goal, current_node_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!journey) notFound();

  const [{ data: node }, { data: skills }] = await Promise.all([
    journey.current_node_id
      ? supabase
          .from("journey_nodes")
          .select("id, title, content_md, skill_tag, node_type, is_fallback")
          .eq("id", journey.current_node_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("skill_catalog").select("slug, name, category").order("name"),
  ]);

  const { data: choices } = node
    ? await supabase
        .from("journey_choices")
        .select("id, label, description, target_skill_tag")
        .eq("node_id", node.id)
    : { data: [] };

  const { data: decision } = node
    ? await supabase
        .from("decisions")
        .select("id")
        .eq("journey_id", id)
        .eq("node_id", node.id)
        .maybeSingle()
    : { data: null };

  const skillCategory =
    skills?.find((s) => s.slug === node?.skill_tag)?.category ?? "explore";

  return (
    <AppShell
      level={profile.level ?? 1}
      xp={profile.xp ?? 0}
      streakDays={profile.streak_days ?? 0}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {journey.title}
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Current step</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={ROUTES.journey}
            className={buttonVariants({ variant: "ghost", className: "rounded-full" })}
          >
            Dashboard
          </Link>
          <Link
            href={ROUTES.journeyMap(id)}
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
          >
            View map
          </Link>
        </div>
      </div>

      {!node ? (
        <div className="space-y-4">
          <JourneyNodeSkeleton />
          <p className="text-sm text-muted-foreground">
            Your first step hasn&apos;t been generated yet.
          </p>
          <RetryNodeForm journeyId={id} />
        </div>
      ) : (
        <JourneyNodeCard
          title={node.title}
          content={node.content_md}
          skillTag={node.skill_tag}
          skillCategory={skillCategory}
          fallback={node.is_fallback}
        >
          {choices && choices.length > 0 ? (
            <ChoicePanel
              journeyId={id}
              nodeId={node.id}
              choices={choices}
              skills={(skills ?? []).filter((s) => s.slug !== "explore")}
              decided={!!decision}
            />
          ) : (
            !decision && <ContinueForm journeyId={id} nodeId={node.id} />
          )}
        </JourneyNodeCard>
      )}
    </AppShell>
  );
}

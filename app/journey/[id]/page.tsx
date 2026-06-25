import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InteractiveNodeView } from "@/components/playground/interactive-node-view";
import { AppShell } from "@/components/layout/app-shell";
import { CheckpointFlow } from "@/components/journey/checkpoint-flow";
import { ChoicePanel } from "@/components/journey/choice-panel";
import { ContinueForm } from "@/components/journey/continue-form";
import {
  JourneyNodeCard,
  JourneyNodeSkeleton,
} from "@/components/journey/journey-node-card";
import { RetryNodeForm } from "@/components/journey/retry-node-form";
import { VerificationSummary } from "@/components/verification/verification-summary";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { checkpointModeForNode, presentFeatureChoices } from "@/lib/journey/presentation";
import { playgroundConfigSchema } from "@/lib/schemas/playground";
import { loadWorkspaceSnapshot } from "@/lib/actions/workspace";
import { createClient } from "@/lib/supabase/server";

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

  const [{ data: node }, { data: skills }, { data: scrims }] = await Promise.all([
    journey.current_node_id
      ? supabase
          .from("journey_nodes")
          .select(
            "id, title, content_md, skill_tag, node_type, is_fallback, playground_config"
          )
          .eq("id", journey.current_node_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("skill_catalog").select("slug, name, category").order("name"),
    supabase.from("lesson_scrims").select("id, slug, title, skill_tag").limit(12),
  ]);

  const [{ data: choices }, { data: decision }] = node
    ? await Promise.all([
        supabase
          .from("journey_choices")
          .select("id, label, description, target_skill_tag")
          .eq("node_id", node.id)
          .limit(3),
        supabase
          .from("decisions")
          .select("id")
          .eq("journey_id", id)
          .eq("node_id", node.id)
          .maybeSingle(),
      ])
    : [{ data: [] }, { data: null }];

  const skillCategory =
    skills?.find((skill) => skill.slug === node?.skill_tag)?.category ?? "explore";

  const playgroundParsed = node?.playground_config
    ? playgroundConfigSchema.safeParse(node.playground_config)
    : null;
  const playground = playgroundParsed?.success ? playgroundParsed.data : null;
  const workspaceSnapshot =
    node && playground ? await loadWorkspaceSnapshot({ nodeId: node.id }) : null;
  const isInteractive = Boolean(playground);
  const mode = checkpointModeForNode(node?.node_type ?? "choice", isInteractive);
  const relevantScrim = node
    ? scrims?.find((scrim) => scrim.skill_tag === node.skill_tag)
    : undefined;
  const scrimHref = relevantScrim
    ? ROUTES.journeyScrim(id, relevantScrim.id)
    : undefined;
  const presentedChoices = node
    ? presentFeatureChoices(choices ?? [], {
        roadmapGoal: journey.goal,
        currentSkillTag: node.skill_tag,
      })
    : [];
  const choicePayload = presentedChoices.map((choice) => ({
    ...choice,
    label: choice.title,
    description: choice.description,
    target_skill_tag: choice.targetSkillTag,
  }));
  const availableSkills = (skills ?? []).filter((skill) => skill.slug !== "explore");

  return (
    <AppShell
      fullBleed={isInteractive}
      level={profile.level ?? 1}
      xp={profile.xp ?? 0}
      streakDays={profile.streak_days ?? 0}
    >
      <div
        className={
          isInteractive
            ? "px-3 py-5 pb-28 sm:px-5 lg:px-8"
            : "pb-20"
        }
      >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {journey.title}
            </p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Current checkpoint
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{journey.goal}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={ROUTES.journey}
              className={buttonVariants({ variant: "ghost", className: "h-11 rounded-full" })}
            >
              Dashboard
            </Link>
            <Link
              href={ROUTES.journeyMap(id)}
              className={buttonVariants({ variant: "outline", className: "h-11 rounded-full" })}
            >
              View map
            </Link>
          </div>
        </div>

        <CheckpointFlow mode={mode} hasScrim={Boolean(relevantScrim)} className="mb-5" />

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Link
            href={ROUTES.journeyScrims(id)}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "min-h-11 rounded-full",
            })}
          >
            Saved scrims
          </Link>
          {relevantScrim && (
            <Link
              href={ROUTES.journeyScrim(id, relevantScrim.id)}
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
                className: "min-h-11 rounded-full",
              })}
            >
              Optional scrim: {relevantScrim.title}
            </Link>
          )}
        </div>

        {!node ? (
          <div className="space-y-4">
            <JourneyNodeSkeleton />
            <div className="rounded-lg border border-primary/30 bg-[var(--primary-soft)] p-4">
              <p className="text-sm font-medium">The roadmap was saved.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Its first checkpoint could not be prepared, so you can retry without recreating
                the roadmap.
              </p>
            </div>
            <RetryNodeForm journeyId={id} />
          </div>
        ) : playground ? (
          <div className="space-y-6">
            <InteractiveNodeView
              journeyId={id}
              nodeId={node.id}
              title={node.title}
              contentMd={node.content_md}
              skillTag={node.skill_tag}
              skillCategory={skillCategory}
              fallback={node.is_fallback}
              playground={playground}
              initialFiles={workspaceSnapshot?.files}
              choices={choicePayload}
              skills={availableSkills}
              decided={Boolean(decision)}
            />
            <VerificationSummary />
          </div>
        ) : (
          <JourneyNodeCard
            title={node.title}
            content={node.content_md}
            skillTag={node.skill_tag}
            skillCategory={skillCategory}
            fallback={node.is_fallback}
            mode={mode}
            scrimHref={scrimHref}
          >
            {choicePayload.length > 0 ? (
              <ChoicePanel
                journeyId={id}
                nodeId={node.id}
                choices={choicePayload}
                skills={availableSkills}
                roadmapGoal={journey.goal}
                currentSkillTag={node.skill_tag}
                decided={Boolean(decision)}
              />
            ) : (
              !decision && <ContinueForm journeyId={id} nodeId={node.id} />
            )}
          </JourneyNodeCard>
        )}
      </div>
    </AppShell>
  );
}

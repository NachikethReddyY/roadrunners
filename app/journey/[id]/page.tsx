import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ChoicePanel } from "@/components/journey/choice-panel";
import {
  EmptyJourneyCard,
  JourneyNodeCard,
  JourneyNodeSkeleton,
} from "@/components/journey/journey-node-card";
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

  if (!profile?.onboarding_complete) redirect(ROUTES.onboarding);

  const { data: journey } = await supabase
    .from("journeys")
    .select("id, title, goal, current_node_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!journey) notFound();

  const { data: node } = journey.current_node_id
    ? await supabase
        .from("journey_nodes")
        .select("id, title, content_md, skill_tag, node_type, is_fallback")
        .eq("id", journey.current_node_id)
        .maybeSingle()
    : { data: null };

  const { data: choices } = node
    ? await supabase
        .from("journey_choices")
        .select("id, label, description, target_skill_tag")
        .eq("node_id", node.id)
    : { data: [] };

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
        <Link href={ROUTES.journeyMap(id)} className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
          View map
        </Link>
      </div>

      {!node ? (
        <div className="space-y-4">
          <JourneyNodeSkeleton />
          <p className="text-sm text-muted-foreground">
            No node yet — generate the first step from onboarding or the AI endpoint.
          </p>
          <EmptyJourneyCard />
        </div>
      ) : (
        <JourneyNodeCard
          title={node.title}
          content={node.content_md}
          skillTag={node.skill_tag}
          skillCategory="web"
          fallback={node.is_fallback}
        >
          {choices && choices.length > 0 ? (
            <ChoicePanel journeyId={id} nodeId={node.id} choices={choices} />
          ) : (
            <button type="button" className={buttonVariants({ className: "h-11 w-full rounded-full" })}>
              Continue
            </button>
          )}
        </JourneyNodeCard>
      )}
    </AppShell>
  );
}

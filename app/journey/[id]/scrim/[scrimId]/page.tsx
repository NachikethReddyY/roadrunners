import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ScrimLessonView } from "@/components/playground/scrim-lesson-view";
import { ContinueForm } from "@/components/journey/continue-form";
import { AppShell } from "@/components/layout/app-shell";
import { loadLatestCheckpoint } from "@/lib/actions/scrim";
import { isTtsConfigured } from "@/lib/config/scrim";
import { ROUTES } from "@/lib/constants/routes";
import { loadScrimBySlug, parseLessonScrim } from "@/lib/scrims/load-scrim";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string; scrimId: string }>;
};

export default async function ScrimLessonPage({ params }: PageProps) {
  const { id: journeyId, scrimId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.login);

  const [{ data: journey }, { data: scrimRow }, { data: profile }, checkpoint] =
    await Promise.all([
      supabase
        .from("journeys")
        .select("id, title, current_node_id")
        .eq("id", journeyId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("lesson_scrims").select("*").eq("id", scrimId).maybeSingle(),
      supabase
        .from("profiles")
        .select("level, streak_days")
        .eq("user_id", user.id)
        .maybeSingle(),
      loadLatestCheckpoint({ journeyId, lessonScrimId: scrimId }),
    ]);

  if (!journey || !scrimRow) notFound();

  const { data: linkedNode } = journey.current_node_id
    ? await supabase
        .from("journey_nodes")
        .select("id, skill_tag, playground_config, node_type")
        .eq("id", journey.current_node_id)
        .maybeSingle()
    : { data: null };

  const bundled = loadScrimBySlug(scrimRow.slug);
  const scrim = parseLessonScrim({
    ...scrimRow,
    initial_files: (bundled?.initial_files ??
      (scrimRow.initial_files as Record<string, string>)) as Record<string, string>,
    timeline: bundled?.timeline ?? scrimRow.timeline,
    narration: bundled?.narration,
    slides: bundled?.slides ?? scrimRow.slides,
    duration_ms: bundled?.duration_ms ?? scrimRow.duration_ms,
  });

  const currentCheckpointNodeId =
    linkedNode &&
    linkedNode.skill_tag === scrim.skill_tag &&
    (linkedNode.node_type === "interactive" || Boolean(linkedNode.playground_config))
      ? linkedNode.id
      : undefined;

  const resumeFiles = checkpoint?.files ?? scrim.initial_files;
  const resumeMs = checkpoint?.timeline_ms ?? 0;

  return (
    <AppShell
      fullBleed
      showProgress={false}
      showNavDock={false}
      level={profile?.level ?? 1}
      streakDays={profile?.streak_days ?? 0}
    >
      <div className="flex h-screen flex-col overflow-hidden px-0 py-0">
        <div className="flex items-center justify-between gap-4 border-b border-border bg-background/92 px-4 py-3 backdrop-blur sm:px-5">
          <div>
            <p className="text-xs text-muted-foreground">{journey.title}</p>
            <h1 className="font-heading text-lg font-semibold">{scrim.title}</h1>
            {checkpoint && (
              <p className="text-xs text-[var(--primary)]">
                Resuming from saved progress
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {currentCheckpointNodeId && (
              <div className="min-w-[13rem]">
                <ContinueForm journeyId={journeyId} nodeId={currentCheckpointNodeId} />
              </div>
            )}
            <Link
              href={ROUTES.journeyScrims(journeyId)}
              className={buttonVariants({ variant: "ghost", className: "rounded-full" })}
            >
              CodeCasts
            </Link>
            <Link
              href={ROUTES.journeyDetail(journeyId)}
              className={buttonVariants({ variant: "outline", className: "rounded-full" })}
            >
              Back to journey
            </Link>
          </div>
        </div>
        <ScrimLessonView
          journeyId={journeyId}
          nodeId={currentCheckpointNodeId}
          scrimId={scrim.id}
          scrim={scrim}
          breadcrumb={`${journey.title} / ${scrim.title}`}
          initialTimelineMs={resumeMs}
          initialFiles={resumeFiles}
          ttsAvailable={isTtsConfigured()}
        />
      </div>
    </AppShell>
  );
}

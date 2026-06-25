import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UserScrimView } from "@/components/playground/user-scrim-view";
import { AppShell } from "@/components/layout/app-shell";
import { loadLatestCheckpoint, loadUserScrim } from "@/lib/actions/scrim";
import { isTtsConfigured } from "@/lib/config/scrim";
import { ROUTES } from "@/lib/constants/routes";
import { lessonScrimSchema } from "@/lib/schemas/playground";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string; userScrimId: string }>;
};

export default async function UserScrimPage({ params }: PageProps) {
  const { id: journeyId, userScrimId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.login);

  const [journeyRes, profileRes, userScrim, checkpoint] = await Promise.all([
    supabase
      .from("journeys")
      .select("id, title")
      .eq("id", journeyId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("level, streak_days")
      .eq("user_id", user.id)
      .maybeSingle(),
    loadUserScrim(userScrimId),
    loadLatestCheckpoint({ journeyId, userScrimId }),
  ]);

  if (!journeyRes.data || !userScrim || userScrim.journeyId !== journeyId) {
    notFound();
  }

  const journey = journeyRes.data;
  const profile = profileRes.data;

  const parsed = lessonScrimSchema.safeParse({
    id: userScrim.id,
    slug: userScrim.id,
    title: userScrim.title,
    skill_tag: userScrim.skillTag ?? "explore",
    template: userScrim.template,
    initial_files: checkpoint?.files ?? userScrim.initialFiles,
    timeline: userScrim.timeline,
    slides: userScrim.slides,
    duration_ms: userScrim.durationMs,
  });

  if (!parsed.success) notFound();

  const resumeMs = checkpoint?.timeline_ms ?? userScrim.resumeTimelineMs;

  return (
    <AppShell
      fullBleed
      level={profile?.level ?? 1}
      streakDays={profile?.streak_days ?? 0}
    >
      <div className="flex h-[calc(100vh-4rem)] flex-col px-2 py-2 sm:px-4">
        <div className="mb-2 flex items-center justify-between gap-4 px-2">
          <div>
            <p className="text-xs text-muted-foreground">{journey.title}</p>
            <h1 className="font-heading text-lg font-semibold">{userScrim.title}</h1>
            <p className="text-xs text-muted-foreground">Your saved CodeCast</p>
          </div>
          <div className="flex gap-2">
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
        <UserScrimView
          journeyId={journeyId}
          userScrimId={userScrimId}
          scrim={{ ...parsed.data, resume_timeline_ms: resumeMs }}
          breadcrumb={`${journey.title} / ${userScrim.title}`}
          ttsAvailable={isTtsConfigured()}
        />
      </div>
    </AppShell>
  );
}

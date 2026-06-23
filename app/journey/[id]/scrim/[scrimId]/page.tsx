import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ScrimLessonView } from "@/components/playground/scrim-lesson-view";
import { AppShell } from "@/components/layout/app-shell";
import { ROUTES } from "@/lib/constants/routes";
import { parseLessonScrim } from "@/lib/scrims/load-scrim";
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

  const [{ data: journey }, { data: scrimRow }, { data: profile }] =
    await Promise.all([
      supabase
        .from("journeys")
        .select("id, title")
        .eq("id", journeyId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("lesson_scrims").select("*").eq("id", scrimId).maybeSingle(),
      supabase
        .from("profiles")
        .select("level, streak_days")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (!journey || !scrimRow) notFound();

  const scrim = parseLessonScrim({
    ...scrimRow,
    initial_files: scrimRow.initial_files as Record<string, string>,
  });

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
            <h1 className="font-heading text-lg font-semibold">{scrim.title}</h1>
          </div>
          <Link
            href={ROUTES.journeyDetail(journeyId)}
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
          >
            Back to journey
          </Link>
        </div>
        <ScrimLessonView
          journeyId={journeyId}
          scrimId={scrim.id}
          scrim={scrim}
          breadcrumb={`${journey.title} / ${scrim.title}`}
        />
      </div>
    </AppShell>
  );
}

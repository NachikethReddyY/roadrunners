import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { listCheckpoints, listUserScrims } from "@/lib/actions/scrim";
import { AppShell } from "@/components/layout/app-shell";
import { PrepareScrimButton } from "@/components/playground/prepare-scrim-button";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeline(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default async function JourneyScrimsPage({ params }: PageProps) {
  const { id: journeyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.login);

  const [{ data: journey }, { data: profile }, userScrims, checkpoints] =
    await Promise.all([
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
      listUserScrims(journeyId),
      listCheckpoints(journeyId),
    ]);

  if (!journey) notFound();

  const { data: lessonScrims } = await supabase
    .from("lesson_scrims")
    .select("id, title")
    .limit(20);

  const lessonTitleById = new Map(
    (lessonScrims ?? []).map((s) => [s.id, s.title])
  );

  return (
    <AppShell
      level={profile?.level ?? 1}
      streakDays={profile?.streak_days ?? 0}
    >
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {journey.title}
            </p>
            <h1 className="font-heading text-2xl font-semibold">CodeCasts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Narrated coding lessons, saved runs, and checkpoints - pick up exactly where you left off.
            </p>
          </div>
          <Link
            href={ROUTES.journeyDetail(journeyId)}
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
          >
            Back
          </Link>
        </div>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Saved CodeCasts</h2>
          {userScrims.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved CodeCasts yet. Pause a lesson and use &quot;Save CodeCast&quot;.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {userScrims.map((scrim) => (
                <li key={scrim.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">{scrim.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {scrim.template}
                      {scrim.skill_tag ? ` · ${scrim.skill_tag}` : ""} ·{" "}
                      {formatWhen(scrim.created_at)} · resume at{" "}
                      {formatTimeline(scrim.resume_timeline_ms)}
                    </p>
                  </div>
                  <Link
                    href={ROUTES.journeyMyScrim(journeyId, scrim.id)}
                    className={buttonVariants({ size: "sm", className: "rounded-full" })}
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Recent checkpoints</h2>
          {checkpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Checkpoints appear when you pause or save progress during a CodeCast.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {checkpoints.map((cp) => (
                <li key={cp.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">
                      {cp.label ?? "Checkpoint"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatWhen(cp.created_at)} · at {formatTimeline(cp.timeline_ms)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Auto-saved</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Curated lessons</h2>
          <div className="flex flex-wrap gap-2">
            {(lessonScrims ?? []).map((scrim) => (
              <PrepareScrimButton
                key={scrim.id}
                scrimId={scrim.id}
                journeyId={journeyId}
                label={lessonTitleById.get(scrim.id) ?? scrim.title}
                className="min-h-10 rounded-full bg-[var(--secondary)] px-4 text-[var(--secondary-foreground)] hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]"
              />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

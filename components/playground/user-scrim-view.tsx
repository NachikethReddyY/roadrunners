"use client";

import { PlaygroundShell } from "@/components/playground/playground-shell";
import type { LessonScrim } from "@/lib/schemas/playground";

type UserScrimViewProps = {
  journeyId: string;
  userScrimId: string;
  scrim: LessonScrim & { resume_timeline_ms?: number };
  breadcrumb: string;
  ttsAvailable?: boolean;
};

export function UserScrimView({
  journeyId,
  userScrimId,
  scrim,
  breadcrumb,
  ttsAvailable = false,
}: UserScrimViewProps) {
  const config = {
    template: scrim.template,
    files: scrim.initial_files,
    preview: scrim.template !== "python",
    completion: "manual" as const,
  };

  return (
    <PlaygroundShell
      config={config}
      title={scrim.title}
      breadcrumb={breadcrumb}
      journeyId={journeyId}
      userScrimId={userScrimId}
      skillTag={scrim.skill_tag}
      ttsAvailable={ttsAvailable}
      scrim={{
        durationMs: scrim.timeline.durationMs,
        events: scrim.timeline.events,
        slides: scrim.slides,
        initialFiles: scrim.initial_files,
        initialTimelineMs: scrim.resume_timeline_ms ?? 0,
      }}
      className="flex-1"
    />
  );
}

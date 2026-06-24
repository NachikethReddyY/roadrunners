"use client";

import { useCallback, useEffect, useRef } from "react";
import { PlaygroundShell } from "@/components/playground/playground-shell";
import type { LessonScrim } from "@/lib/schemas/playground";
import { saveWorkspaceSnapshot } from "@/lib/actions/workspace";

type ScrimLessonViewProps = {
  journeyId: string;
  scrimId: string;
  scrim: LessonScrim;
  breadcrumb: string;
  initialTimelineMs?: number;
  initialFiles?: Record<string, string>;
  ttsAvailable?: boolean;
};

export function ScrimLessonView({
  journeyId,
  scrimId,
  scrim,
  breadcrumb,
  initialTimelineMs = 0,
  initialFiles,
  ttsAvailable = false,
}: ScrimLessonViewProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeFiles = initialFiles ?? scrim.initial_files;

  const debouncedSave = useCallback(
    (files: Record<string, string>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void saveWorkspaceSnapshot({
          journeyId,
          scrimId,
          files,
        });
      }, 1500);
    },
    [journeyId, scrimId]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const config = {
    template: scrim.template,
    files: resumeFiles,
    preview: scrim.template !== "python",
    completion: "manual" as const,
  };

  return (
    <PlaygroundShell
      config={config}
      title={scrim.title}
      breadcrumb={breadcrumb}
      journeyId={journeyId}
      lessonScrimId={scrimId}
      skillTag={scrim.skill_tag}
      ttsAvailable={ttsAvailable}
      scrim={{
        durationMs: scrim.timeline.durationMs,
        events: scrim.timeline.events,
        slides: scrim.slides,
        initialFiles: scrim.initial_files,
        initialTimelineMs,
      }}
      className="flex-1"
      onFilesChange={debouncedSave}
    />
  );
}

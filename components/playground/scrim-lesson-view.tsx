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
};

export function ScrimLessonView({
  journeyId,
  scrimId,
  scrim,
  breadcrumb,
}: ScrimLessonViewProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    files: scrim.initial_files,
    preview: scrim.template !== "python",
    completion: "manual" as const,
  };

  return (
    <PlaygroundShell
      config={config}
      title={scrim.title}
      breadcrumb={breadcrumb}
      scrim={{
        durationMs: scrim.timeline.durationMs,
        events: scrim.timeline.events,
        slides: scrim.slides,
        initialFiles: scrim.initial_files,
      }}
      className="flex-1"
      onFilesChange={debouncedSave}
    />
  );
}

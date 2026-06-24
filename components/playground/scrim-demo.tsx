"use client";

import { PlaygroundShell } from "@/components/playground/playground-shell";
import type { PlaygroundTemplate, ScrimEvent, ScrimSlide } from "@/lib/schemas/playground";

export type ScrimDemoData = {
  title: string;
  template: PlaygroundTemplate;
  initial_files: Record<string, string>;
  duration_ms: number;
  slides: ScrimSlide[];
  timeline: { durationMs: number; events: ScrimEvent[] };
};

type ScrimDemoProps = {
  data: ScrimDemoData;
  breadcrumb?: string;
  className?: string;
};

/** Public preview — no auth, no DB snapshots. */
export function ScrimDemo({ data, breadcrumb, className }: ScrimDemoProps) {
  return (
    <PlaygroundShell
      config={{
        template: data.template,
        files: data.initial_files,
        preview: data.template !== "python",
        completion: "manual",
      }}
      title={data.title}
      breadcrumb={breadcrumb}
      scrim={{
        durationMs: data.timeline.durationMs,
        events: data.timeline.events,
        slides: data.slides,
        initialFiles: data.initial_files,
      }}
      className={className}
      fullscreen
    />
  );
}

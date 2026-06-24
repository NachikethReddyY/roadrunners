import { z } from "zod";

export const playgroundTemplateSchema = z.enum([
  "vanilla",
  "react-ts",
  "python",
]);

export const playgroundCompletionSchema = z.enum([
  "manual",
  "output_contains",
  "tests",
]);

export const playgroundConfigSchema = z.object({
  template: playgroundTemplateSchema,
  files: z.record(z.string(), z.string()),
  activeFile: z.string().optional(),
  entryFile: z.string().optional(),
  preview: z.boolean().default(true),
  completion: playgroundCompletionSchema.default("manual"),
  completionTarget: z.string().optional(),
});

export const scrimSlideSchema = z.object({
  id: z.string(),
  title: z.string(),
  image_url: z.string().url().optional(),
  markdown: z.string().optional(),
});

export const scrimEventSchema = z.discriminatedUnion("type", [
  z.object({
    t: z.number().nonnegative(),
    type: z.literal("files"),
    files: z.record(z.string(), z.string()),
  }),
  z.object({
    t: z.number().nonnegative(),
    type: z.literal("focus"),
    path: z.string(),
  }),
  z.object({
    t: z.number().nonnegative(),
    type: z.literal("caption"),
    text: z.string(),
    audio_url: z.string().url().optional(),
  }),
  z.object({
    t: z.number().nonnegative(),
    type: z.literal("slide"),
    slideId: z.string(),
  }),
  z.object({
    t: z.number().nonnegative(),
    type: z.literal("run"),
  }),
]);

export const scrimTimelineSchema = z.object({
  durationMs: z.number().nonnegative(),
  events: z.array(scrimEventSchema),
});

export const lessonScrimSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  skill_tag: z.string(),
  template: playgroundTemplateSchema,
  initial_files: z.record(z.string(), z.string()),
  timeline: scrimTimelineSchema,
  slides: z.array(scrimSlideSchema),
  duration_ms: z.number().nonnegative(),
});

export type PlaygroundConfig = z.infer<typeof playgroundConfigSchema>;
export type PlaygroundTemplate = z.infer<typeof playgroundTemplateSchema>;
export type ScrimTimeline = z.infer<typeof scrimTimelineSchema>;
export type ScrimEvent = z.infer<typeof scrimEventSchema>;
export type ScrimSlide = z.infer<typeof scrimSlideSchema>;
export type LessonScrim = z.infer<typeof lessonScrimSchema>;

/** Apply timeline events up to `timeMs` — returns merged editor state. */
export function applyTimelineAt(
  initialFiles: Record<string, string>,
  events: ScrimEvent[],
  timeMs: number
): {
  files: Record<string, string>;
  activeFile: string | null;
  caption: string | null;
  slideId: string | null;
} {
  const sorted = [...events].sort((a, b) => a.t - b.t);
  let files = { ...initialFiles };
  let activeFile: string | null = Object.keys(initialFiles)[0] ?? null;
  let caption: string | null = null;
  let slideId: string | null = null;

  for (const event of sorted) {
    if (event.t > timeMs) break;
    switch (event.type) {
      case "files":
        files = { ...event.files };
        break;
      case "focus":
        activeFile = event.path;
        break;
      case "caption":
        caption = event.text;
        break;
      case "slide":
        slideId = event.slideId;
        break;
      case "run":
        break;
    }
  }

  return { files, activeFile, caption, slideId };
}

/** Latest caption event at or before `timeMs`. */
export function captionEventAt(
  events: ScrimEvent[],
  timeMs: number
): Extract<ScrimEvent, { type: "caption" }> | null {
  const captions = events
    .filter((e): e is Extract<ScrimEvent, { type: "caption" }> => e.type === "caption")
    .sort((a, b) => a.t - b.t);
  let latest: Extract<ScrimEvent, { type: "caption" }> | null = null;
  for (const event of captions) {
    if (event.t > timeMs) break;
    latest = event;
  }
  return latest;
}

// ponytail: self-check — fails if timeline merge breaks
if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
  const r = applyTimelineAt({ "a.py": "x" }, [{ t: 100, type: "files", files: { "a.py": "y" } }], 100);
  if (r.files["a.py"] !== "y") throw new Error("applyTimelineAt regression");
}

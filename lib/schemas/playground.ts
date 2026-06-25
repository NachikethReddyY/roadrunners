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
    /** Spoken narration (ElevenLabs). Falls back to captionToSpeechText(text). */
    speech: z.string().optional(),
    audio_url: z.union([z.string().url(), z.string().startsWith("/")]).optional(),
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
  z.object({
    t: z.number().nonnegative(),
    type: z.literal("challenge"),
    id: z.string(),
    title: z.string(),
    instructions: z.string(),
    hint: z.string().optional(),
    completion: z
      .object({
        path: z.string().optional(),
        file_must_include: z.string().optional(),
        file_must_not_include: z.string().optional(),
        output_must_include: z.string().optional(),
      })
      .optional(),
  }),
]);

export const scrimTimelineSchema = z.object({
  durationMs: z.number().nonnegative(),
  events: z.array(scrimEventSchema),
});

export const scrimNarrationCueSchema = z.object({
  t: z.number().nonnegative(),
  text: z.string(),
});

export const scrimNarrationSchema = z.object({
  audio_url: z.union([z.string().url(), z.string().startsWith("/")]),
  script: z.string(),
  cues: z.array(scrimNarrationCueSchema).default([]),
});

export const lessonScrimSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  skill_tag: z.string(),
  template: playgroundTemplateSchema,
  initial_files: z.record(z.string(), z.string()),
  timeline: scrimTimelineSchema,
  narration: scrimNarrationSchema.optional(),
  slides: z.array(scrimSlideSchema),
  duration_ms: z.number().nonnegative(),
});

export type PlaygroundConfig = z.infer<typeof playgroundConfigSchema>;
export type PlaygroundTemplate = z.infer<typeof playgroundTemplateSchema>;
export type ScrimTimeline = z.infer<typeof scrimTimelineSchema>;
export type ScrimNarration = z.infer<typeof scrimNarrationSchema>;
export type ScrimEvent = z.infer<typeof scrimEventSchema>;
export type ScrimSlide = z.infer<typeof scrimSlideSchema>;
export type ScrimChallengeEvent = Extract<ScrimEvent, { type: "challenge" }>;
export type LessonScrim = z.infer<typeof lessonScrimSchema>;

function interpolateStringByTime(
  from: string,
  to: string,
  startMs: number,
  endMs: number,
  timeMs: number
): string {
  if (startMs >= endMs) return to;
  if (timeMs <= startMs) return from;
  if (timeMs >= endMs) return to;

  const progress = (timeMs - startMs) / (endMs - startMs);

  if (to.startsWith(from)) {
    const extra = to.length - from.length;
    return from + to.slice(from.length, from.length + Math.round(extra * progress));
  }

  if (from.startsWith(to)) {
    const removeCount = from.length - to.length;
    return from.slice(0, from.length - Math.round(removeCount * progress));
  }

  return progress < 1 ? from : to;
}

function interpolateFiles(
  fromFiles: Record<string, string>,
  toFiles: Record<string, string>,
  startMs: number,
  endMs: number,
  timeMs: number
): Record<string, string> {
  const allPaths = new Set([...Object.keys(fromFiles), ...Object.keys(toFiles)]);
  const nextFiles: Record<string, string> = {};

  for (const path of allPaths) {
    const from = fromFiles[path] ?? "";
    const to = toFiles[path] ?? "";
    nextFiles[path] = interpolateStringByTime(from, to, startMs, endMs, timeMs);
  }

  return nextFiles;
}

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
  let lastFilesEvent: Extract<ScrimEvent, { type: "files" }> | null = null;
  let nextFilesEvent: Extract<ScrimEvent, { type: "files" }> | null = null;

  for (const event of sorted) {
    if (event.t > timeMs) {
      if (event.type === "files") {
        nextFilesEvent = event;
      }
      break;
    }
    switch (event.type) {
      case "files":
        files = { ...event.files };
        lastFilesEvent = event;
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
      case "challenge":
        break;
    }
  }

  if (lastFilesEvent && nextFilesEvent) {
    const blockedByChallenge = sorted.some(
      (event) =>
        event.type === "challenge" &&
        event.t > lastFilesEvent.t &&
        event.t <= timeMs &&
        event.t < nextFilesEvent.t
    );

    if (!blockedByChallenge) {
      files = interpolateFiles(
        lastFilesEvent.files,
        nextFilesEvent.files,
        lastFilesEvent.t,
        nextFilesEvent.t,
        timeMs
      );
    }
  }

  return { files, activeFile, caption, slideId };
}

export function challengeEvents(events: ScrimEvent[]): ScrimChallengeEvent[] {
  return events
    .filter((e): e is ScrimChallengeEvent => e.type === "challenge")
    .sort((a, b) => a.t - b.t);
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

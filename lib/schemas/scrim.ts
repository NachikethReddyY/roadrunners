import { z } from "zod";
import {
  playgroundTemplateSchema,
  scrimNarrationSchema,
  scrimSlideSchema,
  scrimTimelineSchema,
} from "@/lib/schemas/playground";

export const saveCheckpointSchema = z.object({
  journeyId: z.string().uuid(),
  nodeId: z.string().uuid().optional(),
  lessonScrimId: z.string().uuid().optional(),
  userScrimId: z.string().uuid().optional(),
  timelineMs: z.number().nonnegative(),
  files: z.record(z.string(), z.string()),
  activeFile: z.string().optional(),
  label: z.string().max(120).optional(),
});

export const saveUserScrimSchema = z.object({
  journeyId: z.string().uuid(),
  title: z.string().min(1).max(120),
  sourceNodeId: z.string().uuid().optional(),
  sourceLessonScrimId: z.string().uuid().optional(),
  skillTag: z.string().optional(),
  template: playgroundTemplateSchema,
  initialFiles: z.record(z.string(), z.string()),
  timeline: scrimTimelineSchema,
  slides: z.array(scrimSlideSchema).default([]),
  narration: scrimNarrationSchema.optional(),
  durationMs: z.number().nonnegative(),
  resumeTimelineMs: z.number().nonnegative().default(0),
});

export const ttsCaptionRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  speech: z.string().max(5000).optional(),
  voiceId: z.string().optional(),
  scrimId: z.string().uuid().optional(),
});

export const runnerExecRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  journeyId: z.string().uuid().optional(),
  nodeId: z.string().uuid().optional(),
  scrimId: z.string().uuid().optional(),
  template: playgroundTemplateSchema,
  files: z.record(z.string(), z.string()),
  entryFile: z.string().optional(),
  /** Full shell command (bash) — runs in Daytona after files are synced. */
  command: z.string().min(1).max(4000).optional(),
  /** Public /test preview — no auth when scrimSlug is allowlisted. */
  demo: z.literal(true).optional(),
  scrimSlug: z.string().max(64).optional(),
});

export type SaveCheckpointInput = z.infer<typeof saveCheckpointSchema>;
export type SaveUserScrimInput = z.infer<typeof saveUserScrimSchema>;

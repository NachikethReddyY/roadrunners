import { z } from "zod";
import {
  playgroundTemplateSchema,
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
  durationMs: z.number().nonnegative(),
  resumeTimelineMs: z.number().nonnegative().default(0),
});

export const ttsCaptionRequestSchema = z.object({
  text: z.string().min(1).max(5000),
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
});

export type SaveCheckpointInput = z.infer<typeof saveCheckpointSchema>;
export type SaveUserScrimInput = z.infer<typeof saveUserScrimSchema>;

import { z } from "zod";

export const journeyStatusSchema = z.enum(["active", "completed", "archived"]);

export const nodeTypeSchema = z.enum(["lesson", "choice", "milestone"]);

export const journeySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  goal: z.string(),
  status: journeyStatusSchema,
  current_node_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const journeyNodeSchema = z.object({
  id: z.string().uuid(),
  journey_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
  skill_tag: z.string(),
  title: z.string(),
  content_md: z.string(),
  node_type: nodeTypeSchema,
  xp_value: z.number().int().nonnegative(),
  archived_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export const journeyChoiceSchema = z.object({
  id: z.string().uuid(),
  node_id: z.string().uuid(),
  label: z.string(),
  description: z.string().nullable(),
  target_skill_tag: z.string(),
});

export const decisionSchema = z.object({
  id: z.string().uuid(),
  journey_id: z.string().uuid(),
  node_id: z.string().uuid(),
  choice_id: z.string().uuid().nullable(),
  decided_at: z.string().datetime(),
});

export type Journey = z.infer<typeof journeySchema>;
export type JourneyNode = z.infer<typeof journeyNodeSchema>;
export type JourneyChoice = z.infer<typeof journeyChoiceSchema>;
export type Decision = z.infer<typeof decisionSchema>;

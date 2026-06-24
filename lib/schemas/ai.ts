import { z } from "zod";
import { playgroundConfigSchema } from "@/lib/schemas/playground";

export const aiChoiceSchema = z.object({
  label: z.string().min(1).max(120),
  description: z.string().max(280).optional(),
  target_skill_tag: z.string().min(1),
});

export const aiNodeOutputSchema = z
  .object({
    title: z.string().min(1).max(200),
    content_md: z.string().min(1).max(8000),
    skill_tag: z.string().min(1),
    node_type: z
      .enum(["lesson", "choice", "interactive"])
      .default("choice"),
    choices: z.array(aiChoiceSchema).min(1).max(3),
    playground: playgroundConfigSchema.optional(),
  })
  .refine(
    (data) =>
      data.node_type !== "interactive" || data.playground !== undefined,
    { message: "interactive nodes require playground config" }
  );

export const aiNextNodeRequestSchema = z.object({
  journeyId: z.string().uuid(),
  pivotSkill: z.string().optional(),
});

export type AiNodeOutput = z.infer<typeof aiNodeOutputSchema>;
export type AiNextNodeRequest = z.infer<typeof aiNextNodeRequestSchema>;

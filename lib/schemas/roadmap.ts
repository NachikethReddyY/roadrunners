import { z } from "zod";

export const createRoadmapSchema = z.object({
  mode: z.enum(["learn", "become"]),
  subject: z.string().min(3, "Tell us a bit more"),
});

export type CreateRoadmapInput = z.infer<typeof createRoadmapSchema>;

export type SkillBubble = {
  slug: string;
  name: string;
  category: string;
};

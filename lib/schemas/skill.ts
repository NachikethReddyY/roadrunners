import { z } from "zod";

export const skillCategorySchema = z.enum([
  "web",
  "mobile",
  "data",
  "ai",
  "devops",
  "explore",
]);

export const skillCatalogSchema = z.object({
  slug: z.string(),
  name: z.string(),
  category: skillCategorySchema,
  icon: z.string().optional(),
});

export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type SkillCatalog = z.infer<typeof skillCatalogSchema>;

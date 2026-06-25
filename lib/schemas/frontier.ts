import { z } from "zod";

export const availabilitySchema = z.enum(["unlocked", "deferred", "locked"]);

export const suggestedModeSchema = z.enum(["guide", "scrim", "build"]);

export const featureChoiceSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  targetSkillTag: z.string().min(1),
  estimatedMinutes: z.number().int().positive().optional(),
  concepts: z.array(z.string()),
  prerequisites: z.array(z.string()).optional(),
  suggestedMode: suggestedModeSchema.optional(),
  availability: availabilitySchema,
  projectContribution: z.string(),
  isPivot: z.boolean(),
});

export const derivedFrontierSchema = z.object({
  taken: z.array(z.string().uuid()),
  unlocked: z.array(z.string().uuid()),
  deferred: z.array(z.string().uuid()),
  locked: z.array(z.string().uuid()),
});

export const choiceOfferBatchSchema = z.object({
  id: z.string().uuid(),
  journey_id: z.string().uuid(),
  node_id: z.string().uuid(),
  offer_fingerprint: z.string(),
  offered_at: z.string().datetime(),
});

export type Availability = z.infer<typeof availabilitySchema>;
export type SuggestedMode = z.infer<typeof suggestedModeSchema>;
export type FeatureChoice = z.infer<typeof featureChoiceSchema>;
export type DerivedFrontier = z.infer<typeof derivedFrontierSchema>;
export type ChoiceOfferBatch = z.infer<typeof choiceOfferBatchSchema>;

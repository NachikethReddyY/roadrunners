import { z } from "zod";

export const profileSchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string().nullable(),
  xp: z.number().int().nonnegative().default(0),
  level: z.number().int().positive().default(1),
  streak_days: z.number().int().nonnegative().default(0),
  last_activity_at: z.string().datetime().nullable(),
  onboarding_complete: z.boolean().default(false),
  goal: z.string().nullable(),
  interests: z.array(z.string()).default([]),
});

export const profileUpdateSchema = profileSchema.partial().omit({ user_id: true });

export type Profile = z.infer<typeof profileSchema>;

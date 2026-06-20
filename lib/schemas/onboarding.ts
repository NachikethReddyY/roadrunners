import { z } from "zod";

export const onboardingSchema = z.object({
  goal: z.string().min(3, "Tell us your goal in a few words"),
  interests: z
    .array(z.string())
    .min(1, "Pick at least one interest")
    .max(5),
  displayName: z.string().min(1).max(80).optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const INTEREST_OPTIONS = [
  { id: "web", label: "Web" },
  { id: "mobile", label: "Mobile" },
  { id: "data", label: "Data" },
  { id: "ai", label: "AI" },
  { id: "devops", label: "DevOps" },
] as const;

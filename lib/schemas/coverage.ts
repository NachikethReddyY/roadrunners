import { z } from "zod";

export const coverageStateSchema = z.enum([
  "introduced",
  "practiced",
  "verified",
]);

export const conceptCoverageSchema = z.object({
  id: z.string().uuid(),
  journey_id: z.string().uuid(),
  user_id: z.string().uuid(),
  concept_tag: z.string().min(1),
  coverage_state: coverageStateSchema,
  updated_at: z.string().datetime(),
});

export const coverageEventSchema = z.object({
  journeyId: z.string().uuid(),
  conceptTag: z.string().min(1),
  state: coverageStateSchema,
});

// Controlled concept tags per task 3 contract
export const CONCEPT_TAGS = [
  "html-structure",
  "css-layout",
  "css-responsive",
  "dom",
  "events",
  "functions",
  "callbacks",
  "promises",
  "async-await",
  "http",
  "routing",
  "json",
  "rest",
  "state-management",
  "error-handling",
  "modules",
  "oop",
  "closures",
  "caching",
  "auth",
  "db-query",
  "python-endpoint",
  "cors",
] as const;

export type ConceptTag = (typeof CONCEPT_TAGS)[number];
export type CoverageState = z.infer<typeof coverageStateSchema>;
export type ConceptCoverage = z.infer<typeof conceptCoverageSchema>;
export type CoverageEvent = z.infer<typeof coverageEventSchema>;

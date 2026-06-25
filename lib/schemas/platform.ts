import { z } from "zod";

// Frozen Verdict contract from task 3 / task 1 integration
export const verdictSchema = z.object({
  runs: z.boolean(),
  fulfills: z.boolean(),
  reason: z.string(),
  output: z.string().optional(),
  objectiveFulfillment: z.enum(["pass", "fail", "inconclusive"]),
  aiAdvisory: z
    .object({
      plausible: z.boolean(),
      reason: z.string(),
    })
    .optional(),
  completionBasis: z.enum(["objective", "user_confirmed"]).optional(),
  infrastructureError: z.boolean().optional(),
});

export const verificationEvidenceRowSchema = z.object({
  id: z.string().uuid(),
  journey_id: z.string().uuid(),
  node_id: z.string().uuid(),
  user_id: z.string().uuid(),
  runs: z.boolean(),
  exit_code: z.number().int().nullable(),
  timed_out: z.boolean(),
  stdout_summary: z.string().nullable(),
  stderr_summary: z.string().nullable(),
  objective_fulfillment: z.enum(["pass", "fail", "inconclusive"]),
  fulfills: z.boolean(),
  infrastructure_error: z.boolean(),
  verification_reason: z.string(),
  entrypoint: z.string().nullable(),
  ai_plausible: z.boolean().nullable(),
  ai_reason: z.string().nullable(),
  recorded_at: z.string().datetime(),
});

export const recordVerificationInputSchema = z.object({
  journeyId: z.string().uuid(),
  nodeId: z.string().uuid(),
  verdict: verdictSchema,
  entrypoint: z.string().optional(),
});

export const submitRoadmapChoiceInputSchema = z.object({
  journeyId: z.string().uuid(),
  nodeId: z.string().uuid(),
  choiceId: z.string().uuid(),
});

export const sandboxReferenceInputSchema = z.object({
  journeyId: z.string().uuid(),
  nodeId: z.string().uuid(),
  daytonaSandboxId: z.string().min(1),
  expiresAt: z.string().datetime(),
});

export const recoverySnapshotInputSchema = z.object({
  journeyId: z.string().uuid(),
  nodeId: z.string().uuid(),
  files: z.record(z.string(), z.string()),
});

export type Verdict = z.infer<typeof verdictSchema>;
export type VerificationEvidenceRow = z.infer<typeof verificationEvidenceRowSchema>;
export type RecordVerificationInput = z.infer<typeof recordVerificationInputSchema>;
export type SubmitRoadmapChoiceInput = z.infer<typeof submitRoadmapChoiceInputSchema>;
export type SandboxReferenceInput = z.infer<typeof sandboxReferenceInputSchema>;
export type RecoverySnapshotInput = z.infer<typeof recoverySnapshotInputSchema>;

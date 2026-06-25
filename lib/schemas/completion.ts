import { z } from "zod";

export const completionBasisSchema = z.enum([
  "objective",
  "user_confirmed",
  "acknowledgment",
]);

export const checkpointCompletionSchema = z.object({
  id: z.string().uuid(),
  journey_id: z.string().uuid(),
  node_id: z.string().uuid(),
  user_id: z.string().uuid(),
  completion_basis: completionBasisSchema,
  verification_evidence_id: z.string().uuid().nullable(),
  completed_at: z.string().datetime(),
});

export const completeCheckpointInputSchema = z.object({
  journeyId: z.string().uuid(),
  nodeId: z.string().uuid(),
  basis: completionBasisSchema,
  verificationEvidenceId: z.string().uuid().optional(),
});

export type CompletionBasis = z.infer<typeof completionBasisSchema>;
export type CheckpointCompletion = z.infer<typeof checkpointCompletionSchema>;
export type CompleteCheckpointInput = z.infer<typeof completeCheckpointInputSchema>;

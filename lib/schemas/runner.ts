import { z } from "zod";

/** Phase 4 server runner request shape (not wired yet). */
export const runnerExecRequestSchema = z.object({
  language: z.enum(["go", "shell", "python-server"]),
  files: z.record(z.string(), z.string()),
  entryFile: z.string(),
  timeoutMs: z.number().int().positive().max(30_000).default(10_000),
});

export type RunnerExecRequest = z.infer<typeof runnerExecRequestSchema>;

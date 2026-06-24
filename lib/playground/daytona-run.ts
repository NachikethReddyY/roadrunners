import { ROUTES } from "@/lib/constants/routes";
import type { RunResult } from "@/lib/playground/execute";

export type DaytonaRunContext = {
  sessionId?: string;
  journeyId?: string;
  nodeId?: string;
  scrimId?: string;
  template: string;
};

export async function runViaDaytona(
  files: Record<string, string>,
  entryFile: string,
  ctx: DaytonaRunContext
): Promise<(RunResult & { sessionId?: string }) | null> {
  try {
    const res = await fetch(ROUTES.runnerExec, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: ctx.sessionId,
        journeyId: ctx.journeyId,
        nodeId: ctx.nodeId,
        scrimId: ctx.scrimId,
        template: ctx.template,
        files,
        entryFile,
      }),
    });

    if (res.status === 501) return null;

    const data = (await res.json()) as {
      stdout?: string;
      stderr?: string;
      exitCode?: number;
      sessionId?: string;
      error?: string;
    };

    if (!res.ok) {
      return {
        stdout: "",
        stderr: data.stderr ?? "",
        error: data.error ?? "Server run failed",
      };
    }

    return {
      stdout: data.stdout ?? "",
      stderr: data.stderr ?? "",
      error: data.exitCode && data.exitCode !== 0 ? `Exit code ${data.exitCode}` : undefined,
      sessionId: data.sessionId,
    };
  } catch {
    return null;
  }
}

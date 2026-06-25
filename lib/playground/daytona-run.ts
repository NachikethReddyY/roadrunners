import { ROUTES } from "@/lib/constants/routes";
import type { RunResult } from "@/lib/playground/execute";

export type DaytonaRunContext = {
  sessionId?: string;
  journeyId?: string;
  nodeId?: string;
  scrimId?: string;
  template: string;
  demo?: boolean;
  scrimSlug?: string;
};

type DaytonaResponse = RunResult & {
  sessionId?: string;
  exitCode?: number;
  fallback?: boolean;
};

async function callRunner(
  body: Record<string, unknown>
): Promise<DaytonaResponse | null> {
  try {
    const res = await fetch(ROUTES.runnerExec, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (
      res.status === 401 ||
      res.status === 403 ||
      res.status === 501 ||
      res.status === 503
    ) {
      return null;
    }

    const data = (await res.json()) as DaytonaResponse & { error?: string };

    if (data.fallback) {
      return null;
    }

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
      error:
        data.exitCode && data.exitCode !== 0
          ? `Exit code ${data.exitCode}`
          : data.error,
      sessionId: data.sessionId,
    };
  } catch {
    return null;
  }
}

export async function runViaDaytona(
  files: Record<string, string>,
  entryFile: string,
  ctx: DaytonaRunContext
): Promise<(RunResult & { sessionId?: string }) | null> {
  return callRunner({
    sessionId: ctx.sessionId,
    journeyId: ctx.journeyId,
    nodeId: ctx.nodeId,
    scrimId: ctx.scrimId,
    template: ctx.template,
    files,
    entryFile,
    demo: ctx.demo || undefined,
    scrimSlug: ctx.scrimSlug,
  });
}

export async function runShellViaDaytona(
  command: string,
  files: Record<string, string>,
  ctx: DaytonaRunContext
): Promise<(RunResult & { sessionId?: string }) | null> {
  return callRunner({
    sessionId: ctx.sessionId,
    journeyId: ctx.journeyId,
    nodeId: ctx.nodeId,
    scrimId: ctx.scrimId,
    template: ctx.template,
    files,
    command,
    demo: ctx.demo || undefined,
    scrimSlug: ctx.scrimSlug,
  });
}

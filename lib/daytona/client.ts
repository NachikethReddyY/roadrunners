import { Daytona } from "@daytonaio/sdk";
import { scrimConfig, isDaytonaConfigured } from "@/lib/config/scrim";
import type { PlaygroundTemplate } from "@/lib/schemas/playground";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DaytonaExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  sessionId?: string;
};

let daytonaClient: Daytona | null = null;

function getDaytona(): Daytona {
  if (!daytonaClient) {
    daytonaClient = new Daytona({
      apiKey: scrimConfig.daytona.apiKey,
      apiUrl: scrimConfig.daytona.apiUrl,
      target: scrimConfig.daytona.target,
    });
  }
  return daytonaClient;
}

function languageForTemplate(template: PlaygroundTemplate): "python" | "typescript" | "javascript" {
  if (template === "python") return "python";
  if (template === "react-ts") return "typescript";
  return "javascript";
}

function pickEntryFile(files: Record<string, string>, entryFile?: string): string {
  if (entryFile && files[entryFile] !== undefined) return entryFile;
  const py = Object.keys(files).find((p) => p.endsWith(".py"));
  if (py) return py;
  const ts = Object.keys(files).find((p) => p.endsWith(".ts") || p.endsWith(".tsx"));
  if (ts) return ts;
  return Object.keys(files)[0] ?? "main.py";
}

export async function execInDaytona(input: {
  userId: string;
  journeyId?: string;
  nodeId?: string;
  scrimId?: string;
  sessionId?: string;
  template: PlaygroundTemplate;
  files: Record<string, string>;
  entryFile?: string;
}): Promise<DaytonaExecResult> {
  if (!isDaytonaConfigured()) {
    throw new Error("Daytona is not configured");
  }

  const supabase = await createClient();
  const ttlMs = scrimConfig.daytona.sandboxTtlMinutes * 60_000;
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  let sandboxId: string | null = null;
  let dbSessionId = input.sessionId;

  if (dbSessionId) {
    const { data: existing } = await supabase
      .from("sandbox_sessions")
      .select("daytona_sandbox_id, expires_at")
      .eq("id", dbSessionId)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (existing && new Date(existing.expires_at) > new Date()) {
      sandboxId = existing.daytona_sandbox_id;
    }
  }

  const daytona = getDaytona();

  if (!sandboxId) {
    const sandbox = await daytona.create({
      language: languageForTemplate(input.template),
      ephemeral: true,
      autoDeleteInterval: scrimConfig.daytona.sandboxTtlMinutes,
    });
    sandboxId = sandbox.id;

    const { data: row, error } = await supabase
      .from("sandbox_sessions")
      .insert({
        user_id: input.userId,
        journey_id: input.journeyId ?? null,
        node_id: input.nodeId ?? null,
        scrim_id: input.scrimId ?? null,
        daytona_sandbox_id: sandboxId,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    dbSessionId = row.id;
  }

  const sandbox = await daytona.get(sandboxId);

  for (const [path, content] of Object.entries(input.files)) {
    await sandbox.fs.uploadFile(Buffer.from(content, "utf-8"), path);
  }

  const entry = pickEntryFile(input.files, input.entryFile);
  const code = input.files[entry] ?? "";

  const response = await sandbox.process.codeRun(code);

  await supabase
    .from("sandbox_sessions")
    .update({ expires_at: expiresAt })
    .eq("id", dbSessionId!);

  return {
    stdout: response.result ?? "",
    stderr: "",
    exitCode: response.exitCode ?? 0,
    sessionId: dbSessionId,
  };
}

/** ponytail: prune expired session rows — upgrade to pg_cron later */
export async function pruneExpiredSandboxSessions(): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin
      .from("sandbox_sessions")
      .delete()
      .lt("expires_at", new Date().toISOString());
  } catch {
    // admin optional
  }
}

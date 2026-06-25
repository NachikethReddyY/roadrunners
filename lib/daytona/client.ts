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

/** ponytail: in-memory demo sessions — upgrade to Redis if multi-instance */
const demoSessions = new Map<string, { sandboxId: string; expiresAt: number }>();

function pruneDemoSessions(): void {
  const now = Date.now();
  for (const [id, row] of demoSessions) {
    if (row.expiresAt <= now) demoSessions.delete(id);
  }
}

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
  const js = Object.keys(files).find((p) => p.endsWith(".js") || p.endsWith(".jsx"));
  if (js) return js;
  return Object.keys(files)[0] ?? "main.py";
}

function runCommandForTemplate(template: PlaygroundTemplate, entry: string): string {
  if (template === "python") return `python3 "${entry}"`;
  if (template === "react-ts") return `npx --yes tsx "${entry}"`;
  return `node "${entry}"`;
}

async function getOrCreateSandbox(
  userId: string,
  template: PlaygroundTemplate,
  journeyId?: string,
  nodeId?: string,
  scrimId?: string,
  sessionId?: string
): Promise<{ sandboxId: string; dbSessionId: string }> {
  const supabase = await createClient();
  const ttlMs = scrimConfig.daytona.sandboxTtlMinutes * 60_000;
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  let sandboxId: string | null = null;
  let dbSessionId = sessionId;

  if (dbSessionId) {
    const { data: existing } = await supabase
      .from("sandbox_sessions")
      .select("daytona_sandbox_id, expires_at")
      .eq("id", dbSessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing && new Date(existing.expires_at) > new Date()) {
      sandboxId = existing.daytona_sandbox_id;
    }
  }

  const daytona = getDaytona();

  if (!sandboxId) {
    const sandbox = await daytona.create({
      language: languageForTemplate(template),
      ephemeral: true,
      autoDeleteInterval: scrimConfig.daytona.sandboxTtlMinutes,
    });
    sandboxId = sandbox.id;

    const { data: row, error } = await supabase
      .from("sandbox_sessions")
      .insert({
        user_id: userId,
        journey_id: journeyId ?? null,
        node_id: nodeId ?? null,
        scrim_id: scrimId ?? null,
        daytona_sandbox_id: sandboxId,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    dbSessionId = row.id;
  }

  return { sandboxId, dbSessionId: dbSessionId! };
}

async function getOrCreateDemoSandbox(
  template: PlaygroundTemplate,
  sessionId?: string
): Promise<{ sandboxId: string; dbSessionId: string }> {
  pruneDemoSessions();
  const ttlMs = scrimConfig.daytona.sandboxTtlMinutes * 60_000;
  const now = Date.now();

  if (sessionId) {
    const existing = demoSessions.get(sessionId);
    if (existing && existing.expiresAt > now) {
      existing.expiresAt = now + ttlMs;
      return { sandboxId: existing.sandboxId, dbSessionId: sessionId };
    }
  }

  const sandbox = await getDaytona().create({
    language: languageForTemplate(template),
    ephemeral: true,
    autoDeleteInterval: scrimConfig.daytona.sandboxTtlMinutes,
  });

  const dbSessionId = crypto.randomUUID();
  demoSessions.set(dbSessionId, {
    sandboxId: sandbox.id,
    expiresAt: now + ttlMs,
  });

  return { sandboxId: sandbox.id, dbSessionId };
}

async function syncFiles(
  sandboxId: string,
  files: Record<string, string>
): Promise<void> {
  const sandbox = await getDaytona().get(sandboxId);
  for (const [path, content] of Object.entries(files)) {
    await sandbox.fs.uploadFile(Buffer.from(content, "utf-8"), path);
  }
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
  command?: string;
  demo?: boolean;
}): Promise<DaytonaExecResult> {
  if (!isDaytonaConfigured()) {
    throw new Error("Daytona is not configured");
  }

  const { sandboxId, dbSessionId } = input.demo
    ? await getOrCreateDemoSandbox(input.template, input.sessionId)
    : await getOrCreateSandbox(
        input.userId,
        input.template,
        input.journeyId,
        input.nodeId,
        input.scrimId,
        input.sessionId
      );

  await syncFiles(sandboxId, input.files);
  const sandbox = await getDaytona().get(sandboxId);

  let stdout = "";
  const stderr = "";
  let exitCode = 0;

  if (input.command) {
    const response = await sandbox.process.executeCommand(input.command);
    stdout = response.result ?? "";
    exitCode = response.exitCode ?? 0;
  } else {
    const entry = pickEntryFile(input.files, input.entryFile);
    const cmd = runCommandForTemplate(input.template, entry);
    const response = await sandbox.process.executeCommand(cmd);
    stdout = response.result ?? "";
    exitCode = response.exitCode ?? 0;
  }

  const supabase = await createClient();
  const expiresAt = new Date(
    Date.now() + scrimConfig.daytona.sandboxTtlMinutes * 60_000
  ).toISOString();
  if (!input.demo) {
    await supabase
      .from("sandbox_sessions")
      .update({ expires_at: expiresAt })
      .eq("id", dbSessionId);
  }

  return { stdout, stderr, exitCode, sessionId: dbSessionId };
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

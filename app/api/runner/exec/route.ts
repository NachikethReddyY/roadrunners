import { NextResponse } from "next/server";
import { execInDaytona } from "@/lib/daytona/client";
import { shouldUseDaytona, isDaytonaConfigured } from "@/lib/config/scrim";
import { runnerExecRequestSchema } from "@/lib/schemas/scrim";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const requestsByUser = new Map<string, number[]>();

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const recent = (requestsByUser.get(user.id) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (recent.length >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  recent.push(now);
  requestsByUser.set(user.id, recent);

  const body = await request.json().catch(() => null);
  const parsed = runnerExecRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { sessionId, journeyId, nodeId, scrimId, template, files, entryFile } =
    parsed.data;

  if (!shouldUseDaytona(template) || !isDaytonaConfigured()) {
    return NextResponse.json(
      {
        error: "Server-side runner unavailable. Use browser runtime.",
        hint: "Set SCRIM_RUNNER=daytona and DAYTONA_API_KEY to enable.",
      },
      { status: 501 }
    );
  }

  try {
    const result = await execInDaytona({
      userId: user.id,
      journeyId,
      nodeId,
      scrimId,
      sessionId,
      template,
      files,
      entryFile,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

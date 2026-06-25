import { NextResponse } from "next/server";
import { execInDaytona } from "@/lib/daytona/client";
import { DEMO_SCRIM_SLUGS } from "@/lib/constants/demo-scrims";
import { shouldUseDaytona, isDaytonaConfigured } from "@/lib/config/scrim";
import { runnerExecRequestSchema } from "@/lib/schemas/scrim";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const DEMO_RATE_LIMIT_MAX = 15;
const requestsByUser = new Map<string, number[]>();
const requestsByIp = new Map<string, number[]>();

function isDaytonaProvisioningError(message: string): boolean {
  return /region .*not available|class container|target .*not available|sandbox.*unavailable/i.test(
    message
  );
}

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimit(
  bucket: Map<string, number[]>,
  key: string,
  max: number
): boolean {
  const now = Date.now();
  const recent = (bucket.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= max) return false;
  recent.push(now);
  bucket.set(key, recent);
  return true;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json().catch(() => null);
  const parsed = runnerExecRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { sessionId, journeyId, nodeId, scrimId, template, files, entryFile, command, demo, scrimSlug } =
    parsed.data;

  const isDemo =
    demo === true &&
    Boolean(scrimSlug) &&
    DEMO_SCRIM_SLUGS.has(scrimSlug!) &&
    !user;

  if (!user && !isDemo) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemo) {
    if (!rateLimit(requestsByIp, clientIp(request), DEMO_RATE_LIMIT_MAX)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  } else if (!rateLimit(requestsByUser, user!.id, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!shouldUseDaytona() || !isDaytonaConfigured()) {
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
      userId: user?.id ?? "demo",
      journeyId,
      nodeId,
      scrimId,
      sessionId,
      template,
      files,
      entryFile,
      command,
      demo: isDemo,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution failed";
    if (isDaytonaProvisioningError(message)) {
      return NextResponse.json(
        {
          error: message,
          fallback: true,
          hint:
            "Daytona could not provision a sandbox for this target. Check DAYTONA_TARGET or use browser runtime.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

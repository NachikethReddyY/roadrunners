import { NextResponse } from "next/server";
import { createAndPersistNextNode } from "@/lib/ai/create-next-node";
import { aiNextNodeRequestSchema } from "@/lib/schemas/ai";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
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
  const recentRequests = (requestsByUser.get(user.id) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  recentRequests.push(now);
  requestsByUser.set(user.id, recentRequests);

  const body = await request.json().catch(() => null);
  const parsed = aiNextNodeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { journeyId, pivotSkill } = parsed.data;

  try {
    const result = await createAndPersistNextNode(supabase, {
      journeyId,
      userId: user.id,
      pivotSkill,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Node generation failed";
    const status = message === "Journey not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

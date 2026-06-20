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

  const [{ data: profile }, { data: recentNodes }, { data: skillCatalog }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("goal, interests")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("journey_nodes")
        .select("title, skill_tag")
        .eq("journey_id", journeyId)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("skill_catalog").select("slug"),
    ]);

  const skillTags = skillCatalog?.map((s) => s.slug) ?? ["explore"];
  const goal = journey.goal ?? profile?.goal ?? "Become hireable in tech";
  const interests = profile?.interests ?? [];

  let output = getFallbackNode(pivotSkill ?? "explore");
  let fallback = true;

  if (isGeminiConfigured()) {
    try {
      output = await generateNextNode({
        goal,
        interests,
        recentNodes: recentNodes ?? [],
        pivotSkill,
        skillTags,
      });
      fallback = false;
    } catch (error) {
      console.error("[ai/next-node] Gemini failed, using fallback:", error);
    }
  }

  const validated = aiNodeOutputSchema.safeParse(output);

  if (!validated.success) {
    return NextResponse.json({ error: "Invalid AI output" }, { status: 500 });
  }

  return NextResponse.json({
    node: validated.data,
    fallback,
  });
}

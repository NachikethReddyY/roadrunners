import { NextResponse } from "next/server";
import { getFallbackNode } from "@/lib/ai/fallback";
import {
  generateNextNode,
  isGeminiConfigured,
} from "@/lib/ai/generate-node";
import { aiNextNodeRequestSchema, aiNodeOutputSchema } from "@/lib/schemas/ai";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = aiNextNodeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { journeyId, pivotSkill } = parsed.data;

  const { data: journey } = await supabase
    .from("journeys")
    .select("id, goal, user_id")
    .eq("id", journeyId)
    .eq("user_id", user.id)
    .single();

  if (!journey) {
    return NextResponse.json({ error: "Journey not found" }, { status: 404 });
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

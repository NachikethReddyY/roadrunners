import { NextResponse } from "next/server";
import { getFallbackNode } from "@/lib/ai/fallback";
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

  // TODO: stream from OpenAI/Gemini — MVP returns validated fallback
  const output = getFallbackNode(pivotSkill ?? "react");
  const validated = aiNodeOutputSchema.safeParse(output);

  if (!validated.success) {
    return NextResponse.json({ error: "Invalid AI output" }, { status: 500 });
  }

  return NextResponse.json({
    node: validated.data,
    fallback: true,
  });
}

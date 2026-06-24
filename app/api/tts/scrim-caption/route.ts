import { NextResponse } from "next/server";
import { isTtsConfigured } from "@/lib/config/scrim";
import { ttsCaptionRequestSchema } from "@/lib/schemas/scrim";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateCaptionAudio } from "@/lib/tts/elevenlabs";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const requestsByUser = new Map<string, number[]>();

export async function POST(request: Request) {
  if (!isTtsConfigured()) {
    return NextResponse.json({ error: "TTS not enabled" }, { status: 503 });
  }

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
  const parsed = ttsCaptionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { audioUrl, cached } = await getOrCreateCaptionAudio(
      parsed.data.text,
      parsed.data.voiceId
    );
    return NextResponse.json({ audioUrl, cached });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TTS failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

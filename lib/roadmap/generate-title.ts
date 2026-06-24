import { getAiConfig, isAiConfigured } from "@/lib/ai/config";

function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function fallbackRoadmapTitle(mode: "learn" | "become", subject: string): string {
  const trimmed = subject.trim();
  if (mode === "learn") {
    return `${titleCase(trimmed)} Roadmap`;
  }
  if (/developer|engineer|analyst|designer/i.test(trimmed)) {
    return `${titleCase(trimmed)} Path`;
  }
  return `Become ${titleCase(trimmed)}`;
}

export async function generateRoadmapTitle(
  mode: "learn" | "become",
  subject: string,
  goal: string
): Promise<string> {
  if (!isAiConfigured()) {
    return fallbackRoadmapTitle(mode, subject);
  }

  const config = getAiConfig();
  if (!config) return fallbackRoadmapTitle(mode, subject);

  try {
    if (config.provider === "openai") {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey: config.apiKey });
      const response = await client.chat.completions.create({
        model: config.model,
        messages: [
          {
            role: "system",
            content:
              "Return a short, motivating roadmap title (3–6 words). No quotes. Examples: Full-Stack Developer Path, React Foundations Roadmap.",
          },
          { role: "user", content: goal },
        ],
        max_tokens: 32,
        temperature: 0.6,
      });
      const title = response.choices[0]?.message.content?.trim();
      if (title && title.length <= 80) return title;
    } else {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const model = genAI.getGenerativeModel({ model: config.model });
      const result = await model.generateContent(
        `Return ONLY a short roadmap title (3–6 words, no quotes) for this learning goal: ${goal}`
      );
      const title = result.response.text()?.trim();
      if (title && title.length <= 80) return title.replace(/^["']|["']$/g, "");
    }
  } catch {
    // ponytail: heuristic title is fine when LLM fails
  }

  return fallbackRoadmapTitle(mode, subject);
}

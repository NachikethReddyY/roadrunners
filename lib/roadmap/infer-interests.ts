import { INTEREST_OPTIONS } from "@/lib/schemas/onboarding";

const KEYWORD_MAP: Record<string, string[]> = {
  web: ["web", "react", "javascript", "typescript", "html", "css", "next", "frontend", "full-stack", "fullstack", "api"],
  mobile: ["mobile", "swift", "ios", "android", "kotlin", "react native", "react-native"],
  data: ["data", "sql", "analytics", "python", "database"],
  ai: ["ai", "ml", "machine learning", "llm", "prompt", "gemini", "openai"],
  devops: ["devops", "docker", "git", "ci/cd", "cicd", "deploy", "cloud"],
};

export function inferInterestsFromText(text: string, skillSlugs: string[] = []): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const [interest, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.add(interest);
    }
  }

  for (const slug of skillSlugs) {
    const normalized = slug.toLowerCase();
    for (const [interest, keywords] of Object.entries(KEYWORD_MAP)) {
      if (keywords.some((kw) => normalized.includes(kw.replace(/\s+/g, "-")))) {
        found.add(interest);
      }
    }
    if (normalized.includes("swift") || normalized.includes("kotlin")) found.add("mobile");
    if (normalized.includes("react") || normalized.includes("javascript")) found.add("web");
  }

  const valid = INTEREST_OPTIONS.map((o) => o.id);
  const result = [...found].filter((id) => valid.includes(id as (typeof valid)[number]));
  return result.length > 0 ? result : ["explore"];
}

export function buildGoalText(mode: "learn" | "become", subject: string): string {
  const trimmed = subject.trim();
  return `I want to ${mode} ${trimmed}`;
}
